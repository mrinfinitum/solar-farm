import { ComparisonTool } from "@/components/properties/comparison-tool";
import { getProperties } from "@/lib/site-finder-data";
export default async function ComparisonsPage(){const{properties}=await getProperties({pageSize:100});return <><div className="finder-page-head"><div><p className="finder-eyebrow">Candidate comparison</p><h1>Compare property evidence</h1><p>Evaluate value, land, utility evidence, risk, confidence, and next steps side by side, without hiding missing information.</p></div></div><ComparisonTool properties={properties}/></>}
