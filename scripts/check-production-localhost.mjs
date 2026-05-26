import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const ignoredDirs = new Set([".git", ".next", ".turbo", "coverage", "dist", "node_modules"]);
const allowedFiles = new Set([
  ".env.example",
  ".env.local",
  ".env.local.example",
  "README.md",
  "FRONTEND_STABILIZATION.md",
  "check-production-localhost.mjs",
]);
const allowedRelativePaths = new Set([
  "apps/poupi-baby/src/lib/backend-url.ts",
  "apps/poupi-baby/src/services/api.ts",
  "packages/api-client/src/index.ts",
]);
const sourceExtensions = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"]);
const localhostPattern = /https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/g;

function hasAllowedExtension(fileName) {
  return [...sourceExtensions].some((ext) => fileName.endsWith(ext));
}

function walk(dir, findings) {
  for (const entry of readdirSync(dir)) {
    if (ignoredDirs.has(entry)) continue;
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      walk(path, findings);
      continue;
    }
    if (!hasAllowedExtension(entry) && !entry.endsWith(".md") && !entry.includes(".env")) continue;
    if (allowedFiles.has(entry)) continue;
    if (allowedRelativePaths.has(relative(root, path).replaceAll("\\", "/"))) continue;

    const text = readFileSync(path, "utf8");
    const matches = text.match(localhostPattern);
    if (matches) {
      findings.push({ file: relative(root, path), matches: [...new Set(matches)] });
    }
  }
}

const findings = [];
walk(root, findings);

if (findings.length > 0) {
  console.error("Production localhost references found. Replace them with explicit env-based URLs before production deploy.");
  for (const finding of findings) {
    console.error(`- ${finding.file}: ${finding.matches.join(", ")}`);
  }
  process.exit(1);
}

console.log("No production localhost references found.");
