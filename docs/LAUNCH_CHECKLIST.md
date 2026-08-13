# NSoul launch checklist

Complete and record each item before commercial launch.

## Domain and deployment

- [ ] Connect the final production domain in Vercel and verify HTTPS.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the canonical `https://` origin with no placeholder domain.
- [ ] Confirm the production, preview, and development Vercel environment scopes.
- [ ] Confirm Supabase Auth Site URL and callback allow-list entries match the production domain.
- [ ] Verify `/`, `/why-nsoul`, `/energy-assessment`, `/project-diligence`, `/login`, `/submit-property`, `/privacy`, `/terms`, `/sitemap.xml`, and `/robots.txt` return successfully.

## Environment variables

- [ ] Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- [ ] Configure server-only `SUPABASE_SERVICE_ROLE_KEY`; confirm it is never exposed to a browser bundle.
- [ ] Configure `LEGAL_CONTACT_EMAIL` with the approved monitored address.
- [ ] Configure `NEXT_PUBLIC_MAP_STYLE_URL` only when a reviewed map provider is selected.
- [ ] Review every Vercel variable for accidental whitespace, preview leakage, or public prefixes on secrets.

## Supabase and administration

- [ ] Apply every migration in filename order through `202608040003_public_buyer_trust_intake.sql`; confirm the remote migration ledger and observable schema both match the checkout.
- [ ] Confirm RLS is enabled and explicit policies are present on every exposed application table.
- [ ] Confirm anonymous users cannot read land submissions or storage objects.
- [ ] Confirm the `site-finder-documents` bucket is private and supports PDF, JPG, and PNG intake.
- [ ] Confirm the `energy-assessment-bills` bucket is private, limits files to 4 MB, and permits only PDF, JPG, JPEG, PNG, CSV, and XLSX.
- [ ] Bootstrap the first owner using the procedure in `docs/SECURITY_AND_OPERATIONS.md`.
- [ ] Run `npm run verify:remote-environment` and retain the non-secret report with the deployment record.
- [ ] Invite the first additional user from Dashboard → Users and verify the activity log.
- [ ] Test backup creation, database export, storage inventory, and restore ownership.

## Email and forms

- [ ] Configure `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, and `CONTACT_FROM_EMAIL`.
- [ ] Verify the sending domain and approved sender in Resend.
- [ ] Submit a valid commercial inquiry and verify both the internal notification and concise confirmation.
- [ ] Test contact validation, honeypot behavior, rate limiting, accessible errors, and the no-email safe fallback.
- [ ] Submit land information with and without an attachment.
- [ ] Confirm land intake remains usable when private storage is unavailable and never exposes a public file URL.
- [ ] Submit an energy assessment with and without bills, verify no production success is claimed unless the request is stored or delivered, and confirm bill downloads require owner or administrator access.
- [ ] Submit a data-room request and confirm it does not automatically expose private documents.

## Content, legal, and measurement

- [ ] Complete `docs/CONTENT_ACCURACY_CHECKLIST.md` with accountable reviewers.
- [ ] Have qualified legal counsel review Privacy, Terms, form consent, disclaimers, and governing-law language.
- [ ] Confirm the legal contact address and information-retention process.
- [ ] Download and open the current term-sheet PDF from every public link.
- [ ] Confirm the PDF filename, size label, non-binding language, and project facts are current.
- [ ] Verify analytics events in production without including form-field contents or unnecessary personal data.
- [ ] Confirm canonical metadata, Open Graph image, sitemap host, and robots exclusions.

## Quality assurance

- [ ] Test at 375, 430, 768, 1024, 1280, 1440, and 1920 pixels.
- [ ] Test light mode, dark mode, reduced motion, and keyboard-only navigation.
- [ ] Test a slow network and environments without email, Supabase, or map credentials.
- [ ] Verify visible focus, labels, error descriptions, FAQ disclosures, theme toggle, navigation, PDF links, and map descriptions.
- [ ] Run `npm run lint`, `npm test`, `npm run build`, and `npm audit --omit=dev`.
- [ ] Run Lighthouse against the production deployment and record accessibility, performance, SEO, and best-practice findings.
- [ ] Check application logs, contact delivery, Supabase storage, database backups, and an export procedure after launch.
# Funding module deployment

- [ ] Review `202608090001_project_funding_reap_workspace.sql` against the linked Supabase project.
- [ ] Back up or document remote migration state before applying the new migration.
- [ ] Apply the funding migration only after review. This sprint does not apply it remotely.
- [ ] Confirm owner/admin, analyst, and viewer RLS behavior in the target environment.
- [ ] Confirm private project-document links produce signed URLs only through existing authorized flows.
- [ ] Re-verify USDA REAP program sources and assign a review date before treating template prompts as current requirements.
- [ ] Assign confirmed USDA contacts. Do not publish or seed unconfirmed names.
