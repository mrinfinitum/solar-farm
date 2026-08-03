import { CsvImporter } from "@/components/imports/csv-importer";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";

export default async function ImportsPage() {
  const profile = await requireSession();
  const canImport = ADMIN_ROLES.includes(profile.role);
  return <>
    <div className="finder-page-head"><div><p className="finder-eyebrow">Authorized data intake</p><h1>CSV property imports</h1><p>Preview, validate, detect source-ID duplicates, dry run, and retain an import report. No scraping or automatic listing feeds are active.</p></div></div>
    {canImport ? <CsvImporter /> : <div className="finder-empty"><strong>Owner or administrator access required</strong><p>Developers, analysts, and viewers can review imported records but cannot run bulk imports.</p></div>}
  </>;
}
