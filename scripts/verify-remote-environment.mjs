import { createClient } from "@supabase/supabase-js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEFAULT_OWNER_USER_ID = "837fbd1a-4c1d-4c23-bbee-71040ead75c7";
const DEFAULT_ORGANIZATION_ID = "a3e17009-78eb-4b48-9226-30ba193061b6";
const EXPECTED_ORGANIZATION_NAME = "NSoul LLC";
const EXPECTED_ORGANIZATION_SLUG = "nsoul";

const CANONICAL_TABLES = [
  "profiles",
  "organizations",
  "organization_members",
  "activity_log",
  "properties",
  "property_enrichment_runs",
  "property_enrichment_steps",
  "property_enrichment_results",
  "property_field_proposals",
  "property_geometries",
  "property_screening_reports",
  "data_providers",
  "provider_usage_logs",
  "provider_usage_summaries",
];

const MIGRATION_SURFACES = {
  "202608020001_site_finder_schema.sql": ["profiles", "id"],
  "202608020002_site_finder_rls.sql": ["provider_settings", "id"],
  "202608020003_identity_and_tenant_security.sql": ["organization_members", "id,role,status"],
  "202608030001_property_acquisition.sql": ["property_parcels", "id,property_id"],
  "202608030002_property_intelligence_crm.sql": ["property_checklist_items", "id,property_id"],
  "202608030003_property_enrichment_gis.sql": ["property_enrichment_runs", "id,status"],
  "202608030004_conversion_intake.sql": [
    "public_property_submissions",
    "id,submission_status,attachment_path",
  ],
  "202608030005_project_development_command_center.sql": [
    "project_stage_history",
    "id,project_id",
  ],
  "202608030006_financial_modeling_capital_readiness.sql": [
    "financial_models",
    "id,project_id,current_version_id",
  ],
  "202608040001_property_provider_integrations.sql": [
    "data_providers",
    "id,enabled,health_status,last_checked_at,cache_duration_seconds",
  ],
};

function requiredValue(value, label) {
  if (!value) throw new Error(`${label} is required.`);
  return value;
}

function optionValue(argv, option, fallback) {
  const index = argv.indexOf(option);
  return index >= 0 ? argv[index + 1] : fallback;
}

function safeError(error) {
  if (!error) return null;
  const rawMessage =
    error.message || error.details || error.hint || JSON.stringify(error) || "Remote verification failed.";
  return {
    code: error.code || "unknown",
    message: String(rawMessage).replaceAll(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "__never__",
      "[configured Supabase URL]",
    ),
  };
}

async function checkTable(supabase, table) {
  const { error } = await supabase.from(table).select("id", { head: true }).limit(0);
  return error ? { exists: false, error: safeError(error) } : { exists: true };
}

async function checkSurface(supabase, table, columns) {
  const { error } = await supabase.from(table).select(columns).limit(1);
  return error
    ? { observable: false, table, columns, error: safeError(error) }
    : { observable: true, table, columns };
}

