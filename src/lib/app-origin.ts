export function publicAppOrigin(): URL | undefined {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (!configured) return undefined;
  const url = new URL(configured);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password ||
      url.pathname !== "/" || url.search || url.hash) {
    throw new Error("NEXT_PUBLIC_APP_URL doit contenir uniquement l’origine publique de Next.js.");
  }
  return url;
}
