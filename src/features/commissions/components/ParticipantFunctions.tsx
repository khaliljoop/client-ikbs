import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Modal from "@/components/ui/modal/Modal";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { assignParticipantFunction, closeParticipantFunction, listCommissionFunctions, listParticipantFunctions,
  participantFunctionError, type CommissionFunctionDefinition, type ParticipantFunction } from "@/lib/api/commission-functions";

const button = "rounded-lg border border-ikbs-border px-3 py-2 text-sm disabled:opacity-50";
const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export default function ParticipantFunctions({ organizationId, commissionId, participationId, name, canAssign, canClose, onClose }: {
  organizationId: string; commissionId: string; participationId: string; name: string;
  canAssign: boolean; canClose: boolean; onClose: () => void;
}) {
  const [rows, setRows] = useState<ParticipantFunction[]>();
  const [choices, setChoices] = useState<{ items: CommissionFunctionDefinition[]; totalPages: number; page: number }>();
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [choice, setChoice] = useState("");
  const [readError, setReadError] = useState<string>();
  const [mutationError, setMutationError] = useState<string>();
  const [closing, setClosing] = useState<ParticipantFunction>();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const toast = useToast();

  useEffect(() => {
    const request = new AbortController();
    void listParticipantFunctions(organizationId, commissionId, participationId, request.signal).then(
      ({ items }) => { if (!request.signal.aborted) { setRows(items); setReadError(undefined); } },
      (failure) => { if (!request.signal.aborted) { setRows(undefined); setReadError(participantFunctionError(failure)); } },
    );
    return () => request.abort();
  }, [organizationId, commissionId, participationId, revision]);

  useEffect(() => {
    if (!canAssign) return;
    const request = new AbortController();
    void listCommissionFunctions(organizationId, { page, limit: 10, search: "", status: "" }, request.signal).then(
      (result) => { if (!request.signal.aborted) setChoices(result); },
      (failure) => { if (!request.signal.aborted) { setChoices(undefined); setMutationError(participantFunctionError(failure)); } },
    );
    return () => request.abort();
  }, [organizationId, page, canAssign, revision]);

  async function save() {
    const target = closing;
    if (pending.current || (target ? !canClose : !canAssign || !choice)) return;
    pending.current = true;
    setBusy(true);
    setMutationError(undefined);
    try {
      const record = target
        ? await closeParticipantFunction(organizationId, commissionId, participationId, target.id)
        : await assignParticipantFunction(organizationId, commissionId, participationId, choice);
      setRows((current) => [...(current ?? []).filter((item) => item.id !== record.id), record]);
      setChoice("");
      toast.success(target ? "Mandat clôturé." : "Fonction attribuée.");
    } catch (failure) {
      setMutationError(participantFunctionError(failure));
    } finally {
      setClosing(undefined);
      setBusy(false);
      pending.current = false;
      setRevision((value) => value + 1);
    }
  }

  const options = choices?.page === page ? choices.items.filter((item) => item.enabled) : [];
  return createPortal(<>
    <Modal open title={"Fonctions · " + name} onClose={() => { if (!pending.current) onClose(); }}>
      <div className="space-y-4">
        {readError && <p role="alert">{readError}</p>}
        {mutationError && <p role="alert">{mutationError}</p>}
        {!rows && !readError && <p role="status">Chargement des fonctions…</p>}
        {rows?.length === 0 && <p>Aucune fonction attribuée.</p>}
        {!!rows?.length && <ul className="divide-y divide-ikbs-border">
          {rows.map((row) => <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div><strong>{row.name}</strong>
              <p className="text-sm">{row.closedAt ? "Clôturée le " + date.format(new Date(row.closedAt)) :
                row.isEffective ? "En cours" : "Non effective"} · Depuis le {date.format(new Date(row.startedAt))}</p>
            </div>
            {canClose && !row.closedAt && <button type="button" className={button} disabled={busy}
              onClick={() => setClosing(row)}>Clôturer</button>}
          </li>)}
        </ul>}
        {canAssign && <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void save(); }}>
          <label className="grid gap-2 text-sm">Fonction activée pour l’organisation
            <select className={button} value={choice} onChange={(event) => setChoice(event.target.value)} disabled={busy || !options.length}>
              <option value="">Choisir une fonction</option>
              {options.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.code}</option>)}
            </select>
          </label>
          {choices?.page === page && !options.length && <p className="text-sm">Aucune fonction activée sur cette page du catalogue.</p>}
          {choices && choices.totalPages > 1 && <div className="flex items-center gap-2">
            <button type="button" className={button} disabled={busy || page <= 1}
              onClick={() => { setChoice(""); setPage(page - 1); }}>Précédent</button>
            <span>Page {page} / {choices.totalPages}</span>
            <button type="button" className={button} disabled={busy || page >= choices.totalPages}
              onClick={() => { setChoice(""); setPage(page + 1); }}>Suivant</button>
          </div>}
          <button type="submit" className={button} disabled={busy || !choice}>Attribuer la fonction</button>
        </form>}
        {readError && <button type="button" className={button} onClick={() => setRevision((value) => value + 1)}>Réessayer</button>}
      </div>
    </Modal>
    {closing && canClose && <ConfirmModal open danger loading={busy} title="Clôturer le mandat"
      message={closing.name + " restera consultable dans l’historique."} confirmLabel="Confirmer la clôture"
      onClose={() => setClosing(undefined)} onConfirm={save} />}
  </>, document.body);
}
