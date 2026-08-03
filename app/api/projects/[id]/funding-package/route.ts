import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiActor } from "@/lib/auth/api";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getApiActor(["owner", "admin"]);
  if (!actor) return NextResponse.json({ error: "Funding package access restricted" }, { status: 403 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid project" }, { status: 422 });
  const [project, model, readiness, dataRoom] = await Promise.all([
    actor.supabase.from("projects").select("project_name,project_code,location,proposed_capacity_mw_dc").eq("id", id).single(),
    actor.supabase.from("financial_model_versions").select("name,version_number,engine_version,outputs,approved_at,is_stale").eq("project_id", id).not("approved_at", "is", null).eq("is_stale", false).order("approved_at", { ascending: false }).limit(1).maybeSingle(),
    actor.supabase.from("funding_readiness_assessments").select("score,readiness_status,blocking_reasons,assessed_at").eq("project_id", id).order("assessed_at", { ascending: false }).limit(1).maybeSingle(),
    actor.supabase.from("funding_data_room_documents").select("category,documents(id,file_name,document_type,created_at)").eq("project_id", id).eq("approved_for_package", true),
  ]);
  if (!project.data) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (!model.data) return NextResponse.json({ error: "An approved, current financial model is required" }, { status: 409 });
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${project.data.project_name} funding package</title><style>body{font:15px system-ui;color:#14251c;margin:48px}h1{font-size:42px}.meta{color:#597064}.panel{border:1px solid #cad6ce;border-radius:16px;padding:24px;margin:20px 0}pre{white-space:pre-wrap}small{display:block;margin-top:50px;color:#65756c}@media print{button{display:none}}</style></head><body><button onclick="print()">Print / Save PDF</button><p>NSoul Studio · Funding readiness package</p><h1>${project.data.project_name}</h1><p class="meta">${project.data.project_code} · ${project.data.location || "Location pending"} · ${project.data.proposed_capacity_mw_dc || "—"} MW DC</p><section class="panel"><h2>Approved financial model</h2><p>${model.data.name} · Version ${model.data.version_number} · ${model.data.engine_version}</p><pre>${JSON.stringify(model.data.outputs, null, 2)}</pre></section><section class="panel"><h2>Funding readiness</h2><pre>${JSON.stringify(readiness.data || { status: "Not assessed" }, null, 2)}</pre></section><section class="panel"><h2>Approved data-room index</h2><pre>${JSON.stringify(dataRoom.data || [], null, 2)}</pre></section><small>Confidential and preliminary. Values are development-stage estimates, not commitments or investment, tax, legal, or accounting advice. Production, savings, incentive eligibility, interconnection, financing, and approvals are not guaranteed.</small></body></html>`;
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store", "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'" } });
}
