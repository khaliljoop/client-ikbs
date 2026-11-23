const returnPaths = /^\/(?:espaces|dash(?:\/organisations)?|espace\/[A-Za-z][0-9]{7}|organisations(?:\/[A-Za-z][0-9]{7})?)?$/;

export function safeReturnPath(value: string | null | undefined): string {
  return value && returnPaths.test(value) && !/[\r\n]/.test(value) ? value : "/";
}

export function loginPath(returnPath: string): string {
  return "/login?redirect=" + encodeURIComponent(safeReturnPath(returnPath));
}
