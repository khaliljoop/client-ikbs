"use client";

import { createContext, Fragment, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { authErrorMessage, getSession, logout } from "@/lib/api/auth";
import { ApiError, CAPABILITIES_CHANGED_EVENT, SESSION_LOST_EVENT } from "@/lib/api/client";
import { loginPath } from "@/lib/auth/redirect";
import type { SessionProfile } from "@/types/auth";

const SessionContext = createContext<{
  profile: SessionProfile;
  signOut: () => Promise<void>;
} | null>(null);

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("SessionProvider manquant");
  return context;
}

export default function SessionProvider({ children, initialProfile, initialError }: {
  children: ReactNode;
  initialProfile: SessionProfile | null;
  initialError?: string;
}) {
  const pathname = usePathname();
  const [profile, setProfile] = useState(initialProfile);
  const [problem, setProblem] = useState(initialError);
  const [verifiedPath, setVerifiedPath] = useState(pathname);
  const pending = useRef<AbortController | null>(null);
  const leaving = useRef(false);

  const leave = useCallback((target: string) => {
    leaving.current = true;
    pending.current?.abort();
    setProfile(null);
    window.location.replace(target);
  }, []);

  const expire = useCallback(() => leave(loginPath(pathname)), [leave, pathname]);

  const refreshSession = useCallback(async () => {
    if (leaving.current || pending.current) return;
    const request = new AbortController();
    pending.current = request;
    try {
      const current = await getSession({ signal: request.signal });
      if (request.signal.aborted || leaving.current) return;
      setProfile(current);
      setVerifiedPath(pathname);
      setProblem(undefined);
    } catch (error) {
      if (request.signal.aborted || leaving.current) return;
      if (error instanceof ApiError && error.status === 401) expire();
      else setProblem(authErrorMessage(error, "session"));
    } finally {
      if (pending.current === request) pending.current = null;
    }
  }, [expire, pathname]);

  useEffect(() => {
    const recheckVisible = () => {
      if (document.visibilityState === "visible") void refreshSession();
    };
    window.addEventListener(SESSION_LOST_EVENT, expire);
    window.addEventListener(CAPABILITIES_CHANGED_EVENT, recheckVisible);
    window.addEventListener("focus", recheckVisible);
    window.addEventListener("pageshow", recheckVisible);
    document.addEventListener("visibilitychange", recheckVisible);
    const interval = window.setInterval(recheckVisible, 60_000);
    return () => {
      window.removeEventListener(SESSION_LOST_EVENT, expire);
      window.removeEventListener(CAPABILITIES_CHANGED_EVENT, recheckVisible);
      window.removeEventListener("focus", recheckVisible);
      window.removeEventListener("pageshow", recheckVisible);
      document.removeEventListener("visibilitychange", recheckVisible);
      window.clearInterval(interval);
      pending.current?.abort();
      pending.current = null;
    };
  }, [expire, refreshSession]);

  useEffect(() => {
    if (pathname === verifiedPath) return;
    const timeout = window.setTimeout(() => void refreshSession(), 0);
    return () => window.clearTimeout(timeout);
  }, [pathname, verifiedPath, refreshSession]);

  useEffect(() => {
    if (!profile) return;
    const delay = Math.max(0, Date.parse(profile.session.expiresAt) - Date.now());
    const timeout = window.setTimeout(() => void refreshSession(), delay);
    return () => window.clearTimeout(timeout);
  }, [profile, refreshSession]);

  async function signOut() {
    try {
      await logout();
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) throw error;
    }
    leave("/login");
  }

  if (problem || !profile || pathname !== verifiedPath) {
    return (
      <section className="mx-auto max-w-md space-y-4 p-8">
        {problem ? (
          <>
            <p role="alert">{problem}</p>
            <button type="button" className="rounded-lg border px-4 py-2" onClick={() => void refreshSession()}>
              Réessayer
            </button>
          </>
        ) : <p role="status">Vérification de votre session…</p>}
      </section>
    );
  }

  return <SessionContext.Provider value={{ profile, signOut }}><Fragment key={profile.user.id}>{children}</Fragment></SessionContext.Provider>;
}
