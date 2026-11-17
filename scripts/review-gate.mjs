// Decides whether a branch pushed by the daily routine can publish without review.
// Usage: git diff --name-status --no-renames origin/main...BRANCH | node scripts/review-gate.mjs
// Run it from a trusted checkout of main, with the branch's entry files copied in (see intake.yml).
// Prints a JSON verdict and, inside GitHub Actions, writes `reasons` and then `auto` outputs.
import { randomUUID } from "node:crypto";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadSite, todayIn, validateEntry } from "./lib.mjs";

const changed = readFileSync(0, "utf8")
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const [status, ...rest] = line.split("\t");
    return { status, path: rest.join("\t") };
  });
const reasons = [];
const today = todayIn(loadSite().timezone);

if (changed.length === 0) reasons.push("The branch changes no files.");
for (const { status, path } of changed) {
  if (status !== "A" && status !== "M") {
    reasons.push(`\`${path}\` has git status ${status}; only added or modified entries can publish automatically.`);
    continue;
  }
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
    entry = { ...JSON.parse(readFileSync(full, "utf8")), file: `${m[1]}.json` };
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
  // Reasons can quote entry text, so strip line breaks and use a random delimiter; write `auto` last.
  const delim = `EOF_${randomUUID()}`;
  const lines = reasons.map((r) => `- ${r.replace(/[\r\n]+/g, " ")}`).join("\n");
  appendFileSync(process.env.GITHUB_OUTPUT, `reasons<<${delim}\n${lines}\n${delim}\n`);
  appendFileSync(process.env.GITHUB_OUTPUT, `auto=${verdict.auto}\n`);
}
