import "server-only";

const requestLog = new Map<string, number[]>();

export function passesRateLimit(key: string, maximum = 4, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const recent = (requestLog.get(key) || []).filter((time) => now - time < windowMs);
  if (recent.length >= maximum) return false;
  requestLog.set(key, [...recent, now]);
  return true;
}

export function requestAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export function sanitizeFilename(filename: string) {
  const base = filename.split(/[\\/]/).pop() || "document";
  return base.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/\.{2,}/g, ".").slice(0, 100) || "document";
}

export async function sendIntakeEmail(subject: string, replyTo: string, lines: string[]) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], reply_to: replyTo, subject, text: lines.join("\n") }),
  });
  if (!response.ok) throw new Error(`Resend returned ${response.status}`);
  return true;
}

export function intakeResult(delivered: boolean, persisted: boolean) {
  if (delivered || persisted || process.env.NODE_ENV !== "production") return true;
  return false;
}
