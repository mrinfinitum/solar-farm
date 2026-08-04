import { randomUUID } from "node:crypto";

import { contactSchema, type ValidatedContact } from "@/lib/validation";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const requestLog = new Map<string, number[]>();

type Submission = ValidatedContact & { submissionId: string; submittedAt: string };

function checkRateLimit(key: string) {
  const now = Date.now();
  const recent = (requestLog.get(key) || []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  requestLog.set(key, recent);
  return true;
}

function formatSubmission(data: Submission) {
  return [
    `Submission ID: ${data.submissionId}`,
    `Submitted: ${data.submittedAt}`,
    `Name: ${data.firstName} ${data.lastName}`,
    `Work email: ${data.email}`,
    `Company: ${data.company}`,
    `Job title: ${data.jobTitle}`,
    `Phone: ${data.phone || "Not provided"}`,
    "",
    `Facility location: ${data.facilityLocation}`,
    `Facility type: ${data.facilityType || "Not provided"}`,
    `Utility provider: ${data.utilityProvider || "Not provided"}`,
    `Annual electricity usage: ${data.annualElectricityUsage || "Not provided"}`,
    `Monthly electricity spend: ${data.electricitySpend || "Not provided"}`,
    `Preferred topic: ${data.discussionTopic || "Not provided"}`,
    `Desired timeline: ${data.desiredTimeline || "Not provided"}`,
    "",
    "Message:",
    data.message,
    "",
    `Source page: ${data.sourcePage || "Unknown"}`,
    `UTM source: ${data.utmSource || "Not provided"}`,
    `UTM medium: ${data.utmMedium || "Not provided"}`,
    `UTM campaign: ${data.utmCampaign || "Not provided"}`,
  ].join("\n");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);
}

async function sendEmail(payload: Record<string, unknown>) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Resend returned ${response.status}`);
}

async function sendWithResend(data: Submission) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) return { configured: false as const };

  const text = formatSubmission(data);
  const rows = text.split("\n").map((line) => `<div style="padding:4px 0;color:#20382c">${escapeHtml(line) || "&nbsp;"}</div>`).join("");
  await sendEmail({
    from,
    to: [to],
    reply_to: data.email,
    subject: `New NSoul Commercial Energy Inquiry, ${data.company}`,
    text,
    html: `<div style="font-family:Arial,sans-serif;max-width:720px;margin:auto;padding:32px"><h1 style="color:#102c1e">New commercial energy inquiry</h1><p style="color:#617269">Structured submission ${escapeHtml(data.submissionId)}</p>${rows}</div>`,
  });

  try {
    await sendEmail({
      from,
      to: [data.email],
      subject: "NSoul received your energy inquiry",
      text: `Hello ${data.firstName},\n\nWe received your commercial energy inquiry and will review the facility information you shared. A member of the NSoul team will follow up if the opportunity appears aligned.\n\nReference: ${data.submissionId}\n\nNSoul LLC`,
    });
  } catch (error) {
    console.error("[NSoul contact] Confirmation delivery failed", error);
  }

  return { configured: true as const };
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 50_000) return Response.json({ message: "Submission is too large." }, { status: 413 });

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!checkRateLimit(forwardedFor || "local")) {
    return Response.json({ message: "Too many requests. Please wait a few minutes and try again." }, { status: 429 });
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
    return Response.json({ message: "Please review the form and try again.", issues: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const submission: Submission = { ...result.data, submissionId: randomUUID(), submittedAt: new Date().toISOString() };
  if (process.env.NODE_ENV !== "production") console.info("[NSoul contact]", submission);

  try {
    const delivery = await sendWithResend(submission);
    return Response.json({
      submissionId: submission.submissionId,
      submittedAt: submission.submittedAt,
      message: delivery.configured
        ? "We’ll review your facility needs and follow up soon."
        : "Your request was received. Email delivery will activate when the contact service is configured.",
    });
  } catch (error) {
    console.error("[NSoul contact] Delivery failed", error);
    return Response.json({ message: "We could not deliver your request. Please try again shortly." }, { status: 502 });
  }
}
