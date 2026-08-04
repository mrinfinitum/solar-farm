import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_ROLES = new Set(["owner", "admin", "developer", "analyst", "viewer"]);

function requiredValue(value, label) {
  if (!value) throw new Error(`${label} is required.`);
  return value;
}

function throwIfError(error, context) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

export function parseBootstrapOptions(argv, env = process.env) {
  const args = [...argv];
  const verifyOnly = args.includes("--verify-only");
  const userIdIndex = args.indexOf("--user-id");
  const userId = userIdIndex >= 0 ? args[userIdIndex + 1] : env.NSOUL_INITIAL_OWNER_USER_ID;

  if (!userId || !UUID_PATTERN.test(userId)) {
    throw new Error("Provide a valid Auth UUID with --user-id or NSOUL_INITIAL_OWNER_USER_ID.");
  }

  return {
    userId,
    verifyOnly,
    organizationName: env.NSOUL_INITIAL_ORGANIZATION_NAME?.trim() || "NSoul",
    organizationSlug: "nsoul",
  };
}

export function evaluateLoginReadiness({
  authUserExists,
  authAccountActive,
  authEmailConfirmed,
  profileExists,
  organizationExists,
  membershipExists,
  membershipOrganizationMatches,
  role,
  status,
}) {
  return Boolean(
    authUserExists &&
      authAccountActive &&
      authEmailConfirmed &&
      profileExists &&
      organizationExists &&
      membershipExists &&
      membershipOrganizationMatches &&
      VALID_ROLES.has(role) &&
      role === "owner" &&
      status === "active",
  );
}

