import { createHash } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

export function ensureDirectories(...paths) {
  paths.forEach((path) => mkdirSync(path, { recursive: true }));
}

export function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${command} failed with exit code ${result.status}`);
}

export async function download(url, destination, expectedMd5) {
  if (existsSync(destination) && (!expectedMd5 || md5(destination) === expectedMd5)) return;
  run("curl", ["--fail", "--location", "--continue-at", "-", "--output", destination, url]);
  if (expectedMd5 && md5(destination) !== expectedMd5) throw new Error(`Checksum mismatch: ${destination}`);
}

export function md5(path) {
  return createHash("md5").update(readFileSync(path)).digest("hex");
}

export async function sha256(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

export function requireCommand(name) {
  const result = spawnSync("which", [name], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`Missing build dependency: ${name}`);
}

export const parseSequence = (path) =>
  readFileSync(path, "utf8")
    .split("\n")
    .map((line) => line.replace(/^\x1e/, "").trim())
    .filter(Boolean)
    .map(JSON.parse);
