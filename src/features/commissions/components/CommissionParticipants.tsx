import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BadgeCheck } from "lucide-react";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import DataTable from "@/components/ui/table/DataTable";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { ApiError } from "@/lib/api/client";
import { closeCommissionParticipation, createCommissionParticipation, listCommissionParticipations,
  participationErrorMessage, type Commission, type CommissionParticipation, type ParticipationListFilters,
  type ParticipationListResponse } from "@/lib/api/commissions";
import { getMember, type DirectoryMember } from "@/lib/api/members";
import ParticipantFunctions from "./ParticipantFunctions";
import ParticipationMemberPicker from "./ParticipationMemberPicker";

const filterOptions = {
  all: { label: "Toutes les participations", query: {} },
  open: { label: "Participations ouvertes", query: { status: "OPEN" } },
  effective: { label: "Participants effectifs", query: { status: "OPEN", effective: true } },
  ineffective: { label: "Participations ouvertes non effectives", query: { status: "OPEN", effective: false } },
  history: { label: "Historique des participations clôturées", query: { status: "CLOSED" } },
} as const;
type Filter = keyof typeof filterOptions;
const memberStatus = { ACTIVE: "Actif", INACTIVE: "Inactif", SUSPENDED: "Suspendu", ARCHIVED: "Archivé" };
const reasons = { ACTIVE: "", INACTIVE: "membre inactif", SUSPENDED: "membre suspendu", ARCHIVED: "membre archivé" };
const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
const button = "rounded-lg border border-ikbs-border px-3 py-2 text-sm hover:bg-ikbs-primary/5 disabled:opacity-50";
type Row = CommissionParticipation & { member?: DirectoryMember };
type Page = Omit<ParticipationListResponse, "items"> & { items: Row[] };

function effectiveness(row: CommissionParticipation) {
  if (!row.isOpen) return "Participation clôturée";
  if (row.isEffective) return "Effective";
  const causes = [row.memberStatus ? reasons[row.memberStatus] : "fiche membre indisponible",
    row.commissionStatus === "ARCHIVED" ? "commission archivée" : ""].filter(Boolean);
  return causes.length ? "Non effective — " + causes.join(", ") : "Non effective";
}

async function readPage(organizationId: string, commissionId: string, filters: ParticipationListFilters,
  canReadArchives: boolean, signal: AbortSignal): Promise<Page> {
  const page = await listCommissionParticipations(organizationId, commissionId, filters, signal);
  const ids = [...new Set(page.items.filter((row) => row.memberStatus !== null &&
    (row.memberStatus !== "ARCHIVED" || canReadArchives)).map((row) => row.memberId))];
  const members = new Map<string, DirectoryMember>();
  // Read at most one page, in small batches. F01 enforces archive access on every detail.
  for (let offset = 0; offset < ids.length; offset += 5) {
    if (signal.aborted) break;
    await Promise.all(ids.slice(offset, offset + 5).map(async (id) => {
      try {
        const { id: memberId, code, firstName, lastName, status } = await getMember(organizationId, id, signal);
        members.set(id, { id: memberId, code, firstName, lastName, status });
      } catch {
        // A period remains readable when the associated fiche cannot be resolved.
      }
    }));
  }
  return { ...page, items: page.items.map((row) => ({ ...row, member: members.get(row.memberId) })) };
}

