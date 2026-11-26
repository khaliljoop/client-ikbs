"use client";

import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { ApiError, apiClient } from "@/lib/api/client";

const field = "w-full rounded-lg border border-ikbs-border bg-ikbs-card px-3 py-2";
const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

function feedback(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "PASSWORD_RESET_INVALID") return "Ce lien est invalide, expiré ou déjà utilisé. Demandez une nouvelle invitation.";
    if (error.code === "PASSWORD_RESET_WEAK") return "Choisissez un mot de passe plus robuste.";
    if (error.status === 429) return "Trop de tentatives. Réessayez dans quelques minutes.";
  }
  return "Impossible de configurer le mot de passe pour le moment.";
}

export default function PasswordSetup() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const code = window.location.hash.slice(1);
    if (!/^[A-Za-z0-9_-]{16,512}$/.test(code)) {
      setError("Ouvrez le lien complet reçu par e-mail ou demandez une nouvelle invitation.");
      return;
    }
    const password = String(data.get("password") ?? "");
    if (password !== data.get("confirmPassword")) {
      setError("Les deux mots de passe doivent être identiques.");
      return;
    }
    pending.current = true;
    setBusy(true);
    setError(undefined);
    try {
      await apiClient<void>("/auth/password/reset", { method: "POST", body: JSON.stringify({ code, password }) });
      form.reset();
      window.history.replaceState(window.history.state, "", window.location.pathname);
      setDone(true);
    } catch (failure) {
      setError(feedback(failure));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  if (done) return <p role="status" className="rounded-xl border border-ikbs-border bg-ikbs-card p-5">
    Mot de passe enregistré. Vous pouvez vous connecter avec votre adresse e-mail.
  </p>;

  return <form method="post" onSubmit={submit} className="space-y-4 rounded-xl border border-ikbs-border bg-ikbs-card p-5 sm:p-6">
    <p className="text-sm text-ikbs-muted">Utilisez entre 8 et 128 caractères.</p>
    <fieldset disabled={busy || !ready} className="space-y-4">
      <label className="grid gap-1 text-sm font-medium">Nouveau mot de passe
        <input className={field} type="password" name="password" autoComplete="new-password" minLength={8} maxLength={128} required />
      </label>
      <label className="grid gap-1 text-sm font-medium">Confirmer le mot de passe
        <input className={field} type="password" name="confirmPassword" autoComplete="new-password" minLength={8} maxLength={128} required />
      </label>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      <button type="submit" className="rounded-lg bg-ikbs-primary px-4 py-2 font-medium text-white disabled:opacity-50">
        {busy ? "Enregistrement…" : "Enregistrer le mot de passe"}
      </button>
    </fieldset>
  </form>;
}
