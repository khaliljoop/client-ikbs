"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { WorkspaceUnavailable } from "@/components/auth/WorkspaceAccess";
import Modal from "@/components/ui/modal/Modal";
import DataTable from "@/components/ui/table/DataTable";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { listMembershipRequests, membershipRequestError, requestStatuses, retryMembershipAccessEmail, reviewMembershipRequest,
  type MembershipRequest, type RequestStatus } from "@/lib/api/membership-requests";
import { requestReview } from "@/lib/auth/workspaces";

const labels = { PENDING: "En attente", APPROVED: "Approuvée", REJECTED: "Refusée" };
const button = "rounded-lg border border-ikbs-border px-3 py-2 text-sm font-medium disabled:opacity-50";
const field = "rounded-lg border border-ikbs-border bg-ikbs-card px-3 py-2";

function Register() {
  const [status, setStatus] = useState<RequestStatus | "">("PENDING");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<MembershipRequest>();
  const [action, setAction] = useState<"approve" | "reject">();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const toast = useToast();
  const key = JSON.stringify([page, status, search, revision]);
  const [loaded, setLoaded] = useState<{ key: string; data: Awaited<ReturnType<typeof listMembershipRequests>> } |
    { key: string; error: string }>();
  const current = loaded?.key === key ? loaded : undefined;
  const data = current && "data" in current ? current.data : undefined;

  useEffect(() => {
    const request = new AbortController();
    void listMembershipRequests(page, status, search, request.signal).then(
      (data) => { if (!request.signal.aborted) setLoaded({ key, data }); },
      (failure) => { if (!request.signal.aborted) setLoaded({ key, error: membershipRequestError(failure) }); },
    );
    return () => request.abort();
  }, [key, page, status, search]);

  function close() {
    if (pending.current) return;
    setSelected(undefined);
    setAction(undefined);
    setError(undefined);
  }

  async function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !action || pending.current) return;
    const reason = String(new FormData(event.currentTarget).get("reason") ?? "").trim();
    pending.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const updated = await reviewMembershipRequest(selected.id, action, reason);
      toast.success(action === "approve"
        ? (updated.accessEmailStatus === "PENDING" ? "Demande approuvée. L’invitation reste en attente." : "Demande approuvée. L’organisation a été créée.")
        : "Demande refusée.");
      setSelected(updated.accessEmailStatus === "PENDING" ? updated : undefined);
      setAction(undefined);
      setPage(1);
      setRevision((value) => value + 1);
    } catch (failure) {
      setError(membershipRequestError(failure));
      setRevision((value) => value + 1);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  async function retryEmail() {
    if (!selected || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const updated = await retryMembershipAccessEmail(selected.id);
      setSelected(updated);
      if (updated.accessEmailStatus === "SENT") toast.success("Invitation transmise au service d’e-mail.");
      else setError("L’invitation reste en attente. Réessayez dans un instant.");
      setRevision((value) => value + 1);
    } catch (failure) {
      setError(membershipRequestError(failure));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return <section className="min-w-0 space-y-4">
    <h1 className="text-2xl font-bold">Demandes d’organisation</h1>
    <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => {
      event.preventDefault();
      setSearch(String(new FormData(event.currentTarget).get("search") ?? "").trim());
      setPage(1);
      setRevision((value) => value + 1);
    }}>
      <label className="grid min-w-0 flex-1 gap-1 text-sm font-medium">Rechercher par nom, référence ou courriel
        <input name="search" type="search" maxLength={100} className={field} />
      </label>
      <button className={button} type="submit">Rechercher</button>
      <label className="grid gap-1 text-sm font-medium">Statut
        <select className={field} value={status} onChange={(event) => { setStatus(event.target.value as RequestStatus | ""); setPage(1); }}>
          <option value="">Tous</option>
          {requestStatuses.map((value) => <option value={value} key={value}>{labels[value]}</option>)}
        </select>
      </label>
    </form>
    {current && "error" in current
      ? <div className="space-y-2"><p role="alert">{current.error}</p>
        <button type="button" className={button} onClick={() => setRevision((value) => value + 1)}>Réessayer</button></div>
      : <DataTable<MembershipRequest> data={data?.data ?? []} rowKey={({ id }) => id} loading={!current}
        emptyMessage="Aucune demande pour ces filtres."
        columns={[
          { key: "reference", label: "Référence", render: (_, item) => <button type="button"
            className="font-medium text-ikbs-primary hover:underline" onClick={() => setSelected(item)}>{item.reference}</button> },
          { key: "organizationName", label: "Organisation", render: (_, item) => <span className="whitespace-normal break-words">{item.organizationName}</span> },
          { key: "firstName", label: "Demandeur", render: (_, item) => <span className="whitespace-normal">{item.firstName} {item.lastName}</span> },
          { key: "status", label: "Statut", render: (_, item) => labels[item.status] },
          { key: "createdAt", label: "Date", render: (_, item) => new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC" }).format(new Date(item.createdAt)) },
        ]}
        pagination={data && { enabled: true, page, limit: 10, total: data.pagination.total,
          totalPages: data.pagination.totalPages, onPageChange: setPage }}
      />}
    {selected && <Modal open title={selected.reference} onClose={close}>
      <div className="space-y-4">
        <div>
          <h2 className="break-words text-lg font-semibold">{selected.organizationName}</h2>
          <p className="whitespace-pre-wrap break-words">{selected.organizationObjective}</p>
        </div>
        <dl className="space-y-1 text-sm">
          <div><dt className="font-medium">Demandeur</dt><dd>{selected.firstName} {selected.lastName}</dd></div>
          <div><dt className="font-medium">Courriel</dt><dd className="break-all">{selected.email}</dd></div>
          {selected.phone && <div><dt className="font-medium">Téléphone</dt><dd>{selected.phone}</dd></div>}
          {selected.address && <div><dt className="font-medium">Adresse</dt><dd>{selected.address}</dd></div>}
          <div><dt className="font-medium">Statut</dt><dd>{labels[selected.status]}</dd></div>
          {selected.accessEmailStatus && <div><dt className="font-medium">Invitation par e-mail</dt>
            <dd>{selected.accessEmailStatus === "SENT" ? "Transmise au service d’e-mail" : "En attente"}</dd></div>}
          {selected.rejectionReason && <div><dt className="font-medium">Motif du refus</dt><dd className="break-words">{selected.rejectionReason}</dd></div>}
        </dl>
        {error && <p role="alert" className="text-red-600">{error}</p>}
        {selected.status === "APPROVED" && selected.accessEmailStatus &&
          <button type="button" className={button} disabled={busy} onClick={retryEmail}>
            {busy ? "Envoi en cours…" : selected.accessEmailStatus === "SENT" ? "Renvoyer l’invitation" : "Relancer l’invitation"}
          </button>}
        {selected.status === "PENDING" && <>
          {!selected.canProvision && <p className="text-sm text-ikbs-muted">
            {selected.awaitingAccount ? "Si cette adresse n’a pas encore de compte IKBS, l’approbation crée son accès et déclenche une invitation."
              : "Cette ancienne demande doit être redéposée par le demandeur."}
          </p>}
          {action ? <form className="space-y-3" onSubmit={review}>
            {action === "approve" ? <p>Confirmer la création de l’organisation et l’accès administrateur du demandeur ?</p>
              : <label className="grid gap-1 text-sm font-medium">Motif du refus (facultatif)
                <textarea className={field} name="reason" rows={3} maxLength={1000} disabled={busy} /></label>}
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} className={button} onClick={() => { setAction(undefined); setError(undefined); }}>Annuler</button>
              <button type="submit" disabled={busy} className={button}>
                {busy ? "Traitement…" : action === "approve" ? "Confirmer l’approbation" : "Confirmer le refus"}
              </button>
            </div>
          </form> : <div className="flex flex-wrap gap-2">
            {(selected.canProvision || selected.awaitingAccount) && <button type="button" className={button} onClick={() => setAction("approve")}>Approuver</button>}
            <button type="button" className={button} onClick={() => setAction("reject")}>Refuser</button>
          </div>}
        </>}
      </div>
    </Modal>}
  </section>;
}

export default function RequestReview() {
  const { profile } = useSession();
  return profile.globalPermissions.includes(requestReview)
    ? <Register key={profile.user.id} /> : <WorkspaceUnavailable kind="global" />;
}
