import { PropertyWizard } from "@/components/properties/property-wizard";
import { QuickScreening } from "@/components/properties/quick-screening";
import { requireSession } from "@/lib/auth/session";

export default async function NewPropertyPage() {
  const profile = await requireSession();
  if (!["owner","admin","developer"].includes(profile.role)) return <div className="finder-empty"><strong>Property operator access required</strong><p>Analysts and viewers can review property intelligence, but only owners, admins, and developers can create operational property records.</p></div>;
  return <><div className="finder-page-head"><div><p className="finder-eyebrow">Property intake</p><h1>Add and screen a candidate site</h1><p>Start quickly from an address, or use the full evidence-led manual workflow.</p></div></div><QuickScreening/><div className="finder-section-divider"><span>or complete full intake</span></div><PropertyWizard/></>;
}
