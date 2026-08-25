import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const checked = /\.(?:[cm]?[jt]sx?|json|ya?ml|swift|rb|sh)$/;
const extensionlessScripts = new Set(["tools/native/xcodebuild"]);
const ignored = /^(?:node_modules|ios|android|dist|coverage)\//;
const generated = /^(?:pnpm-lock\.yaml|assets\/regions\/)/;
const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter(
    (file) =>
      file &&
      (checked.test(file) || extensionlessScripts.has(file)) &&
      !ignored.test(file) &&
      !generated.test(file),
  );

const violations = files
  .map((file) => ({ file, lines: readFileSync(file, "utf8").split(/\r?\n/).length }))
  .filter(({ lines }) => lines >= 200);

if (violations.length) {
  console.error(violations.map(({ file, lines }) => `${file}: ${lines} lines`).join("\n"));
  process.exit(1);
}
console.log(`Line limit passed (${files.length} files).`);
