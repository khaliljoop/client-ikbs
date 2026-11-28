"use client";

import Link from "next/link";
import { Archive, Eye, Pencil, Power } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { WorkspaceUnavailable } from "@/components/auth/WorkspaceAccess";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import Modal from "@/components/ui/modal/Modal";
import DataTable from "@/components/ui/table/DataTable";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { organisationRoutes } from "@/config/routes";
import { ApiError } from "@/lib/api/client";
import { archiveCommissionFunction, createCommissionFunction, functionErrorMessage, getCommissionFunction,
  listCommissionFunctions, setCommissionFunctionEnabled, updateCommissionFunction, type CommissionFunctionDefinition } from "@/lib/api/commission-functions";
import type { CommissionFilters } from "@/lib/api/commissions";
import { canManageOrganizations, findWorkspace } from "@/lib/auth/workspaces";
import CommissionForm from "./CommissionForm";

const button = "rounded-lg border border-ikbs-border px-3 py-2 text-sm hover:bg-ikbs-primary/5 disabled:opacity-50";
const labels = { ACTIVE: "Active", ARCHIVED: "Archivée" };
const utc = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
const formResource = { noun: "fonction", create: createCommissionFunction, update: updateCommissionFunction,
  get: getCommissionFunction, error: functionErrorMessage };
type Definition = CommissionFunctionDefinition;
type Page = Awaited<ReturnType<typeof listCommissionFunctions>>;

