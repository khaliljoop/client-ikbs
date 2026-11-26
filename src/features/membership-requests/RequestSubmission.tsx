"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { confirmMembershipRequest, membershipRequestError, requestMembershipEmailCode, type PublicRequestInput } from "@/lib/api/membership-requests";

const field = "w-full rounded-lg border border-ikbs-border bg-ikbs-card px-3 py-2";

export default function RequestSubmission() {
  const [receipt, setReceipt] = useState<{ reference: string; code: string }>();
  const [draft, setDraft] = useState<PublicRequestInput>();
  const [challengeId, setChallengeId] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) ?? "").trim();
    const input = { firstName: value("firstName"), lastName: value("lastName"), email: value("email"),
      organizationName: value("organizationName"), organizationObjective: value("organizationObjective") };
    if (Object.values(input).some((text) => !text)) {
      setError("Tous les champs sont obligatoires.");
      return;
    }
    setDraft(input);
    void sendCode(input);
  }

  async function sendCode(input: PublicRequestInput) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(undefined);
    try {
      setChallengeId((await requestMembershipEmailCode(input)).challengeId);
    } catch (failure) {
      setError(membershipRequestError(failure));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || !challengeId || pending.current) return;
    const otp = String(new FormData(event.currentTarget).get("otp") ?? "").trim();
    pending.current = true;
    setBusy(true);
    setError(undefined);
    try {
      setReceipt(await confirmMembershipRequest(draft, challengeId, otp));
    } catch (failure) {
      setError(membershipRequestError(failure));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return <section className="mx-auto max-w-xl space-y-5 px-4 py-10">
    <h1 className="text-2xl font-bold">Proposer une organisation</h1>
    {receipt ? <div role="status" className="space-y-3 rounded-xl border border-ikbs-border bg-ikbs-card p-5">
      <p>Demande enregistrée sous la référence <strong>{receipt.reference}</strong>.</p>
      <p>Conservez la référence et ce code privé pour suivre votre demande. Le code sert aussi au rattachement si vous avez déjà un compte IKBS.</p>
      <code className="block select-all break-all rounded-lg bg-ikbs-primary/10 p-3">{receipt.code}</code>
      <p>Pour un nouveau compte, l’approbation déclenche un e-mail vous permettant de choisir votre mot de passe.</p>
      <div className="flex flex-wrap gap-3">
        <Link className="font-medium text-ikbs-primary" href="/suivre-demande">Suivre ma demande</Link>
        <Link className="font-medium text-ikbs-primary" href="/rattacher-demande">Rattacher à un compte existant</Link>
      </div>
    </div> : challengeId && draft ? <form method="post" onSubmit={verify}
      className="space-y-4 rounded-xl border border-ikbs-border bg-ikbs-card p-5 sm:p-6">
      <h2 className="font-semibold">Vérifiez votre adresse e-mail</h2>
      <p className="text-sm text-ikbs-muted">Saisissez le code envoyé à <strong className="break-all">{draft.email}</strong> ou ouvrez le lien dans l’e-mail. La validation expire après 10 minutes.</p>
      <label className="grid gap-1 text-sm font-medium">Code de vérification
        <input className={field} name="otp" inputMode="numeric" autoComplete="one-time-code"
          pattern="[0-9]{6}" minLength={6} maxLength={6} required disabled={busy} />
      </label>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className="rounded-lg bg-ikbs-primary px-4 py-2 font-medium text-white disabled:opacity-50">
          {busy ? "Traitement…" : "Vérifier et déposer"}
        </button>
        <button type="button" disabled={busy} className="text-sm font-medium text-ikbs-primary"
          onClick={() => void sendCode(draft)}>Renvoyer le code</button>
        <button type="button" disabled={busy} className="text-sm font-medium text-ikbs-primary"
          onClick={() => { setChallengeId(undefined); setError(undefined); }}>Corriger l’adresse</button>
      </div>
    </form> : <form method="post" className="space-y-4 rounded-xl border border-ikbs-border bg-ikbs-card p-5 sm:p-6" onSubmit={submit}>
      <fieldset disabled={busy} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium">Prénom<input name="firstName" defaultValue={draft?.firstName} autoComplete="given-name" className={field} required maxLength={100} /></label>
          <label className="grid gap-1 text-sm font-medium">Nom<input name="lastName" defaultValue={draft?.lastName} autoComplete="family-name" className={field} required maxLength={100} /></label>
        </div>
        <label className="grid gap-1 text-sm font-medium">Adresse e-mail<input type="email" name="email" defaultValue={draft?.email} autoComplete="email" className={field} required maxLength={254} /></label>
        <label className="grid gap-1 text-sm font-medium">Nom de l’organisation<input name="organizationName" defaultValue={draft?.organizationName} className={field} required maxLength={255} /></label>
        <label className="grid gap-1 text-sm font-medium">Objectif de l’organisation<textarea name="organizationObjective" defaultValue={draft?.organizationObjective} className={field} rows={5} required maxLength={2000} /></label>
        {error && <p role="alert" className="text-red-600">{error}</p>}
        <button type="submit" className="rounded-lg bg-ikbs-primary px-4 py-2 font-medium text-white disabled:opacity-50">
          {busy ? "Envoi en cours…" : "Recevoir un code par e-mail"}
        </button>
      </fieldset>
      <Link href="/suivre-demande" className="text-sm font-medium text-ikbs-primary">Suivre une demande déjà déposée</Link>
    </form>}
  </section>;
}
