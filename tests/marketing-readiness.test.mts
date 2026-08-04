import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";

import { contactSchema } from "../lib/validation.ts";

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

test("Our Vision is discoverable, qualified, and shareable", () => {
  const page = read("app/our-vision/page.tsx");
  const header = read("components/layout/site-header.tsx");
  const footer = read("components/layout/site-footer.tsx");
  const founderStatement = read("components/vision/founder-statement.tsx");
  const scrollReset = read("components/vision/vision-scroll-reset.tsx");
  const sitemap = read("app/sitemap.ts");

  assert.match(page, /title: "Our Vision \| NSoul"/);
  assert.match(page, /alternates: \{ canonical: "\/our-vision" \}/);
  assert.match(page, /openGraph:/);
  assert.match(page, /NSoul is being structured/);
  assert.match(page, /[Aa]s operating success permits/);
  assert.match(page, /development-stage/);
  assert.match(page, /nsoul-energy-community-ecosystem\.png/);
  assert.equal(existsSync(new URL("../public/brand/nsoul-energy-community-ecosystem.png", import.meta.url)), true);
  assert.match(page, /VisionScrollReset/);
  assert.match(scrollReset, /window\.scrollTo\(0, 0\)/);
  assert.doesNotMatch(founderStatement, /wealthy|making money/i);
  assert.match(header, /Our Vision/);
  assert.match(footer, /href="\/our-vision"/);
  assert.match(sitemap, /\/our-vision/);
});

test("public term sheet is a real non-empty PDF", () => {
  const pdf = new URL("../public/documents/cornerstone-solar-indicative-term-sheet.pdf", import.meta.url);
  assert.equal(existsSync(pdf), true);
  assert.ok(statSync(pdf).size > 5_000);
  assert.equal(readFileSync(pdf).subarray(0, 4).toString(), "%PDF");
});
