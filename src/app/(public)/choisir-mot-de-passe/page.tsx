import Link from "next/link";
import PasswordSetup from "@/features/membership-requests/PasswordSetup";

export default function PasswordSetupPage() {
  return <section className="mx-auto max-w-xl space-y-5 px-4 py-10">
    <h1 className="text-2xl font-bold">Choisir votre mot de passe</h1>
    <PasswordSetup />
    <Link className="text-sm font-medium text-ikbs-primary" href="/login">Aller à la connexion</Link>
  </section>;
}
