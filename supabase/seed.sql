insert into public.properties (
  id,property_code,project_name,status,pipeline_stage,source_type,source_name,source_collected_at,address_line_1,city,county,state,postal_code,internal_summary,next_action
) values (
  '10000000-0000-4000-8000-000000000001','OK-MCC-001','1 Cornerstone Lane Solar Farm','converted-to-project','project-development','internal-reference','Cornerstone Solar development record',current_date,
  '1 Cornerstone Lane','Idabel','McCurtain County','Oklahoma','74745','Initial reference property. Acreage, price, parcel, coordinates, flood, zoning, and utility capacity remain not yet verified.','Obtain written PSO circuit-capacity response.'
) on conflict(property_code) do nothing;

insert into public.property_utility (property_id,electric_utility,circuit_capacity_status,verification_status,interconnection_notes)
values ('10000000-0000-4000-8000-000000000001','Public Service Company of Oklahoma','requested','requested','Circuit-capacity response pending. No capacity is inferred from visible infrastructure.')
on conflict(property_id) do nothing;

insert into public.projects (
  id,property_id,project_code,project_name,project_stage,legal_entity,proposed_capacity_mw_dc,annual_generation_estimate_kwh,target_cod,utility,interconnection_status,site_control_status,offtaker_status,financing_status,grant_status,engineering_status,permitting_status,construction_status,summary
) values (
  '20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','CS-001','Cornerstone Solar Project 001','development','NSoul LLC',1.5,2250000,'Q2/Q3 2027, subject to interconnection and final approvals','Public Service Company of Oklahoma','response-pending','not-yet-verified','outreach-active','future-phase','future-phase','preliminary-pending','not-yet-verified','future-phase','Reference commercial solar project in Idabel, Oklahoma. All values remain conceptual until supported by final engineering and approvals.'
) on conflict(project_code) do nothing;

insert into public.project_milestones(project_id,section,task_name,task_description,status,sort_order) values
('20000000-0000-4000-8000-000000000001','Regulatory and land due diligence','USDA REAP geographic eligibility','Project address verified as geographically eligible.','complete',10),
('20000000-0000-4000-8000-000000000001','Regulatory and land due diligence','PSO circuit-capacity response','Written utility response requested.','pending',20),
('20000000-0000-4000-8000-000000000001','Engineering and EPC specifications','Preliminary aerial layout','Layout remains pending and conceptual.','pending',30),
('20000000-0000-4000-8000-000000000001','Engineering and EPC specifications','Production estimate','Production modeling remains pending.','pending',40),
('20000000-0000-4000-8000-000000000001','Engineering and EPC specifications','Itemized construction quote','EPC pricing remains pending.','pending',50),
('20000000-0000-4000-8000-000000000001','Commercial off-taker pipeline','Commercial outreach','Regional outreach is active; no executed PPA is claimed.','active',60),
('20000000-0000-4000-8000-000000000001','Financing and grants','Financing and grant deployment','Future phase, subject to project advancement and approvals.','future',70)
on conflict do nothing;
