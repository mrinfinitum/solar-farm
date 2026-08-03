import { contactSchema, type ValidatedContact } from "@/lib/validation";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const requestLog = new Map<string, number[]>();

function checkRateLimit(key: string) {
  const now = Date.now();
  const recent = (requestLog.get(key) || []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  requestLog.set(key, recent);
  return true;
}

function formatSubmission(data: ValidatedContact) {
  return [
    `Name: ${data.firstName} ${data.lastName}`,
    `Work email: ${data.email}`,
    `Company: ${data.company}`,
    `Job title: ${data.jobTitle}`,
    `Phone: ${data.phone || "Not provided"}`,
    `Facility location: ${data.facilityLocation}`,
    `Approximate monthly electricity spend: ${data.electricitySpend || "Not provided"}`,
    "",
    "Message:",
    data.message,
  ].join("\n");
}

async function sendWithResend(data: ValidatedContact) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) return { configured: false as const };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: data.email,
      subject: `NSoul commercial energy inquiry — ${data.company}`,
      text: formatSubmission(data),
    }),
  });

  if (!response.ok) throw new Error(`Resend returned ${response.status}`);
  return { configured: true as const };
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 50_000) {
    return Response.json({ message: "Submission is too large." }, { status: 413 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const rateLimitKey = forwardedFor || "local";
  if (!checkRateLimit(rateLimitKey)) {
    return Response.json(
      { message: "Too many requests. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid request." }, { status: 400 });
  }

  if (typeof body === "object" && body !== null && "website" in body && body.website) {
    return Response.json({ message: "Your request has been received." });
  }

  const result = contactSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { message: "Please review the form and try again." },
      { status: 400 },
    );
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[NSoul contact]", result.data);
  }

  try {
    const delivery = await sendWithResend(result.data);
    return Response.json({
      message: delivery.configured
        ? "We’ll review your facility needs and follow up soon."
        : "Your request was validated successfully. Email delivery will activate when the contact service is configured.",
    });
  } catch (error) {
    console.error("[NSoul contact] Delivery failed", error);
    return Response.json(
      { message: "We could not deliver your request. Please try again shortly." },
      { status: 502 },
    );
  }
}
