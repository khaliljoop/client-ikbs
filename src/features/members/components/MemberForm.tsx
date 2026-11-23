"use client";

import { useRef, useState } from "react";
import FormModal from "@/components/ui/forms/FormModal";
import type { DynamicFormField, FormErrors, FormValues } from "@/components/ui/forms/DynamicForm";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { createMember, memberMutationError, updateMember, type MemberDetail } from "@/lib/api/members";

const personalFields: DynamicFormField[] = [
  { type: "input", name: "firstName", label: "Prénom", required: true, autoComplete: "given-name" },
  { type: "input", name: "lastName", label: "Nom", required: true, autoComplete: "family-name" },
  { type: "input", inputType: "email", name: "email", label: "Email", required: true, autoComplete: "email" },
  { type: "input", inputType: "tel", name: "phone", label: "Téléphone", autoComplete: "tel-national",
    helperText: "Numéro sénégalais à 9 chiffres, sans indicatif." },
  { type: "textarea", name: "address", label: "Adresse", rows: 2, maxLength: 300 },
  { type: "radio", name: "gender", label: "Sexe", orientation: "horizontal", options: [
    { value: "", label: "Non renseigné" }, { value: "FEMALE", label: "Femme" }, { value: "MALE", label: "Homme" },
  ] },
];
const createFields: DynamicFormField[] = [
  ...personalFields,
  { type: "input", name: "username", label: "Nom d’utilisateur", required: true,
    helperText: "Identifiant de la fiche. La création ne donne aucun accès à IKBS." },
  { type: "input", name: "code", label: "Code membre", disabled: true },
];

export default function MemberForm({ organizationId, member, onClose, onSaved }: {
  organizationId: string;
  member?: MemberDetail;
  onClose: () => void;
  onSaved: (saved: MemberDetail) => void;
}) {
  const personal = member?.personal;
  const [values, setValues] = useState<FormValues>({
    firstName: member?.firstName ?? "", lastName: member?.lastName ?? "",
    email: personal?.email ?? "", phone: personal?.phone ?? "", address: personal?.address ?? "",
    gender: personal?.gender ?? "", username: "", code: "Généré à l’enregistrement",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const toast = useToast();

  async function save() {
    if (pending.current) return;
    const firstName = String(values.firstName).trim();
    const lastName = String(values.lastName).trim();
    const email = String(values.email).trim().toLowerCase();
    const phone = String(values.phone).trim();
    const address = String(values.address).trim();
    const gender = values.gender === "MALE" || values.gender === "FEMALE" ? values.gender : null;
    const username = String(values.username).trim().toLowerCase();
    const phoneChanged = phone !== (personal?.phone ?? "");
    const addressChanged = address !== (personal?.address ?? "");
    const problems: FormErrors = {};
    if (!firstName || firstName.length > 100) problems.firstName = "Saisissez un prénom de 1 à 100 caractères.";
    if (!lastName || lastName.length > 100) problems.lastName = "Saisissez un nom de 1 à 100 caractères.";
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) problems.email = "Saisissez une adresse email valide.";
    if (phoneChanged && phone && !/^(70|75|76|77|78)\d{7}$/.test(phone)) problems.phone = "Saisissez un numéro sénégalais valide à 9 chiffres.";
    if (addressChanged && address.length > 300) problems.address = "L’adresse est limitée à 300 caractères.";
    if (!member && !/^[a-z0-9._-]{3,50}$/.test(username)) {
      problems.username = "Utilisez 3 à 50 lettres, chiffres, points, tirets ou underscores.";
    }
    setErrors(problems);
    setSubmitError(undefined);
    if (Object.keys(problems).length) return;

    pending.current = true;
    setSaving(true);
    try {
      const saved = member
        ? await updateMember(organizationId, member.id, {
          firstName, lastName, ...(email !== personal?.email && { email }),
          ...(phoneChanged && { phone: phone || null }),
          ...(addressChanged && { address: address || null }),
          ...(gender !== (personal?.gender ?? null) && { gender }),
        })
        : await createMember(organizationId, {
          firstName, lastName, email, username, ...(phone && { phone }),
          ...(address && { address }), ...(gender && { gender }),
        });
      toast.success(member ? "Fiche membre mise à jour." : "Membre ajouté.");
      onSaved(saved);
    } catch (error) {
      setSubmitError(memberMutationError(error));
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return <FormModal open title={member ? "Modifier le membre" : "Ajouter un membre"}
    fields={member ? personalFields : createFields} values={values} errors={errors} columns={2}
    loading={saving} submitError={submitError} onSubmit={save}
    onClose={() => { if (!pending.current) onClose(); }}
    onChange={(name, value) => {
      setValues((current) => ({ ...current, [name]: value }));
      setErrors((current) => ({ ...current, [name]: undefined }));
      setSubmitError(undefined);
    }} />;
}
