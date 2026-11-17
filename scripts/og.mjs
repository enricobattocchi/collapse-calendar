// Renders the social preview cards written by build.mjs (_og/*.html) to 1200×630 PNGs
// with headless Chrome. Run after scripts/build.mjs. Set CHROME to override the binary.
// Usage: node scripts/og.mjs
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { ROOT } from "./lib.mjs";

const chrome = process.env.CHROME || "google-chrome";
const jobs = JSON.parse(readFileSync(join(ROOT, "_og", "manifest.json"), "utf8"));
for (const { src, out } of jobs) {
  mkdirSync(dirname(out), { recursive: true });
  execFileSync(chrome, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-sandbox",
    "--virtual-time-budget=5000", "--window-size=1200,630",
    `--screenshot=${out}`, `file://${src}`,
  ], { stdio: "ignore" });
}
console.log(`Rendered ${jobs.length} social preview images.`);
