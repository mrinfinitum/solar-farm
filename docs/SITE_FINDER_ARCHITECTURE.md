# Cornerstone Site Finder architecture

## Product surfaces

- Public marketing remains at `/`.
- Public land intake at `/submit-property` inserts only an unverified lead.
- Supabase-authenticated application routes live under `/dashboard`.
- Route protection uses the Next.js 16 `proxy.ts` convention plus server-side user/profile checks in the data-access layer.

## Security boundaries

- Cookie sessions use `@supabase/ssr`.
- Every protected Server Component, API mutation, and signed-download handler resolves the authenticated user server-side.
- RLS is the authoritative permission layer: viewers read, analysts create/update, and administrators manage settings/imports/permanent deletion/conversion.
- The service-role key is imported only from a `server-only` module and is used solely for anonymous public-intake insertion.
- Documents live in the non-public `site-finder-documents` bucket. Downloads receive 60-second signed URLs from the server.
- Important changes are written to `activity_log` by database triggers.

## Data flow

Manual and CSV records retain source name, URL, raw identifier, and collection date. Future providers implement `PropertyDataProvider` and return normalized data, evidence level, warnings, and licensing notes. Disabled stubs return no records.

Scores are calculated transparently in `lib/scoring/calculate.ts`, versioned, and stored alongside point explanations. Overrides are separate fields and require a written reason. Data confidence is independent of suitability score.

## Safe unconfigured behavior

The public website does not require Supabase. Without credentials, login explains setup is required, public intake returns a temporary-unavailable response, and maps explain which style/data source is missing. No placeholder integration fabricates geometry, listings, capacity, or approvals.
