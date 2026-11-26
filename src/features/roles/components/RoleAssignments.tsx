"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { assignRole, assignmentErrorMessage, findMembershipForMember, listAssignableRoles, listAssignedRoles, listMemberships,
  removeRoleAssignment, type MembershipOption } from "@/lib/api/roles";

const button = "rounded-lg border border-ikbs-border px-3 py-2 text-sm font-medium hover:bg-ikbs-primary/5 disabled:opacity-50";
type Directory = Awaited<ReturnType<typeof listMemberships>>;
type Assignments = { assigned: string[]; choices: { id: string; name: string }[] };

function SelectedMembership({ organizationId, membership, actorId, revision, canManage }: {
  organizationId: string;
  membership: MembershipOption;
  actorId: string;
  revision: number;
  canManage: boolean;
}) {
  const [attempt, setAttempt] = useState(0);
  const key = revision + ":" + attempt;
  const [load, setLoad] = useState<{ key: string; data: Assignments } | { key: string; error: string }>();
  const [selection, setSelection] = useState("");
  const [removal, setRemoval] = useState<{ id: string; label: string }>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const toast = useToast();
  const current = load?.key === key ? load : undefined;
  const data = current && "data" in current ? current.data : undefined;
  const self = membership.identityId === actorId;
  const available = data?.choices.filter(({ id }) => !data.assigned.includes(id)) ?? [];
  const selectedRole = available.some(({ id }) => id === selection) ? selection : "";

  useEffect(() => {
    const request = new AbortController();
    void Promise.all([
      listAssignedRoles(organizationId, membership.identityId, request.signal),
      listAssignableRoles(organizationId, request.signal),
    ]).then(([assigned, choices]) => {
      if (!request.signal.aborted) setLoad({ key, data: { assigned: assigned.roleIds, choices: choices.items } });
    }, (failure) => {
      if (!request.signal.aborted) setLoad({ key, error: assignmentErrorMessage(failure) });
    });
    return () => request.abort();
  }, [organizationId, membership.identityId, key]);

  function refresh() {
    setAttempt((value) => value + 1);
  }

  async function mutate(roleId: string, remove: boolean) {
    if (pending.current || (!remove && self)) return;
    pending.current = true;
    setBusy(true);
    setError(undefined);
    try {
      if (remove) await removeRoleAssignment(organizationId, membership.identityId, roleId);
      else await assignRole(organizationId, membership.identityId, roleId);
      setSelection("");
      toast.success(remove ? "Rôle retiré." : "Rôle attribué.");
    } catch (failure) {
      setError(assignmentErrorMessage(failure));
    } finally {
      setBusy(false);
      pending.current = false;
      setRemoval(undefined);
      refresh();
    }
  }

  return <section className="min-w-0 space-y-4 rounded-lg border border-ikbs-border p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="break-all font-semibold">{membership.displayName}</h3>
      <button type="button" className={button} disabled={busy} onClick={refresh}>Actualiser les affectations</button>
    </div>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {!current && <p role="status">Chargement des affectations…</p>}
    {current && "error" in current && <p role="alert">{current.error}</p>}
    {data && <>
      {data.assigned.length ? <ul className="divide-y divide-ikbs-border">
        {data.assigned.map((id) => {
          const label = data.choices.find((role) => role.id === id)?.name ?? id;
          return <li key={id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span className="break-all">{label}</span>
            <button type="button" className={button} disabled={busy} onClick={() => setRemoval({ id, label })}
              aria-label={"Retirer " + label}>Retirer</button>
          </li>;
        })}
      </ul> : <p className="text-sm text-ikbs-muted">Aucun rôle personnalisé attribué.</p>}
      {self ? <p className="text-sm text-ikbs-muted">Vous ne pouvez pas vous attribuer un rôle.</p>
        : available.length ? <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => {
          event.preventDefault();
          if (selectedRole) void mutate(selectedRole, false);
        }}>
          <label className="grid min-w-0 flex-1 gap-1 text-sm font-medium">
            Rôle à attribuer
            <select className="min-w-0 rounded-lg border border-ikbs-border bg-ikbs-card px-3 py-2"
              value={selectedRole} disabled={busy} onChange={(event) => setSelection(event.target.value)}>
              <option value="">Choisir un rôle</option>
              {available.map(({ id, name }) => <option value={id} key={id}>{name} ({id})</option>)}
            </select>
          </label>
          <button type="submit" className={button} disabled={!selectedRole || busy}>Attribuer</button>
        </form> : <p className="text-sm text-ikbs-muted">
          {data.choices.length ? "Aucun autre rôle attribuable." : "Aucun rôle personnalisé attribuable dans cette organisation."}
          {!data.choices.length && canManage && <> <a href="#roles-personnalises" className="font-medium text-ikbs-primary underline">
            Accéder aux rôles personnalisés
          </a></>}
        </p>}
    </>}
    {removal && <ConfirmModal open danger title="Retirer le rôle"
      message={"Retirer « " + removal.label + " » de cette appartenance ?"}
      confirmLabel="Confirmer le retrait" loading={busy} onClose={() => setRemoval(undefined)}
      onConfirm={() => mutate(removal.id, true)} />}
  </section>;
}

