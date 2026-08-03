export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.nsoul.co").replace(/\/$/, "");
export const LEGAL_CONTACT_EMAIL = process.env.LEGAL_CONTACT_EMAIL || "legal@nsoul.co";

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}
