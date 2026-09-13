import Link from "next/link";
import { routes } from "@/config/routes";
import MobileMenu from "./MobileMenu";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function PublicHeader() {
  return (
    <header className="relative border-b border-ikbs-border bg-ikbs-card">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href={routes.home}
          className="text-2xl font-bold text-ikbs-primary"
        >
          IKBS
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link
            href={routes.home}
            className="text-sm font-medium text-foreground transition hover:text-ikbs-success"
          >
            Accueil
          </Link>

          <Link
            href={routes.services}
            className="text-sm font-medium text-foreground transition hover:text-ikbs-success"
          >
            Services
          </Link>

          <Link
            href={routes.organisations}
            className="text-sm font-medium text-foreground transition hover:text-ikbs-success"
          >
            Organisations
          </Link>

          <ThemeToggle />

          <Link
            href={routes.login}
            className="
              rounded-lg
              bg-ikbs-primary
              px-4
              py-2
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-ikbs-primary-dark
            "
          >
            Connexion
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <MobileMenu />
        </div>
      </nav>
    </header>
  );
}