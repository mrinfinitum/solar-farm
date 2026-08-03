# Sprint 4 — Project Development Command Center

## Readiness assessment

Sprint 4 creates the governed operating foundation for projects promoted from the property pipeline. It is ready for controlled internal use after migration and role verification. It is not a live utility, SCADA, accounting, tax, legal, financing, or construction field-management system.

No record should be interpreted as proof of interconnection approval, binding PPA execution, committed financing, confirmed incentives, approved permits, or guaranteed production unless the corresponding verified record and private supporting document exist.

## Migration order and manual steps

Apply migrations in filename order. Sprint 4 is `202608030005_project_development_command_center.sql`. It depends on organizations, profiles, memberships, tenant helper functions, properties, projects, tasks, contacts, documents, project promotion, and activity logging from earlier migrations.

After applying it as the Supabase database owner:

1. Verify RLS on every Sprint 4 table and the private `site-finder-documents` bucket.
2. Open an existing promoted project; configurable stage gates are seeded by the migration.
3. Invoke `select public.refresh_project_notifications();` from an authenticated scheduled workflow for each organization context.
4. Review every seeded incentive program before linking it to a project.

No additional environment variables are required beyond the documented Supabase URL, publishable key, and server-only service-role key. Optional email/provider variables retain their existing behavior.

## Stage and gate model

Canonical stages are `prospect`, `site_control`, `utility_screening`, `interconnection_application`, `preliminary_engineering`, `offtaker_development`, `ppa_negotiation`, `permitting`, `financing`, `procurement`, `construction`, `commissioning`, `operating`, `repowering`, `decommissioning`, `suspended`, and `cancelled`. Legacy `development` records migrate to `utility_screening`. Arbitrary stage text is rejected and history is append-only.

`advance_project_stage` checks canonical transitions and configurable required gates under a row lock. Direct updates to the stage and health columns are rejected by a database trigger. A developer may advance a satisfied transition. An owner/admin may override a failed or nonstandard transition only with a written reason and a supporting decision that belongs to the project. The initial templates govern utility screening → application, application → preliminary engineering, off-taker development → PPA negotiation, PPA negotiation → financing, and financing → procurement.

## Health rules

`recalculate_project_health` applies deterministic database rules. An unresolved critical blocker produces `blocked`; an overdue critical milestone produces `at_risk`; an unresolved high blocker produces `attention`; otherwise the project is `on_track`. The shared TypeScript model additionally supports site-control expiry, capital gap, permit delay, EPC budget variance, and construction schedule variance. Only owners/admins may override health, and history preserves actor, timestamp, prior value, reason, and effective value.

## Operational modules

- **Interconnection:** requests distinguish nearby infrastructure, preliminary utility feedback, formal study results, and executed agreements. Status history is append-only; proximity never implies approval.
- **Engineering/EPC:** engagement, deliverable, design, production, equipment, vendor, proposal, comparison, cost, and O&M records preserve versions. Recommendations include scope, schedule, equipment, warranty, bonding, exclusions, and risk—not price alone.
- **Off-taker/PPA:** opportunity and outreach records cover load, utility/rate, authority, credit, interest, stage, and next action. PPA versions remain non-binding unless executed confirmation and a signed private document are present.
- **Permitting/diligence:** agency, application, deadline, approval, expiration, cost, conditions, evidence, property, environmental, title, survey, geotechnical, and zoning records are retained.
- **Finance:** budgets, capital stacks, cost estimates, lender/investor opportunities, requirements, and manual financial models are versioned. Full funding requires committed/closed capital at least equal to approved current cost. Models are preliminary and not professional advice.
- **Incentives:** seeded programs are `review_required`, require current verification, and are not professional advice. Project records separate estimated and confirmed value.
- **Execution:** blockers, decisions, milestones, tasks, private documents, and activity share existing platform systems and material-event logging.
- **Construction/operations:** manual contracts, milestones, progress, change orders, commissioning, assets, maintenance, readings, and incidents are scaffolded. No SCADA or live production feed is claimed.

## RLS and roles

| Capability | Owner | Admin | Developer | Analyst | Viewer |
| --- | --- | --- | --- | --- | --- |
| Read tenant project operations | Yes | Yes | Yes | Yes | Yes |
| Mutate project operations | Yes | Yes | Yes | No | No |
| Create/update analysis and incentive research | Yes | Yes | Yes | Yes | No |
| Read financial/investor records | Yes | Yes | Yes | Yes | No |
| Archive records | Yes | Yes | No | No | No |
| Advance satisfied stage | Yes | Yes | Yes | No | No |
| Override failed gate or health | Yes | Yes | No | No | No |

All policies compare tenant IDs to `current_organization_id()`. Anonymous grants are revoked. Financial reads exclude viewers. History tables have no direct update/delete policies. Privileged functions recheck role in PostgreSQL.

## Notifications and timelines

`refresh_project_notifications` creates deduplicated in-app alerts for critical milestones, critical blockers, and incentive deadlines. The notification model also supports site control, permits, proposals, utility, PPA, and funding conditions. The project activity page combines audit events from the project and related operational record IDs. Email delivery remains optional.

## Known limitations and Sprint 5

- No live utility queue, GIS, SCADA, ERP, accounting, lender, tax-credit, or e-signature integration.
- Flexible foundation tables use a typed common envelope plus JSON details until stable workflows justify deeper normalization.
- Notification refresh requires a scheduler or application call.
- Stage-gate evidence is deliberately human-reviewed; automatic satisfaction is future work.
- Legal, finance, tax, incentive, engineering, and production records require qualified professional verification.

Recommended Sprint 5 work: approval queues and gate templates, scheduled notification digests, e-signature/document review, utility/provider integrations with provenance, controlled financial scenario calculation, construction field reporting, operations adapters, and portfolio/board exports.