function createAdminClient(env = process.env) {
  const url = requiredValue(env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredValue(env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function getAuthUser(supabase, userId) {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  throwIfError(error, "Unable to read the Supabase Auth user");
  if (!data.user) throw new Error(`Supabase Auth user ${userId} does not exist.`);
  return data.user;
}

async function getOrganization(supabase, slug) {
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();
  throwIfError(error, "Unable to read the organization");
  return data;
}

async function getProfile(supabase, userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, organization")
    .eq("id", userId)
    .maybeSingle();
  throwIfError(error, "Unable to read the user profile");
  return data;
}

async function getMembership(supabase, userId) {
  const { data, error } = await supabase
    .from("organization_members")
    .select("id, organization_id, user_id, role, status, invited_by")
    .eq("user_id", userId)
    .maybeSingle();
  throwIfError(error, "Unable to read the organization membership");
  return data;
}

async function inspectOwnerState(supabase, userId, organizationSlug) {
  const authUser = await getAuthUser(supabase, userId);
  const [profile, organization, membership] = await Promise.all([
    getProfile(supabase, userId),
    getOrganization(supabase, organizationSlug),
    getMembership(supabase, userId),
  ]);
  const bannedUntil = authUser.banned_until ? Date.parse(authUser.banned_until) : 0;
  const authAccountActive =
    !authUser.banned_until || (Number.isFinite(bannedUntil) && bannedUntil <= Date.now());
  const authEmailConfirmed = Boolean(authUser.email_confirmed_at || authUser.confirmed_at);
  const membershipOrganizationMatches = Boolean(
    membership && organization && membership.organization_id === organization.id,
  );

  const result = {
    userId,
    authUserExists: true,
    authAccountActive,
    authEmailConfirmed,
    profileExists: Boolean(profile),
    organizationExists: Boolean(organization),
    organization: organization ? { id: organization.id, name: organization.name, slug: organization.slug } : null,
    membershipExists: Boolean(membership),
    membershipOrganizationMatches,
    role: membership?.role ?? null,
    status: membership?.status ?? null,
  };

  return { ...result, loginReady: evaluateLoginReadiness(result) };
}

async function ensureOrganization(supabase, name, slug) {
  const existing = await getOrganization(supabase, slug);
  if (existing) {
    if (existing.name === name) return { record: existing, change: "unchanged" };
    const { data, error } = await supabase
      .from("organizations")
      .update({ name })
      .eq("id", existing.id)
      .select("id, name, slug")
      .single();
    throwIfError(error, "Unable to update the organization identity");
    return { record: data, change: "updated" };
  }

  const { data, error } = await supabase
    .from("organizations")
    .insert({ name, slug })
    .select("id, name, slug")
    .single();
  throwIfError(error, "Unable to create the organization");
  return { record: data, change: "created" };
}

async function ensureProfile(supabase, authUser, organizationName) {
  const existing = await getProfile(supabase, authUser.id);
  const email = requiredValue(authUser.email, "The Auth user's email");

  if (existing) {
    const updates = {};
    if (existing.email !== email) updates.email = email;
    if (existing.organization !== organizationName) updates.organization = organizationName;
    if (!Object.keys(updates).length) return { record: existing, change: "unchanged" };

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", authUser.id)
      .select("id, email, full_name, organization")
      .single();
    throwIfError(error, "Unable to update the user profile");
    return { record: data, change: "updated" };
  }

  const fullName =
    authUser.user_metadata?.full_name?.trim() ||
    authUser.user_metadata?.name?.trim() ||
    email.split("@")[0];
  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: authUser.id, email, full_name: fullName, organization: organizationName })
    .select("id, email, full_name, organization")
    .single();
  throwIfError(error, "Unable to create the user profile");
  return { record: data, change: "created" };
}

async function ensureOwnerMembership(supabase, userId, organizationId) {
  const existing = await getMembership(supabase, userId);
  if (existing && existing.organization_id !== organizationId) {
    throw new Error(
      `User ${userId} already belongs to a different organization; refusing to move the membership automatically.`,
    );
  }

  if (existing) {
    if (existing.role === "owner" && existing.status === "active" && existing.invited_by === userId) {
      return { record: existing, change: "unchanged" };
    }

    const { data, error } = await supabase
      .from("organization_members")
      .update({ role: "owner", status: "active", invited_by: userId })
      .eq("id", existing.id)
      .select("id, organization_id, user_id, role, status, invited_by")
      .single();
    throwIfError(error, "Unable to activate the owner membership");
    return { record: data, change: "updated" };
  }

  const { data, error } = await supabase
    .from("organization_members")
    .insert({
      organization_id: organizationId,
      user_id: userId,
      role: "owner",
      status: "active",
      invited_by: userId,
    })
    .select("id, organization_id, user_id, role, status, invited_by")
    .single();
  throwIfError(error, "Unable to create the owner membership");
  return { record: data, change: "created" };
}

async function ensureBootstrapAudit(supabase, userId, organizationId, membershipId) {
  const { data: existing, error: readError } = await supabase
    .from("activity_log")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("entity_id", membershipId)
    .eq("action", "initial_owner_bootstrap")
    .limit(1)
    .maybeSingle();
  throwIfError(readError, "Unable to inspect the bootstrap audit record");
  if (existing) return "unchanged";

  const { error } = await supabase.from("activity_log").insert({
    organization_id: organizationId,
    actor_id: userId,
    entity_type: "organization_member",
    entity_id: membershipId,
    action: "initial_owner_bootstrap",
    after_data: {
      user_id: userId,
      role: "owner",
      status: "active",
      source: "scripts/bootstrap-first-owner.mjs",
    },
  });
  throwIfError(error, "Unable to create the bootstrap audit record");
  return "created";
}

export async function bootstrapFirstOwner(options, env = process.env) {
  const supabase = createAdminClient(env);
  const authUser = await getAuthUser(supabase, options.userId);
  const organization = await ensureOrganization(
    supabase,
    options.organizationName,
    options.organizationSlug,
  );
  const profile = await ensureProfile(supabase, authUser, options.organizationName);
  const membership = await ensureOwnerMembership(supabase, options.userId, organization.record.id);
  const audit = await ensureBootstrapAudit(
    supabase,
    options.userId,
    organization.record.id,
    membership.record.id,
  );
  const verification = await inspectOwnerState(supabase, options.userId, options.organizationSlug);

  return {
    changes: {
      organization: organization.change,
      profile: profile.change,
      membership: membership.change,
      audit,
    },
    verification,
  };
}

export async function verifyFirstOwner(options, env = process.env) {
  const supabase = createAdminClient(env);
  return inspectOwnerState(supabase, options.userId, options.organizationSlug);
}

async function main() {
  const options = parseBootstrapOptions(process.argv.slice(2));
  const result = options.verifyOnly
    ? { verification: await verifyFirstOwner(options) }
    : await bootstrapFirstOwner(options);
  console.log(JSON.stringify(result, null, 2));
  if (!result.verification.loginReady) process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`First-owner bootstrap failed: ${error.message}`);
    process.exitCode = 1;
  });
}
