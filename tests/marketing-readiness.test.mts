import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";

import { contactSchema } from "../lib/validation.ts";
import { dataRoomRequestSchema, energyAssessmentSchema } from "../lib/validation/public-trust.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("commercial inquiry validates the required qualification data", () => {
  const valid = contactSchema.safeParse({
    firstName: "Jordan", lastName: "Lee", email: "jordan@example.com", company: "Example Manufacturing",
    jobTitle: "Operations Director", phone: "", facilityLocation: "Idabel, Oklahoma", facilityType: "Manufacturing",
    annualElectricityUsage: "2,500,000–5,000,000 kWh", electricitySpend: "$25,000–$50,000",
    discussionTopic: "PPA opportunity", utilityProvider: "PSO", desiredTimeline: "Within 6 months",
    message: "We are evaluating a long-term commercial energy agreement.", interested: true, website: "",
  });
  assert.equal(valid.success, true);
  assert.equal(contactSchema.safeParse({}).success, false);
});

test("contact delivery has a safe no-email fallback and structured identifiers", () => {
  const route = read("app/api/contact/route.ts");
  assert.match(route, /randomUUID/);
  assert.match(route, /submittedAt/);
  assert.match(route, /configured: false/);
  assert.match(route, /Email delivery will activate/);
  assert.match(route, /New NSoul Commercial Energy Inquiry/);
});

test("land intake is validated, private, and resilient when storage is unavailable", () => {
  const route = read("app/api/public-submissions/route.ts");
  const migration = read("supabase/migrations/202608030004_conversion_intake.sql");
  const form = read("components/forms/public-property-form.tsx");
  assert.match(route, /request\.formData\(\)/);
  assert.match(route, /MAX_FILE_SIZE = 5 \* 1024 \* 1024/);
  assert.match(route, /attachmentWarning/);
  assert.match(migration, /revoke all on public\.public_property_submissions from anon/);
  assert.match(migration, /attachment_path/);
  assert.match(form, /disabled=\{!storageConfigured\}/);
});

test("FAQ uses keyboard-native disclosures", () => {
  const faq = read("components/sections/faq-section.tsx");
  assert.match(faq, /<details/);
  assert.match(faq, /<summary>/);
  assert.match(faq, /faq_open/);
});

test("public routes and canonical metadata exist", () => {
  for (const path of ["app/page.tsx", "app/our-vision/page.tsx", "app/privacy/page.tsx", "app/terms/page.tsx", "app/submit-property/page.tsx", "app/sitemap.ts", "app/robots.ts"]) {
    assert.equal(existsSync(new URL(`../${path}`, import.meta.url)), true, path);
  }
  assert.match(read("lib/site-config.ts"), /https:\/\/www\.nsoul\.co/);
  assert.doesNotMatch(read("app/layout.tsx"), /\.example/);
});

test("homepage marketing stays regional rather than exposing project specifics", () => {
  const publicHomepage = [
    read("app/page.tsx"),
    read("app/layout.tsx"),
    read("components/sections/hero-section.tsx"),
    read("components/sections/cornerstone-project-section.tsx"),
    read("components/sections/contact-section.tsx"),
    read("components/sections/faq-section.tsx"),
  ].join("\n");

  assert.match(publicHomepage, /Oklahoma Region/);
  assert.match(publicHomepage, /U\.S\. Census Bureau TIGERweb state boundary/);
  assert.doesNotMatch(publicHomepage, /1 Cornerstone Lane|Idabel project site|McCurtain County|Southeast Oklahoma|Q2\/Q3 2027|2\.25M kWh/i);
});

