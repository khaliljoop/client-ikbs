import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { authErrorMessage } from "@/lib/api/auth";
import { loginPath } from "@/lib/auth/redirect";
import { getServerSession } from "@/lib/auth/server-session";
import SessionProvider from "./SessionProvider";

export default async function SessionGate({ children, returnPath }: { children: ReactNode; returnPath: string }) {
  let profile;
  try {
    profile = await getServerSession();
  } catch (error) {
    return <SessionProvider initialProfile={null} initialError={authErrorMessage(error, "session")}>{children}</SessionProvider>;
  }
  if (!profile) redirect(loginPath(returnPath));
  return <SessionProvider initialProfile={profile}>{children}</SessionProvider>;
}
