"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { linkMembershipRequest, membershipRequestError } from "@/lib/api/membership-requests";

const field = "w-full rounded-lg border border-ikbs-border bg-ikbs-card px-3 py-2";

export default function RequestClaim() {
  const [linked, setLinked] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const form = new FormData(event.currentTarget);
    pending.current = true;
    setBusy(true);
    setError(undefined);
    try {
      await linkMembershipRequest(String(form.get("reference") ?? "").trim(), String(form.get("code") ?? "").trim());
      setLinked(true);
    } catch (error) {
      setError(membershipRequestError(error));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return <section className="mx-auto max-w-xl space-y-5 px-4 py-10">
    <h1 className="text-2xl font-bold">Rattacher une demande</h1>
    {linked ? <div role="status" className="space-y-3 rounded-xl border border-ikbs-border bg-ikbs-card p-5">
      <p>La demande est rattachée à votre compte et peut être examinée.</p>
      <Link href="/espaces" className="font-medium text-ikbs-primary">Voir mes espaces</Link>
    </div> : <form method="post" onSubmit={submit} className="space-y-4 rounded-xl border border-ikbs-border bg-ikbs-card p-5">
      <p className="text-sm text-ikbs-muted">Votre compte doit utiliser l’adresse e-mail indiquée dans la demande.</p>
      <fieldset disabled={busy} className="space-y-4">
        <label className="grid gap-1 text-sm font-medium">Référence<input name="reference" className={field} required maxLength={15} placeholder="DEM-2026-000001" /></label>
        <label className="grid gap-1 text-sm font-medium">Code de rattachement<input name="code" type="password" autoComplete="off" className={field} required maxLength={32} /></label>
        {error && <p role="alert" className="text-red-600">{error}</p>}
        <button type="submit" className="rounded-lg bg-ikbs-primary px-4 py-2 font-medium text-white disabled:opacity-50">
          {busy ? "Rattachement…" : "Confirmer le rattachement"}
        </button>
      </fieldset>
    </form>}
  </section>;
}
