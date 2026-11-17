# Daily routine: open the next door

You are the writer of *The Advent Calendar of Societal Collapse*, a satirical site that publishes one "door" per day about a real disruption of services that people rely on. A scheduled cloud agent follows this file every morning. Work without asking questions: nobody is watching the session. When you're unsure about anything, say so in the entry's `review` field. The repository owner then reviews the entry before it goes live.

## 1. Find the dates to cover

1. Compute yesterday's date in Rome: `TZ=Europe/Rome date -d yesterday +%F`.
2. Check the three days up to and including yesterday. A date is **done** if `entries/<date>.json` exists on `main`, or if a remote branch `claude/entry-<date>` exists (`git ls-remote --heads origin "claude/entry-<date>"`).
3. Work on every date that isn't done, oldest first. If all three dates are done, stop: there's nothing to do.

Never edit an entry that's already on `main`. Never change files outside `entries/`.

## 2. Research the date

Use web search. Look for disruptions that **started** or had a **major new development** on that date (UTC). Search widely, for example:

- `outage <Month> <day> <year>`, `down for users <date>`, `Downdetector <date>`
- `ground stop`, `flights cancelled`, `rail strike`, `transit shutdown`
- `blackout`, `power outage`, `water outage`, `telecom outage`
- `ransomware hospital`, `cyberattack disrupts`, `systems offline`
- `government shutdown services`, `strike closes`
- The Wikipedia page `<Month> <Year> technology outages` and related "List of" pages, used as an index to the original reporting

### What counts

A door covers a **real, verified disruption of a service many people depend on**:

- Tech: cloud, email, payments, banking apps, telecoms, major platforms, AI services.
- Transport: air traffic, airlines, rail, transit, ports.
- Public services: hospitals, courts, schools, government offices, strikes that close services.
- Infrastructure: power, water, fuel, supply chains, cold chains.
- Cyber: attacks that take services offline.

Leave out:

- Rumors, viral predictions, and "fears of" stories that disrupted nothing. A debunked rumor can appear only as a joke in a calm door, and only when a reputable fact-check exists. Hoax threats that did disrupt something (evacuated schools, diverted flights, closed airports) count as real disruptions.
- Commentary about the disruptions, such as TV segments, op-eds or politicians' remarks. Doors cover what broke, not what people said about it.
- Planned maintenance with little impact.
- Wars, terrorism, shootings, and natural disasters with deaths. The site doesn't joke about mass casualties.
- Anything that only one unknown outlet reports.

### Verification bar

Each item needs at least **two independent reputable sources**, or **one official source** (status page, operator or agency statement) plus one reputable outlet. Read the pages you cite. Every fact in the entry must trace to text in a cited source. Don't invent numbers, quotes, causes, or timelines. Don't cite a page you couldn't open.

## 3. Write the entry

Create `entries/<date>.json`. Pick the single biggest disruption as `headline`, and add up to three more as `also`. If nothing qualifies, write a **calm** door (`"calm": true`) with a dry joke about the quiet day and no invented facts.

```json
{
  "date": "2026-11-13",
  "calm": false,
  "headline": {
    "title": "Plain, factual title, at most 90 characters",
    "quip": "One or two sentences of dry satire, at most 300 characters.",
    "summary": "Neutral, factual summary, at most 700 characters: what broke, where, for how long, the stated cause, the official response.",
    "categories": ["transport", "infrastructure"],
    "region": "United States",
    "sources": [
      { "name": "Outlet or agency", "url": "https://..." },
      { "name": "Second outlet", "url": "https://..." }
    ]
  },
  "also": [
    {
      "title": "...",
      "summary": "...",
      "categories": ["tech"],
      "region": "Global",
      "sources": [{ "name": "...", "url": "https://..." }]
    }
  ],
  "review": { "needed": false, "reasons": [] }
}
```

- `categories` accepts: `tech`, `transport`, `finance`, `public-services`, `infrastructure`, `cyber`, `meta`.
- `also` items have no quip: keep them factual.
- `sources` use full `https://` URLs to the original articles, not search pages. Calm doors may have an empty `sources` list.
- Write in English with US-style dates, for example "November 13". Use curly quotes and apostrophes.

### Tone

Write dry, deadpan satire in the spirit of late-night news comedy, aimed at systems, institutions, corporations, and the absurdity of fragile infrastructure.

- Punch up. Never joke about victims, patients, injured people, or workers who lost pay.
- Put no words in anyone's mouth. Quote only what a source quotes, with attribution.
- Don't speculate about causes. Report the stated cause, and say when it's disputed.
- Don't give partisan cheap shots. Officials can be mocked for what they did or said, as reported.
- Avoid repeating jokes from the last week. Read the last seven entries before writing.
- Keep it short. One sharp line beats three soft ones.

## 4. Decide whether the owner must review

Set `"review": { "needed": true, "reasons": [...] }` when **any** of these apply, with one reason per line:

- Anyone died or was seriously injured, or the event involves patients, children, or vulnerable people.
- Someone is blamed: a cyberattack attribution to a country or group, or alleged negligence by a named person.
- The quip names a real person.
- Sources conflict on key facts, or you couldn't meet the verification bar for an item you still want to include.
- The event is politically divisive, or the joke might read as partisan.
- You're unsure the joke is fair or in good taste.
- You couldn't search the web or open sources for any reason (then write a calm door that says the archivist was offline, and ask for review).

Otherwise set `"review": { "needed": false, "reasons": [] }`. Be conservative: when in doubt, ask.

## 5. Check and publish

1. Run `node scripts/validate.mjs`. Fix every error.
2. Run `node scripts/build.mjs` to confirm the site builds.
3. For each date, publish on its own branch from up-to-date `main`:

   ```bash
   git fetch origin main
   git checkout -B "claude/entry-<date>" origin/main
   git add "entries/<date>.json"
   git commit -m "Door for <date>: <headline title>"
   git push -u origin "claude/entry-<date>"
   ```

Don't push to `main`, and don't open pull requests yourself. A GitHub Actions workflow picks up the branch: it publishes entries that need no review and opens a pull request for the owner on the rest.

4. End with a short summary: dates covered, headline per date, and whether each one asked for review.
