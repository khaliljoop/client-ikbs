"use client";

import { useRef, useState, type FormEvent } from "react";
import { membershipRequestError, trackMembershipRequest, type RequestStatus } from "@/lib/api/membership-requests";

const statusLabel: Record<RequestStatus, string> = {
  PENDING: "En attente de traitement",
  APPROVED: "Approuvée",
  REJECTED: "Refusée",
};
const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" });
const field = "rounded-lg border border-ikbs-border bg-ikbs-card px-3 py-2";

export default function RequestTracking() {
  const [result, setResult] = useState<Awaited<ReturnType<typeof trackMembershipRequest>>>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const data = new FormData(event.currentTarget);
    const reference = String(data.get("reference") ?? "").trim();
    const code = String(data.get("code") ?? "").trim();
    pending.current = true;
    setBusy(true);
    setError(undefined);
    setResult(undefined);
    try {
      setResult(await trackMembershipRequest(reference, code));
    } catch (failure) {
      setError(membershipRequestError(failure));
    } finally {
      setBusy(false);
      pending.current = false;
    }
  }

  return <section className="mx-auto max-w-xl space-y-5 px-4 py-10">
    <h1 className="text-2xl font-bold">Suivre une demande</h1>
    <form method="post" onSubmit={submit} className="space-y-4 rounded-xl border border-ikbs-border bg-ikbs-card p-5 sm:p-6">
      <p className="text-sm text-ikbs-muted">Saisissez la référence et le code privé reçus lors du dépôt ou dans le courriel d’approbation.</p>
      <fieldset disabled={busy} className="space-y-4">
        <label className="grid gap-1 text-sm font-medium">Référence
          <input name="reference" className={field} placeholder="DEM-2026-000001" maxLength={15} autoComplete="off" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">Code privé de suivi
          <input name="code" type="password" className={field} maxLength={32} minLength={32} autoComplete="off" required />
        </label>
        <button type="submit" className="rounded-lg bg-ikbs-primary px-4 py-2 font-medium text-white disabled:opacity-50">
          {busy ? "Recherche…" : "Consulter le statut"}
        </button>
      </fieldset>
      {error && <p role="alert" className="text-red-600">{error}</p>}
    </form>
    {result && <div role="status" className="space-y-2 rounded-xl border border-ikbs-border bg-ikbs-card p-5">
      <p className="text-sm text-ikbs-muted">{result.reference}</p>
      <h2 className="text-lg font-semibold">{statusLabel[result.status]}</h2>
      <p>Déposée le {date.format(new Date(result.createdAt))}</p>
      {result.reviewedAt && <p>Traitée le {date.format(new Date(result.reviewedAt))}</p>}
    </div>}
  </section>;
}
