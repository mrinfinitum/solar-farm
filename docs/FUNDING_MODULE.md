# Project Funding module

## Architecture

Funding is a project domain. The portfolio view at `/dashboard/funding` aggregates records, while each project owns its funding sources at `/dashboard/projects/[id]/funding`. USDA REAP is the first program-specific workspace.

The module does not replace existing finance, incentive, document, contact, task, milestone, or activity systems. It links to them:

- `project_funding_sources.project_incentive_id` can reference the existing incentive record.
- Requirements link to existing `documents` and `tasks` records.
- `funding_requirement_documents` supports multiple existing project documents per requirement.
- Funding milestones can reference `project_milestones`.
- Funding contacts reference `contacts`.
- Material changes are written through the existing `activity_log` trigger.
- The project funding stack reads the latest existing capital-stack version when available.

## Permissions

- Owner and admin: full workflow access, template management, archival, and deletion.
- Developer and analyst: create and update project funding workflows, evidence links, communications, questions, costs, and reimbursements.
- Viewer: same-organization read-only access.
- Anonymous users: no access.

These rules are enforced by Supabase RLS and repeated in server route authorization. UI visibility is not the authorization boundary.

## Workflow

Funding sources progress through research, planning, preparation, submission, review, award, closing, reimbursement, and completion states. Amounts remain nullable. The UI shows `Not yet modeled` rather than inferring missing figures.

The deterministic next-best-action order is:

1. Overdue blocking requirement
2. Incomplete blocking requirement
3. Open agency question
4. Upcoming milestone
5. Upcoming linked task

## Deployment

Apply `202608090001_project_funding_reap_workspace.sql` after reviewing it in the target environment. The migration has not been applied remotely by this sprint. No new browser secrets are required. Existing Supabase authentication, private document storage, and organization membership are required.
