export const SESSION_COOKIE = "__Host-ikbs_session";

export function sessionCookieHeader(values: readonly { value: string }[]): string | undefined {
  if (values.length !== 1) return;
  const [{ value }] = values;
  if (value.length === 43 && /^[A-Za-z0-9_-]+$/.test(value)) {
    return SESSION_COOKIE + "=" + value;
  }
}
