export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1
          className="
            text-2xl font-bold
            text-foreground
          "
        >
          Tableau de bord
        </h1>

        <p
          className="
            mt-1 text-sm
            text-ikbs-muted
          "
        >
          Vue d&apos;ensemble de la
          plateforme IKBS.
        </p>
      </div>

      <div
        className="
          rounded-xl
          border border-ikbs-border
          bg-ikbs-card
          p-6
        "
      >
        <p className="text-ikbs-muted">
          Le tableau de bord sera
          construit à cette étape.
        </p>
      </div>
    </div>
  );
}