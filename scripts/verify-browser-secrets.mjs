import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const clientExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

function filesBelow(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? filesBelow(path) : [path];
  });
}

for (const path of filesBelow(join(root, "app")).concat(filesBelow(join(root, "components")))) {
  if (!clientExtensions.has(extname(path))) continue;
  const source = readFileSync(path, "utf8");
  if (!/^\s*["']use client["'];/m.test(source)) continue;
  assert.equal(source.includes("SUPABASE_SERVICE_ROLE_KEY"), false, `${relative(root, path)} references the service-role environment variable`);
  assert.equal(source.includes("@/lib/supabase/admin"), false, `${relative(root, path)} imports the server-only admin client`);
}

const staticDirectory = join(root, ".next", "static");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
for (const path of filesBelow(staticDirectory)) {
  const bundle = readFileSync(path, "utf8");
  assert.equal(bundle.includes("SUPABASE_SERVICE_ROLE_KEY"), false, `${relative(root, path)} contains the service-role variable name`);
  if (serviceKey && serviceKey.length >= 20) {
    assert.equal(bundle.includes(serviceKey), false, `${relative(root, path)} contains the configured service-role value`);
  }
}

console.log(`Browser secret verification passed (${existsSync(staticDirectory) ? "built bundles scanned" : "source graph scanned; build output not present"}).`);
