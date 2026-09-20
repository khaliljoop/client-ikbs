"use client";

import {
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";
import Link from "next/link";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  FormEvent,
  useState,
} from "react";

import { routes } from "@/config/routes";
import {
  mockLogin,
  saveMockUser,
} from "@/lib/auth/mock-auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (
  event: FormEvent<HTMLFormElement>,
) => {
  event.preventDefault();

  setError("");
  setLoading(true);

  try {
    const user = await mockLogin({
      email,
      password,
    });

    saveMockUser(user);

    const redirect =searchParams.get("redirect");

    // router.push(
    //   redirect || routes.home,
    // );
    console.log(
  "LOGIN URL actuelle:",
  window.location.href,
);

console.log(
  "LOGIN redirect param:",
  redirect,
);

const target = redirect || routes.home;

console.log(
  "LOGIN destination:",
  target,
);

router.replace(target);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Une erreur est survenue lors de la connexion.",
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <section
      className="
        min-h-[calc(100vh-64px)]
        bg-background
      "
    >
      <div
        className="
          mx-auto
          flex
          min-h-[calc(100vh-64px)]
          max-w-7xl
          items-center
          px-4
          py-10
          sm:px-6
          lg:px-8
        "
      >
        <div className="mx-auto w-full max-w-md">

          {/* ========================= */}
          {/* RETOUR */}
          {/* ========================= */}

          <Link
            href={routes.home}
            className="
              mb-6
              inline-flex
              items-center
              gap-2
              text-sm
              font-medium
              text-ikbs-muted
              transition
              hover:text-ikbs-primary
            "
          >
            <ArrowLeft
              size={16}
              aria-hidden="true"
            />

            <span>
              Retour à l&apos;accueil
            </span>
          </Link>

          {/* ========================= */}
          {/* CARTE LOGIN */}
          {/* ========================= */}

          <div
            className="
              rounded-2xl
              border
              border-ikbs-border
              bg-ikbs-card
              p-6
              shadow-sm
              sm:p-8
            "
          >
            {/* ========================= */}
            {/* HEADER */}
            {/* ========================= */}

            <div className="text-center">
              <div
                className="
                  mx-auto
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-ikbs-primary/10
                  text-ikbs-primary
                "
              >
                <Building2
                  size={26}
                  aria-hidden="true"
                />
              </div>

              <h1
                className="
                  mt-5
                  text-2xl
                  font-bold
                  text-foreground
                "
              >
                Connexion
              </h1>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-ikbs-muted
                "
              >
                Connectez-vous pour accéder
                à votre espace organisation.
              </p>
            </div>

            {/* ========================= */}
            {/* FORMULAIRE */}
            {/* ========================= */}

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              {/* EMAIL */}

              <div>
                <label
                  htmlFor="email"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-foreground
                  "
                >
                  Adresse email
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-ikbs-muted
                    "
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="nom@exemple.com"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value,
                      )
                    }
                    disabled={loading}
                    required
                    className="
                      h-11
                      w-full
                      rounded-xl
                      border
                      border-ikbs-border
                      bg-background
                      pl-10
                      pr-4
                      text-sm
                      text-foreground
                      outline-none
                      transition
                      placeholder:text-ikbs-muted

                      focus:border-ikbs-primary
                      focus:ring-2
                      focus:ring-ikbs-primary/20

                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  />
                </div>
              </div>

              {/* PASSWORD */}

              <div>
                <div
                    className="
                    mb-2
                    flex
                    items-center
                    justify-between
                    gap-4
                    "
                >
                    <label
                    htmlFor="password"
                    className="
                        text-sm
                        font-medium
                        text-foreground
                    "
                    >
                    Mot de passe
                    </label>

                    <Link
                    href="/mot-de-passe-oublie"
                    className="
                        text-xs
                        font-medium
                        text-ikbs-primary
                        transition
                        hover:underline
                    "
                    >
                    Mot de passe oublié ?
                    </Link>
                </div>

                <div className="relative">
                    {/* Icône cadenas */}

                    <LockKeyhole
                    size={18}
                    aria-hidden="true"
                    className="
                        pointer-events-none
                        absolute
                        left-3
                        top-1/2
                        -translate-y-1/2
                        text-ikbs-muted
                    "
                    />

                    <input
                    id="password"
                    name="password"
                    type={
                        showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(event) =>
                        setPassword(
                        event.target.value,
                        )
                    }
                    disabled={loading}
                    required
                    className="
                        h-11
                        w-full
                        rounded-xl
                        border
                        border-ikbs-border
                        bg-background
                        pl-10
                        pr-11
                        text-sm
                        text-foreground
                        outline-none
                        transition
                        placeholder:text-ikbs-muted

                        focus:border-ikbs-primary
                        focus:ring-2
                        focus:ring-ikbs-primary/20

                        disabled:cursor-not-allowed
                        disabled:opacity-60
                    "
                    />

                    {/* Afficher / masquer */}

                    <button
                    type="button"
                    onClick={() =>
                        setShowPassword(
                        (current) => !current,
                        )
                    }
                    disabled={loading}
                    aria-label={
                        showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                    title={
                        showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                    className="
                        absolute
                        right-2
                        top-1/2
                        flex
                        h-8
                        w-8
                        -translate-y-1/2
                        items-center
                        justify-center
                        rounded-lg
                        text-ikbs-muted
                        transition

                        hover:bg-ikbs-primary/10
                        hover:text-ikbs-primary

                        focus:outline-none
                        focus:ring-2
                        focus:ring-ikbs-primary/20

                        disabled:cursor-not-allowed
                        disabled:opacity-50
                    "
                    >
                    {showPassword ? (
                        <EyeOff
                        size={18}
                        aria-hidden="true"
                        />
                    ) : (
                        <Eye
                        size={18}
                        aria-hidden="true"
                        />
                    )}
                    </button>
                </div>
                </div>

              {/* ========================= */}
              {/* ERREUR */}
              {/* ========================= */}

              {error && (
                <div
                  role="alert"
                  className="
                    rounded-xl
                    border
                    border-red-200
                    bg-red-50
                    px-4
                    py-3
                    text-sm
                    text-red-700

                    dark:border-red-900
                    dark:bg-red-950/30
                    dark:text-red-300
                  "
                >
                  {error}
                </div>
              )}

              {/* ========================= */}
              {/* SUBMIT */}
              {/* ========================= */}

              <button
                type="submit"
                disabled={loading}
                className="
                  flex
                  h-11
                  w-full
                  items-center
                  justify-center
                  rounded-xl
                  bg-ikbs-primary
                  px-4
                  text-sm
                  font-semibold
                  text-white
                  transition

                  hover:bg-ikbs-primary-dark

                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {loading
                  ? "Connexion..."
                  : "Se connecter"}
              </button>
            </form>
          </div>

          {/* ========================= */}
          {/* FOOTER */}
          {/* ========================= */}

          <p
            className="
              mt-6
              text-center
              text-xs
              leading-5
              text-ikbs-muted
            "
          >
            L&apos;accès à l&apos;espace privé
            est réservé aux membres autorisés
            d&apos;une organisation.
          </p>
        </div>
      </div>
    </section>
  );
}