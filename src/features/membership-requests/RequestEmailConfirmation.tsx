"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { confirmMembershipRequestLink, membershipRequestError } from "@/lib/api/membership-requests";

export default function RequestEmailConfirmation() {
  const [receipt, setReceipt] = useState<{ reference: string; code: string }>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);

  async function confirm() {
    if (pending.current) return;
    const token = window.location.hash.slice(1);
    if (!token) {
      setError("Ouvrez le lien complet reçu par e-mail ou demandez un nouveau code.");
      return;
    }
    pending.current = true;
    setBusy(true);
    setError(undefined);
    try {
      setReceipt(await confirmMembershipRequestLink(token));
      window.history.replaceState(null, "", window.location.pathname);
    } catch (failure) {
      setError(failure instanceof ApiError && failure.code === "REQUEST_EMAIL_CODE_INVALID"
        ? "Ce lien est invalide, expiré ou déjà utilisé."
        : membershipRequestError(failure));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return <section className="mx-auto max-w-xl space-y-5 px-4 py-10">
    <h1 className="text-2xl font-bold">Valider une demande d’organisation</h1>
    {receipt ? <div role="status" className="space-y-3 rounded-xl border border-ikbs-border bg-ikbs-card p-5">
      <p>Demande enregistrée sous la référence <strong>{receipt.reference}</strong>.</p>
      <p>Conservez votre référence et votre code privé pour suivre la demande.</p>
      <code className="block select-all break-all rounded-lg bg-ikbs-primary/10 p-3">{receipt.code}</code>
      <div className="flex flex-wrap gap-3">
        <Link href="/suivre-demande" className="font-medium text-ikbs-primary">Suivre ma demande</Link>
        <Link href="/rattacher-demande" className="font-medium text-ikbs-primary">Rattacher à un compte existant</Link>
      </div>
    </div> : <div className="space-y-4 rounded-xl border border-ikbs-border bg-ikbs-card p-5 sm:p-6">
      <p>Confirmez que vous souhaitez déposer la demande associée à cet e-mail.</p>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void confirm()} disabled={busy}
          className="rounded-lg bg-ikbs-primary px-4 py-2 font-medium text-white disabled:opacity-50">
          {busy ? "Validation…" : "Confirmer ma demande"}
        </button>
        <Link href="/proposer-organisation" className="text-sm font-medium text-ikbs-primary">Demander un nouveau code</Link>
      </div>
    </div>}
  </section>;
}
