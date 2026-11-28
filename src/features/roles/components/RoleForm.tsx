"use client";

import { useRef, useState, type FormEvent } from "react";
import InputGroup from "@/components/ui/forms/InputGroup";
import TextareaGroup from "@/components/ui/forms/TextareaGroup";
import Modal from "@/components/ui/modal/Modal";
import { createRole, roleErrorMessage, updateRole, type OrganizationRole } from "@/lib/api/roles";

const permissionLabels: Record<string, string> = {
  "organization.read": "Consulter l’organisation",
  "organization.profile.update": "Modifier le profil de l’organisation",
  "members.write": "Créer et modifier des fiches membres",
  "members.lifecycle": "Gérer les statuts et consulter les archives",
  "commissions.read": "Consulter les commissions et leurs participants",
  "commissions.manage": "Gérer le registre des commissions",
  "commissions.members.manage": "Ajouter et retirer des participants",
  "commissions.functions.manage": "Activer les fonctions, les attribuer et clôturer les mandats",
};

export function rolePermissionLabel(permission: string) {
  return permissionLabels[permission] ?? permission;
}

const modules = [
  { name: "Organisation", prefix: "organization." },
  { name: "Membres", prefix: "members." },
  { name: "Commissions", prefix: "commissions." },
];

export default function RoleForm({ organizationId, role, delegable, onClose, onSaved }: {
  organizationId: string;
  role: OrganizationRole | null;
  delegable: string[];
  onClose: () => void;
  onSaved: (saved: OrganizationRole) => void;
}) {
  const [code, setCode] = useState(role?.code ?? "");
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [permissions, setPermissions] = useState<string[]>(role?.permissions ?? []);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const canEditPermissions = !role?.permissions.some((permission) => !delegable.includes(permission));

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    setError(undefined);
    const normalizedCode = code.trim().toLowerCase();
    if (!role && !/^[a-z][a-z0-9_-]{1,39}$/.test(normalizedCode)) {
      setError("Le code doit commencer par une lettre et contenir de 2 à 40 lettres, chiffres, tirets ou underscores.");
      return;
    }
    const normalizedName = name.trim();
    if (!normalizedName || normalizedName.length > 100) {
      setError("Saisissez un nom de 1 à 100 caractères.");
      return;
    }
    pending.current = true;
    setSaving(true);
    let saved: OrganizationRole;
    try {
      const input = { name: normalizedName, description: description.trim() || null };
      if (role) {
        const changed = permissions.length !== role.permissions.length || permissions.some((permission) => !role.permissions.includes(permission));
        saved = await updateRole(organizationId, role.id, { ...input, ...(canEditPermissions && changed && { permissions }) });
      } else {
        saved = await createRole(organizationId, { ...input, code: normalizedCode, permissions });
      }
    } catch (error) {
      setError(roleErrorMessage(error));
      return;
    } finally {
      pending.current = false;
      setSaving(false);
    }
    onSaved(saved);
  }

  return <Modal open size="lg" title={role ? "Modifier le rôle" : "Créer un rôle"}
    onClose={() => { if (!pending.current) onClose(); }} closeOnOverlayClick={false}>
    <form onSubmit={save} className="space-y-5">
      <InputGroup label="Nom" name="name" required value={name} disabled={saving} onChange={(value) => setName(String(value))} />
      <InputGroup label="Code" name="code" required value={code} readOnly={!!role} disabled={saving}
        helperText="Le code identifie le rôle. Il est fixe après création." onChange={(value) => setCode(String(value))} />
      <TextareaGroup label="Description facultative" name="description" value={description} rows={3} maxLength={500}
        disabled={saving} onChange={setDescription} />
      <div className="space-y-3">
        <h3 className="font-semibold">Permissions</h3>
        {!canEditPermissions
          ? <p className="text-sm text-ikbs-muted">Ce rôle contient une permission que vous ne pouvez pas déléguer. Vous pouvez modifier son nom et sa description.</p>
          : delegable.length === 0 && <p className="text-sm text-ikbs-muted">Aucune permission délégable.</p>}
        {canEditPermissions && modules.map(({ name, prefix }) => {
          const entries = delegable.filter((permission) => permission.startsWith(prefix));
          return entries.length > 0 && <fieldset key={prefix} disabled={saving} className="space-y-2 rounded-lg border border-ikbs-border px-3 pb-3">
            <legend className="px-1 text-sm font-medium">{name}</legend>
            {entries.map((permission) => <label key={permission} className="flex items-start gap-2 text-sm">
              <input className="mt-1" type="checkbox" checked={permissions.includes(permission)} onChange={(event) => {
                const checked = event.target.checked;
                setPermissions((current) => checked ? [...current, permission] : current.filter((item) => item !== permission));
              }} />
              {rolePermissionLabel(permission)}
            </label>)}
          </fieldset>;
        })}
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" disabled={saving} onClick={onClose} className="rounded-lg border border-ikbs-border px-4 py-2">Annuler</button>
        <button type="submit" disabled={saving} className="rounded-lg bg-ikbs-primary px-4 py-2 text-white disabled:opacity-50">
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  </Modal>;
}
