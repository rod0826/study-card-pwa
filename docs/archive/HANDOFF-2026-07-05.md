# JianStudy / study-card-pwa handoff

Date: 2026-07-05
Project folder: `/Users/rod.chang/projects/personal/study-card-pwa`
Repo: `https://github.com/rod0826/study-card-pwa.git`
Live URL: `https://rod0826.github.io/study-card-pwa/`
Latest deployed implementation commit: `f467ceb feat: add technology and home study cards`
Previous handoff notes commit: `b5b0f26 docs: clarify handoff commit references`

## How to resume with Codex

```bash
cd /Users/rod.chang/projects/personal/study-card-pwa
codex
```

Suggested first prompt:

```text
We are continuing the JianStudy static PWA in this repo. Read HANDOFF.md, README.md, docs/add-subject-guide.md, data/sets.json, app.js, index.html, styles.css, manifest.webmanifest, and sw.js first.

The app is deployed on GitHub Pages at https://rod0826.github.io/study-card-pwa/.

For regular memorization subjects, add cards only from the user-provided source files. Do not invent cards from outside the source. Keep derived card content in data/*.json, register each set in data/sets.json, add the data file to sw.js ASSETS, bump sw.js CACHE_NAME, then run JSON/JS/static verification before committing.

The next planned area is an English vocabulary memorization layer. Treat that as a new design task first, not as a direct copy of the regular subject card format.
```

## Current app shape

