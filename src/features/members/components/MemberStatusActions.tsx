"use client";

import { useRef, useState } from "react";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { ApiError } from "@/lib/api/client";
import { changeMemberStatus, memberMutationError, type DirectoryMember,
  type NextMemberStatus } from "@/lib/api/members";

export default function MemberStatusActions({ organizationId, member, onSaved, onRefresh }: {
  organizationId: string;
  member: DirectoryMember;
  onSaved: ()  => void;
  onRefresh: () => void;
}) {
  const [confirm, setConfirm] = useState<"INACTIVE" | "ARCHIVED">();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const toast = useToast();
  if (member.status === "ARCHIVED") return null;

  async function save(status: NextMemberStatus) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      await changeMemberStatus(organizationId, member, status);
      setConfirm(undefined);
      toast.success(status === "ARCHIVED" ? "Fiche archivée." :
        status === "INACTIVE" ? "Fiche désactivée." : "Fiche active.");
      onSaved();
    } catch (error) {
      setConfirm(undefined);
      if (error instanceof ApiError && error.status === 409) {
        toast.error("Le statut a changé ou cette transition est indisponible. La fiche a été actualisée.");
        onRefresh();
      } else {
        toast.error(memberMutationError(error));
      }
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  const button = "rounded-lg border border-ikbs-border px-3 py-1.5 text-sm font-medium hover:bg-ikbs-primary/5 disabled:opacity-50";
  const archive = confirm === "ARCHIVED";
  return <div className="flex flex-wrap gap-2">
    {member.status === "ACTIVE"
      ? <button type="button" className={button} disabled={busy} onClick={() => setConfirm("INACTIVE")}>Désactiver</button>
      : <button type="button" className={button} disabled={busy} onClick={() => void save("ACTIVE")}>
          {member.status === "INACTIVE" ? "Réactiver" : "Activer"}
        </button>}
    <button type="button" className={button} disabled={busy} onClick={() => setConfirm("ARCHIVED")}>Archiver</button>
    {confirm && <ConfirmModal open danger loading={busy}
      title={archive ? "Archiver la fiche" : "Désactiver la fiche"}
      message={archive
        ? "La fiche sera conservée dans les archives. Elle ne pourra plus être modifiée ni réactivée."
        : "La fiche restera dans le registre et pourra être réactivée. Les accès au compte sont conservés."}
      confirmLabel={archive ? "Confirmer l’archivage" : "Confirmer la désactivation"}
      onClose={() => setConfirm(undefined)} onConfirm={() => save(confirm)} />}
  </div>;
}
