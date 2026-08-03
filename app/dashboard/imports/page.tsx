import { CsvImporter } from "@/components/imports/csv-importer";
import { PublicSubmissionReview } from "@/components/imports/public-submission-review";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";
import { getPublicPropertySubmissions } from "@/lib/site-finder-data";

export default async function ImportsPage() {
  const profile = await requireSession();
  const canImport = ADMIN_ROLES.includes(profile.role);
  const submissions = canImport ? await getPublicPropertySubmissions() : [];
  return <>
    <div className="finder-page-head"><div><p className="finder-eyebrow">Authorized data intake</p><h1>CSV property imports</h1><p>Preview, validate, detect source-ID duplicates, dry run, and retain an import report. No scraping or automatic listing feeds are active.</p></div></div>
    {canImport ? <><PublicSubmissionReview rows={submissions}/><CsvImporter /></> : <div className="finder-empty"><strong>Owner or administrator access required</strong><p>Developers, analysts, and viewers can review imported records but cannot run bulk imports or convert public submissions.</p></div>}
  </>;
}
