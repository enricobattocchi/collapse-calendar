# The Advent Calendar of Societal Collapse

A satirical calendar with one door per day. Behind each door is a real, sourced disruption of a service that people rely on. The name comes from Jon Stewart, who on [*The Daily Show*](https://www.youtube.com/watch?v=now0emhNT4A) of November 16, 2026 called the run of outages "an advent calendar of societal collapse." This project isn't affiliated with him or the show.

- Calendar: <https://collapse-calendar.lopo.it>
- Society Status, the same data as a parody status page: <https://society-status.lopo.it>

## How it runs on its own

```
06:00 UTC  Claude Code routine reads ROUTINE.md, researches yesterday,
           writes entries/<date>.json, pushes branch claude/entry-<date>
     │
     ▼
Intake workflow (.github/workflows/intake.yml)
     ├─ entry valid and review.needed == false ─► squash to main ─► Deploy workflow ─► Cloudflare Pages
     └─ anything else ─► pull request, label needs-review, assigned to the owner (GitHub notification)
                              │
                              └─ owner merges ─► Deploy workflow ─► Cloudflare Pages
10:00 UTC  Watchdog workflow opens an issue if yesterday's door is still missing
```

The routine catches up on up to three missed days per run. The calendar starts on the date of the first entry, and every door and the whole board decay a little more each day.

## Review a door

When a door needs your OK, GitHub notifies you about a pull request titled "Door for <date> needs review."

- To publish the door, merge the pull request.
- To change the text first, edit `entries/<date>.json` in the pull request, then merge.
- To skip the day, close the pull request.

## Fix a published door

Edit `entries/<date>.json` on `main`. The deploy workflow rebuilds both sites on every push.

## Work locally

Requires Node.js 20 or later. The project has no dependencies.

```bash
node scripts/validate.mjs            # check every entry
PREVIEW=1 node scripts/build.mjs     # build both sites into _site/
python3 -m http.server 8765 --directory _site
# open http://127.0.0.1:8765/calendar/ and http://127.0.0.1:8765/status/
```

## Files

| Path | Purpose |
|---|---|
| `entries/` | One JSON file per door. The format is in `ROUTINE.md`. |
| `site.json` | Title, site URLs, Cloudflare project names, Jon Stewart quote. |
| `ROUTINE.md` | Instructions that the daily routine follows. |
| `scripts/` | Build, gift drawings, social preview renderer (`og.mjs`, needs Chrome), validator, and review gate. |
| `src/` | Stylesheet, script, and icon. |

## Hosting

Both sites are Cloudflare Workers with static assets, the current form of Cloudflare Pages: `collapse-calendar` and `society-status`, configured in `wrangler/`. Their custom domains under `lopo.it` were attached once and stay in place across deploys. The deploy workflow needs two repository secrets:

- `CLOUDFLARE_API_TOKEN`: an account API token with **Account › Workers Scripts › Edit**.
- `CLOUDFLARE_ACCOUNT_ID`: the Cloudflare account ID.
