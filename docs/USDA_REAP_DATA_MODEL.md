# USDA REAP data model

## Reusable program and project records

- `funding_program_templates`: versioned program identity, official sources, review metadata, and caution notes.
- `funding_template_requirements`: normalized reusable requirement prompts.
- `funding_template_milestones`: reusable workflow phases.
- `project_funding_sources`: project-specific grant, tax credit, debt, equity, equipment financing, incentive, or other source.
- `funding_requirements`: editable project checklist and evidence state.
- `funding_requirement_documents`: many-to-many links to the existing private document library.
- `funding_milestones`: project-program phases, optionally linked to existing project milestones.
- `funding_contacts`: program relationship links to existing contacts.
- `funding_communications`: calls, emails, meetings, portal messages, letters, and notes.
- `funding_questions`: agency clarification and response workflow.
- `funding_cost_items`: project costs and internal eligibility status with invoice and payment evidence.
- `funding_reimbursements`: post-award request, approval, and payment tracking.
- `organization_federal_registrations`: private entity-registration status that can be shown in the funding workspace without loading the identifier itself.
- `organization_federal_identifiers`: restricted owner and administrator storage for a UEI if it is deliberately entered later. No UEI value is seeded.
- `tasks`: the existing task system also supports a company-scoped federal-registration renewal task. This avoids creating a second task system for annual SAM.gov renewal work.

## Audit and tenancy

Every table carries `organization_id`, uses fail-closed tenant RLS, and rejects anonymous access. Material funding changes use the existing `log_change()` trigger and `activity_log`. Federal-registration tables use dedicated sanitized audit triggers so an identifier value can never be copied into `activity_log`. Project workflow deletes are limited to owner and admin roles. Funding source removal is archival through the API.

## Federal registration privacy

The funding UI queries only federal-registration status. It does not query `organization_federal_identifiers`. UEI, EIN, banking, taxpayer, and SAM account values must not be placed in requirements, notes, activity descriptions, analytics, public project data, or client bundles.

SAM.gov activation and renewal dates are status metadata, not sensitive identifier values. The August 9, 2026 activation completes the configured federal-registration checklist only. It does not change the USDA REAP source beyond Preparing / Pre-Application and does not set an application-submission timestamp.

## Known unknowns

- Current application window and deadline
- Current program percentage and caps
- Applicant eligibility determination
- Required form version
- Environmental review scope
- Matching-fund treatment
- Financing evidence expectations
- Award conditions and reimbursement instructions

These values must remain unset until current official guidance or direct agency confirmation supports them.
