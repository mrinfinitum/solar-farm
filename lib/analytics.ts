export type AnalyticsEvent =
  | "page_view"
  | "hero_primary_cta"
  | "hero_secondary_cta"
  | "nav_contact_click"
  | "term_sheet_download"
  | "project_cta_click"
  | "contact_form_start"
  | "contact_form_submit"
  | "contact_form_success"
  | "contact_form_error"
  | "land_submission_start"
  | "land_submission_submit"
  | "land_submission_success"
  | "faq_open"
  | "why_nsoul_view"
  | "why_nsoul_cta"
  | "buyer_protection_view"
  | "energy_assessment_start"
  | "energy_assessment_submit"
  | "energy_assessment_success"
  | "bill_upload_start"
  | "bill_upload_success"
  | "diligence_view"
  | "diligence_document_click"
  | "data_room_request_start"
  | "data_room_request_submit"
  | "audience_path_select"
  | "procurement_faq_open";

type EventProperties = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(name: AnalyticsEvent, properties: EventProperties = {}) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent("nsoul:analytics", { detail: { name, properties } }));

  if (process.env.NODE_ENV === "development") {
    console.info("[NSoul analytics]", name, properties);
  }
}

export function getUtmParameters(search = typeof window === "undefined" ? "" : window.location.search) {
  const parameters = new URLSearchParams(search);
  return {
    utmSource: cleanParameter(parameters.get("utm_source")),
    utmMedium: cleanParameter(parameters.get("utm_medium")),
    utmCampaign: cleanParameter(parameters.get("utm_campaign")),
  };
}

function cleanParameter(value: string | null) {
  return value?.trim().slice(0, 120) || "";
}
