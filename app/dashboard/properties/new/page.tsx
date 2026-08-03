import { PropertyWizard } from "@/components/properties/property-wizard";
import { requireSession } from "@/lib/auth/session";

export default async function NewPropertyPage() {
  const profile = await requireSession();
  if (!["owner","admin","developer"].includes(profile.role)) return <div className="finder-empty"><strong>Property operator access required</strong><p>Analysts and viewers can review property intelligence, but only owners, admins, and developers can create operational property records.</p></div>;
  return <><div className="finder-page-head"><div><p className="finder-eyebrow">Manual property intake</p><h1>Add a candidate property</h1><p>Eight-step intake with source evidence, conservative defaults, initial scoring, and missing-information guidance.</p></div></div><PropertyWizard/></>;
}
