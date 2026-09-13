import { appConfig } from "@/config/app";

export default function PublicFooter() {
  return (
    <footer className="border-t border-ikbs-border bg-ikbs-primary-dark text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-white/80">
          © {new Date().getFullYear()} {appConfig.name} —{" "}
          {appConfig.fullName}
        </p>
      </div>
    </footer>
  );
}