"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { WorkspaceUnavailable } from "@/components/auth/WorkspaceAccess";
import FormModal from "@/components/ui/forms/FormModal";
import type { FormErrors, FormValues } from "@/components/ui/forms/DynamicForm";
import { ApiError } from "@/lib/api/client";
import { getOrganization, organizationErrorMessage, updateOrganization } from "@/lib/api/organizations";
import { findWorkspace, organizationUpdate } from "@/lib/auth/workspaces";
import type { Organization } from "@/types/organization";
import {
  organizationFormFields, organizationFormToUpdateInput, organizationToFormValues, validateOrganizationForm,
} from "../forms/organization-form";

function OrganizationProfile({ id, canEdit }: { id: string; canEdit: boolean }) {
  const [record, setRecord] = useState<Organization | null>(null);
  const [loadError, setLoadError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const [form, setForm] = useState<FormValues | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveError, setSaveError] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void getOrganization(id, { signal: controller.signal }).then(
      (organization) => { if (!controller.signal.aborted) setRecord(organization); },
      (error) => { if (!controller.signal.aborted) setLoadError(organizationErrorMessage(error)); },
    );
    return () => controller.abort();
  }, [id, attempt]);

  async function save() {
    if (!canEdit || !form) return;
    const validation = validateOrganizationForm(form);
    setErrors(validation);
    if (Object.values(validation).some(Boolean)) return;

    setSaving(true);
    setSaveError(undefined);
    try {
      const updated = await updateOrganization(id, organizationFormToUpdateInput(form));
      setRecord(updated);
      setForm(null);
    } catch (error) {
      setSaveError(organizationErrorMessage(error));
      if (error instanceof ApiError && error.status === 404) {
        setRecord(null);
        setLoadError(organizationErrorMessage(error));
      }
    } finally {
      setSaving(false);
    }
  }

  if (!record) {
    return loadError ? (
      <div className="space-y-3">
        <p role="alert">{loadError}</p>
        <button type="button" className="rounded-lg border px-4 py-2" onClick={() => {
          setLoadError(undefined);
          setAttempt((current) => current + 1);
        }}>Réessayer</button>
      </div>
    ) : <p role="status">Chargement de l’organisation…</p>;
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{record.name}</h1>
        {canEdit && <button type="button" className="rounded-lg bg-ikbs-primary px-4 py-2 text-white"
          onClick={() => {
            setErrors({});
            setSaveError(undefined);
            setForm(organizationToFormValues(record));
          }}>Modifier le profil</button>}
      </header>
      <dl className="space-y-3 rounded-xl border border-ikbs-border bg-ikbs-card p-5">
        <div><dt className="font-medium">Code</dt><dd>{record.code}</dd></div>
        {record.description && <div><dt className="font-medium">Présentation</dt><dd>{record.description}</dd></div>}
        {record.email && <div><dt className="font-medium">Email</dt><dd>{record.email}</dd></div>}
        {record.phone && <div><dt className="font-medium">Téléphone</dt><dd>{record.phone}</dd></div>}
        {record.address && <div><dt className="font-medium">Adresse</dt><dd>{record.address}</dd></div>}
      </dl>
      {canEdit && form && (
        <FormModal open title="Modifier le profil de l’organisation" fields={organizationFormFields}
          values={form} errors={errors} columns={2} loading={saving} submitError={saveError}
          onChange={(name, value) => {
            setForm((current) => current && { ...current, [name]: value });
            setErrors((current) => ({ ...current, [name]: undefined }));
          }}
          onClose={() => { if (!saving) setForm(null); }} onSubmit={save} />
      )}
    </section>
  );
}

export default function OrganizationWorkspace({ code }: { code: string }) {
  const { profile } = useSession();
  const workspace = findWorkspace(profile, code);
  if (!workspace) return <WorkspaceUnavailable kind="local" />;
  const canEdit = workspace.permissions.includes(organizationUpdate);
  return <OrganizationProfile key={workspace.id + ":" + canEdit} id={workspace.id} canEdit={canEdit} />;
}
