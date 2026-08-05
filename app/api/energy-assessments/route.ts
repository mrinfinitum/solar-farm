import { randomUUID } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { intakeResult, passesRateLimit, requestAddress, sanitizeFilename, sendIntakeEmail } from "@/lib/public-intake";
import { energyAssessmentSchema } from "@/lib/validation/public-trust";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png", "csv", "xlsx"]);
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 52 * 1024 * 1024) return Response.json({ message: "Submission is too large." }, { status: 413 });
  if (!passesRateLimit(`assessment:${requestAddress(request)}`)) return Response.json({ message: "Too many requests. Please wait and try again." }, { status: 429 });

  let form: FormData;
  try { form = await request.formData(); } catch { return Response.json({ message: "Invalid submission." }, { status: 400 }); }
  if (String(form.get("website") || "")) return Response.json({ message: "Assessment received." });

  const values = Object.fromEntries([...form.entries()].filter(([, value]) => typeof value === "string"));
  const parsed = energyAssessmentSchema.safeParse(values);
  if (!parsed.success) return Response.json({ message: "Please review the highlighted fields.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });

  const files = form.getAll("bills").filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length > 12) return Response.json({ message: "Upload no more than 12 bills." }, { status: 400 });
  for (const file of files) {
    const extension = sanitizeFilename(file.name).split(".").pop()?.toLowerCase() || "";
    if (file.size > MAX_FILE_SIZE || !ALLOWED_EXTENSIONS.has(extension) || !ALLOWED_MIME_TYPES.has(file.type)) {
      return Response.json({ message: `Unsupported or oversized file: ${sanitizeFilename(file.name)}.` }, { status: 400 });
    }
  }

  const assessmentId = randomUUID();
  const submittedAt = new Date().toISOString();
  const admin = createAdminClient();
  let persisted = false;
  if (files.length && !admin) return Response.json({ message: "Secure bill upload is unavailable. Submit without files and provide bills after we contact you." }, { status: 503 });

  if (admin) {
    const data = parsed.data;
    const { error } = await admin.from("public_energy_assessments").insert({
      id: assessmentId, submitted_at: submittedAt, first_name: data.firstName, last_name: data.lastName, email: data.email,
      company: data.company, job_title: data.jobTitle, phone: data.phone, facility_name: data.facilityName,
      facility_address: data.facilityAddress, city: data.city, state: data.state, zip_code: data.zipCode,
      facility_type: data.facilityType, current_utility: data.currentUtility, years_at_facility: data.yearsAtFacility,
      annual_electricity_use: data.annualElectricityUse, monthly_electricity_spend: data.monthlyElectricitySpend,
      current_blended_rate: data.currentBlendedRate, daytime_operating_hours: data.daytimeOperatingHours,
      electric_meters: data.electricMeters, demand_charges_known: data.demandChargesKnown, peak_demand: data.peakDemand,
      existing_renewable_contracts: data.existingRenewableContracts, desired_contract_term: data.desiredContractTerm,
      desired_timeline: data.desiredTimeline, consent: true, source_page: data.sourcePage, audience: data.audience,
      utm_source: data.utmSource, utm_medium: data.utmMedium, utm_campaign: data.utmCampaign,
    });
    if (!error) {
      persisted = true;
      for (const file of files) {
        const safeName = `${randomUUID()}-${sanitizeFilename(file.name)}`;
        const path = `${assessmentId}/${safeName}`;
        const upload = await admin.storage.from("energy-assessment-bills").upload(path, file, { contentType: file.type, upsert: false });
        if (upload.error) return Response.json({ message: "The assessment was saved, but a bill could not be stored. Please contact us before resubmitting." }, { status: 502 });
        const metadata = await admin.from("energy_assessment_files").insert({ assessment_id: assessmentId, storage_path: path, original_filename: sanitizeFilename(file.name), mime_type: file.type, size_bytes: file.size });
        if (metadata.error) {
          await admin.storage.from("energy-assessment-bills").remove([path]);
          return Response.json({ message: "The assessment was saved, but bill metadata could not be secured. Please contact us before resubmitting." }, { status: 502 });
        }
      }
    } else {
      if (process.env.NODE_ENV !== "production") console.error("[NSoul assessment persistence]", error.message);
      if (files.length) return Response.json({ message: "Secure bill storage is temporarily unavailable. Submit without files or try again later." }, { status: 503 });
    }
  }

  if (process.env.NODE_ENV !== "production") console.info("[NSoul energy assessment]", { assessmentId, submittedAt, ...parsed.data, fileCount: files.length });
  let delivered = false;
  try {
    delivered = await sendIntakeEmail(`NSoul energy assessment, ${parsed.data.company}`, parsed.data.email, [
      `Assessment ID: ${assessmentId}`, `Submitted: ${submittedAt}`, `Contact: ${parsed.data.firstName} ${parsed.data.lastName}`, `Company: ${parsed.data.company}`, `Email: ${parsed.data.email}`,
      `Facility: ${parsed.data.facilityName}, ${parsed.data.facilityAddress}, ${parsed.data.city}, ${parsed.data.state} ${parsed.data.zipCode}`, `Utility: ${parsed.data.currentUtility}`, `Annual use: ${parsed.data.annualElectricityUse || "Not provided"}`, `Monthly spend: ${parsed.data.monthlyElectricitySpend || "Not provided"}`, `Bill files: ${files.length}`, `Source: ${parsed.data.sourcePage || "Unknown"}`,
    ]);
  } catch (error) { console.error("[NSoul assessment delivery]", error); }

  if (!intakeResult(delivered, persisted)) return Response.json({ message: "We could not securely store or deliver this assessment. Please try again shortly." }, { status: 503 });
  return Response.json({ assessmentId, submittedAt, message: "Assessment received. We will review the information and contact you regarding the next step. Any analysis provided will remain preliminary and non-binding unless incorporated into definitive agreements." });
}
