export const DEFAULT_AFTER_LOGIN = "/employees";

/**
 * The post-login destination from `?next=`, restricted to same-origin paths so the
 * login page cannot be used as an open redirect (e.g. `?next=//evil.example`).
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return DEFAULT_AFTER_LOGIN;
  }
  try {
    const url = new URL(next, "http://placeholder.invalid");
    if (url.origin !== "http://placeholder.invalid" || url.pathname === "/login") {
      return DEFAULT_AFTER_LOGIN;
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return DEFAULT_AFTER_LOGIN;
  }
}