export function MemberRoleAssignment({ organizationId, memberId, actorId }: {
  organizationId: string; memberId: string; actorId: string;
}) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ attempt: number; membership: MembershipOption | null } |
    { attempt: number; error: string }>();
  useEffect(() => {
    const request = new AbortController();
    void findMembershipForMember(organizationId, memberId, request.signal).then(
      (membership) => { if (!request.signal.aborted) setResult({ attempt, membership }); },
      (error) => { if (!request.signal.aborted) setResult({ attempt, error: assignmentErrorMessage(error) }); },
    );
    return () => request.abort();
  }, [organizationId, memberId, attempt]);

  if (result?.attempt !== attempt) return <p role="status">Recherche du compte associé…</p>;
  if ("error" in result) return <div className="space-y-2">
    <p role="alert">{result.error}</p>
    <button type="button" className={button} onClick={() => setAttempt((value) => value + 1)}>Réessayer</button>
  </div>;
  return result.membership
    ? <SelectedMembership organizationId={organizationId} membership={result.membership} actorId={actorId} revision={0} canManage={false} />
    : <p role="status">Aucun compte actif avec une appartenance à cette organisation n’est associé à cette fiche.</p>;
}

export default function RoleAssignments({ organizationId, actorId, revision, canManage }: {
  organizationId: string;
  actorId: string;
  revision: number;
  canManage: boolean;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([query, page, limit, attempt]);
  const [load, setLoad] = useState<{ key: string; data: Directory } | { key: string; error: string }>();
  const [selected, setSelected] = useState<MembershipOption>();
  const current = load?.key === key ? load : undefined;
  const data = current && "data" in current ? current.data : undefined;

  useEffect(() => {
    const request = new AbortController();
    void listMemberships(organizationId, page, query, request.signal, limit).then(
      (data) => { if (!request.signal.aborted) setLoad({ key, data }); },
      (error) => { if (!request.signal.aborted) setLoad({ key, error: assignmentErrorMessage(error) }); },
    );
    return () => request.abort();
  }, [organizationId, page, limit, query, key]);

  function changePage(next: number) {
    setPage(next);
    setSelected(undefined);
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(String(new FormData(event.currentTarget).get("membershipSearch") ?? "").trim());
    changePage(1);
    setAttempt((value) => value + 1);
  }

  return <section id="affectations" tabIndex={-1} aria-labelledby="role-assignments-title"
    className="min-w-0 scroll-mt-24 space-y-4 rounded-xl border border-ikbs-border bg-ikbs-card p-4">
    <h2 id="role-assignments-title" className="text-xl font-semibold">Affectations de rôles</h2>
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="min-w-0 space-y-3">
        <form className="flex flex-wrap items-end gap-2" onSubmit={search}>
          <label className="grid min-w-0 flex-1 gap-1 text-sm font-medium">
            Rechercher une appartenance
            <input type="search" name="membershipSearch" maxLength={100}
              className="min-w-0 rounded-lg border border-ikbs-border bg-ikbs-card px-3 py-2" />
          </label>
          <button className={button} type="submit">Rechercher</button>
        </form>
        {!current && <p role="status">Chargement de l’annuaire…</p>}
        {current && "error" in current && <div className="space-y-2">
          <p role="alert">{current.error}</p>
          <button type="button" className={button} onClick={() => setAttempt((value) => value + 1)}>Réessayer</button>
        </div>}
        {data && (data.items.length ? <ul aria-label="Appartenances actives"
          className="max-h-80 overflow-y-auto divide-y divide-ikbs-border rounded-lg border border-ikbs-border">
          {data.items.map((membership) => <li key={membership.identityId}>
            <button type="button" aria-pressed={selected?.identityId === membership.identityId}
              className="w-full break-all px-3 py-2 text-left text-sm hover:bg-ikbs-primary/5 aria-pressed:bg-ikbs-primary/10"
              onClick={() => setSelected(membership)}>
              {membership.displayName}
              <span className="block text-xs text-ikbs-muted">{membership.identityId}</span>
            </button>
          </li>)}
        </ul> : <p className="text-sm text-ikbs-muted">Aucune appartenance active sur cette page.</p>)}
        {data && (data.total > 0 || page > 1) && <nav aria-label="Pagination des appartenances" className="flex flex-wrap items-center gap-2 text-sm">
          <span role="status">{data.items.length > 0
            ? `${(data.page - 1) * data.limit + 1}–${(data.page - 1) * data.limit + data.items.length} sur ${data.total}`
            : `0 sur ${data.total}`}</span>
          <label className="flex items-center gap-2">
            Par page
            <select className={button} value={limit} onChange={(event) => { setLimit(Number(event.target.value)); changePage(1); }}>
              {[15, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
          <button type="button" className={button} disabled={page <= 1} onClick={() => changePage(page - 1)}>Précédent</button>
          <button type="button" className={button} disabled={page * data.limit >= data.total} onClick={() => changePage(page + 1)}>Suivant</button>
        </nav>}
      </div>
      {selected ? <SelectedMembership key={selected.identityId} organizationId={organizationId}
        membership={selected} actorId={actorId} revision={revision} canManage={canManage} />
        : data && data.items.length > 0 && <p className="text-sm text-ikbs-muted">
          Sélectionnez une appartenance active pour consulter, attribuer ou retirer ses rôles.
        </p>}
    </div>
  </section>;
}