export default function CommissionParticipants({ commission, canManage, canManageFunctions, canReadArchives, refreshingCommission, onRefreshCommission }: {
  commission: Commission; canManage: boolean; canManageFunctions: boolean; canReadArchives: boolean; refreshingCommission: boolean; onRefreshCommission: () => void;
}) {
  const [query, setQuery] = useState<{ filter: Filter; page: number }>({ filter: "all", page: 1 });
  const [revision, setRevision] = useState(0);
  const [snapshot, setSnapshot] = useState<{ query: typeof query; value: Page }>();
  const [issue, setIssue] = useState<{ query: typeof query; revision: number; message: string }>();
  const [mutationError, setMutationError] = useState<string>();
  const [permissionRefused, setPermissionRefused] = useState(false);
  const [picking, setPicking] = useState(false);
  const [functions, setFunctions] = useState<Row>();
  const [closing, setClosing] = useState<Row>();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const mounted = useRef(false);
  const request = useRef<AbortController>(null);
  const toast = useToast();
  const data = snapshot?.query === query ? snapshot.value : undefined;
  const error = issue?.query === query && issue.revision === revision ? issue.message : undefined;
  const mayMutate = canManage && !permissionRefused && commission.status === "ACTIVE" && !refreshingCommission;
  const { organizationId, id: commissionId } = commission;
  const pageSize = 10;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    request.current = controller;
    const { signal } = controller;
    void readPage(organizationId, commissionId, { page: query.page, limit: pageSize, ...filterOptions[query.filter].query },
      canReadArchives, signal).then(
      (value) => {
        if (signal.aborted) return;
        if (query.page > Math.max(1, value.totalPages)) {
          setQuery({ ...query, page: Math.max(1, value.totalPages) });
        } else {
          setSnapshot({ query, value });
          setIssue(undefined);
        }
      },
      (failure) => {
        if (signal.aborted) return;
        if (failure instanceof ApiError && [401, 403, 404].includes(failure.status)) {
          setSnapshot(undefined);
          setPicking(false);
          setClosing(undefined);
          if (failure.status === 403) setPermissionRefused(true);
        }
        setIssue({ query, revision, message: participationErrorMessage(failure) });
      },
    );
    return () => controller.abort();
  }, [organizationId, commissionId, query, revision, canReadArchives]);

  function refresh() {
    request.current?.abort();
    setRevision((value) => value + 1);
  }

  function integrate(row: Row, created: boolean) {
    setSnapshot((previous) => {
      const filter: Partial<ParticipationListFilters> = filterOptions[query.filter].query;
      const compatible = (!filter.status || row.status === filter.status) &&
        (filter.effective === undefined || row.isEffective === filter.effective);
      if (!previous || previous.query !== query) {
        if (!created || !compatible || query.page !== 1) return previous;
        // Only the mutation result is confirmed while the first GET is still pending.
        return { query, value: { items: [row], page: 1, limit: pageSize, total: 0, totalPages: 0 } };
      }
      const known = previous.value.items.some((item) => item.id === row.id);
      const items = previous.value.items.filter((item) => item.id !== row.id);
      if (compatible && (known || (created && query.page === 1))) {
        items.push(row);
        items.sort((a, b) => b.startedAt.localeCompare(a.startedAt) || a.id.localeCompare(b.id));
      }
      return { query, value: { ...previous.value, items: items.slice(0, pageSize) } };
    });
  }

  async function mutate(selection: { member: DirectoryMember } | { period: Row }) {
    if (pending.current || !mayMutate) return;
    pending.current = true;
    setBusy(true);
    setMutationError(undefined);
    try {
      const created = "member" in selection;
      const row = created
        ? await createCommissionParticipation(organizationId, commissionId, { memberId: selection.member.id })
        : await closeCommissionParticipation(organizationId, commissionId, selection.period.id,
          { status: "CLOSED", version: selection.period.version });
      if (!mounted.current) return;
      integrate({ ...row, member: created ? selection.member : selection.period.member }, created);
      setPicking(false);
      toast.success(created ? "Membre affecté à la commission." : "Participation clôturée.");
      refresh();
    } catch (failure) {
      if (!mounted.current) return;
      setMutationError(participationErrorMessage(failure));
      if (failure instanceof ApiError && [403, 404, 409].includes(failure.status)) {
        if (failure.status === 403) setPermissionRefused(true);
        setPicking(false);
        onRefreshCommission();
        refresh();
      }
    } finally {
      pending.current = false;
      if (mounted.current) {
        setClosing(undefined);
        setBusy(false);
      }
    }
  }

  function close(row: Row) {
    if (row.isOpen && mayMutate && row.commissionStatus === "ACTIVE") setClosing(row);
  }

  return <section className="min-w-0 space-y-4" aria-label="Participations">
    {commission.status === "ARCHIVED" && <p>Cette commission est archivée. Ses participations sont conservées à titre historique et ne peuvent plus être modifiées.</p>}
    <div className="flex flex-wrap items-end justify-between gap-3">
      <label className="grid gap-1 text-sm">Filtrer les participations
        <select value={query.filter} disabled={busy} className="max-w-full rounded-lg border border-ikbs-border bg-ikbs-card px-3 py-2"
          onChange={(event) => {
            const filter = event.target.value;
            if (Object.hasOwn(filterOptions, filter)) setQuery({ filter: filter as Filter, page: 1 });
          }}>
          {Object.entries(filterOptions).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}
        </select>
      </label>
      {mayMutate && !picking && <button type="button" className={button} disabled={busy} onClick={() => setPicking(true)}>
        Affecter un membre
      </button>}
    </div>
    {mutationError && <p role="alert">{mutationError}</p>}
    {mayMutate && picking && <ParticipationMemberPicker organizationId={organizationId} busy={busy}
      openMemberIds={new Set(data?.items.filter((row) => row.isOpen).map((row) => row.memberId))}
      onSelect={(member) => void mutate({ member })} onCancel={() => setPicking(false)} />}
    {error && <div role="alert" className="space-y-2">
      <p>{data && "Actualisation impossible. "}{error}</p>
      <button type="button" className={button} onClick={refresh}>Réessayer les participations</button>
    </div>}
    {(!error || data) && <DataTable<Row> data={data?.items ?? []} loading={!data && !error}
      rowKey={(row) => row.id} emptyMessage="Aucune participation pour ces critères."
      columns={[
        { key: "memberId", label: "Membre", render: (_, row) => row.member && (row.memberStatus !== "ARCHIVED" || canReadArchives)
          ? <div className="whitespace-normal">{row.member.firstName} {row.member.lastName}<br /><span className="font-mono text-xs">{row.member.code}</span></div>
          : row.memberStatus === null ? "Fiche membre indisponible"
            : row.memberStatus === "ARCHIVED" && !canReadArchives ? "Fiche archivée à accès restreint" : "Nom indisponible" },
        { key: "memberStatus", label: "Statut du membre", render: (_, row) => row.memberStatus ? memberStatus[row.memberStatus] : "—" },
        { key: "startedAt", label: "Début (UTC)", render: (_, row) => date.format(new Date(row.startedAt)) },
        { key: "endedAt", label: "Clôture (UTC)", render: (_, row) => row.endedAt ? date.format(new Date(row.endedAt)) : "—" },
        { key: "status", label: "Période", render: (_, row) => row.status === "OPEN" ? "Ouverte" : "Clôturée" },
        { key: "isEffective", label: "Effectivité", render: (_, row) => <span className="block whitespace-normal">{effectiveness(row)}</span> },
      ]}
      actions={{ enabled: true, items: (row) => [{
        key: "functions", label: "Fonctions du participant", icon: <BadgeCheck size={16} />, onClick: () => setFunctions(row),
      }, {
        key: "close", label: "Retirer de la commission", danger: true,
        hidden: !mayMutate || !row.isOpen || row.commissionStatus !== "ACTIVE", disabled: busy || !!error, onClick: () => close(row),
      }] }} />}
    {data && data.totalPages > 1 && <nav aria-label="Pages des participations" className="flex flex-wrap items-center gap-2 text-sm">
      <button type="button" className={button} disabled={busy || data.page <= 1}
        onClick={() => setQuery({ ...query, page: data.page - 1 })}>Participations précédentes</button>
      <span>Page {data.page} / {data.totalPages}</span>
      <button type="button" className={button} disabled={busy || data.page >= Math.min(data.totalPages, 100_000)}
        onClick={() => setQuery({ ...query, page: data.page + 1 })}>Participations suivantes</button>
    </nav>}
    {functions && <ParticipantFunctions organizationId={organizationId} commissionId={commissionId} participationId={functions.id}
      name={functions.member ? functions.member.firstName + " " + functions.member.lastName : "Participant"}
      canAssign={canManageFunctions && commission.status === "ACTIVE" && functions.isEffective}
      canClose={canManageFunctions && commission.status === "ACTIVE" && functions.isOpen} onClose={() => setFunctions(undefined)} />}
    {mayMutate && closing && createPortal(<ConfirmModal open danger title="Retirer de la commission"
      message="Voulez-vous retirer ce membre de la commission ? Sa période de participation sera clôturée et restera consultable dans l’historique."
      confirmLabel="Confirmer le retrait" loading={busy} onClose={() => setClosing(undefined)}
      onConfirm={() => mutate({ period: closing })} />, document.body)}
  </section>;
}
