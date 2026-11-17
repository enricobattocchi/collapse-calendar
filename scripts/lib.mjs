// Shared helpers for the build, the validator, and the review gate.
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const ENTRIES_DIR = join(ROOT, "entries");

export const CATEGORIES = {
  tech: "Tech",
  transport: "Transport",
  finance: "Money",
  "public-services": "Public services",
  infrastructure: "Infrastructure",
  cyber: "Cyber",
  meta: "Meta",
};

export const LIMITS = { title: 90, quip: 300, summary: 700, also: 3 };

export function loadSite() {
  return JSON.parse(readFileSync(join(ROOT, "site.json"), "utf8"));
}

export function entryFiles() {
  return readdirSync(ENTRIES_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();
}

export function loadEntries() {
  return entryFiles().map((f) => ({
    file: f,
    ...JSON.parse(readFileSync(join(ENTRIES_DIR, f), "utf8")),
  }));
}

// Calendar dates are plain YYYY-MM-DD strings; compare them in UTC to avoid DST drift.
export function dayDiff(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

export function dayNumber(site, date) {
  return dayDiff(site.startDate, date) + 1;
}

export function todayIn(tz) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function addDays(date, n) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
}

export function formatDate(date) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
}

function checkItem(item, where, errors, { needSources }) {
  if (!item || typeof item !== "object") return errors.push(`${where}: missing`);
  for (const key of ["title", "summary"]) {
    if (typeof item[key] !== "string" || !item[key].trim()) errors.push(`${where}.${key}: required string`);
    else if (item[key].length > LIMITS[key]) errors.push(`${where}.${key}: longer than ${LIMITS[key]} chars`);
  }
  if (item.quip !== undefined && (typeof item.quip !== "string" || item.quip.length > LIMITS.quip))
    errors.push(`${where}.quip: must be a string of at most ${LIMITS.quip} chars`);
  if (!Array.isArray(item.categories) || item.categories.length === 0)
    errors.push(`${where}.categories: at least one required`);
  else for (const c of item.categories) if (!(c in CATEGORIES)) errors.push(`${where}.categories: unknown "${c}"`);
  const sources = item.sources ?? [];
  if (!Array.isArray(sources)) return errors.push(`${where}.sources: must be an array`);
  if (needSources && sources.length === 0) errors.push(`${where}.sources: at least one source required`);
  sources.forEach((s, i) => {
    if (!s || typeof s.name !== "string" || !s.name.trim()) errors.push(`${where}.sources[${i}].name: required`);
    if (!s || typeof s.url !== "string" || !/^https:\/\/[^\s"<>]+$/.test(s.url))
      errors.push(`${where}.sources[${i}].url: must be an https URL`);
  });
}

export function validateEntry(entry, { today } = {}) {
  const errors = [];
  const expected = entry.file?.replace(/\.json$/, "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date ?? "")) errors.push("date: must be YYYY-MM-DD");
  else if (expected && entry.date !== expected) errors.push(`date: "${entry.date}" does not match file name`);
  if (today && entry.date > today) errors.push(`date: ${entry.date} is in the future`);
  if (typeof entry.calm !== "boolean") errors.push("calm: required boolean");
  checkItem(entry.headline, "headline", errors, { needSources: entry.calm === false });
  if (entry.headline && typeof entry.headline.quip !== "string") errors.push("headline.quip: required");
  const also = entry.also ?? [];
  if (!Array.isArray(also)) errors.push("also: must be an array");
  else {
    if (also.length > LIMITS.also) errors.push(`also: at most ${LIMITS.also} items`);
    also.forEach((item, i) => checkItem(item, `also[${i}]`, errors, { needSources: true }));
  }
  if (entry.note !== undefined && typeof entry.note !== "string") errors.push("note: must be a string");
  const r = entry.review;
  if (!r || typeof r.needed !== "boolean") errors.push("review.needed: required boolean");
  else if (r.needed && (!Array.isArray(r.reasons) || r.reasons.length === 0))
    errors.push("review.reasons: explain why review is needed");
  return errors;
}
