export function backendOrigin(): string {
  const configured = process.env.IKBS_API_ORIGIN ?? "http://127.0.0.1:3000";
  const url = new URL(configured);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
      url.pathname !== "/" || url.search || url.hash) {
    throw new Error("IKBS_API_ORIGIN doit être une origine HTTP(S) sans chemin.");
  }
  return url.origin;
}
