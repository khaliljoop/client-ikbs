"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import MemberStatusActions from "./MemberStatusActions";
import MemberForm from "./MemberForm";
import MemberInvitation from "./MemberInvitation";
import { useEffect, useState, type FormEvent } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { WorkspaceUnavailable } from "@/components/auth/WorkspaceAccess";
import DataTable from "@/components/ui/table/DataTable";
import { organisationRoutes } from "@/config/routes";
import { getMember, listMembers, memberErrorMessage, type DirectoryMember, type MemberDetail as MemberRecord } from "@/lib/api/members";
import { findWorkspace, rolesAssign } from "@/lib/auth/workspaces";

const statusLabels = { ACTIVE: "Actif", INACTIVE: "Inactif", SUSPENDED: "Suspendu", ARCHIVED: "Archivé" };

function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return <div className="space-y-2">
    <p role="alert">{message}</p>
    <button type="button" className="rounded-lg border px-4 py-2" onClick={retry}>Réessayer</button>
  </div>;
}

function MemberList({ organizationId, href, canWrite, canManageStatus, rolesHref }: {
  organizationId: string; href: string; canWrite: boolean; canManageStatus: boolean; rolesHref?: string;
}) {
  const [showArchives, setShowArchives] = useState(false);
  const archived = canManageStatus && showArchives;
  const [adding, setAdding] = useState(false);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; data: Awaited<ReturnType<typeof listMembers>> } |
    { key: string; error: string }>();
  const key = JSON.stringify([search, page, limit, attempt, archived]);
  const current = result?.key === key ? result : undefined;
  const data = current && "data" in current ? current.data : undefined;

  useEffect(() => {
    const request = new AbortController();
    void listMembers(organizationId, page, limit, search, request.signal, archived ? "ARCHIVED" : undefined).then(
      (data) => { if (!request.signal.aborted) setResult({ key, data }); },
      (error) => { if (!request.signal.aborted) setResult({ key, error: memberErrorMessage(error) }); },
    );
    return () => request.abort();
  }, [organizationId, search, page, limit, key, archived]);

  function refreshList() {
    setPage(1);
    setAttempt((value) => value + 1);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(String(new FormData(event.currentTarget).get("search") ?? "").trim());
    setPage(1);
    setAttempt((value) => value + 1);
  }

  return <section className="min-w-0 space-y-4">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold">Membres</h1>
      {canWrite && !archived && <button type="button" className="rounded-lg bg-ikbs-primary px-4 py-2 text-white"
        onClick={() => setAdding(true)}>Ajouter un membre</button>}
    </header>
    {canWrite && adding && <MemberForm organizationId={organizationId} onClose={() => setAdding(false)}
      onSaved={(member) => {
        setAdding(false);
        setAttempt((value) => value + 1);
        router.push(href + "/" + member.id);
      }} />}
    {canManageStatus && <label className="flex items-center gap-2 text-sm font-medium">
      <input type="checkbox" checked={archived} onChange={(event) => {
        setShowArchives(event.target.checked);
        setPage(1);
      }} />
      Afficher les archives
    </label>}
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <label className="grid flex-1 gap-1">
        <span className="text-sm font-medium">Rechercher par nom ou code</span>
        <input type="search" name="search" maxLength={100}
          className="min-w-0 rounded-lg border border-ikbs-border bg-ikbs-card px-3 py-2" />
      </label>
      <button type="submit" className="rounded-lg bg-ikbs-primary px-4 py-2 text-white">Rechercher</button>
    </form>
    {current && "error" in current
      ? <LoadError message={current.error} retry={() => setAttempt((value) => value + 1)} />
      : <DataTable<DirectoryMember>
          columns={[
            { key: "firstName", label: "Nom complet", render: (_, member) =>
              <Link className="font-medium text-ikbs-primary hover:underline" href={href + "/" + member.id}>
                {member.firstName} {member.lastName}
              </Link> },
            { key: "code", label: "Code" },
            { key: "status", label: "Statut", render: (_, member) => statusLabels[member.status] },
            ...(!archived && (canManageStatus || rolesHref) ? [{
              key: "id" as const, label: "Actions", render: (_: string, member: DirectoryMember) =>
                <div className="flex flex-wrap items-center gap-2">
                  {canManageStatus && <MemberStatusActions organizationId={organizationId} member={member}
                    onSaved={refreshList} onRefresh={refreshList} />}
                  {rolesHref && member.status !== "ARCHIVED" && <Link className="font-medium text-ikbs-primary hover:underline"
                    href={rolesHref + "?" + new URLSearchParams({ memberId: member.id })}
                    aria-label={`Gérer les rôles de ${member.firstName} ${member.lastName} (${member.code})`}>Gérer les rôles</Link>}
                </div>,
            }] : []),
          ]}
          data={data?.items ?? []} loading={!current} rowKey={(member) => member.id}
          emptyMessage={search ? "Aucun membre ne correspond à cette recherche." : "Aucun membre à afficher."}
          pagination={data && { enabled: true, page, limit, total: data.total, onPageChange: setPage,
            onLimitChange: (size) => { setLimit(size); setPage(1); } }}
        />}
  </section>;
}

