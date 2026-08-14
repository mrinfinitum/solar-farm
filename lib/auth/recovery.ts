export type RecoveryTokens = {
  accessToken: string;
  refreshToken: string;
  type: "recovery" | "invite" | "signup";
};

const supportedRecoveryTypes = new Set(["recovery", "invite", "signup"]);

export function recoveryTokensFromHash(hash: string): RecoveryTokens | null {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const type = params.get("type");

  if (!accessToken || !refreshToken || !type || !supportedRecoveryTypes.has(type)) return null;

  return {
    accessToken,
    refreshToken,
    type: type as RecoveryTokens["type"],
  };
}
