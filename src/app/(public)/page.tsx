import Link from "next/link";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import { routes } from "@/config/routes";

export default function HomePage() {
  return (
    <Section>
      <Container>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-ikbs-primary sm:text-4xl lg:text-5xl">
              Bienvenue sur IKBS
            </h1>

            <p className="mt-4 max-w-2xl text-ikbs-muted">
              Une plateforme moderne pour gérer vos organisations,
              membres, événements et cotisations.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <h2 className="text-lg font-semibold">
                Organisations
              </h2>

              <p className="mt-2 text-sm text-ikbs-muted">
                Gérez plusieurs organisations depuis une seule
                plateforme.
              </p>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold">
                Membres
              </h2>

              <p className="mt-2 text-sm text-ikbs-muted">
                Gérez les membres et leurs rôles.
              </p>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold">
                Événements
              </h2>

              <p className="mt-2 text-sm text-ikbs-muted">
                Organisez vos réunions et événements.
              </p>
            </Card>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button>
              Découvrir IKBS
            </Button>

            <Link href={routes.organisations}>
              <Button variant="outline">
                Voir les organisations
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}