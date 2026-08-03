import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { publicSubmissionSchema } from "@/lib/validation/site-finder";

const attempts = new Map<string, { count: number; reset: number }>();
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

function nullable(value: unknown) {
  return value === "" || value == null ? null : value;
}

function safeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "attachment";
}

export async function POST(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const ipHash = createHash("sha256").update(ip).digest("hex");
  const now = Date.now();
  const current = attempts.get(ipHash);

  if (current && current.reset > now && current.count >= 5) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
  }

  attempts.set(ipHash, {
    count: current && current.reset > now ? current.count + 1 : 1,
    reset: current && current.reset > now ? current.reset : now + 60 * 60 * 1000,
  });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "The submission format was not recognized." }, { status: 400 });
  }

  const raw = Object.fromEntries(
    [...formData.entries()]
      .filter(([key, value]) => key !== "attachment" && typeof value === "string")
      .map(([key, value]) => [key, value]),
  );
  const parsed = publicSubmissionSchema.safeParse({ ...raw, consent: raw.consent === "true" });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please review the required property and contact fields.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  if (parsed.data.website) return NextResponse.json({ ok: true, message: "Submission received." });

  const attachment = formData.get("attachment");
  if (attachment instanceof File && attachment.size > 0) {
    if (attachment.size > MAX_FILE_SIZE || !ALLOWED_FILE_TYPES.has(attachment.type)) {
      return NextResponse.json({ error: "Attachments must be PDF, JPG, or PNG files no larger than 5 MB." }, { status: 422 });
    }
  }

  // Public intake is deliberately mediated by this validated, rate-limited,
  // server-only route. Anonymous database and storage reads remain prohibited.
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Land submissions are temporarily unavailable while the secure database is being configured." },
      { status: 503 },
    );
  }

  const { data: organization } = await admin.from("organizations").select("id").eq("slug", "nsoul").maybeSingle();
  if (!organization) return NextResponse.json({ error: "The intake organization is not configured." }, { status: 503 });

  const submissionId = randomUUID();
  let attachmentPath: string | null = null;
  let attachmentWarning = false;

  if (attachment instanceof File && attachment.size > 0) {
    const storagePath = `${organization.id}/public-intake/${submissionId}/${safeFilename(attachment.name)}`;
    const { error: uploadError } = await admin.storage
      .from("site-finder-documents")
      .upload(storagePath, new Uint8Array(await attachment.arrayBuffer()), {
        contentType: attachment.type,
        upsert: false,
      });
    if (uploadError) attachmentWarning = true;
    else attachmentPath = storagePath;
  }

  const data = parsed.data;
  const { error } = await admin.from("public_property_submissions").insert({
    id: submissionId,
    organization_id: organization.id,
    name: data.name,
    email: data.email,
    phone: nullable(data.phone),
    submitter_type: data.submitter_type,
    property_address: data.property_address,
    county: data.county,
    approximate_acreage: data.approximate_acreage,
    asking_price: data.asking_price,
    current_use: nullable(data.current_use),
    tillable_status: nullable(data.tillable_status),
    cleared_percentage: data.cleared_percentage,
    wooded_percentage: data.wooded_percentage,
    road_access: nullable(data.road_access),
    utility_information: nullable(data.utility_information),
    seller_financing_interest: data.seller_financing_interest,
    lease_interest: data.lease_interest,
    option_interest: data.option_interest,
    listing_url: nullable(data.listing_url),
    parcel_number: nullable(data.parcel_number),
    message: nullable(data.message),
    attachment_path: attachmentPath,
    source: data.source,
    utm_source: nullable(data.utm_source),
    utm_medium: nullable(data.utm_medium),
    utm_campaign: nullable(data.utm_campaign),
    evidence_level: "unverified",
    status: "new-lead",
    submission_status: "new-lead",
    consented_at: new Date().toISOString(),
    source_ip_hash: ipHash,
  });

  if (error) {
    if (attachmentPath) await admin.storage.from("site-finder-documents").remove([attachmentPath]);
    if (process.env.NODE_ENV === "development") console.error("Public property submission failed", error.message);
    return NextResponse.json({ error: "The submission could not be stored securely." }, { status: 500 });
  }

  return NextResponse.json(
    {
      ok: true,
      submissionId,
      message: attachmentWarning
        ? "Your property details were received. The optional file could not be stored, but your submission is complete."
        : "Your land submission has been received for an initial, non-binding review.",
    },
    { status: 201 },
  );
}