async function main() {
  const url = requiredValue(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredValue(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    "SUPABASE_SERVICE_ROLE_KEY",
  );
  const ownerUserId = optionValue(process.argv, "--user-id", DEFAULT_OWNER_USER_ID);
  const expectedOrganizationId = optionValue(
    process.argv,
    "--organization-id",
    DEFAULT_ORGANIZATION_ID,
  );

  if (!UUID_PATTERN.test(ownerUserId) || !UUID_PATTERN.test(expectedOrganizationId)) {
    throw new Error("Owner and organization identifiers must be valid UUIDs.");
  }

  const projectRef = new URL(url).hostname.split(".")[0];
  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const tableEntries = [];
  for (const table of CANONICAL_TABLES) {
    tableEntries.push([table, await checkTable(supabase, table)]);
  }
  const tables = Object.fromEntries(tableEntries);
  const migrationSurfaceEntries = [];
  for (const [migration, [table, columns]] of Object.entries(MIGRATION_SURFACES)) {
    migrationSurfaceEntries.push([migration, await checkSurface(supabase, table, columns)]);
  }
  const migrationSurfaces = Object.fromEntries(migrationSurfaceEntries);

  const [authResult, profileResult, organizationResult, membershipResult, providerResult, rpcResult] =
    await Promise.all([
      supabase.auth.admin.getUserById(ownerUserId),
      supabase.from("profiles").select("id").eq("id", ownerUserId).maybeSingle(),
      supabase
        .from("organizations")
        .select("id,name,slug")
        .eq("slug", EXPECTED_ORGANIZATION_SLUG)
        .maybeSingle(),
      supabase
        .from("organization_members")
        .select("organization_id,user_id,role,status")
        .eq("user_id", ownerUserId)
        .maybeSingle(),
      supabase
        .from("data_providers")
        .select(
          "provider_key,provider_version,status,enabled,health_status,last_checked_at,cache_duration_seconds,credential_required",
        )
        .eq("organization_id", expectedOrganizationId)
        .order("provider_key"),
      supabase.rpc("activate_my_membership"),
    ]);

  const authUser = authResult.data?.user || null;
  const organization = organizationResult.data;
  const membership = membershipResult.data;
  const bannedUntil = authUser?.banned_until ? Date.parse(authUser.banned_until) : 0;
  const authAccountActive = Boolean(
    authUser &&
      (!authUser.banned_until || (Number.isFinite(bannedUntil) && bannedUntil <= Date.now())),
  );
  const authEmailConfirmed = Boolean(authUser?.email_confirmed_at || authUser?.confirmed_at);
  const organizationMatchesExpected = Boolean(
    organization &&
      organization.id === expectedOrganizationId &&
      organization.name === EXPECTED_ORGANIZATION_NAME &&
      organization.slug === EXPECTED_ORGANIZATION_SLUG,
  );
  const membershipOrganizationMatches = Boolean(
    membership && membership.organization_id === expectedOrganizationId,
  );
  const functionExists = !rpcResult.error;
  const loginReady = Boolean(
    authUser &&
      authAccountActive &&
      authEmailConfirmed &&
      profileResult.data &&
      organization &&
      membership &&
      membershipOrganizationMatches &&
      membership.role === "owner" &&
      membership.status === "active" &&
      functionExists,
  );
  const schemaReady = Object.values(tables).every((result) => result.exists) && functionExists;

  const report = {
    checkedAt: new Date().toISOString(),
    projectRef,
    expected: {
      ownerUserId,
      organizationId: expectedOrganizationId,
      organizationName: EXPECTED_ORGANIZATION_NAME,
      organizationSlug: EXPECTED_ORGANIZATION_SLUG,
    },
    schema: {
      tables,
      migrationSurfaces,
      activateMyMembershipFunction: functionExists
        ? { exists: true, unauthenticatedServiceCheckReturned: rpcResult.data }
        : { exists: false, error: safeError(rpcResult.error) },
      latestProviderColumns: providerResult.error
        ? { exist: false, error: safeError(providerResult.error) }
        : { exist: true, providerRowCount: providerResult.data?.length || 0 },
      ready: schemaReady && !providerResult.error,
    },
    owner: {
      authUserExists: Boolean(authUser),
      authAccountActive,
      authEmailConfirmed,
      profileExists: Boolean(profileResult.data),
      organizationExists: Boolean(organization),
      organization: organization
        ? { id: organization.id, name: organization.name, slug: organization.slug }
        : null,
      organizationMatchesExpected,
      membershipExists: Boolean(membership),
      membershipOrganizationMatches,
      role: membership?.role || null,
      status: membership?.status || null,
      loginReady,
    },
    errors: {
      auth: safeError(authResult.error),
      profile: safeError(profileResult.error),
      organization: safeError(organizationResult.error),
      membership: safeError(membershipResult.error),
    },
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.schema.ready || !report.owner.loginReady || !organizationMatchesExpected) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(`Remote environment verification failed: ${error.message}`);
  process.exitCode = 1;
});
