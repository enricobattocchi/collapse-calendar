// Validates every entry in entries/. Exits with status 1 on any error.
// Usage: node scripts/validate.mjs
import { loadEntries, loadSite, todayIn, validateEntry } from "./lib.mjs";

const site = loadSite();
const today = todayIn(site.timezone);

let entries;
try {
  entries = loadEntries();
} catch (err) {
  console.error(`Invalid JSON in entries/: ${err.message}`);
  process.exit(1);
}

let failed = 0;
for (const entry of entries) {
  const errors = validateEntry(entry, { today });
  if (errors.length) {
    failed++;
    console.error(`✗ entries/${entry.file}`);
    for (const e of errors) console.error(`    ${e}`);
  }
}
console.log(`${entries.length - failed}/${entries.length} entries valid.`);
process.exit(failed ? 1 : 0);
