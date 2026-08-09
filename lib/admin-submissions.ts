import "server-only";

import { ADMIN_ROLES } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export type AssessmentFile = {
  id: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

export type ContactSubmission = {
  id: string;
  submitted_at: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  job_title: string;
  phone: string | null;
  facility_location: string;
  facility_type: string | null;
  annual_electricity_usage: string | null;
  electricity_spend: string | null;
  discussion_topic: string | null;
  utility_provider: string | null;
  desired_timeline: string | null;
  message: string;
  source_page: string | null;
  status: string;
};

export type EnergyAssessment = {
  id: string;
  submitted_at: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  job_title: string;
  phone: string | null;
  facility_name: string;
  facility_address: string;
  city: string;
  state: string;
  zip_code: string;
  facility_type: string;
  current_utility: string;
  years_at_facility: string | null;
  annual_electricity_use: string | null;
  monthly_electricity_spend: string | null;
  current_blended_rate: string | null;
  daytime_operating_hours: string | null;
  electric_meters: string | null;
  demand_charges_known: string | null;
  peak_demand: string | null;
  existing_renewable_contracts: string | null;
  desired_contract_term: string | null;
  desired_timeline: string | null;
  audience: string | null;
  source_page: string | null;
  status: string;
  energy_assessment_files: AssessmentFile[];
};

export type DataRoomRequest = {
  id: string;
  submitted_at: string;
  name: string;
  company: string;
  title: string;
  email: string;
  phone: string | null;
  organization_type: string;
  reason: string;
  documents_requested: string;
  nda_willingness: string;
  project_relationship: string;
  source_page: string | null;
  status: string;
};

export type PropertySubmission = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  submitter_type: string | null;
  property_address: string;
  county: string;
  approximate_acreage: number | null;
  asking_price: number | null;
  current_use: string | null;
  road_access: string | null;
  utility_information: string | null;
  message: string | null;
  status: string;
  converted_property_id: string | null;
};

export async function getAdminSubmissions() {
  await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();
  if (!admin) {
    return {
      configured: false,
      contacts: [] as ContactSubmission[],
      assessments: [] as EnergyAssessment[],
      diligenceRequests: [] as DataRoomRequest[],
      propertySubmissions: [] as PropertySubmission[],
      errors: [] as string[],
    };
  }

  const [contactsResult, assessmentsResult, diligenceResult, propertiesResult] = await Promise.all([
    admin.from("public_contact_submissions").select("*").order("submitted_at", { ascending: false }).limit(100),
    admin
      .from("public_energy_assessments")
      .select("*,energy_assessment_files(id,original_filename,mime_type,size_bytes,created_at)")
      .order("submitted_at", { ascending: false })
      .limit(100),
    admin.from("public_data_room_requests").select("*").order("submitted_at", { ascending: false }).limit(100),
    admin
      .from("public_property_submissions")
      .select("id,created_at,name,email,phone,submitter_type,property_address,county,approximate_acreage,asking_price,current_use,road_access,utility_information,message,status,converted_property_id")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const errors = [contactsResult.error, assessmentsResult.error, diligenceResult.error, propertiesResult.error]
    .filter((error): error is NonNullable<typeof error> => Boolean(error))
    .map((error) => error.message);

  return {
    configured: true,
    contacts: (contactsResult.data || []) as ContactSubmission[],
    assessments: (assessmentsResult.data || []) as unknown as EnergyAssessment[],
    diligenceRequests: (diligenceResult.data || []) as DataRoomRequest[],
    propertySubmissions: (propertiesResult.data || []) as PropertySubmission[],
    errors,
  };
}