function FunctionCatalogue({ organizationId, registerHref, canManage }: {
  organizationId: string; registerHref: string; canManage: boolean;
}) {
  const [filters, setFilters] = useState<CommissionFilters>({ page: 1, limit: 10, search: "", status: "" });
  const [revision, setRevision] = useState(0);
  const [snapshot, setSnapshot] = useState<{ filters: CommissionFilters; page: Page }>();
  const [issue, setIssue] = useState<{ filters: CommissionFilters; message: string }>();
  const [mutationError, setMutationError] = useState<string>();
  const [viewing, setViewing] = useState<Definition>();
  const [editing, setEditing] = useState<Definition | null>();
  const [archiving, setArchiving] = useState<Definition>();
  const [changing, setChanging] = useState<Definition>();
  const global = !organizationId;
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const request = useRef<AbortController>(null);
  const mounted = useRef(false);
  const toast = useToast();
  const data = snapshot?.filters === filters ? snapshot.page : undefined;
  const error = issue?.filters === filters ? issue.message : undefined;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    request.current = controller;
    void listCommissionFunctions(organizationId, filters, controller.signal).then(
      (page) => {
        if (controller.signal.aborted) return;
        if (filters.page > Math.max(1, page.totalPages)) {
          setFilters({ ...filters, page: Math.max(1, page.totalPages) });
        } else {
          setSnapshot({ filters, page });
          setIssue(undefined);
        }
      },
      (failure) => {
        if (controller.signal.aborted) return;
        if (failure instanceof ApiError && [401, 403, 404].includes(failure.status)) {
          setSnapshot(undefined);
          setViewing(undefined);
          setEditing(undefined);
          setArchiving(undefined);
        }
        setIssue({ filters, message: functionErrorMessage(failure) });
      },
    );
    return () => controller.abort();
  }, [organizationId, filters, revision]);

  function refresh() {
    request.current?.abort();
    setRevision((current) => current + 1);
  }

  function integrate(record: Definition, created: boolean) {
    setSnapshot((previous) => {
      if (!previous || previous.filters !== filters) return previous;
      const { page } = previous;
      const found = page.items.some((row) => row.id === record.id);
      const needle = filters.search.toLocaleLowerCase("fr");
      const matches = (!filters.status || filters.status === record.status) &&
        [record.name, record.code, record.description ?? ""].some((value) => value.toLocaleLowerCase("fr").includes(needle));
      const items = page.items.filter((row) => row.id !== record.id);
      if (matches && (found || (created && filters.page === 1))) {
        items.push(record);
        items.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
      }
      return { filters, page: { ...page, items: items.slice(0, filters.limit) } };
    });
    refresh();
  }

  async function archive(record: Definition) {
    if (running.current || !canManage) return;
    running.current = true;
    setBusy(true);
    setMutationError(undefined);
    try {
      const saved = await archiveCommissionFunction(organizationId, record.id, record.version);
      if (!mounted.current) return;
      integrate(saved, false);
      toast.success("Fonction archivée.");
    } catch (failure) {
      if (!mounted.current) return;
      setMutationError(functionErrorMessage(failure));
      refresh();
    } finally {
      running.current = false;
      if (mounted.current) {
        setBusy(false);
        setArchiving(undefined);
      }
    }
  }

  async function changeActivation(record: Definition) {
    if (running.current || !canManage || global) return;
    running.current = true;
    setBusy(true);
    setMutationError(undefined);
    try {
      const saved = await setCommissionFunctionEnabled(organizationId, record.id, !record.enabled);
      if (!mounted.current) return;
      integrate(saved, false);
      toast.success(saved.enabled ? "Fonction activée pour l’organisation." : "Fonction désactivée pour l’organisation.");
    } catch (failure) {
      if (!mounted.current) return;
      setMutationError(functionErrorMessage(failure));
      refresh();
    } finally {
      running.current = false;
      if (mounted.current) {
        setBusy(false);
        setChanging(undefined);
      }
    }
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const search = String(new FormData(event.currentTarget).get("search") ?? "").trim();
    setFilters((previous) => ({ ...previous, search, page: 1 }));
  }

  return <section className="min-w-0 space-y-4">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        <Link href={registerHref} className="text-sm font-medium text-ikbs-primary hover:underline">{global ? "Retour à l’administration globale" : "Retour aux commissions"}</Link>
        <h1 className="text-2xl font-bold">{global ? "Référentiel des fonctions" : "Catalogue des fonctions"}</h1>
      </div>
      {global && canManage && <button type="button" className="rounded-lg bg-ikbs-primary px-4 py-2 text-white"
        onClick={() => setEditing(null)}>Nouvelle fonction</button>}
    </header>
    <form onSubmit={search} className="flex flex-wrap items-end gap-2">
      <label className="grid min-w-0 flex-1 gap-1 text-sm">
        Rechercher par code, nom ou description
        <input type="search" name="search" maxLength={100} className="rounded-lg border border-ikbs-border bg-ikbs-card px-3 py-2" />
      </label>
      <button type="submit" className={button}>Rechercher</button>
      {global && <label className="grid gap-1 text-sm">Statut
        <select value={filters.status} className="rounded-lg border border-ikbs-border bg-ikbs-card px-3 py-2"
          onChange={(event) => {
            const value = event.target.value;
            const status = value === "ACTIVE" || value === "ARCHIVED" ? value : "";
            setFilters((previous) => ({ ...previous, page: 1, status }));
          }}>
          <option value="">Tous les statuts</option><option value="ACTIVE">Actives</option><option value="ARCHIVED">Archivées</option>
        </select>
      </label>}
    </form>
    {mutationError && <p role="alert">{mutationError}</p>}
    {error && <div role="alert" className="space-y-2">
      <p>{data && "Actualisation impossible. "}{error}</p>
      <button type="button" className={button} onClick={refresh}>Réessayer</button>
    </div>}
    {(!error || data) && <DataTable<Definition> data={data?.items ?? []} rowKey={(row) => row.id}
      loading={!data && !error} emptyMessage="Aucune fonction pour ces critères."
      columns={[
        { key: "code", label: "Code" },
        { key: "name", label: "Nom" },
        { key: "description", label: "Description", render: (_, row) => <span className="block max-w-xs whitespace-normal break-words">{row.description ?? "—"}</span> },
        { key: "status", label: global ? "Statut" : "Utilisation", render: (_, row) => global ? labels[row.status] : row.enabled ? "Activée" : "Non activée" },
      ]}
      pagination={data && { enabled: true, page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages,
        onPageChange: (page) => setFilters((previous) => ({ ...previous, page: Math.min(100_000, Math.max(1, page)) })),
        onLimitChange: (limit) => setFilters((previous) => ({ ...previous, limit, page: 1 })),
      }}
      actions={{ enabled: true, items: (row) => [
        { key: "detail", label: "Consulter la fonction", icon: <Eye size={16} />, onClick: () => setViewing(row) },
        { key: "edit", label: "Modifier la fonction", icon: <Pencil size={16} />, hidden: !global || !canManage || row.status !== "ACTIVE",
          onClick: () => { setMutationError(undefined); setEditing(row); } },
        { key: "archive", label: "Archiver la fonction", icon: <Archive size={16} />, danger: true,
          hidden: !canManage || row.status !== "ACTIVE", onClick: () => { setMutationError(undefined); setArchiving(row); } },
        { key: "activation", label: row.enabled ? "Désactiver la fonction" : "Activer la fonction",
          icon: <Power size={16} />, hidden: global || !canManage, disabled: busy, onClick: () => setChanging(row) },
      ] }} />}
    {viewing && <Modal open title="Détail de la fonction" onClose={() => setViewing(undefined)}>
      <dl className="space-y-3">
        {[
          ["Code", viewing.code], ["Nom", viewing.name], ["Description", viewing.description ?? "Aucune description"],
          ["Statut", labels[viewing.status]], ["Version", viewing.version], ["Création (UTC)", utc.format(new Date(viewing.createdAt))],
          ["Modification (UTC)", utc.format(new Date(viewing.updatedAt))],
          ...(viewing.archivedAt ? [["Archivage (UTC)", utc.format(new Date(viewing.archivedAt))]] : []),
        ].map(([name, value]) => <div key={name}>
          <dt className="text-sm font-medium text-ikbs-muted">{name}</dt>
          <dd className="whitespace-pre-wrap break-words">{value}</dd>
        </div>)}
      </dl>
    </Modal>}
    {global && canManage && editing !== undefined && <CommissionForm key={editing?.id ?? "new"} resource={formResource}
      organizationId={organizationId} initial={editing} onClose={() => setEditing(undefined)} onSaved={(saved) => {
        if (!mounted.current) return;
        setEditing(undefined);
        setMutationError(undefined);
        integrate(saved, editing === null);
        toast.success(editing ? "Fonction modifiée." : "Fonction créée.");
      }} />}
    {global && canManage && archiving && <ConfirmModal open danger loading={busy} title="Archiver la fonction"
      message="L’archivage est définitif. La fonction restera consultable dans le catalogue."
      confirmLabel="Confirmer l’archivage" onClose={() => setArchiving(undefined)} onConfirm={() => archive(archiving)} />}
    {!global && canManage && changing && <ConfirmModal open loading={busy} title={changing.enabled ? "Désactiver la fonction" : "Activer la fonction"}
      message={changing.name} confirmLabel={changing.enabled ? "Désactiver" : "Activer"}
      onClose={() => setChanging(undefined)} onConfirm={() => changeActivation(changing)} />}
  </section>;
}

export function GlobalCommissionFunctionWorkspace() {
  const { profile } = useSession();
  if (!canManageOrganizations(profile)) return <WorkspaceUnavailable kind="global" />;
  return <FunctionCatalogue key={profile.user.id} organizationId="" registerHref="/dash" canManage />;
}

export default function CommissionFunctionWorkspace({ code }: { code: string }) {
  const { profile } = useSession();
  const workspace = findWorkspace(profile, code);
  if (!workspace || !workspace.permissions.includes("commissions.read")) return <WorkspaceUnavailable kind="local" />;
  const canManage = workspace.permissions.includes("commissions.functions.manage");
  return <FunctionCatalogue key={profile.user.id + ":" + workspace.id + ":" + canManage} organizationId={workspace.id}
    registerHref={organisationRoutes.commissions(workspace.code)} canManage={canManage} />;
}