function MemberDetail({ organizationId, memberId, href, canWrite, canManageStatus, canInvite }: {
  canInvite: boolean; organizationId: string; memberId: string; href: string; canWrite: boolean; canManageStatus: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<MemberRecord | string>();

  useEffect(() => {
    const request = new AbortController();
    void getMember(organizationId, memberId, request.signal).then(
      (member) => { if (!request.signal.aborted) setResult(member); },
      (error) => { if (!request.signal.aborted) setResult(memberErrorMessage(error)); },
    );
    return () => request.abort();
  }, [organizationId, memberId, attempt]);

  function refreshDetail() {
    setEditing(false);
    setResult(undefined);
    setAttempt((value) => value + 1);
  }

  const personal = canWrite && typeof result === "object" ? result.personal : undefined;

  return <section className="space-y-4">
    <Link className="font-medium text-ikbs-primary hover:underline" href={href}>Retour aux membres</Link>
    {!result ? <p role="status">Chargement de la fiche…</p>
      : typeof result === "string" ? <LoadError message={result} retry={() => {
        setResult(undefined);
        setAttempt((value) => value + 1);
      }} />
      : <>
        <header className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-ikbs-border bg-ikbs-card p-5 sm:p-6">
          <div className="flex min-w-0 items-center gap-4">
            <div aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-full bg-ikbs-primary/10 text-lg font-semibold text-ikbs-primary sm:size-16">
              {Array.from(result.firstName)[0]?.toLocaleUpperCase("fr")}{Array.from(result.lastName)[0]?.toLocaleUpperCase("fr")}
            </div>
            <div className="min-w-0 space-y-2">
              <h1 className="break-words text-xl font-bold sm:text-2xl">{result.firstName} {result.lastName}</h1>
              <p className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-mono text-ikbs-muted">{result.code}</span>
                <span className="rounded-full border border-ikbs-border px-2.5 py-0.5 font-medium">{statusLabels[result.status]}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
          {personal && result.status !== "ARCHIVED" && <button type="button" className="rounded-lg border border-ikbs-border px-4 py-2 font-medium hover:bg-ikbs-primary/5"
            onClick={() => setEditing(true)}>Modifier</button>}
          {canInvite && personal?.email && result.status === "ACTIVE" &&
            <MemberInvitation key={personal.email} organizationId={organizationId} memberId={result.id} email={personal.email} />}
          {canManageStatus && <MemberStatusActions organizationId={organizationId} member={result}
            onSaved={refreshDetail} onRefresh={refreshDetail} />}
          </div>
        </header>
        {personal && result.status !== "ARCHIVED" && editing && <MemberForm organizationId={organizationId} member={result}
          onClose={() => setEditing(false)} onSaved={(updated) => { setResult(updated); setEditing(false); }} />}
        {personal && <section className="space-y-4 rounded-2xl border border-ikbs-border bg-ikbs-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Informations personnelles</h2>
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {[
              ["Email", personal.email],
              ["Téléphone", personal.phone],
              ["Adresse", personal.address],
              ["Sexe", personal.gender === "FEMALE" ? "Femme" : personal.gender === "MALE" ? "Homme" : null],
            ].map(([label, value]) => <div className="min-w-0" key={label}>
              <dt className="text-sm font-medium text-ikbs-muted">{label}</dt>
              <dd className="mt-1 whitespace-pre-wrap break-words">{value || "Non renseigné"}</dd>
            </div>)}
          </dl>
        </section>}
      </>}
  </section>;
}

export default function MemberDirectory({ code, memberId }: { code: string; memberId?: string }) {
  const { profile } = useSession();
  const workspace = findWorkspace(profile, code);
  if (!workspace) return <WorkspaceUnavailable kind="local" />;
  const href = organisationRoutes.members(workspace.code);
  const key = profile.user.id + ":" + workspace.id;
  const canWrite = workspace.permissions.includes("members.write");
  const canManageStatus = workspace.permissions.includes("members.lifecycle");
  return memberId
    ? <MemberDetail key={key + ":" + memberId + ":" + canWrite + ":" + canManageStatus} organizationId={workspace.id} memberId={memberId} href={href} canWrite={canWrite} canManageStatus={canManageStatus}
      canInvite={canWrite && workspace.permissions.includes(rolesAssign)} />
    : <MemberList key={key + ":" + canManageStatus} organizationId={workspace.id} href={href} canWrite={canWrite}
      canManageStatus={canManageStatus} rolesHref={workspace.permissions.includes(rolesAssign) ? organisationRoutes.roles(workspace.code) : undefined} />;
}
