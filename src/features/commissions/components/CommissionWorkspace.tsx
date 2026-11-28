"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Archive, Eye, Pencil } from "lucide-react";
import { useSession } from "@/components/auth/SessionProvider";
import { WorkspaceUnavailable } from "@/components/auth/WorkspaceAccess";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import Modal from "@/components/ui/modal/Modal";
import DataTable from "@/components/ui/table/DataTable";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { ApiError } from "@/lib/api/client";
import { archiveCommission, commissionErrorMessage, getCommission, listCommissions,
  type Commission, type CommissionFilters, type CommissionPage } from "@/lib/api/commissions";
import { organisationRoutes } from "@/config/routes";
import { findWorkspace } from "@/lib/auth/workspaces";
import CommissionForm, { commissionFormResource } from "./CommissionForm";
import CommissionParticipants from "./CommissionParticipants";

const label = { ACTIVE: "Active", ARCHIVED: "Archivée" };
const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
const date = (value: string) => dateFormat.format(new Date(value));
const button = "rounded-lg border border-ikbs-border px-3 py-2 text-sm hover:bg-ikbs-primary/5";

type DetailTab = "general" | "participants";

function CommissionDetail({ organizationId, id, initialTab, canManageParticipants, canManageFunctions, canReadMemberArchives, onClose, onUpdate }: {
  organizationId: string; id: string; initialTab: DetailTab; canManageParticipants: boolean; canManageFunctions: boolean; canReadMemberArchives: boolean;
  onClose: () => void; onUpdate: (record: Commission) => void;
}) {
  const [tab, setTab] = useState(initialTab);
  const tabs = useId();
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<{ record: Commission; attempt: number }>();
  const [failure, setFailure] = useState<{ message: string; attempt: number }>();
  const result = loaded?.record;
  const error = failure?.attempt === attempt ? failure.message : undefined;
  const refresh = () => setAttempt((value) => value + 1);
  useEffect(() => {
    const request = new AbortController();
    void getCommission(organizationId, id, request.signal).then(
      (record) => { if (!request.signal.aborted) setLoaded({ record, attempt }); },
      (error) => {
        if (request.signal.aborted) return;
        if (error instanceof ApiError && [401, 403, 404].includes(error.status)) setLoaded(undefined);
        setFailure({ message: commissionErrorMessage(error), attempt });
      },
    );
    return () => request.abort();
  }, [organizationId, id, attempt]);
  return <Modal open title="Détail de la commission" size="xl" onClose={() => {
    if (result) onUpdate(result);
    onClose();
  }}>
    {error && <div className="space-y-2">
      <p role="alert">{error}</p>
      <button type="button" className={button} onClick={refresh}>Relire la commission</button>
    </div>}
    {!result && !error && <p role="status">Chargement de la commission…</p>}
    {result && <>
      <div role="tablist" aria-label="Détail de la commission" className="mb-4 flex flex-wrap gap-2">
        {(["general", "participants"] as const).map((option) => <button key={option} type="button" role="tab"
          id={tabs + option} aria-controls={tabs + "panel-" + option} aria-selected={tab === option}
          tabIndex={tab === option ? 0 : -1} className={button + (tab === option ? " bg-ikbs-primary/10 font-semibold" : "")}
          onClick={() => setTab(option)} onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            const next = event.key === "Home" ? "general" : event.key === "End" ? "participants" :
              option === "general" ? "participants" : "general";
            setTab(next);
            document.getElementById(tabs + next)?.focus();
          }}>
          {option === "general" ? "Informations générales" : "Participants"}
        </button>)}
      </div>
      <div role="tabpanel" id={tabs + "panel-general"} aria-labelledby={tabs + "general"} hidden={tab !== "general"}>
        <dl className="grid gap-4 sm:grid-cols-2">
        {[
          ["Code", result.code], ["Nom", result.name], ["Description", result.description ?? "Aucune description"],
          ["Statut", label[result.status]], ["Version", result.version], ["Création (UTC)", date(result.createdAt)],
          ["Modification (UTC)", date(result.updatedAt)],
          ...(result.archivedAt ? [["Archivage (UTC)", date(result.archivedAt)]] : []),
        ].map(([name, value]) => <div className="min-w-0" key={name}>
          <dt className="text-sm font-medium text-ikbs-muted">{name}</dt>
          <dd className="whitespace-pre-wrap break-words">{value}</dd>
        </div>)}
        </dl>
      </div>
      <div role="tabpanel" id={tabs + "panel-participants"} aria-labelledby={tabs + "participants"} hidden={tab !== "participants"}>
        {tab === "participants" && <CommissionParticipants commission={result} canManage={canManageParticipants}
          canManageFunctions={canManageFunctions} canReadArchives={canReadMemberArchives} refreshingCommission={loaded.attempt !== attempt} onRefreshCommission={refresh} />}
      </div>
    </>}
  </Modal>;
}

