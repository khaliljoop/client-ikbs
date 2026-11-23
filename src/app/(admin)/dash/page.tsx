import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold">Administration globale</h1>
      <Link href="/dash/organisations" className="inline-block rounded-lg border border-ikbs-border bg-ikbs-card p-4 text-ikbs-primary">
        Gérer les organisations
      </Link>
    </section>
  );
}
