import { ApiError } from "../api/client";
import "server-only";
import { cookies } from "next/headers";
import { getSession } from "../api/auth";
import { backendOrigin } from "../api/origin";
import { SESSION_COOKIE, sessionCookieHeader } from "./session-cookie";

export async function getServerSession() {
  const store = await cookies();
  const cookie = sessionCookieHeader(store.getAll(SESSION_COOKIE));
  if (!cookie) return null;
  try {
    return await getSession({ headers: { Cookie: cookie } }, backendOrigin());
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}
