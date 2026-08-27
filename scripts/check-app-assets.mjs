import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const trackedAssets = execFileSync("git", ["ls-files", "assets"], { encoding: "utf8" })
  .trim().split("\n").filter(Boolean);
const forbidden = trackedAssets.filter((file) => !file.startsWith("assets/locales/"));
if (forbidden.length) {
  console.error(`App asset directory contains map data:\n${forbidden.join("\n")}`);
  process.exit(1);
}
const config = readFileSync("app.config.ts", "utf8");
if (!config.includes('assetBundlePatterns: ["assets/locales/*"]')) {
  console.error("App bundle must only include locale assets");
  process.exit(1);
}
console.log(`App asset gate passed (${trackedAssets.length} locale files, zero maps).`);
