// Builds the static site into _site/. No dependencies.
// Usage: node scripts/build.mjs
//
// Pages:
// Two sites, each deployed to its own Cloudflare Pages project and subdomain:
//   _site/calendar/   the calendar (site.siteUrl): /, /day/YYYY-MM-DD/, /feed.xml, /doors.json
//   _site/status/     the parody status page (site.statusUrl)
// With PREVIEW=1, links between the two sites point to /calendar/ and /status/ for local testing.
//
// The look follows the "Advent Calendar of Societal Collapse" design canvas.
// Every decay value comes from dates, so a door always looks the same.
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CATEGORIES, ROOT, addDays, dayDiff, loadEntries, loadSite, validateEntry } from "./lib.mjs";
import { gift } from "./gift.mjs";

const OUT = join(ROOT, "_site", "calendar");
const OUT_STATUS = join(ROOT, "_site", "status");
const site = loadSite();
const entries = loadEntries().filter((e) => {
  const errors = validateEntry(e);
  if (errors.length) console.warn(`Skipping entries/${e.file}: ${errors.join("; ")}`);
  return errors.length === 0;
});
// The calendar starts on the date of the first disruption.
const START = entries[0]?.date ?? site.startDate;
const prologue = entries.filter((e) => e.date < START);
const doors = entries.filter((e) => e.date >= START);
const latest = entries.at(-1);
const PREVIEW = Boolean(process.env.PREVIEW);
const CAL_URL = PREVIEW ? "/calendar/" : `${site.siteUrl}/`;
const STATUS_URL = PREVIEW ? "/status/" : `${site.statusUrl}/`;
const nextDate = latest ? addDays(latest.date, 1) : START;

