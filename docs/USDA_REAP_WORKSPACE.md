# USDA REAP workspace

## Purpose

The USDA REAP workspace is an internal project-preparation and audit tool for 1 Cornerstone Lane Solar Farm. It is not a submitted grant application and does not assert applicant eligibility, current grant percentages, award caps, deadlines, approval, financing, or environmental completion.

As of August 9, 2026, NSoul LLC's SAM.gov Financial Assistance registration is Active and a UEI has been assigned. The current annual renewal date is August 9, 2027, with internal renewal preparation due July 9, 2027. The USDA REAP application has not been submitted, and SAM activation does not establish REAP eligibility, approval, or funding. The workspace shows registration status without loading or rendering the actual UEI.

Routes:

- `/dashboard/projects/[id]/funding/reap`
- `/dashboard/projects/[id]/funding/reap/eligibility`
- `/dashboard/projects/[id]/funding/reap/documents`
- `/dashboard/projects/[id]/funding/reap/timeline`
- `/dashboard/projects/[id]/funding/reap/contacts`
- `/dashboard/projects/[id]/funding/reap/questions`
- `/dashboard/projects/[id]/funding/reap/costs`
- `/dashboard/projects/[id]/funding/reap/reimbursement`
- `/dashboard/projects/[id]/funding/reap/activity`

## Project status and program rules

Project status is stored in `project_funding_sources`, requirements, milestones, questions, costs, and reimbursements. Program guidance is separately stored in versioned `funding_program_templates` and normalized template rows.

The initial template is `internal-preparation-v1`. It intentionally has no verification date. Before submission, an authorized user must review current USDA Rural Development guidance and add source evidence, verification dates, and the reviewer.

Official Oklahoma contact directory:

https://www.rd.usda.gov/ok/oklahoma-contacts

Specific contact names are not seeded. Add a person to the existing contact library only after the relationship is confirmed, then link that contact to the funding source.

## Readiness

Each readiness category is calculated as completed required, applicable requirements divided by all required, applicable requirements. `Not applicable` rows are excluded. No rows produces `Not configured`. Rows with no applicable required items produce `Not applicable`.

Data confidence is separate. It measures required, applicable records with source-backed verification. A completed internal checklist item can therefore improve readiness without implying high source confidence.

For the current Project 001 template, the four configured federal-registration requirements are complete, so that category calculates to 100%. Eligibility, current program guidance, the Oklahoma application pathway, the application package, submission, review, and award remain separate incomplete requirements.

The Next Best Action remains deterministic. Completed SAM activation is no longer a blocker, so the engine advances to the highest-priority remaining requirement, question, milestone, or task.

## Reimbursement controls

Internal controls prevent a reimbursement from being marked paid without a paid amount and paid date. A funding source cannot be completed while an open reimbursement request remains. These are NSoul workflow controls, not representations of USDA rules.
