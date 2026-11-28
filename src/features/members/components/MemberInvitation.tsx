"use client";

import { useRef, useState } from "react";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import { inviteMember, memberInvitationError } from "@/lib/api/members";

export default function MemberInvitation({ organizationId, memberId, email }: {
  organizationId: string; memberId: string; email: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"SENT" | "PENDING">();
  const [error, setError] = useState<string>();
  const pending = useRef(false);

  async function send() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(undefined);
    try {
      setStatus((await inviteMember(organizationId, memberId)).status);
    } catch (failure) {
      setError(memberInvitationError(failure));
    } finally {
      setOpen(false);
      setBusy(false);
      pending.current = false;
    }
  }

  return <div className="max-w-sm space-y-2">
    <button type="button" onClick={() => setOpen(true)}
      className="rounded-lg border border-ikbs-border px-4 py-2 font-medium hover:bg-ikbs-primary/5">
      {status ? "Renvoyer l’invitation" : "Inviter ce membre"}
    </button>
    {error ? <p role="alert" className="text-sm text-red-600">{error}</p>
      : status && <p role="status" className="text-sm text-ikbs-muted">
        {status === "SENT" ? "Invitation transmise au service d’e-mail." : "Accès préparé. Relancez l’invitation après une minute."}
      </p>}
    <ConfirmModal open={open} loading={busy} title="Inviter ce membre"
      message={`Envoyer à ${email} un lien pour choisir son mot de passe et accéder à l’espace membre ?`}
      confirmLabel="Envoyer l’invitation" onClose={() => setOpen(false)} onConfirm={send} />
  </div>;
}
