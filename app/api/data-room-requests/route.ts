import { randomUUID } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { intakeResult, passesRateLimit, requestAddress, sendIntakeEmail } from "@/lib/public-intake";
import { dataRoomRequestSchema } from "@/lib/validation/public-trust";

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 40_000) return Response.json({ message: "Submission is too large." }, { status: 413 });
  if (!passesRateLimit(`data-room:${requestAddress(request)}`)) return Response.json({ message: "Too many requests. Please wait and try again." }, { status: 429 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ message: "Invalid request." }, { status: 400 }); }
  if (typeof body === "object" && body !== null && "website" in body && body.website) return Response.json({ message: "Request received." });
  const parsed = dataRoomRequestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ message: "Please review the form.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });

  const requestId = randomUUID();
  const submittedAt = new Date().toISOString();
  const admin = createAdminClient();
  let persisted = false;
  if (admin) {
    const data = parsed.data;
    const result = await admin.from("public_data_room_requests").insert({
      id: requestId, submitted_at: submittedAt, name: data.name, company: data.company, title: data.title,
      email: data.email, phone: data.phone, organization_type: data.organizationType, reason: data.reason,
      documents_requested: data.documentsRequested, nda_willingness: data.ndaWillingness,
      project_relationship: data.projectRelationship, source_page: data.sourcePage, utm_source: data.utmSource,
      utm_medium: data.utmMedium, utm_campaign: data.utmCampaign,
    });
    persisted = !result.error;
    if (result.error && process.env.NODE_ENV !== "production") console.error("[NSoul data room persistence]", result.error.message);
  }
  if (process.env.NODE_ENV !== "production") console.info("[NSoul data room request]", { requestId, submittedAt, ...parsed.data });
  let delivered = false;
  try { delivered = await sendIntakeEmail(`NSoul diligence access request, ${parsed.data.company}`, parsed.data.email, [`Request ID: ${requestId}`, `Name: ${parsed.data.name}`, `Company: ${parsed.data.company}`, `Title: ${parsed.data.title}`, `Organization type: ${parsed.data.organizationType}`, `Reason: ${parsed.data.reason}`, `Documents requested: ${parsed.data.documentsRequested}`, `NDA willingness: ${parsed.data.ndaWillingness}`, `Project relationship: ${parsed.data.projectRelationship}`]); } catch (error) { console.error("[NSoul data room delivery]", error); }
  if (!intakeResult(delivered, persisted)) return Response.json({ message: "We could not securely store or deliver this request. Please try again shortly." }, { status: 503 });
  return Response.json({ requestId, message: "Access request received. No private documents have been released. We will review the request and contact you regarding next steps." });
}
