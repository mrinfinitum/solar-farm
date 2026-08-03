import { csvProvider } from "@/lib/integrations/providers/csv";
import { manualProvider } from "@/lib/integrations/providers/manual";
import { providerStubs } from "@/lib/integrations/providers/stubs";
export const providerRegistry = [manualProvider, csvProvider, ...providerStubs];
export function getProvider(key: string) { return providerRegistry.find((provider) => provider.key === key) ?? null; }