function CommissionRegister({ organizationId, catalogueHref, canManage, canManageParticipants, canManageFunctions, canReadMemberArchives }: {
  organizationId: string; catalogueHref: string; canManage: boolean; canManageParticipants: boolean; canManageFunctions: boolean; canReadMemberArchives: boolean;
}) {
  const [filters, setFilters] = useState<CommissionFilters>({ page: 1, limit: 10, search: "", status: "" });
  const [revision, setRevision] = useState(0);
  const [snapshot, setSnapshot] = useState<{ filters: CommissionFilters; value: CommissionPage }>();
  const [issue, setIssue] = useState<{ filters: CommissionFilters; revision: number; message: string }>();
  const [editing, setEditing] = useState<Commission | null>();
  const [viewing, setViewing] = useState<{ id: string; tab: DetailTab }>();
  const [archiving, setArchiving] = useState<Commission>();
  const [archiveError, setArchiveError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const toast = useToast();
  const data = snapshot?.filters === filters ? snapshot.value : undefined;
  const error = issue?.filters === filters && issue.revision === revision ? issue.message : undefined;
  const refresh = () => setRevision((value) => value + 1);
  useEffect(() => {
    const request = new AbortController();
    void listCommissions(organizationId, filters, request.signal).then(
      (value) => {
        if (!request.signal.aborted) {
          setSnapshot({ filters, value });
          setIssue(undefined);
          setArchiveError(undefined);
        }
      },
      (failure) => {
        if (!request.signal.aborted) setIssue({ filters, revision, message: commissionErrorMessage(failure) });
      },
    );
    return () => request.abort();
  }, [organizationId, filters, revision]);

  function integrate(saved: Commission, created = false) {
    setSnapshot((previous) => {
      if (!previous) return previous;
      const { value, filters: scope } = previous;
      const matchesStatus = !scope.status || scope.status === saved.status;
      const needle = scope.search.toLocaleLowerCase("fr");
      const matchesSearch = !needle || [saved.code, saved.name, saved.description ?? ""]
        .some((field) => field.toLocaleLowerCase("fr").includes(needle));
      const found = value.items.some(({ id }) => id === saved.id);
      const items = value.items.filter(({ id }) => id !== saved.id);
      if (matchesStatus && matchesSearch && (found || (created && scope.page === 1))) {
        items.push(saved);
        items.sort((first, second) => second.createdAt.localeCompare(first.createdAt) || first.id.localeCompare(second.id));
      }
      return { ...previous, value: { ...value, items: items.slice(0, scope.limit) } };
    });
    refresh();
  }

  async function archive(record: Commission) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setArchiveError(undefined);
    try {
      integrate(await archiveCommission(organizationId, record.id, record.version));
      toast.success("Commission archivée.");
    } catch (failure) {
      setArchiveError(commissionErrorMessage(failure));
    } finally {
      setArchiving(undefined);
      setBusy(false);
      pending.current = false;
    }
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = String(new FormData(event.currentTarget).get("search") ?? "").trim();
    setFilters((value) => value.search === term && value.page === 1 ? value : { ...value, search: term, page: 1 });
  }

  return <section className="min-w-0 space-y-4">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold">Commissions</h1>
      <div className="flex flex-wrap items-center gap-2">
        <Link className={button} href={catalogueHref}>Catalogue des fonctions</Link>
        {canManage && <button type="button" className="rounded-lg bg-ikbs-primary px-4 py-2 text-white" onClick={() => setEditing(null)}>
          Nouvelle commission
        </button>}
      </div>
    </header>
    <form className="flex flex-wrap items-end gap-2" onSubmit={search}>
      <label className="grid min-w-0 flex-1 gap-1 text-sm">
        Rechercher par code, nom ou description
        <input name="search" type="search" maxLength={100} className="rounded-lg border border-ikbs-border bg-ikbs-card px-3 py-2" />
      </label>
      <button className={button} type="submit">Rechercher</button>
      <label className="grid gap-1 text-sm">Statut
        <select value={filters.status} className="rounded-lg border border-ikbs-border bg-ikbs-card px-3 py-2"
          onChange={(event) => {
            const status = event.target.value === "ACTIVE" ? "ACTIVE" : event.target.value === "ARCHIVED" ? "ARCHIVED" : "";
            setFilters((value) => ({ ...value, status, page: 1 }));
          }}>
          <option value="">Tous les statuts</option><option value="ACTIVE">Actives</option><option value="ARCHIVED">Archivées</option>
        </select>
      </label>
    </form>
    {error && <div role="alert" className="space-y-2">
      <p>{data && "Actualisation impossible. "}{error}</p>
      <button type="button" className={button} onClick={refresh}>Réessayer</button>
    </div>}
    {archiveError && <div role="alert" className="space-y-2">
      <p>{archiveError}</p>
      <button type="button" className={button} onClick={refresh}>Relire le registre</button>
    </div>}
    {(!error || data) && <DataTable<Commission> data={data?.items ?? []} loading={!data && !error}
      rowKey={(record) => record.id} emptyMessage="Aucune commission pour ces critères."
      columns={[
        { key: "code", label: "Code" },
        { key: "name", label: "Nom", render: (_, row) => <div className="grid justify-items-start gap-1">
          <span className="whitespace-normal">{row.name}</span>
          <button type="button" className="text-sm font-medium text-ikbs-primary underline underline-offset-2"
            aria-label={"Voir les participants de " + row.name}
            onClick={() => setViewing({ id: row.id, tab: "participants" })}>Voir les participants</button>
        </div> },
        { key: "description", label: "Description", render: (_, row) => <span className="block max-w-xs whitespace-normal break-words">{row.description ?? "—"}</span> },
        { key: "status", label: "Statut", render: (_, row) => label[row.status] },
        { key: "createdAt", label: "Création (UTC)", render: (_, row) => date(row.createdAt) },
      ]}
      pagination={data && { enabled: true, page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages,
        onPageChange: (page) => setFilters((value) => ({ ...value, page: Math.min(100_000, Math.max(1, page)) })),
        onLimitChange: (limit) => setFilters((value) => ({ ...value, limit, page: 1 })),
      }}
      actions={{ enabled: true, items: (row) => [
        { key: "detail", label: "Consulter la commission", icon: <Eye size={16} />, onClick: () => setViewing({ id: row.id, tab: "general" }) },
        { key: "edit", label: "Modifier la commission", icon: <Pencil size={16} />,
          hidden: !canManage || row.status !== "ACTIVE", onClick: () => setEditing(row) },
        { key: "archive", label: "Archiver la commission", icon: <Archive size={16} />, danger: true,
          hidden: !canManage || row.status !== "ACTIVE", disabled: !!archiveError, onClick: () => { setArchiveError(undefined); setArchiving(row); } },
      ] }} />}
    {viewing && <CommissionDetail key={viewing.id + ":" + viewing.tab} organizationId={organizationId} id={viewing.id} initialTab={viewing.tab}
      canManageParticipants={canManageParticipants} canManageFunctions={canManageFunctions} canReadMemberArchives={canReadMemberArchives}
      onUpdate={(record) => {
        if (data?.items.some((row) => row.id === record.id && row.version !== record.version)) integrate(record);
      }} onClose={() => setViewing(undefined)} />}
    {canManage && editing !== undefined && <CommissionForm resource={commissionFormResource} key={editing ? "edit:" + editing.id : "create"}
      organizationId={organizationId} initial={editing} onClose={() => setEditing(undefined)} onSaved={(saved) => {
        setEditing(undefined);
        integrate(saved, editing === null);
        toast.success(editing ? "Commission modifiée." : "Commission créée.");
      }} />}
    {canManage && archiving && <ConfirmModal open danger title="Archiver la commission"
      message="L’archivage de cette commission est définitif. Elle restera consultable, mais ne pourra plus être modifiée ni réactivée."
      confirmLabel="Confirmer l’archivage" loading={busy} onClose={() => setArchiving(undefined)}
      onConfirm={() => archive(archiving)} />}
  </section>;
}

export default function CommissionWorkspace({ code }: { code: string }) {
  const { profile } = useSession();
  const workspace = findWorkspace(profile, code);
  if (!workspace || !workspace.permissions.includes("commissions.read")) return <WorkspaceUnavailable kind="local" />;
  return <CommissionRegister key={profile.user.id + ":" + workspace.id}
    organizationId={workspace.id} catalogueHref={organisationRoutes.commissions(workspace.code) + "/fonctions"}
    canManage={workspace.permissions.includes("commissions.manage")}
    canReadMemberArchives={workspace.permissions.includes("members.lifecycle")}
    canManageFunctions={workspace.permissions.includes("commissions.functions.manage")}
    canManageParticipants={workspace.permissions.includes("commissions.members.manage")} />;
}
