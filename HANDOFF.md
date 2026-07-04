# JianStudy / study-card-pwa handoff

Date: 2026-07-04
Project folder: `/Users/rod.chang/projects/personal/study-card-pwa`
Repo: `https://github.com/rod0826/study-card-pwa.git`
Live URL: `https://rod0826.github.io/study-card-pwa/`
Latest commit at handoff: `62340c7 feat: refine installed app and history cards`

## How to resume tomorrow with Codex

```bash
cd /Users/rod.chang/projects/personal/study-card-pwa
codex
```

Suggested first prompt for Codex:

```text
We are continuing the JianStudy static PWA in this repo. Read HANDOFF.md, README.md, docs/add-subject-guide.md, data/sets.json, app.js, index.html, styles.css, manifest.webmanifest, and sw.js first. The app is deployed on GitHub Pages at https://rod0826.github.io/study-card-pwa/. Help add the next subject from user-provided photos only; do not invent cards from outside the photos. Keep content in data/*.json, register sets in data/sets.json, bump sw.js CACHE_NAME and ASSETS, then run JSON/JS/static verification before committing.
```

## Current app shape

- Plain static PWA: `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, `sw.js`.
- Card data is file-based:
  - `data/sets.json` = registry of card sets.
  - `data/history-mid2-1-final-2026.json` = current history card set.
- Progress is stored in browser `localStorage` per set id: `study-card-progress:<setId>`.
- GitHub Pages is served from `main` branch.
- Original uploaded photos are **not committed/published**; only derived card data is published.

## What was completed today

### PWA / UI

- Created and deployed the JianStudy study-card PWA.
- Applied JianStudy branding and app icons.
- Added mobile-friendly flashcard flow:
  - card set selection
  - review modes: all / weak / wrong / new
  - category filter
  - answer input
  - hint
  - reveal answer
  - self grade: correct / hesitant / wrong
  - wrong/hesitant cards are reinserted later in the queue for spaced review.
- Added visible answer CTA: `정답 입력`.
- Kept Enter key as a shortcut for answer reveal.
- Moved maintainer instructions out of the student UI and into docs.
- Removed top visible title/subtitle because it overlapped with logo on mobile; header now shows logo image only.
- Install guide card now hides after app is installed/opened in standalone mode:
  - `display-mode: standalone`
  - iOS `navigator.standalone`
  - `appinstalled` event
- Added messenger/Open Graph sharing thumbnail:
  - `assets/og-image.png` at 1200×630
  - absolute `og:image` URL in `index.html`
  - cached in `sw.js`

### History card content

- Earlier card set was narrowed to the uploaded scan/photo scope after noticing over-inferred content.
- Then expanded history cards from the uploaded handwritten one-page image for final-check use.
- Current history set:
  - file: `data/history-mid2-1-final-2026.json`
  - card count: 122
  - categories:
    - `춘추 전국·진·한`
    - `위진남북조·수·당`
    - `송·요·금`
    - `몽골·원`
    - `명·청·근대 변화`
- Principle: use only visible uploaded-photo content. Do not add “likely textbook scope” unless the user explicitly asks.

### Docs

- Added/updated `docs/add-subject-guide.md` for adding future subjects.
- Important future-subject checklist:
  1. Create `data/<set-id>.json`.
  2. Add set metadata to `data/sets.json`.
  3. Add the data file to `sw.js` `ASSETS`.
  4. Bump `CACHE_NAME` in `sw.js`.
  5. Validate JSON/JS and live Pages after push.

## Verification already done

Local/static verification:

```bash
python3 -m json.tool data/history-mid2-1-final-2026.json >/tmp/history.json.pretty
python3 -m json.tool data/sets.json >/tmp/sets.json.pretty
python3 -m json.tool manifest.webmanifest >/tmp/manifest.pretty
node --check app.js
```

Assertions passed:

- history card count = 122
- `data/sets.json` cardCount = 122
- no visible `<h1>`/hero subtitle remains
- OG image metadata exists
- install card hiding code exists
- service worker cache = `jianstudy-v5`
- `assets/og-image.png` exists and is reachable

Live verification passed for:

- `/`
- `/app.js`
- `/styles.css`
- `/sw.js`
- `/data/sets.json`
- `/data/history-mid2-1-final-2026.json`
- `/assets/og-image.png`

## Good next tasks

1. Add additional subjects from new uploaded photos.
   - Daughter gave positive feedback and wants other subjects added.
   - Keep the “photo-only source boundary” rule.
   - If OCR is uncertain, either omit or mark for user confirmation; do not invent.

2. Improve multi-subject experience if more sets are added.
   - Current `setSelect` is enough for a few sets.
   - If many subjects are added, consider grouping by subject/grade/exam.

3. Consider adding a “final check” mode.
   - e.g. hide hints by default, show only unanswered/wrong items first, compact progress summary.

4. Consider adding an export/import/reset helper for progress if the child uses multiple devices.
   - Not needed now, but could matter after more subjects.

5. Keep verification terminal-first.
   - Avoid repeated browser automation; the user noticed many browser attempts and was concerned.
   - Prefer `curl`, JSON parsing, `node --check`, and live URL polling.

## Commands for the next change

After editing:

```bash
python3 -m json.tool data/sets.json >/tmp/sets.json.pretty
python3 -m json.tool data/<new-set>.json >/tmp/new-set.pretty
python3 -m json.tool manifest.webmanifest >/tmp/manifest.pretty
node --check app.js
```

Optional local server on an unused port:

```bash
cd /Users/rod.chang/projects/personal/study-card-pwa
python3 -m http.server 9876
```

After commit/push:

```bash
git status --short
git add <changed-files>
git commit -m "feat: add <subject> study cards"
git push origin main

base='https://rod0826.github.io/study-card-pwa'
curl -L -s "$base/data/sets.json" | python3 -m json.tool | head
curl -L -s "$base/sw.js" | head -1
curl -L -s -o /tmp/og.png -w '%{http_code} %{size_download}\n' "$base/assets/og-image.png"
```

## Notes / cautions

- Link-preview thumbnails can be cached by KakaoTalk/other messengers; a correct `og:image` may not update instantly after first share.
- When adding subjects, generated card ids should be stable and unique within each set.
- If a set file name changes, update both `data/sets.json` and `sw.js` `ASSETS`.
- For future PWA cache changes, current cache is `jianstudy-v5`; next cache should be `jianstudy-v6`.
