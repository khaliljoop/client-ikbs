import { useEffect, useState, type FormEvent } from "react";
import { listMembers, memberErrorMessage, type DirectoryMember } from "@/lib/api/members";

const limit = 10;
const button = "rounded-lg border border-ikbs-border px-3 py-2 text-sm disabled:opacity-50";

export default function ParticipationMemberPicker({ organizationId, busy, openMemberIds, onSelect, onCancel }: {
  organizationId: string;
  busy: boolean;
  openMemberIds: ReadonlySet<string>;
  onSelect: (member: DirectoryMember) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState({ search: "", page: 1 });
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ query: typeof query; attempt: number; value:
    { items: DirectoryMember[]; total: number } | string }>();
  const data = result?.query === query && result.attempt === attempt ? result.value : undefined;

  useEffect(() => {
    const request = new AbortController();
    void listMembers(organizationId, query.page, limit, query.search, request.signal, "ACTIVE").then(
      (value) => { if (!request.signal.aborted) setResult({ query, attempt, value }); },
      (failure) => { if (!request.signal.aborted) setResult({ query, attempt, value: memberErrorMessage(failure) }); },
    );
    return () => request.abort();
  }, [organizationId, query, attempt]);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery({ page: 1, search: String(new FormData(event.currentTarget).get("memberSearch") ?? "").trim() });
  }

  const active = typeof data === "object" ? data.items.filter((member) => member.status === "ACTIVE") : [];
  return <section aria-label="Sélection du membre" className="space-y-3 rounded-xl border border-ikbs-border p-4">
    <h3 className="font-semibold">Affecter un membre</h3>
    <form className="flex flex-wrap items-end gap-2" onSubmit={search}>
      <label className="grid flex-1 gap-1 text-sm">
        Rechercher une fiche active par nom ou code
        <input name="memberSearch" type="search" maxLength={100} className="rounded-lg border border-ikbs-border bg-ikbs-card px-3 py-2" />
      </label>
      <button type="submit" className={button} disabled={busy}>Rechercher</button>
    </form>
    {!data && <p role="status">Chargement des fiches actives…</p>}
    {typeof data === "string" && <div role="alert" className="space-y-2">
      <p>{data}</p>
      <button type="button" className={button} onClick={() => setAttempt((value) => value + 1)}>Réessayer la recherche</button>
    </div>}
    {typeof data === "object" && <>
      {active.length === 0 ? <p>Aucune fiche active pour cette recherche.</p> : <ul className="divide-y divide-ikbs-border">
        {active.map((member) => <li key={member.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
          <span>{member.firstName} {member.lastName} · <span className="font-mono">{member.code}</span></span>
          <button type="button" className={button} disabled={busy || openMemberIds.has(member.id)}
            aria-label={`Affecter ${member.firstName} ${member.lastName}`}
            onClick={() => onSelect(member)}>{openMemberIds.has(member.id) ? "Participation déjà ouverte" : "Affecter"}</button>
        </li>)}
      </ul>}
      <div aria-label="Pages des fiches membres" className="flex flex-wrap items-center gap-2 text-sm">
        <button type="button" className={button} disabled={busy || query.page === 1}
          onClick={() => setQuery({ ...query, page: query.page - 1 })}>Fiches précédentes</button>
        <span>Page {query.page}</span>
        <button type="button" className={button} disabled={busy || query.page >= 100_000 || query.page * limit >= data.total}
          onClick={() => setQuery({ ...query, page: query.page + 1 })}>Fiches suivantes</button>
      </div>
    </>}
    <button type="button" className={button} disabled={busy} onClick={onCancel}>Annuler la sélection</button>
  </section>;
}