test("Why NSoul section explains benefits for businesses of different sizes", () => {
  const section = read("components/sections/project-model-section.tsx");
  const benefits = read("components/project-model/regional-project-feature.tsx");
  const styles = read("app/globals.css");

  assert.match(section, /Lower costs\. Less capital\. Local renewable power\./);
  assert.match(section, /actual electricity usage/);
  for (const message of [
    "Potential cost savings",
    "Capital stays in your business",
    "Measurable renewable value",
    "Growing businesses",
    "Regional institutions",
    "Large energy users",
    "Procurement teams",
    "No equipment ownership",
    "Renewable-energy goals",
  ]) assert.match(benefits, new RegExp(message, "i"));
  assert.match(benefits, /Compare a proposed project rate with your actual utility costs/);
  assert.match(benefits, /REC terms defined by contract/);
  assert.doesNotMatch(benefits, /guaranteed savings|risk-free/i);
  assert.match(benefits, /Three ways NSoul creates value/);
  assert.match(benefits, /Commercial benefits/);
  assert.doesNotMatch(benefits, /regional-project-process/);
  assert.match(benefits, /Bill-based estimate/);
  assert.match(benefits, /Capital stays in your business/);
  assert.match(styles, /regional-project-facts[\s\S]*grid-template-columns: repeat\(3/);
  assert.match(styles, /regional-project-roles[\s\S]*grid-template-columns: repeat\(2/);
  assert.match(styles, /nsoul-hero-solar-field\.png/);
  assert.match(styles, /regional-project-diagram:hover::before/);
});

test("Our Vision is discoverable, qualified, and shareable", () => {
  const page = read("app/our-vision/page.tsx");
  const header = read("components/layout/site-header.tsx");
  const footer = read("components/layout/site-footer.tsx");
  const projectData = read("lib/project-data.ts");
  const founderStatement = read("components/vision/founder-statement.tsx");
  const scrollReset = read("components/vision/vision-scroll-reset.tsx");
  const styles = read("app/globals.css");
  const sitemap = read("app/sitemap.ts");

  assert.match(page, /title: "Our Vision \| NSoul"/);
  assert.match(page, /alternates: \{ canonical: "\/our-vision" \}/);
  assert.match(page, /openGraph:/);
  assert.match(page, /NSoul is being structured/);
  assert.match(page, /NSoul operating model/);
  assert.match(page, /8 stages · Continuous ownership cycle/);
  assert.match(page, /[Aa]s operating success permits/);
  assert.match(page, /development-stage/);
  assert.match(page, /nsoul-solar-horizon-dreamscape\.jpg/);
  assert.equal(existsSync(new URL("../public/brand/nsoul-solar-horizon-dreamscape.jpg", import.meta.url)), true);
  assert.doesNotMatch(page, />SOL<|>SOUL<|The NSoul idea/);
  assert.match(page, /VisionScrollReset/);
  assert.match(scrollReset, /window\.scrollTo\(0, 0\)/);
  assert.match(scrollReset, /scrollRestoration = "manual"/);
  assert.match(scrollReset, /requestAnimationFrame\(reset\)/);
  assert.doesNotMatch(founderStatement, /wealthy|making money/i);
  assert.match(styles, /@keyframes vision-node-spin/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(`${header}\n${projectData}`, /Our Vision/);
  assert.match(header, /aria-controls="mobile-menu"/);
  assert.match(header, /mobile-menu__contact/);
  assert.doesNotMatch(header, /<span>0\{index \+ 1\}<\/span>/);
  assert.match(footer, /href="\/our-vision"/);
  assert.match(sitemap, /\/our-vision/);
});

test("public term sheet is a real non-empty PDF", () => {
  const pdf = new URL("../public/documents/cornerstone-solar-indicative-term-sheet.pdf", import.meta.url);
  assert.equal(existsSync(pdf), true);
  assert.ok(statSync(pdf).size > 5_000);
  assert.equal(readFileSync(pdf).subarray(0, 4).toString(), "%PDF");
});

test("Why NSoul redirects to Our Vision and the homepage buyer-confidence teaser renders", () => {
  const nextConfig = read("next.config.ts");
  const home = read("app/page.tsx");
  const teaser = read("components/sections/buyer-confidence-section.tsx");
  assert.equal(existsSync(new URL("../app/why-nsoul/page.tsx", import.meta.url)), false);
  assert.match(nextConfig, /source: "\/why-nsoul"/);
  assert.match(nextConfig, /destination: "\/our-vision"/);
  assert.match(nextConfig, /permanent: true/);
  assert.match(home, /BuyerConfidenceSection/);
  assert.match(teaser, /A smaller developer should not mean greater customer risk/);
  assert.match(teaser, /href="\/our-vision"/);
});

test("buyer-confidence navigation and contextual routes are discoverable", () => {
  const header = read("components/layout/site-header.tsx");
  const footer = read("components/layout/site-footer.tsx");
  const sitemap = read("app/sitemap.ts");
  const projectData = read("lib/project-data.ts");
  assert.match(projectData, /Our Vision/);
  assert.doesNotMatch(projectData, /Why NSoul/);
  assert.match(header, /mobileNavigation/);
  for (const route of ["/our-vision", "/project-diligence", "/energy-assessment"]) {
    assert.match(`${header}\n${footer}\n${sitemap}\n${projectData}`, new RegExp(route.replace("/", "\\/")));
  }
  assert.doesNotMatch(sitemap, /\/why-nsoul/);
});

test("energy assessment validates commercial qualification data", () => {
  const result = energyAssessmentSchema.safeParse({
    firstName: "Jordan", lastName: "Lee", email: "jordan@example.com", company: "Example Manufacturing", jobTitle: "Operations Director",
    phone: "", facilityName: "Main Plant", facilityAddress: "100 Main Street", city: "Idabel", state: "OK", zipCode: "74745",
    facilityType: "Manufacturing", currentUtility: "PSO", yearsAtFacility: "20", annualElectricityUse: "1500000",
    monthlyElectricitySpend: "12000", currentBlendedRate: ".095", daytimeOperatingHours: "7 to 5", electricMeters: "2",
    demandChargesKnown: "Yes", peakDemand: "900", existingRenewableContracts: "None", desiredContractTerm: "20 years",
    desiredTimeline: "Within 6 months", consent: "on", website: "",
  });
  assert.equal(result.success, true);
  assert.equal(energyAssessmentSchema.safeParse({}).success, false);
});

test("bill upload is private, constrained, and graceful when unconfigured", () => {
  const form = read("components/forms/energy-assessment-form.tsx");
  const route = read("app/api/energy-assessments/route.ts");
  const signedRoute = read("app/api/energy-assessments/[id]/files/[fileId]/route.ts");
  const migration = read("supabase/migrations/202608040003_public_buyer_trust_intake.sql");
  assert.match(form, /disabled=\{!storageConfigured\}/);
  assert.match(form, /provide bills securely after we contact you/);
  assert.match(route, /MAX_FILE_SIZE = 4 \* 1024 \* 1024/);
  assert.match(route, /files\.length > 12/);
  assert.match(route, /sanitizeFilename/);
  assert.match(migration, /public, file_size_limit/);
  assert.match(migration, /'energy-assessment-bills'.*false/s);
  assert.match(signedRoute, /getApiActor\(ADMIN_ROLES\)/);
  assert.match(signedRoute, /createSignedUrl/);
});

test("data-room access requests are validated and never expose files", () => {
  const valid = dataRoomRequestSchema.safeParse({
    name: "Jordan Lee", company: "Example Manufacturing", title: "Counsel", email: "jordan@example.com", phone: "",
    organizationType: "Commercial energy buyer", reason: "Commercial and legal diligence for a potential energy agreement.",
    documentsRequested: "Utility correspondence and entity documentation.", ndaWillingness: "Yes", projectRelationship: "Potential off-taker", website: "",
  });
  assert.equal(valid.success, true);
  assert.equal(dataRoomRequestSchema.safeParse({}).success, false);
  assert.match(read("app/api/data-room-requests/route.ts"), /intakeResult/);
  assert.match(read("components/forms/data-room-request-form.tsx"), /does not grant access or expose private project files/);
});

test("project diligence renders accurate statuses and missing document states", () => {
  const page = read("app/project-diligence/page.tsx");
  const content = read("lib/content/project-diligence.ts");
  assert.match(page, /Information as of \{project\.informationDate\}/);
  assert.match(content, /PSO circuit-capacity response pending/);
  assert.match(content, /Not yet published/);
  assert.match(content, /Available under NDA/);
  assert.match(content, /Not yet available/);
  assert.match(content, /commercialTerms\.startingPpaRate/);
  assert.doesNotMatch(content, /0\.08075|1 Cornerstone Lane|2_250_000/);
});

test("new public pages include metadata, responsive navigation, themes, and reduced motion", () => {
  for (const path of ["app/project-diligence/page.tsx", "app/energy-assessment/page.tsx"]) {
    const page = read(path);
    assert.match(page, /export const metadata/);
    assert.match(page, /alternates: \{ canonical:/);
  }
  const styles = read("app/globals.css");
  assert.match(styles, /html\[data-theme="dark"\]/);
  assert.match(styles, /@media \(max-width: 430px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});
