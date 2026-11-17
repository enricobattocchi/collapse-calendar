// Decides whether a branch pushed by the daily routine can publish without review.
// Usage: git diff --name-only origin/main...HEAD | node scripts/review-gate.mjs
// Prints a JSON verdict and, inside GitHub Actions, writes `auto` and `reasons` outputs.
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadSite, todayIn, validateEntry } from "./lib.mjs";

const changed = readFileSync(0, "utf8").split("\n").map((s) => s.trim()).filter(Boolean);
const reasons = [];
const today = todayIn(loadSite().timezone);

if (changed.length === 0) reasons.push("The branch changes no files.");
for (const path of changed) {
  const m = path.match(/^entries\/(\d{4}-\d{2}-\d{2})\.json$/);
  if (!m) {
    reasons.push(`\`${path}\` is outside \`entries/\`; only the owner can approve code or config changes.`);
    continue;
  }
  const full = join(ROOT, path);
  if (!existsSync(full)) {
    reasons.push(`\`${path}\` is deleted.`);
    continue;
  }
  let entry;
  try {
    entry = { file: `${m[1]}.json`, ...JSON.parse(readFileSync(full, "utf8")) };
  } catch (err) {
    reasons.push(`\`${path}\` is not valid JSON: ${err.message}`);
    continue;
  }
  const errors = validateEntry(entry, { today });
  for (const e of errors) reasons.push(`\`${path}\`: ${e}`);
  if (entry.review?.needed !== false) {
    for (const r of entry.review?.reasons ?? ["The entry asks for review."]) reasons.push(`\`${path}\` (routine): ${r}`);
  }
}

const verdict = { auto: reasons.length === 0, reasons };
console.log(JSON.stringify(verdict, null, 2));
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `auto=${verdict.auto}\n`);
  appendFileSync(process.env.GITHUB_OUTPUT, `reasons<<EOF_REASONS\n${reasons.map((r) => `- ${r}`).join("\n")}\nEOF_REASONS\n`);
}
