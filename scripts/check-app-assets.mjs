import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";

const overview = "assets/maps/united-states-overview.zip";
const trackedAssets = execFileSync("git", ["ls-files", "assets"], { encoding: "utf8" })
  .trim().split("\n").filter(Boolean);
const allowed = (file) => file.startsWith("assets/locales/") || file === overview;
const forbidden = trackedAssets.filter((file) => !allowed(file));
if (forbidden.length) throw new Error(`Unexpected app assets:\n${forbidden.join("\n")}`);
if (!existsSync(overview)) throw new Error("Bundled overview map is missing");
const overviewBytes = statSync(overview).size;
if (overviewBytes > 20_000_000) throw new Error(`Bundled overview exceeds 20 MB: ${overviewBytes}`);
const config = readFileSync("app.config.ts", "utf8");
if (!config.includes('assetBundlePatterns: ["assets/locales/*", "assets/maps/*"]')) {
  throw new Error("App bundle patterns must include locales and the overview map");
}
console.log(`App asset gate passed: bundled overview ${(overviewBytes / 1_000_000).toFixed(1)} MB.`);