- Plain static PWA: `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, `sw.js`.
- Card data is file-based:
  - `data/sets.json` = registry of visible card sets.
  - `data/history-mid2-1-final-2026.json` = history set, 122 cards.
  - `data/technology-mid2-1-final-2026.json` = technology set, 143 cards.
  - `data/home-mid2-1-final-2026.json` = home economics set, 93 cards.
- Current visible set titles follow this rule:
  - `중 2-1 기말 역사`
  - `중 2-1 기말 기술`
  - `중 2-1 기말 가정`
- The dropdown now renders the set title only. Do not re-add ` · ${subject}` because that caused `역사 · 역사`-style duplication.
- Progress is stored in browser `localStorage` per set id: `study-card-progress:<setId>`.
- GitHub Pages is served from the `main` branch.
- Original source photos/PDFs are not committed or published. Only derived card JSON is published.
- Current local-only source folder: `중2-1_기술_가정/` with 4 PDFs. It remains untracked.

## What was completed

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
  - wrong/hesitant cards are reinserted later in the queue for spaced review
- Added visible answer CTA: `정답 입력`.
- Kept Enter key as a shortcut for answer reveal.
- Moved maintainer instructions out of the student UI and into docs.
- Removed top visible title/subtitle because it overlapped with logo on mobile. Header now shows logo image only.
- Install guide card hides after app is installed/opened in standalone mode:
  - `display-mode: standalone`
  - iOS `navigator.standalone`
  - `appinstalled` event
- Added messenger/Open Graph sharing thumbnail:
  - `assets/og-image.png` at 1200x630
  - absolute `og:image` URL in `index.html`
  - cached in `sw.js`
- Generalized the page/OG description so it is no longer history-only.

### History card content

- History set was narrowed to the uploaded scan/photo scope after noticing over-inferred content.
- Then expanded from the uploaded handwritten one-page image for final-check use.
- Current history set:
  - file: `data/history-mid2-1-final-2026.json`
  - title: `중 2-1 기말 역사`
  - card count: 122
  - categories:
    - `춘추 전국·진·한`
    - `위진남북조·수·당`
    - `송·요·금`
    - `몽골·원`
    - `명·청·근대 변화`
- Principle: use only visible uploaded-photo content. Do not add likely textbook scope unless the user explicitly asks.

### Technology and home economics content

- Added technology and home economics from the local PDF folder `중2-1_기술_가정/`.
- Source PDFs:
  - technology memorization note
  - technology QnA cards
  - home economics memorization note
  - home economics QnA cards
- The PDFs are text-based ReportLab PDFs, so `pdftotext -layout` worked cleanly. OCR was not needed.
- Card generation rule used today:
  - Start from QnA cards.
  - Fill gaps from the memorization notes.
  - Split long facts into one memory point per card where possible.
  - Do not add outside textbook assumptions.
- Technology set:
  - file: `data/technology-mid2-1-final-2026.json`
  - title: `중 2-1 기말 기술`
  - card count: 143
  - categories:
    - `건설 기술의 의미와 발달`
    - `건설 구조물의 종류와 혁신`
    - `건설 과정과 관리`
    - `에너지 제로 하우스와 교량`
    - `정보 통신과 인공지능`
    - `정보 통신·인공지능 윤리`
- Home economics set:
  - file: `data/home-mid2-1-final-2026.json`
  - title: `중 2-1 기말 가정`
  - card count: 93
  - categories:
    - `가족의 이해와 건강한 가족`
    - `사회 변화와 가족 문화`
    - `대인 관계와 의사소통`
    - `성폭력과 가정 폭력`
    - `생활 자원 관리와 생활 환경`
    - `디지털 생활 환경`

### Docs

- Added/updated `docs/add-subject-guide.md` for adding future subjects.
- This handoff was updated after adding technology and home economics.

## Verification already done

Local/static verification:

```bash
python3 -m json.tool data/sets.json >/tmp/sets.precommit.json.pretty
python3 -m json.tool data/history-mid2-1-final-2026.json >/tmp/history.precommit.json.pretty
python3 -m json.tool data/technology-mid2-1-final-2026.json >/tmp/technology.precommit.json.pretty
python3 -m json.tool data/home-mid2-1-final-2026.json >/tmp/home.precommit.json.pretty
node --check app.js
```

Structural assertions passed:

- history card count = 122
- technology card count = 143
- home economics card count = 93
- `data/sets.json` card counts match the actual JSON files
- set titles match the `중 2-1 기말 <과목>` rule
- no duplicate card ids in the three current sets
- all card categories exist in their set-level `categories`
- dropdown no longer renders duplicated subject text
- service worker cache = `jianstudy-v6`
- `sw.js` includes the technology and home economics JSON files in `ASSETS`

Live verification passed after push:

```bash
base='https://rod0826.github.io/study-card-pwa'
curl -L -s -H 'Cache-Control: no-cache' "$base/data/sets.json"
curl -L -s -H 'Cache-Control: no-cache' "$base/sw.js" | head -n 1
curl -L -s -o /tmp/live-technology.json -w 'technology %{http_code} %{size_download}\n' "$base/data/technology-mid2-1-final-2026.json"
curl -L -s -o /tmp/live-home.json -w 'home %{http_code} %{size_download}\n' "$base/data/home-mid2-1-final-2026.json"
```

Observed live result:

- `sets.json`: `중 2-1 기말 역사:122 / 중 2-1 기말 기술:143 / 중 2-1 기말 가정:93`
- `sw.js`: `const CACHE_NAME = 'jianstudy-v6';`
- technology JSON: HTTP 200
- home economics JSON: HTTP 200

## Good next tasks

1. Add more regular memorization subjects in the same pattern.
   - Use the provided photos/PDFs only.
   - Prefer QnA cards as the base when they exist.
   - Use memorization notes to fill missing details.
   - If OCR or extracted text is uncertain, omit it or ask the user. Do not invent.

2. Design the English vocabulary memorization layer.
   - User expects a separate hierarchy from regular memorization subjects.
   - Expected learning flow: match English spelling with Korean meaning.
   - Do not implement it by assumption. First clarify:
     - one-way only: English spelling -> Korean meaning
     - reverse direction too: Korean meaning -> English spelling
     - whether exact spelling, case, punctuation, and spacing should be strict
     - whether the data should live under `data/vocab/*.json` or stay in `data/*.json` with a `kind: "vocabulary"` field
   - Likely UI difference: vocabulary sets may need a spelling-focused answer check and a meaning-focused prompt mode.

3. Improve multi-subject experience only if the list grows.
   - Current `setSelect` is enough for three regular sets.
   - If many regular and vocabulary sets are added, consider grouping by kind/subject/grade/exam.

4. Consider adding a final-check mode.
   - Example: hide hints by default, show only unanswered/wrong items first, compact progress summary.

5. Consider export/import/reset helpers for progress if the child uses multiple devices.
   - Not needed yet, but could matter after more subjects.

6. Keep verification terminal-first.
   - Avoid repeated browser automation.
   - Prefer `curl`, JSON parsing, `node --check`, and live URL polling.

## Commands for the next regular subject change

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
curl -L -s -H 'Cache-Control: no-cache' "$base/data/sets.json" | python3 -m json.tool | head
curl -L -s -H 'Cache-Control: no-cache' "$base/sw.js" | head -1
curl -L -s -o /tmp/new-set.json -w '%{http_code} %{size_download}\n' "$base/data/<new-set>.json"
```

## Notes / cautions

- Link-preview thumbnails can be cached by KakaoTalk/other messengers. A correct `og:image` may not update instantly after first share.
- When adding subjects, generated card ids should be stable and unique within each set.
- If a set file name changes, update both `data/sets.json` and `sw.js` `ASSETS`.
- For future PWA cache changes, current cache is `jianstudy-v6`; next cache should be `jianstudy-v7`.
- Keep source photos/PDFs out of the public repo unless the user explicitly asks otherwise.
