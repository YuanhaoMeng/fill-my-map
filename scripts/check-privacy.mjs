import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const runtimeFiles = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter((file) => /^(?:src\/.*\.[jt]sx?|App\.tsx|index\.ts|app\.config\.ts)$/.test(file));

const forbiddenApis = [
  ["fetch", /\bfetch\s*\(/],
  ["XMLHttpRequest", /\bXMLHttpRequest\b/],
  ["WebSocket", /\bWebSocket\b/],
  ["EventSource", /\bEventSource\b/],
];
const violations = runtimeFiles.flatMap((file) => {
  const source = readFileSync(file, "utf8");
  return forbiddenApis
    .filter(([, pattern]) => pattern.test(source))
    .map(([name]) => `${file}: runtime network API ${name}`);
});

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const dependencies = Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies });
const forbiddenDependencies = /(?:analytics|amplitude|firebase|segment|sentry|telemetry|expo-updates|axios)/i;
dependencies.filter((name) => forbiddenDependencies.test(name)).forEach((name) => {
  violations.push(`package.json: forbidden network/telemetry dependency ${name}`);
});

const mapPatch = readFileSync("patches/@maplibre__maplibre-react-native@11.3.7.patch", "utf8");
if (!mapPatch.includes("super initWithFrame:frame styleJSON:emptyStyle")) {
  violations.push("MapLibre must initialize with a local empty style before React props arrive");
}

const appConfig = readFileSync("app.config.ts", "utf8");
if (!appConfig.includes('customBuildFlags: "-DSQLITE_ENABLE_RTREE=1"')) {
  violations.push("Expo SQLite must compile with RTree for the bundled spatial index");
}

if (violations.length) {
  console.error(violations.join("\n"));
  process.exit(1);
}
console.log(`Privacy gate passed (${runtimeFiles.length} runtime files).`);