// ---------- helpers ----------
const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmt = (date, opts) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });
const pillDate = (date) => fmt(date, { month: "short", day: "numeric" }).toUpperCase(); // NOV 12
const shortDate = (date) => fmt(date, { month: "short", day: "numeric" }); // Nov 12
const longDate = (date) => fmt(date, { weekday: "long", month: "short", day: "numeric", year: "numeric" }).toUpperCase();
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const f = (x, d = 2) => Number(x).toFixed(d);
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, t) => {
  const A = hex(a);
  const B = hex(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
};
const frac = (x) => x - Math.floor(x);
const hash = (n) => frac(Math.sin(n * 12.9898 + 78.233) * 43758.5453);
// Door wear halves the distance to 1 every HALF_LIFE days: day 46 ≈ 0.5, day 91 ≈ 0.75, day 136 ≈ 0.875.
const HALF_LIFE = 45;
const wearOf = (n) => (n < 1 ? 0 : 1 - Math.pow(0.5, (n - 1) / HALF_LIFE));
const dayN = (date) => dayDiff(START, date) + 1;
const boardAge = latest ? wearOf(dayN(latest.date)) : 0;

// Our categories → the design's door and gift kinds.
const KIND = { tech: "Tech", transport: "Transport", finance: "Money", cyber: "Cyber", infrastructure: "Power", "public-services": "Public", meta: "Calm" };
const TAG_BG = { Tech: "#1E5636", Transport: "#1C3260", Money: "#6E5410", Cyber: "#5A2A6C", Power: "#8C3A10", Public: "#8E1B22", Calm: "#5B574F" };
const INKS = ["#B3202A", "#1E5636", "#B8862A", "#7A1F3D"];
const KRAFT = "#7A5A36";
const kindOf = (e) => (e.calm ? "Calm" : KIND[e.headline.categories[0]] ?? "Calm");
const catLabel = (e) => (e.calm ? "Calm day" : CATEGORIES[e.headline.categories[0]] ?? "Other");
const seedOf = (date) => {
  const n = dayN(date);
  return n >= 1 ? hash(n) : hash(1000 + Math.abs(n));
};
const inkOf = (date) => (dayN(date) < 1 ? KRAFT : INKS[Math.floor(seedOf(date) * 4) % 4]);
const doorWear = (date) => wearOf(dayN(date));

const FONTS =
  "https://fonts.googleapis.com/css2?family=Shrikhand&family=Fraunces:ital,wght@1,500&family=Oswald:wght@500;600;700&family=Public+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400;1,500&family=Inter:wght@400;500;600;700&display=swap";

function layout({ title, description, prefix, body, path, bodyClass, base = site.siteUrl, image, imageAlt, siteName = site.title, type = "website" }) {
  const url = `${base}/${path}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:site_name" content="${esc(siteName)}">
<meta property="og:locale" content="en_US">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(imageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<meta name="twitter:image:alt" content="${esc(imageAlt)}">
<link rel="canonical" href="${esc(url)}">
<link rel="icon" href="${prefix}favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${esc(site.title)}" href="${CAL_URL}feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="${prefix}style.css">
</head>
<body class="${bodyClass}">
${body}
<script src="${prefix}app.js" defer></script>
</body>
</html>
`;
}

const viewNav = (prefix, current) => `<nav class="views" aria-label="Choose a view">
  <a href="${prefix}"${current === "calendar" ? ' aria-current="page"' : ""}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="1.5" y="2.5" width="13" height="12" rx="1.5"/><path d="M1.5 6.5h13M6 6.5v8M10.5 6.5v8M4.5 1v3M11.5 1v3"/></svg>Calendar</a>
  <a href="${STATUS_URL}"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M1 8.5h3l2-5 3.5 9 2-4H15"/></svg>Society Status</a>
</nav>`;

// ---------- door ----------
function tearClip(w, tr) {
  if (w <= 0.28) return "none";
  const t = Math.round((w - 0.28) * 64) + 8;
  const r = (x) => Math.round(x);
  return tr
    ? `polygon(0 0, calc(100% - ${t}px) 0, calc(100% - ${r(t * 0.72)}px) ${r(t * 0.22)}px, calc(100% - ${r(t * 0.58)}px) ${r(t * 0.16)}px, calc(100% - ${r(t * 0.34)}px) ${r(t * 0.58)}px, calc(100% - ${r(t * 0.12)}px) ${r(t * 0.62)}px, 100% ${t}px, 100% 100%, 0 100%)`
    : `polygon(0 0, 100% 0, 100% 100%, ${t}px 100%, ${r(t * 0.7)}px calc(100% - ${r(t * 0.2)}px), ${r(t * 0.55)}px calc(100% - ${r(t * 0.12)}px), ${r(t * 0.3)}px calc(100% - ${r(t * 0.6)}px), ${r(t * 0.1)}px calc(100% - ${r(t * 0.55)}px), 0 calc(100% - ${t}px))`;
}

function door({ date, entry, state, today = false, prefix = "" }) {
  const w = doorWear(date);
  const s = clamp(seedOf(date), 0, 0.9999);
  const s2 = (s * 7.31) % 1;
  const s3 = (s * 13.73) % 1;
  const ink = inkOf(date);
  const tr = s2 < 0.5;
  const tapeOp = clamp((w - 0.45) * 4);
  const locked = state === "locked";
  const href = entry ? `${prefix}day/${date}/` : "";
  const vars = [
    `--ink:${ink}`,
    `--tilt:${f((s - 0.5) * 2 * w * 5)}deg`,
    `--dx:${f((s2 - 0.5) * w * 8, 1)}px`,
    `--dy:${f((s3 - 0.5) * w * 6, 1)}px`,
    `--sat:${f(1 - 0.65 * w)}`,
    `--sep:${f(0.45 * w)}`,
    `--bri:${f(1 + 0.04 * w)}`,
    `--edge-blur:${f(6 + 22 * w, 0)}px`,
    `--edge-a:${f(0.12 + 0.55 * w)}`,
    `--gloss:${f(clamp(0.5 * (1 - 1.3 * w), 0, 0.5))}`,
    `--seal-op:${f(1 - 0.45 * w)}`,
    `--stain-op:${f(clamp((w - 0.2) * 1.1, 0, 0.6))}`,
    `--slip-stain-op:${f(clamp((w - 0.3) * 0.9, 0, 0.45))}`,
    `--stain-x:${f(8 + s2 * 50, 0)}%`,
    `--stain-y:${f(6 + s3 * 34, 0)}%`,
    `--crease-op:${f(clamp((w - 0.35) * 1.4, 0, 0.45))}`,
    `--crease-y:${f(20 + s * 50, 0)}%`,
    `--crease-rot:${f(-18 + s2 * 36, 1)}deg`,
    `--clip:${tearClip(w, tr)}`,
    `--tape-op:${f(tapeOp)}`,
    `--tape-rot:${f((tr ? 38 : 30) + s * 10, 1)}deg`,
    `--pill-bg:${mix("#FFF6DE", "#E4D2AE", w)}`,
    `--pill-rot:${f((s3 - 0.5) * w * 8, 1)}deg`,
    `--slip-bg:${mix("#FFF9EA", "#E6D6B4", w)}`,
    `--slip-edge:${f(0.1 + 0.45 * w)}`,
    `--slip-rot:${f((s3 - 0.5) * (1 + w * 4))}deg`,
  ].join(";");
  const label = locked
    ? `${pillDate(date)}, locked. Opens ${shortDate(addDays(date, 1))}, ${site.publishTime}`
    : `${today ? "Today, " : ""}${pillDate(date)}: open this door`;
  const front = `<${locked ? "div" : "a"} class="front"${locked ? ` role="img" aria-disabled="true"` : ` href="${href}"`} aria-label="${esc(label)}">
      <span class="print" aria-hidden="true"><span class="gloss"></span><span class="dash"></span><span class="seal"></span><span class="seal-text">OPEN</span></span>
      ${locked ? `<span class="shade" aria-hidden="true"></span>` : ""}
      <span class="stain" aria-hidden="true"></span>
      <span class="crease" aria-hidden="true"></span>
      <span class="pill"><span class="pill-date">${pillDate(date)}</span>${
        locked
          ? `<span class="pill-lock"><svg aria-hidden="true" width="11" height="12" viewBox="0 0 11 12"><rect x="1" y="5" width="9" height="6.5" rx="1.2" fill="#3A2E24"/><path d="M3 5 V3.6 a2.5 2.5 0 0 1 5 0 V5" fill="none" stroke="#3A2E24" stroke-width="1.4"/></svg>Opens ${esc(shortDate(addDays(date, 1)))}, ${esc(site.publishTime)}</span>`
          : ""
      }</span>
    </${locked ? "div" : "a"}>`;
  const inside = entry
    ? `<article class="inside">
      <span class="lip" aria-hidden="true"></span>
      <span class="gift-slot">${gift(kindOf(entry), w)}</span>
      <span class="slip">
        <span class="slip-stain" aria-hidden="true"></span>
        <span class="slip-top"><span class="tag" style="background:${TAG_BG[kindOf(entry)]}">${esc(catLabel(entry))}</span><span class="slip-date">${pillDate(date)}</span></span>
        <strong class="headline${entry.calm ? " calm" : ""}${entry.headline.title.length > 46 ? " long" : ""}">${esc(entry.headline.title)}</strong>
        ${entry.also?.length ? `<span class="more">+${entry.also.length} more collapsing</span>` : ""}
        <a class="read" href="${href}">Read the door →</a>
      </span>
    </article>`
    : "";
  return `<div class="door${state === "open" ? " open" : ""}${locked ? " locked" : ""}" data-date="${date}" style="${vars}">
    ${front}
    ${inside}
    ${tapeOp > 0 ? `<span class="tape ${tr ? "tr" : "bl"}" aria-hidden="true"></span>` : ""}
    ${today ? `<span class="ribbon">TODAY</span>` : ""}
  </div>`;
}

// ---------- calendar page ----------
function lights() {
  const N = 24;
  const S = N / 2;
  const H = 72;
  const sag = H - 26;
  let wire = "";
  for (let j = 0; j < S; j++) {
    const x0 = (j * 1000) / S;
    const x1 = ((j + 1) * 1000) / S;
    wire += (j === 0 ? `M ${x0} 8 ` : "") + `Q ${(x0 + x1) / 2} ${sag} ${x1} 8 `;
  }
  const colors = ["#FF4D4D", "#FFC94D", "#43D17A", "#5AA9FF"];
  let bulbs = "";
  for (let k = 0; k < N; k++) {
    const seg = Math.floor(k / 2);
    const tt = k % 2 === 0 ? 0.32 : 0.68;
    const x = ((seg + tt) * 100) / S;
    const y = (1 - tt) * (1 - tt) * 8 + 2 * (1 - tt) * tt * sag + tt * tt * 8;
    const th = 0.12 + hash(k + 101) * 1.05;
    const lit = boardAge < th;
    const flick = lit && th - boardAge < 0.07;
    const c = colors[k % 4];
    bulbs += `<span class="bulb${lit ? "" : " off"}${flick ? " flicker" : ""}${k % 2 ? " odd" : ""}" style="left:${f(x)}%;top:${f(y - 3, 1)}px;--rot:${f((hash(k + 7) - 0.5) * 22, 1)}deg;--c:${c}"><span class="cap"></span><span class="glass"></span></span>`;
  }
  return `<div class="lights" aria-hidden="true"><svg viewBox="0 0 1000 ${H}" preserveAspectRatio="none"><path d="${wire}"/></svg>${bulbs}</div>`;
}

function fallingTitle() {
  const lines = [
    ["The", "Advent", "Calendar"],
    ["of", "Societal", "Collapse"],
  ];
  let n = 0;
  return lines
    .map(
      (ws) =>
        `<span class="tline">${ws
          .map(
            (wd) =>
              `<span class="tword">${[...wd]
                .map((ch) => {
                  n++;
                  const th = 0.2 + hash(n * 3.1 + 11) * 1.6;
                  const dd = clamp((boardAge - th) / 0.28);
                  const on = boardAge > th;
                  const fallen = boardAge > th + 0.28;
                  const sign = hash(n + 50) < 0.5 ? -1 : 1;
                  if (fallen) return `<span class="ghost">${esc(ch)}</span>`;
                  if (!on) return `<span>${esc(ch)}</span>`;
                  return `<span style="transform:translateY(${f(30 * dd * dd, 1)}px) rotate(${f(sign * (5 + 24 * dd), 1)}deg);transform-origin:${sign < 0 ? "0% 0%" : "100% 0%"}">${esc(ch)}</span>`;
                })
                .join("")}</span>`
          )
          .join(" ")}</span>`
    )
    .join("");
}

function indexPage() {
  const a = boardAge;
  const boardVars = [
    `--ground:${mix("#16305A", "#3E465A", a)}`,
    `--gold:${mix("#E3B850", "#8D7A55", a)}`,
    `--pattern-a:${f(0.12 * (1 - a), 3)}`,
    `--pattern-b:${f(0.07 * (1 - a * 0.6), 3)}`,
    `--glitter:${f(clamp(1 - 1.25 * a))}`,
    `--bleach:${f(0.13 * a, 3)}`,
    `--stain1:${f(clamp((a - 0.35) * 1.4, 0, 0.7))}`,
    `--stain2:${f(clamp((a - 0.55) * 1.6, 0, 0.6))}`,
    `--crease:${f(clamp((a - 0.6) * 2, 0, 0.5))}`,
    `--tape:${f(clamp((a - 0.5) * 4))}`,
    `--title:${mix("#FFE9A8", "#D9CBA4", a)}`,
    `--title-shadow:${mix("#8E1B22", "#4A2A26", a)}`,
    `--title-glow:${f(0.45 * (1 - a))}`,
    `--tag-bg:${mix("#F6E8C4", "#E2CFA6", a)}`,
    `--tag-rot:${f(2.5 + a * 5, 1)}deg`,
  ].join(";");
  const newest = doors.at(-1)?.date;
  const body = `<div class="board" style="${boardVars}">
<div class="layer pattern" aria-hidden="true"></div>
<div class="layer glitter" aria-hidden="true"></div>
<div class="layer bleach" aria-hidden="true"></div>
<div class="layer stain1" aria-hidden="true"></div>
<div class="layer stain2" aria-hidden="true"></div>
<div class="layer fold" aria-hidden="true"></div>
<div class="layer frame" aria-hidden="true"></div>
<div class="layer btape t1" aria-hidden="true"></div>
<div class="layer btape t2" aria-hidden="true"></div>
${lights()}
<div class="wrap">
  <div class="topbar">
    <p class="eyebrow">A new door every morning at ${esc(site.publishTime)}</p>
    ${viewNav("", "calendar")}
  </div>
  <header class="hero">
    <div class="hero-text">
      <h1><span class="sr-only">${esc(site.title)}</span><span aria-hidden="true">${fallingTitle()}</span></h1>
      <p class="kicker">ASSORTED DISRUPTIONS · ONE DOOR A DAY · CONTENTS MAY HAVE SHIFTED</p>
      <p class="lede">Every morning a new door opens on a real disruption of something people rely on. Every door cites its sources. The jokes are aimed at fragile systems, never at the people stuck inside them.</p>
    </div>
    <div class="price-tag-wrap">
      <figure class="price-tag">
        <span class="hole" aria-hidden="true"></span>
        <blockquote>“…${esc(site.inspiration.quote)}.”</blockquote>
        <figcaption>${esc(site.inspiration.who)}, <cite>${esc(site.inspiration.show)}</cite>, ${esc(shortDate(site.inspiration.date))}, ${site.inspiration.date.slice(0, 4)}<br><a href="${esc(site.inspiration.url)}" rel="noopener">Watch the episode →</a></figcaption>
      </figure>
    </div>
  </header>
  ${
    prologue.length
      ? `<section class="prologue" aria-labelledby="prologue-h">
    <div class="prologue-intro">
      <h2 id="prologue-h">Before the countdown</h2>
      <p>Things that broke before anyone was counting. Filed here so the calendar could start on time.</p>
    </div>
    ${prologue.map((e) => `<div class="cell compact">${door({ date: e.date, entry: e, state: "closed" })}</div>`).join("\n    ")}
  </section>`
      : ""
  }
  <section class="doors" aria-labelledby="doors-h">
    <div class="doors-head">
      <h2 id="doors-h">The doors</h2>
      ${newest ? `<a href="#door-${newest}">Jump to today ↓</a>` : ""}
    </div>
    <ol class="grid">
      ${doors.map((e) => `<li class="cell" id="door-${e.date}">${door({ date: e.date, entry: e, state: "closed", today: e.date === newest })}</li>`).join("\n      ")}
      <li class="cell">${door({ date: nextDate, entry: null, state: "locked" })}</li>
    </ol>
    <p class="reset-row"><button class="reset" type="button" hidden>Close all doors</button></p>
  </section>
  <footer class="site-footer">
    <p>Every door links to its news sources. Not affiliated with The Daily Show, Comedy Central, or any company that appears behind a door.</p>
    <nav aria-label="Footer"><a href="https://github.com/${esc(site.repo)}#readme">About</a><a href="https://github.com/${esc(site.repo)}/blob/main/ROUTINE.md">How doors are chosen</a><a href="doors.json">doors.json</a><a href="feed.xml">RSS</a></nav>
  </footer>
</div>
</div>`;
  return layout({ title: site.title, description: site.tagline, prefix: "", body, path: "", bodyClass: "cal", image: `${site.siteUrl}/og/home.png`, imageAlt: `${site.title}: a grid of advent calendar doors, each one a real disruption.` });
}

// ---------- door page ----------
function dayPage(e, prev, next) {
  const prefix = "../../";
  const w = doorWear(e.date);
  const n = dayN(e.date);
  const kind = kindOf(e);
  const vars = [
    `--ground:${mix("#16305A", "#3E465A", boardAge)}`,
    `--star-a:${f(0.55 * (1 - boardAge * 0.8))}`,
    `--ink:${inkOf(e.date)}`,
    `--sat:${f(1 - 0.65 * w)}`,
    `--sep:${f(0.45 * w)}`,
    `--pill-bg:${mix("#FFF6DE", "#E4D2AE", w)}`,
    `--slip-bg:${mix("#FFF9EA", "#E6D6B4", w)}`,
    `--slip-rot:${f((hash(n + 3) - 0.5) * (0.6 + w * 3))}deg`,
    `--edge-blur:${f(10 + 40 * w, 0)}px`,
    `--edge-a:${f(0.08 + 0.5 * w)}`,
    `--stain-op:${f(clamp((w - 0.25) * 1, 0, 0.55))}`,
    `--tape-op:${f(clamp((w - 0.45) * 4))}`,
  ].join(";");
  const navBtn = (d, dir) => {
    if (!d) return "<span></span>";
    const note = d.date < START ? "Before the countdown" : dir === "prev" ? "Previous door" : "Next door";
    const pill = `<span class="nav-pill">${pillDate(d.date)}</span>`;
    const label = `<span class="nav-note">${note}</span>`;
    return `<a class="door-nav ${dir}" href="${prefix}day/${d.date}/" style="background:${inkOf(d.date)}">${
      dir === "prev" ? `<span aria-hidden="true">←</span>${pill}${label}` : `${label}${pill}<span aria-hidden="true">→</span>`
    }</a>`;
  };
  const sources = (e.headline.sources ?? [])
    .map((s) => `<li><a href="${esc(s.url)}" rel="noopener">${esc(s.name)}</a></li>`)
    .join("");
  const body = `<div class="page" style="${vars}">
<div class="wrap narrow">
  <div class="topbar">
    <a class="back" href="${prefix}">← ${esc(site.title)}</a>
    ${viewNav(prefix, "calendar")}
  </div>
  <div class="cavity">
    <span class="lip" aria-hidden="true"></span>
    <div class="cavity-gift">${gift(kind, w)}</div>
    <span class="cavity-pill">${pillDate(e.date)}</span>
  </div>
  <article class="slip-page">
    <span class="slip-stain" aria-hidden="true"></span>
    <span class="slip-tape a" aria-hidden="true"></span>
    <span class="slip-tape b" aria-hidden="true"></span>
    <p class="meta"><span class="tag" style="background:${TAG_BG[kind]}">${esc(catLabel(e))}</span><span>${longDate(e.date)}</span>${e.date < START ? "<span>BEFORE THE COUNTDOWN</span>" : ""}</p>
    <h1>${esc(e.headline.title)}</h1>
    <p class="quip">${esc(e.headline.quip)}</p>
    <hr>
    <h2>WHAT HAPPENED</h2>
    <p class="body">${esc(e.headline.summary)}</p>
    ${sources ? `<h2>SOURCES</h2><ol class="sources">${sources}</ol>` : ""}
    ${
      e.also?.length
        ? `<h2>ALSO COLLAPSING TODAY</h2><ul class="also">${e.also
            .map((a) => {
              const k = KIND[a.categories[0]] ?? "Calm";
              const src = (a.sources ?? []).map((s) => `<a href="${esc(s.url)}" rel="noopener">${esc(s.name)}</a>`).join(" · ");
              return `<li><div class="mini-cavity">${gift(k, w)}</div><div><span class="tag" style="background:${TAG_BG[k]}">${esc(CATEGORIES[a.categories[0]] ?? "Other")}</span><div class="also-h">${esc(a.title)}</div><div class="also-t">${esc(a.summary)}</div>${src ? `<div class="also-s">${src}</div>` : ""}</div></li>`;
            })
            .join("")}</ul>`
        : ""
    }
    ${e.note ? `<p class="note">${esc(e.note)}</p>` : ""}
  </article>
  <nav class="door-pager" aria-label="Previous and next door">${navBtn(prev, "prev")}${navBtn(next, "next")}</nav>
  <p class="page-foot">Every door links to its news sources. The jokes are aimed at fragile systems, never at the people stuck inside them.</p>
</div>
</div>`;
  return layout({
    title: `${shortDate(e.date)}: ${e.headline.title} · ${site.shortTitle}`,
    description: e.headline.quip,
    prefix,
    body,
    path: `day/${e.date}/`,
    bodyClass: "cal",
    type: "article",
    image: `${site.siteUrl}/og/${e.date}.png`,
    imageAlt: `${pillDate(e.date)}: ${e.headline.title}`,
  });
}

// ---------- status page ----------
const COMPONENTS = [
  { cat: "transport", name: "Air travel and transport" },
  { cat: "tech", name: "Cloud, email and apps" },
  { cat: "finance", name: "Banking and payments" },
  { cat: "public-services", name: "Public services" },
  { cat: "infrastructure", name: "Power, water and supply chains" },
  { cat: "cyber", name: "Cybersecurity" },
];
const SEV = {
  op: { c: "#3BA55C", l: "Operational", tc: "#1E7F4F", r: 0 },
  degraded: { c: "#E9B949", l: "Degraded performance", tc: "#8A5A00", r: 1 },
  partial: { c: "#F08C2E", l: "Partial outage", tc: "#B45309", r: 2 },
  major: { c: "#D93025", l: "Major outage", tc: "#C62828", r: 3 },
};

function severity(cat, date, byDate) {
  const e = byDate[date];
  if (e && !e.calm) {
    if (e.headline.categories.includes(cat)) return "major";
    if ((e.also ?? []).some((a) => a.categories.includes(cat))) return "partial";
  }
  const y = byDate[addDays(date, -1)];
  if (y && !y.calm && y.headline.categories.includes(cat)) return "degraded";
  return "op";
}

function statusPage() {
  const prefix = "";
  const byDate = Object.fromEntries(entries.map((e) => [e.date, e]));
  const first = entries[0]?.date ?? START;
  const today = latest?.date ?? START;
  const tracked = dayDiff(first, today) + 1;
  const SPAN = 90;
  const worse = (a, b) => (SEV[b].r > SEV[a].r ? b : a);

  const comps = COMPONENTS.map((c) => {
    let bad = 0;
    const bars = [];
    for (let i = SPAN - 1; i >= 0; i--) {
      const d = addDays(today, -i);
      const sev = d < first ? null : severity(c.cat, d, byDate);
      if (sev && sev !== "op") bad++;
      bars.push(`<span title="${esc(`${shortDate(d)} · ${sev ? SEV[sev].l : "Not yet counting"}`)}" style="background:${sev ? SEV[sev].c : "#D4D6DB"}"></span>`);
    }
    const cur = worse(severity(c.cat, today, byDate), severity(c.cat, addDays(today, -1), byDate));
    const pct = f(((tracked - bad) / tracked) * 100, 1);
    return { ...c, bars, cur, pct, bad };
  });
  const majors = comps.filter((c) => c.cur === "major");
  const worst = comps.reduce((w, c) => worse(w, c.cur), "op");
  const banner =
    majors.length >= 2
      ? { bg: "#C62828", text: "Major outage across multiple systems" }
      : majors.length === 1
        ? { bg: "#C62828", text: `Major outage: ${majors[0].name}` }
        : worst !== "op"
          ? { bg: "#B45309", text: `${SEV[worst].l} across some systems` }
          : { bg: "#1E7F4F", text: "All systems operational. Suspiciously." };

  const compRow = (name, status, color, bars, aria, uptime) => `<div class="comp">
      <div class="comp-head"><span class="comp-name">${esc(name)}</span><span class="comp-status" style="color:${color}">${esc(status)}</span></div>
      <div class="bars" role="img" aria-label="${esc(aria)}">${bars.join("")}</div>
      <div class="comp-foot"><span>${SPAN} days ago</span><span class="rule" aria-hidden="true"></span><span>${esc(uptime)}</span><span class="rule" aria-hidden="true"></span><span>Today</span></div>
    </div>`;
  const rows = comps
    .map((c) =>
      compRow(c.name, SEV[c.cur].l, SEV[c.cur].tc, c.bars, `${c.name}: ${c.bad} days with incidents since ${shortDate(first)}`, `${c.pct}% of days without incident`)
    )
    .join("\n");
  const jokeBars = Array.from({ length: SPAN }, () => `<span style="background:${SEV.major.c}"></span>`);
  const joke = compRow("Public trust in institutions", "Major outage", SEV.major.tc, jokeBars, "Public trust in institutions: major outage every day", "0% of days without incident");

  // A status page stands on its own: incidents cite news sources, not calendar doors.
  const incident = (it, date, major) => `<div class="inc">
      <h4 class="inc-title" style="color:${major ? "#C62828" : "#B45309"}">${esc(it.title)}</h4>
      <div class="inc-comp">${esc([major ? "Major outage" : "Partial outage", ...it.categories.map((c) => COMPONENTS.find((x) => x.cat === c)?.name).filter(Boolean)].join(" · "))}</div>
      <p class="inc-upd"><strong>Reported</strong> · ${esc(it.summary)}<br><span>${esc(shortDate(date))}${it.region ? ` · ${esc(it.region)}` : ""}</span></p>
      ${it.sources?.length ? `<p class="inc-link">Sources: ${it.sources.map((s) => `<a href="${esc(s.url)}" rel="noopener">${esc(s.name)}</a>`).join(" · ")}</p>` : ""}
    </div>`;
  const incidents = (e) => [...(e.calm ? [] : [incident(e.headline, e.date, true)]), ...(e.also ?? []).filter((a) => a.categories.some((c) => COMPONENTS.some((x) => x.cat === c))).map((a) => incident(a, e.date, false))].join("");
  const dayBlock = (label, e) => {
    if (!e) return `<div class="pday"><h3>${esc(label)}</h3><p class="pnote">No incidents reported. Yet.</p></div>`;
    const calmNote = e.calm ? `<p class="pnote">No major incidents reported. ${esc(e.headline.title)}</p>` : "";
    return `<div class="pday"><h3>${esc(label)}</h3>${calmNote}${incidents(e)}</div>`;
  };
  const year = (d) => fmt(d, { month: "short", day: "numeric", year: "numeric" });
  const past = [
    dayBlock(year(nextDate), null),
    ...[...doors].reverse().map((e) => dayBlock(year(e.date), e)),
    prologue.length ? `<div class="pday"><h3>Before the countdown</h3>${[...prologue].reverse().map(incidents).join("")}</div>` : "",
  ].join("\n");

  const body = `<header class="s-header">
  <div class="s-inner">
    <a class="s-logo" href="./"><svg aria-hidden="true" width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="none" stroke="#1D2026" stroke-width="2.2"/><path d="M15 2 L13 10 L17 14 L12 20 L15 28" fill="none" stroke="#D93025" stroke-width="2.2" stroke-linejoin="round"/></svg><span>Society Status</span></a>
    <div class="s-actions">
      <nav class="s-views" aria-label="Choose a view"><a href="${CAL_URL}">Calendar</a><a href="./" aria-current="page">Status</a></nav>
      <a class="s-sub" href="${CAL_URL}feed.xml">Subscribe to updates</a>
    </div>
  </div>
</header>
<main class="s-main">
  <div class="s-banner" role="status" style="background:${banner.bg}">
    <span class="s-banner-text"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="10" fill="none" stroke="#FFFFFF" stroke-width="2"/><path d="M11 5.5 V12.5" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/><circle cx="11" cy="16" r="1.4" fill="#FFFFFF"/></svg>${esc(banner.text)}</span>
    <span class="s-updated">Updated ${esc(year(nextDate))} · ${esc(site.publishTime)} CET</span>
  </div>
  <section class="s-card" aria-labelledby="comp-h">
    <h2 id="comp-h" class="sr-only">Components</h2>
    ${rows}
    ${joke}
    <div class="legend">
      <span><i style="background:#3BA55C"></i>Operational</span>
      <span><i style="background:#E9B949"></i>Degraded</span>
      <span><i style="background:#F08C2E"></i>Partial outage</span>
      <span><i style="background:#D93025"></i>Major outage</span>
      <span><i style="background:#D4D6DB"></i>Not yet counting</span>
      <span>Current status reflects the worst incident in the past 48 hours.</span>
    </div>
  </section>
  <section class="s-past" aria-labelledby="past-h">
    <h2 id="past-h">Past incidents</h2>
    ${past}
  </section>
  <footer class="s-footer">Society Status is a parody of a service status page. The incidents are real, and each one cites its news sources. Not affiliated with any company named here.</footer>
</main>`;
  return layout({ title: "Society Status", description: `${banner.text}. A parody status page for real disruptions, with sources.`, prefix, body, path: "", bodyClass: "status", base: site.statusUrl, siteName: "Society Status", image: `${site.statusUrl}/og.png`, imageAlt: "Society Status: a parody status page reporting a major outage across multiple systems." });
}

// ---------- feeds ----------
function feed() {
  const items = [...entries]
    .reverse()
    .slice(0, 50)
    .map((e) => {
      const link = `${site.siteUrl}/day/${e.date}/`;
      const desc = `${e.headline.quip}\n\n${e.headline.summary}`;
      return `<item><title>${esc(`${shortDate(e.date)}: ${e.headline.title}`)}</title><link>${esc(link)}</link><guid>${esc(link)}</guid><pubDate>${new Date(`${addDays(e.date, 1)}T06:00:00Z`).toUTCString()}</pubDate><description>${esc(desc)}</description></item>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(site.title)}</title><link>${esc(site.siteUrl)}/</link><description>${esc(site.tagline)}</description><language>en</language>
${items}
</channel></rss>
`;
}

// ---------- write ----------
rmSync(join(ROOT, "_site"), { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
mkdirSync(OUT_STATUS, { recursive: true });
writeFileSync(join(OUT, "index.html"), indexPage());
writeFileSync(join(OUT_STATUS, "index.html"), statusPage());
entries.forEach((e, i) => {
  mkdirSync(join(OUT, "day", e.date), { recursive: true });
  writeFileSync(join(OUT, "day", e.date, "index.html"), dayPage(e, entries[i - 1], entries[i + 1]));
});
writeFileSync(join(OUT, "feed.xml"), feed());
writeFileSync(join(OUT, "doors.json"), JSON.stringify(entries.map(({ file, review, ...e }) => e), null, 2));
for (const dir of [OUT, OUT_STATUS])
  for (const file of ["style.css", "app.js", "favicon.svg"]) copyFileSync(join(ROOT, "src", file), join(dir, file));
// ---------- social preview cards (rendered to PNG by scripts/og.mjs) ----------
const OG_SRC = join(ROOT, "_og");
const cardShell = (inner, bg) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="${FONTS}"><style>
*{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{background:${bg};font-family:"Public Sans",system-ui,sans-serif;color:#F6E9C6}
.gift{display:block;width:100%;height:100%}
</style></head><body>${inner}</body></html>`;
const navyBg = (a) => `${mix("#16305A", "#3E465A", a)} radial-gradient(circle at 20% 30%, rgba(255,215,120,.35) 0 1.5px, transparent 2.5px) 0 0/34px 30px`;
const brandLine = (url) => `<div style="position:absolute;left:56px;right:56px;bottom:38px;display:flex;justify-content:space-between;align-items:baseline">
<span style="font:400 30px Shrikhand,Georgia,serif;color:#FFE9A8">The Advent Calendar of Societal Collapse</span>
<span style="font:600 20px Oswald,sans-serif;letter-spacing:.08em;color:#EBD9B0">${esc(url.replace("https://", ""))}</span></div>`;

function ogDoor(e) {
  const w = doorWear(e.date);
  const kind = kindOf(e);
  const title = e.headline.title;
  const size = title.length > 70 ? 46 : title.length > 45 ? 54 : 62;
  return cardShell(`<div style="position:absolute;left:56px;top:56px;width:330px;height:430px;border-radius:18px;overflow:hidden;background:linear-gradient(180deg,#2A1A12,#3E271B);box-shadow:inset 0 10px 22px rgba(0,0,0,.65)">
  <div style="position:absolute;left:0;right:0;top:0;height:26px;background:${inkOf(e.date)};clip-path:polygon(0 0,100% 0,100% 55%,90% 100%,78% 45%,64% 90%,50% 35%,36% 95%,22% 50%,10% 95%,0 60%)"></div>
  <div style="position:absolute;left:25px;right:25px;top:70px;height:250px">${gift(kind, w)}</div>
  <div style="position:absolute;left:50%;bottom:30px;transform:translateX(-50%);padding:8px 18px 7px;border-radius:999px;background:${mix("#FFF6DE", "#E4D2AE", w)};color:#1E1914;font:600 38px/1 Oswald,sans-serif;letter-spacing:.06em;white-space:nowrap">${pillDate(e.date)}</div>
</div>
<div style="position:absolute;left:430px;right:56px;top:56px;height:430px;display:flex;flex-direction:column;justify-content:center;gap:22px">
  <div><span style="display:inline-block;padding:5px 12px 4px;border-radius:4px;background:${TAG_BG[kind]};color:#fff;font:500 22px Oswald,sans-serif;letter-spacing:.12em;text-transform:uppercase">${esc(catLabel(e))}</span></div>
  <div style="font-weight:800;font-size:${size}px;line-height:1.06;letter-spacing:-.01em;color:#FFF4DA">${esc(title)}</div>
  <div style="font:italic 500 26px/1.3 Fraunces,Georgia,serif;color:#EBDDB8;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden">${esc(e.headline.quip)}</div>
</div>
${brandLine(site.siteUrl)}`, navyBg(boardAge));
}

// The home and status cards never change: platforms cache them by URL.
// Only per-door cards carry daily content, and each door has its own URL.
function ogHome() {
  const DECOR = [
    { ink: "#B3202A", rot: 0, label: "OPEN" },
    { ink: "#1E5636", rot: -1.5, label: "OPEN" },
    { ink: "#B8862A", rot: 1, label: "OPEN" },
    { ink: "#7A1F3D", rot: -2.5, label: "OPEN" },
    { ink: "#B3202A", rot: 3, label: "OPEN" },
    { ink: "#1E5636", rot: -5, label: "?" },
  ];
  const tiles = DECOR
    .map((d) => `<div style="flex:1;height:170px;border-radius:10px;background:${d.ink};box-shadow:inset 0 0 0 3px rgba(255,240,200,.5),0 6px 10px rgba(0,0,0,.4);position:relative;transform:rotate(${d.rot}deg)">
<span style="position:absolute;left:50%;top:28px;width:56px;height:56px;margin-left:-28px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#FFF2B8,#E2B84F 45%,#9C7424)"></span>
<span style="position:absolute;left:50%;bottom:18px;transform:translateX(-50%);padding:5px 14px 4px;border-radius:999px;background:#FFF6DE;color:#1E1914;font:600 22px/1 Oswald,sans-serif;letter-spacing:.06em;white-space:nowrap">${d.label}</span></div>`)
    .join("");
  return cardShell(`<div style="position:absolute;left:56px;right:56px;top:48px">
<div style="font:500 20px Oswald,sans-serif;letter-spacing:.2em;color:#EBD9B0">ONE REAL DISRUPTION A DAY · EVERY DOOR CITES ITS SOURCES</div>
<div style="margin-top:14px;font:400 76px/1.02 Shrikhand,Georgia,serif;color:#FFE9A8;text-shadow:0 4px 0 #8E1B22">The Advent Calendar<br>of Societal Collapse</div>
<div style="display:flex;gap:22px;margin-top:40px">${tiles}</div></div>
<div style="position:absolute;left:56px;right:56px;bottom:30px;display:flex;justify-content:space-between;font:600 20px Oswald,sans-serif;letter-spacing:.08em;color:#EBD9B0"><span>“…AN ADVENT CALENDAR OF SOCIETAL COLLAPSE.” · JON STEWART</span><span>${esc(site.siteUrl.replace("https://", ""))}</span></div>`, navyBg(0.3));
}

function ogStatus() {
  const banner = { bg: "#C62828", text: "Major outage across multiple systems" };
  const FIXED = [
    ["Air travel and transport", "degraded"],
    ["Cloud, email and apps", "major"],
    ["Banking and payments", "partial"],
    ["Power, water and supply chains", "degraded"],
    ["Cybersecurity", "major"],
  ];
  const rows = [...FIXED.map(([name, cur]) => ({ name, status: SEV[cur].l, color: SEV[cur].tc })), { name: "Public trust in institutions", status: "Major outage", color: SEV.major.tc }]
    .map((r) => `<div style="display:flex;justify-content:space-between;padding:13px 26px;border-top:1px solid #EEF0F3;font-size:22px"><span style="font-weight:600">${esc(r.name)}</span><span style="font-weight:600;color:${r.color}">${esc(r.status)}</span></div>`)
    .join("");
  return cardShell(`<div style="font-family:Inter,system-ui,sans-serif;color:#1D2026;padding:44px 56px">
<div style="display:flex;align-items:center;gap:14px;font-weight:700;font-size:34px"><svg width="40" height="40" viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="none" stroke="#1D2026" stroke-width="2.2"/><path d="M15 2 L13 10 L17 14 L12 20 L15 28" fill="none" stroke="#D93025" stroke-width="2.2" stroke-linejoin="round"/></svg>Society Status</div>
<div style="margin-top:24px;padding:20px 26px;border-radius:10px;background:${banner.bg};color:#fff;font-weight:700;font-size:32px">${esc(banner.text)}</div>
<div style="margin-top:20px;background:#fff;border:1px solid #E3E5EA;border-radius:10px">${rows}</div>
<div style="margin-top:16px;font-size:18px;color:#5C6370">${esc(site.statusUrl.replace("https://", ""))} · a parody status page for real disruptions</div></div>`, "#F6F7F9");
}

rmSync(OG_SRC, { recursive: true, force: true });
mkdirSync(OG_SRC, { recursive: true });
const ogJobs = [
  { src: "home.html", out: join(OUT, "og", "home.png"), html: ogHome() },
  { src: "status.html", out: join(OUT_STATUS, "og.png"), html: ogStatus() },
  ...entries.map((e) => ({ src: `${e.date}.html`, out: join(OUT, "og", `${e.date}.png`), html: ogDoor(e) })),
];
for (const job of ogJobs) writeFileSync(join(OG_SRC, job.src), job.html);
writeFileSync(join(OG_SRC, "manifest.json"), JSON.stringify(ogJobs.map(({ src, out }) => ({ src: join(OG_SRC, src), out })), null, 2));

console.log(`Built ${entries.length} doors into _site/ (calendar age ${f(boardAge)}).`);
