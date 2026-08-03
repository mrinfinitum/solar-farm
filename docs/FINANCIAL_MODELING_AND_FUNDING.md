# Sprint 5 — Financial modeling and funding readiness

NSoul Studio now includes a server-calculated, version-controlled project-finance workspace and a restricted capital-partner CRM. It is an operating and diligence aid, not investment, tax, legal, or accounting advice. No output represents guaranteed production, savings, incentive eligibility, interconnection, financing, or project approval.

## Environment and migration order

No new environment variables are required. The existing authenticated stack still requires:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; invitation administration only)
- `NEXT_PUBLIC_SITE_URL`

Apply migrations in filename order. Sprint 5 is `202608030006_financial_modeling_capital_readiness.sql` and depends on Sprint 4's project, production, EPC, PPA, interconnection, incentive, document, audit, and tenant-security tables.

## Calculation methodology

The deterministic engine is `lib/finance/engine.ts`, version `nsoul-finance-1.0.0`. Every run persists the complete validated input set, output set, engine version, canonical SHA-256 version hash, source hash, warnings, annual revenue schedule, and annual operating-cost schedule.

- Delivered generation applies annual degradation, curtailment, and availability to the supplied annual-generation assumption.
- PPA revenue equals delivered kWh multiplied by the escalated contract rate.
- Operating expense follows the configured annual escalation; replacement capital is placed in specified years.
- Incentives marked `unverified` are excluded. Estimated and confirmed values remain planning inputs and carry explicit disclaimers.
- Debt supports interest-only years, amortization, and a balloon. DSCR is CFADS divided by debt service and is `null` when no debt service exists.
- Project and equity NPV use annual end-of-period discounting. IRR uses a bounded bisection solver and returns unavailable when cash flows lack a usable sign change or do not converge.
- Simple and discounted payback are first non-negative cumulative cash-flow years. Break-even PPA is solved server-side with a bounded binary search.
- Sensitivity runs are capped at 121 cells.

The current tax line is a planning placeholder using a configured effective rate and straight-line depreciation. It intentionally does not implement tax-credit eligibility, partnership flips, transfer pricing, state tax, or an authoritative depreciation election. Those require qualified professional review and verified source data.

## Version and approval workflow

1. Owner, admin, developer, or analyst creates a model version.
2. The server validates inputs, calculates outputs, and stores an immutable snapshot.
3. Blocking warnings prevent approval.
4. Owner or admin records an approval decision through `approve_financial_model`; direct inserts into the approval ledger are not allowed.
5. Changes to production models, EPC proposals, PPA scenarios, interconnection cost estimates, project incentives, or debt terms mark previously approved model versions stale.
6. A stale version cannot be approved or included in a funding package. Recalculation creates a new version rather than overwriting history.

## Funding-readiness rules

Readiness is deterministic and evidence-based. Eighty percent of the score comes from five gates: a current approved model, approved production source, approved budget, valid site control, and interconnection evidence. Twenty percent comes from completed requirements. Any unresolved fatal flag sets the result to `blocked` regardless of the numeric score.

Statuses are `early`, `developing`, `review_ready`, `lender_ready`, and `blocked`. “Lender ready” is an internal evidence state, not a statement that a lender has approved or will finance a project.

## RLS and role matrix

All Sprint 5 tables enable RLS, deny `anon`, and require the current organization for every operation.

| Capability | Viewer | Analyst | Developer | Admin | Owner |
|---|---:|---:|---:|---:|---:|
| View project finance and readiness | Yes | Yes | Yes | Yes | Yes |
| Create model/scenario/sensitivity versions | No | Yes | Yes | Yes | Yes |
| Edit project assumptions | No | Analysis only | Yes | Yes | Yes |
| Approve a financial model | No | No | No | Yes | Yes |
| Approve lender-ready package | No | No | No | Yes | Yes |
| View/manage capital partners and sensitive terms | No | No | No | Yes | Yes |
| Delete financial records | No | No | No | Yes | Yes |

Every API handler rechecks the authenticated actor and role. UI visibility is not used as an authorization boundary. The publishable Supabase client remains user-scoped; Sprint 5 does not use the service-role client.

## Data room and funding package

Project documents remain in the existing private, organization-prefixed Supabase Storage bucket. `funding_data_room_documents` is an allowlist: only owner/admin-approved entries are included in the printable funding package. `/api/projects/[id]/funding-package` also requires an approved, non-stale financial model, returns `private, no-store`, and is restricted to owner/admin. It produces print/PDF-ready HTML without making storage objects public.

## Initial operating procedure

1. Bootstrap the first owner using `docs/SECURITY_AND_OPERATIONS.md` and invite additional users through Dashboard → Users.
2. Apply all migrations and verify RLS with a viewer, analyst, developer, admin, and owner account.
3. Create or approve the project production model, budget, and evidence records.
4. Create a financial model under Project → Finance. Review warnings and source data.
5. Have an owner/admin document approval. Recalculate whenever a material input changes.
6. Add readiness requirements and private data-room documents. Approve only reviewed documents for package inclusion.
7. Create and maintain sensitive partner records under Dashboard → Capital with owner/admin accounts only.

## Verification and remaining risks

`npm run test:finance` covers formulas, edge cases, role boundaries, stale approvals, data-room inclusion, and RLS structure. Run the complete suite with `npm test`, then `npm run lint`, `npm run build`, and `npm audit --omit=dev`.

Remaining risks and manual checks:

- Migrations and RLS must be exercised against the target Supabase project; a local code build cannot prove deployed policy state.
- Multi-step Supabase writes are sequential because the application does not yet expose a single database transaction RPC for complete model persistence. Failures are surfaced, but an operator may need to archive a partial draft before rerunning.
- The tax/depreciation layer is intentionally preliminary and needs professional validation before transaction use.
- No lender, tax-credit, utility, SCADA, market-data, or accounting integration is connected. Records are manual until a verified adapter is added.
- Funding packages are printable HTML; browser “Save as PDF” is the current PDF generation path.

## Recommended Sprint 6

Move multi-table model persistence into one transactional database RPC; add verified utility, market-data, and accounting adapters; implement professionally reviewed tax-credit and partnership-allocation models; generate signed PDF packages server-side; and add controlled lender-portal access with end-to-end Supabase policy tests in a disposable project.
