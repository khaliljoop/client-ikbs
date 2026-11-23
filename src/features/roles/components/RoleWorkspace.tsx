"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useSession } from "@/components/auth/SessionProvider";
import { WorkspaceUnavailable } from "@/components/auth/WorkspaceAccess";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import DataTable from "@/components/ui/table/DataTable";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { deleteRole, listDelegableRolePermissions, listRoles, roleErrorMessage, type OrganizationRole } from "@/lib/api/roles";
import { findWorkspace, rolesAssign, rolesManage } from "@/lib/auth/workspaces";
import RoleAssignments from "./RoleAssignments";
import RoleForm, { rolePermissionLabel } from "./RoleForm";

type RoleData = { roles: OrganizationRole[]; delegable: string[] };
type RoleLoad = { version: number; data?: RoleData; error?: string };

function RoleDefinitions({ organizationId, onChange }: { organizationId: string; onChange: () => void }) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<RoleLoad>();
  const [editing, setEditing] = useState<OrganizationRole | null>();
  const [deleting, setDeleting] = useState<OrganizationRole>();
  const [deletionError, setDeletionError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const toast = useToast();
  const current = state?.version === version ? state : undefined;
  const data = state?.data;

  useEffect(() => {
    const request = new AbortController();
    void Promise.all([listRoles(organizationId, request.signal), listDelegableRolePermissions(organizationId, request.signal)])
      .then(([roles, catalog]) => {
        if (!request.signal.aborted) setState({ version, data: { roles: roles.items, delegable: catalog.permissions } });
      }, (error) => {
        if (!request.signal.aborted) setState((previous) => ({ ...previous, version, error: roleErrorMessage(error) }));
      });
    return () => request.abort();
  }, [organizationId, version]);

  function refresh() {
    setVersion((value) => value + 1);
  }

  async function remove(role: OrganizationRole) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      await deleteRole(organizationId, role.id);
      setState((previous) => previous?.data ? { ...previous, data: { ...previous.data,
        roles: previous.data.roles.filter(({ id }) => id !== role.id),
      } } : previous);
      toast.success("Rôle supprimé.");
      refresh();
      onChange();
    } catch (error) {
      setDeletionError(roleErrorMessage(error));
    } finally {
      pending.current = false;
      setBusy(false);
      setDeleting(undefined);
    }
  }

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold">Rôles personnalisés</h2>
      {data && <button type="button" onClick={() => setEditing(null)}
        className="rounded-lg bg-ikbs-primary px-4 py-2 font-medium text-white">Créer un rôle</button>}
    </div>
    {deletionError && <p role="alert" className="rounded-lg border border-red-500/30 p-3 text-sm text-red-600">{deletionError}</p>}
    {current?.error && <div className="space-y-2">
      <p role="alert">{data && "Actualisation impossible. "}{current.error}</p>
      <button type="button" onClick={refresh} className="rounded-lg border border-ikbs-border px-4 py-2">Réessayer</button>
    </div>}
    {(data || !current?.error) && <DataTable<OrganizationRole>
      data={data?.roles ?? []} rowKey={(role) => role.id} loading={!data && !current}
      emptyMessage="Aucun rôle personnalisé dans cette organisation."
      columns={[
        { key: "name", label: "Rôle", render: (_, role) => <div className="max-w-64 whitespace-normal break-words">
          <p className="font-semibold">{role.name}</p>
          <p className="font-mono text-xs text-ikbs-muted">{role.code}</p>
          {role.description && <p className="mt-1 text-sm text-ikbs-muted">{role.description}</p>}
        </div> },
        { key: "permissions", label: "Permissions du rôle", render: (_, role) =>
          role.permissions.length ? <ul className="max-w-sm space-y-1 whitespace-normal">
            {role.permissions.map((permission) => <li key={permission}>{rolePermissionLabel(permission)}</li>)}
          </ul> : <span className="text-ikbs-muted">Aucune permission</span> },
      ]}
      actions={{ enabled: true, items: () => [
        { key: "edit", label: "Modifier le rôle", icon: <Pencil size={16} />, onClick: setEditing },
        { key: "delete", label: "Supprimer le rôle", icon: <Trash2 size={16} />, danger: true,
          onClick: (role) => { setDeletionError(undefined); setDeleting(role); } },
      ] }}
    />}
    {editing !== undefined && data && <RoleForm key={editing ? "edit:" + editing.id : "create"} organizationId={organizationId} role={editing} delegable={data.delegable}
      onClose={() => setEditing(undefined)} onSaved={(saved) => {
        setEditing(undefined);
        // Keep the confirmed response visible even if the read that follows fails.
        setState((previous) => previous?.data ? { ...previous, data: {
          ...previous.data,
          roles: [...previous.data.roles.filter(({ id }) => id !== saved.id), saved]
            .sort((left, right) => left.code.localeCompare(right.code)),
        } } : previous);
        toast.success(editing ? "Rôle mis à jour." : "Rôle créé.");
        setDeletionError(undefined);
        refresh();
        onChange();
      }} />}
    {deleting && <ConfirmModal open danger loading={busy} title="Supprimer le rôle"
      message={"Supprimer « " + deleting.name + " » ? Cette action est définitive."}
      confirmLabel="Supprimer" onClose={() => setDeleting(undefined)} onConfirm={() => remove(deleting)} />}
  </section>;
}

export default function RoleWorkspace({ code }: { code: string }) {
  const { profile } = useSession();
  const [revision, setRevision] = useState(0);
  const workspace = findWorkspace(profile, code);
  if (!workspace) return <WorkspaceUnavailable kind="local" />;
  const canManage = workspace.permissions.includes(rolesManage);
  const canAssign = workspace.permissions.includes(rolesAssign);
  return <section className="min-w-0 space-y-6">
    <h1 className="text-2xl font-bold">Rôles et habilitations</h1>
    {!canManage && !canAssign && <p role="alert">Votre compte ne dispose pas des droits nécessaires dans cette organisation.</p>}
    {canManage && <RoleDefinitions key={"definitions:" + profile.user.id + ":" + workspace.id} organizationId={workspace.id}
      onChange={() => setRevision((value) => value + 1)} />}
    {canAssign && <RoleAssignments key={"assignments:" + profile.user.id + ":" + workspace.id} actorId={profile.user.id}
      organizationId={workspace.id} revision={revision} />}
  </section>;
}
