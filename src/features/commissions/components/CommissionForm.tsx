"use client";

import { useRef, useState, type FormEvent } from "react";
import InputGroup from "@/components/ui/forms/InputGroup";
import TextareaGroup from "@/components/ui/forms/TextareaGroup";
import Modal from "@/components/ui/modal/Modal";
import { ApiError } from "@/lib/api/client";
import { commissionErrorMessage, createCommission, getCommission, updateCommission, type Commission } from "@/lib/api/commissions";

export default function CommissionForm({ organizationId, initial, onClose, onSaved }: {
  organizationId: string;
  initial: Commission | null;
  onClose: () => void;
  onSaved: (commission: Commission) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [version, setVersion] = useState(initial?.version);
  const [error, setError] = useState<string>();
  const [conflict, setConflict] = useState(false);
  const [latest, setLatest] = useState<Commission>();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || conflict) return;
    setError(undefined);
    if (!name.trim() || name.trim().length > 100 || description.trim().length > 500) {
      setError("Le nom doit contenir de 1 à 100 caractères et la description au plus 500 caractères.");
      return;
    }
    pending.current = true;
    setBusy(true);
    let saved: Commission;
    try {
      const input = { name: name.trim(), description: description.trim() || null };
      saved = initial && version !== undefined
        ? await updateCommission(organizationId, initial.id, { ...input, version })
        : await createCommission(organizationId, input);
    } catch (failure) {
      setError(commissionErrorMessage(failure));
      if (initial && failure instanceof ApiError && failure.status === 409) {
        setConflict(true);
        setLatest(undefined);
      }
      return;
    } finally {
      pending.current = false;
      setBusy(false);
    }
    onSaved(saved);
  }

  async function reread() {
    if (!initial || pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      setLatest(await getCommission(organizationId, initial.id));
      setError(undefined);
    } catch (failure) {
      setError(commissionErrorMessage(failure));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return <Modal open size="lg" title={initial ? "Modifier la commission" : "Nouvelle commission"}
    closeOnOverlayClick={false} onClose={() => { if (!pending.current) onClose(); }}>
    <form className="space-y-4" onSubmit={save}>
      {initial && <p className="font-mono text-sm text-ikbs-muted">{initial.code} · version {version}</p>}
      <InputGroup label="Nom" name="name" value={name} required disabled={busy} onChange={(value) => setName(String(value))} />
      <TextareaGroup label="Description facultative" name="description" value={description} rows={3}
        maxLength={500} disabled={busy} onChange={setDescription} />
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {conflict && <section className="space-y-2 rounded-lg border border-ikbs-border p-3 text-sm">
        <p>Votre brouillon est conservé. Relisez la version du serveur avant de reprendre la modification.</p>
        <button type="button" disabled={busy} onClick={() => void reread()} className="rounded-lg border px-3 py-2">Relire la commission</button>
        {latest && <>
          <p className="break-words"><strong>Version {latest.version} sur le serveur</strong> · {latest.name}</p>
          <p className="whitespace-pre-wrap break-words">{latest.description || "Aucune description"}</p>
          {latest.status === "ACTIVE" ? <button type="button" className="rounded-lg border px-3 py-2" onClick={() => {
            setVersion(latest.version);
            setLatest(undefined);
            setConflict(false);
          }}>Adopter cette version de référence</button> : <p>Cette commission est archivée.</p>}
        </>}
      </section>}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" disabled={busy} onClick={onClose} className="rounded-lg border px-4 py-2">Annuler</button>
        <button type="submit" disabled={busy || conflict} className="rounded-lg bg-ikbs-primary px-4 py-2 text-white disabled:opacity-50">
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  </Modal>;
}
