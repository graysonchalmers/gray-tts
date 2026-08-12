# 🧭 Session Handoff — Tool-GrayTTS (GrayTTS)

_Last updated: 2026-08-12 05:20 CT_

## 🧭 North Star & Backlog
Moved to [`BACKLOG.md`](BACKLOG.md) — that's now the durable home for the roadmap so it
survives session-log churn here. Check it before starting new feature work.

## 🎯 Current state
GrayTTS speaks natively via `chrome.tts`. Popup got a full visual pass (commit `80d516f`), then
three backlog items were built:
1. **Per-language voice memory** — voice/rate/pitch/volume stored per language
   (`ttsSettings.perLang[lang]`), keyed off the Language filter dropdown. Switching the filter
   recalls what you last used for that language. Old single-bucket settings auto-migrate on
   first load.
2. **Visible failure state** — a `chrome.tts.speak()` error sets a red badge + tooltip on the
   toolbar icon, and the popup's Preview button shows an inline red error on failure.
2b. **Migration bug fix** (found by advisor review before Grayson ever saw it) — the legacy
   settings shape was migrating into the wrong bucket key (always `''` instead of whatever
   language filter was active), which meant anyone with a language filter already set would
   have silently lost their saved voice on first load. Also fixed: migration wasn't being
   persisted immediately, and `background.js` had no fallback for reading the still-legacy
   shape, so right-click/hotkey speech could fall back to the system default voice before the
   popup was ever reopened. Regression-tested with a standalone Node script covering the exact
   repro case (see `README.md` change notes) — not committed, was throwaway.
4. **Stop / Resume controls** — added `Resume` (`chrome.tts.resume()`) and `Stop`
   (`chrome.tts.stop()`) buttons next to the existing `Pause`. Popup is ephemeral (no state to
   sync across opens), so these are separate one-shot buttons rather than a stateful toggle —
   deliberately avoids the fragility a Pause/Resume toggle would need.

Grayson confirmed on his setup the service worker console showed real `'word'` events with
`charIndex` values, so backlog item #3 (**read-along highlighting**) got built: the currently-
spoken word is now highlighted live on the page for right-click/hotkey reads, using the CSS
Custom Highlight API (no DOM mutation — safe on React-heavy pages like Gemini, which is
literally where this session's false-alarm `rvApiKey` scare happened — see below). Full
technical detail in `README.md`'s change notes; ranking/status in `BACKLOG.md`.

Also this session: Grayson saw an `Uncaught ReferenceError: rvApiKey is not defined` error on
`gemini.google.com` pointing at `responsivevoice.js` — alarming since that file was removed
back in the `chrome.tts` migration. Traced it to a **false alarm**: confirmed via Edge's Secure
Preferences that the extension loads from the correct, current `C:\Projects-local\Tool-GrayTTS`
folder (no responsivevoice.js anywhere on it), and the actual cause was a stale DevTools
console entry (likely "Preserve log") that survived an extension reload + tab refresh. Clearing
the console and hard-refreshing confirmed it's gone. Not a regression, no code changed for this.

Current version: 1.7 (2026-08-12 05:20). Grayson confirmed 2026-08-12 that per-language voice
memory, the error badge, and Resume/Stop all work in a real loaded Edge extension (general
check, not scenario-by-scenario). Read-along highlighting is code-complete and its offset-mapping
logic is verified against a live DOM (including a word split across a `<b>` tag and an overrun
length value — see README) — but **not yet tested in the real extension on a real page**.

## 📌 Where we stopped
Just finished building read-along highlighting. Not yet committed as of this note — check
`git log` for the real state.

## ▶️ Next concrete step
Verify read-along highlighting in Edge: select a paragraph on a real page, right-click → "Read
with GrayTTS" (or the hotkey), and confirm the currently-spoken word gets visually highlighted
and the highlight clears cleanly at the end / on Stop. Worth trying on both a plain page and a
JS-heavy one (Gemini, since that's already open) to make sure a re-rendering page doesn't break
it — the whole point of using the CSS Highlight API instead of DOM wrapping was to survive that.

## ❓ Open questions
- North Star (in `BACKLOG.md`) — confirm with Grayson it's the right one-sentence filter.
- Does Grayson want the "many voices sound the same" issue investigated further (e.g. is it a
  Windows/Edge TTS engine limitation, or are duplicate voice entries actually distinct)? He
  said he's fine with it for now ("I love what we got") — treat as low-priority unless raised
  again.
- No test/build tooling exists for this project (it's a plain unpacked MV3 extension, no
  bundler) — confirmed intentional enough to not touch; a `.claude/launch.json` was added this
  session purely to preview `popup.html`'s static rendering in the Browser pane, not as a test
  harness.

## 🗂️ Changed this session
- Branch: `main` · Files: `background.js`, `content.js`, `popup.html`, `popup.js`,
  `manifest.json`, `README.md` · Removed: `responsivevoice.js` (and untracked `rv-config.js`,
  deleted, never committed)
- **Decision:** Dropped ResponsiveVoice entirely in favor of `chrome.tts` (the native
  browser/OS TTS API). Why: ResponsiveVoice fetched audio from `responsivevoice.org` inside
  the content script, which inherits the host page's Content Security Policy — CSP-strict
  sites (GitHub confirmed) silently blocked the audio load with **no visible error**, which is
  what made this bug so hard to pin down. `chrome.tts` speaks from the background service
  worker with no remote fetch, so it's immune to page CSP entirely. Bonus: much less code
  (content.js dropped from a speak_text handler to a 4-line get_selection responder).
- **Decision:** `background.js`'s `speakInTab`/`speak` now reads `ttsSettings` fresh from
  `chrome.storage.sync` on every call instead of trusting the in-memory `ttsSettings`
  variable. Why: MV3 service workers get torn down after ~30s idle and respawn fresh on the
  next event, silently resetting that variable to `{}` — this was actively causing "select
  text, right-click, nothing happens, no error" before the CSP issue was even found.
- **Decision:** Added `langFilterSelect` to popup, using `Intl.DisplayNames` for
  human-readable language labels, persisted to `ttsSettings.lang` in `chrome.storage.sync`.

---

## 🕓 Session log
### 2026-08-12 (part 6) — Read-along highlighting, and a false-alarm rvApiKey scare
- Grayson reported `Uncaught ReferenceError: rvApiKey is not defined` on `gemini.google.com`,
  pointing at `extensions://<id>/responsivevoice.js` — alarming since that file was removed in
  the `chrome.tts` migration two sessions ago. Investigated methodically rather than assuming:
  confirmed via `git log`/filesystem that no copy of `responsivevoice.js` exists in the repo;
  searched common local folders for stray copies (none found); then read Edge's own
  `Secure Preferences` JSON for the extension ID in the error and confirmed it's loading from
  exactly `C:\Projects-local\Tool-GrayTTS` — the correct, current folder. Ruled out a duplicate
  install. Landed on the real cause: a stale DevTools console entry (consistent with "Preserve
  log" being on) that survived an extension reload + tab refresh. Confirmed resolved after
  clearing the console and hard-refreshing. No code changes — this was a false alarm, not a bug.
- Confirmed word events fire on Grayson's setup (the diagnostic from part 3 — "looks good"),
  which unblocked backlog item #3. Built **read-along highlighting**:
  - `content.js`: captures the active selection's `Range` on demand, and maps a
    `chrome.tts` word event's `charIndex`/`length` onto that Range by walking its text nodes —
    handles a spoken word split across inline markup (e.g. `<b>`) correctly.
  - Uses the **CSS Custom Highlight API** (`CSS.highlights` + `Highlight`, via a new
    `content.css` declared in `manifest.json`'s `content_scripts`) instead of wrapping spoken
    text in new DOM elements — chosen specifically because it never mutates the page's DOM,
    which matters on a framework-heavy page like Gemini (the same page from the false alarm
    above) that could otherwise wipe out or duplicate injected wrapper spans on a re-render.
    Degrades silently if unsupported.
  - `background.js`: `speak()` now takes an optional `tabId`, sent by both the context-menu and
    hotkey call sites (not the popup's Preview, which has no source page). Relays `'word'`
    events to that tab as `highlight_progress` messages, and clears the highlight on
    `'end'`/`'interrupted'`/`'cancelled'`/`'error'`.
  - Removed the temporary diagnostic `console.log` from `background.js` now that it's answered.
  - **Verified the offset-mapping logic against a live DOM** in the Browser pane (not just
    `node --check`): built a throwaway test page with a word split across a `<b>` tag, confirmed
    `getSubRange()` correctly highlights exactly `"brown"` across that boundary, confirmed
    ordinary words and the last word in a string, confirmed an intentionally-overrun `length`
    value clamps to the end instead of dropping the highlight, and confirmed `clearHighlight()`
    actually removes it. Test file was throwaway, not committed.
  - **Not yet tested in the real loaded extension on a real page** — that's the next step.
- Bumped to 1.7.

### 2026-08-12 (part 5) — Edge verification confirmed (partial)
- Grayson said it's "working good" on his side. Asked specifically whether that covered the
  word-event diagnostic (a more technical check than the others) or just the general feel —
  it was the general feel; the diagnostic itself hadn't been checked yet at that point (it was
  confirmed working in part 6 above).
- Updated `HANDOFF.md` and `BACKLOG.md` to mark items 1/2/4 as Edge-confirmed and narrow the
  remaining open item down to just the word-event check, with clear step-by-step instructions
  for what to look for in the service worker console.

### 2026-08-12 (part 4) — Promoted the backlog to BACKLOG.md
- Pushed part 3's commit (`0770c73`) to `origin/main` on explicit request (`/github-push`),
  without confirmation the Edge verification pass had happened yet — flagged that gap in chat
  rather than blocking, since invoking the push skill directly reads as explicit "ship it".
- Asked what "next task" meant (ambiguous — could've meant doing the Edge pass, this backlog
  move, or something unrelated); Grayson picked backlog item #5.
- Created `BACKLOG.md`: North Star + ranked backlog, moved out of `HANDOFF.md` verbatim (plus a
  new "Not yet Edge-verified" section restating the four outstanding checks so they're not lost
  in the move). `HANDOFF.md` now just links to it instead of duplicating the content.

### 2026-08-12 (part 3) — Migration bug fix, Stop/Resume controls, word-event diagnostic
- Pushed part 2's commit (`418a5b7`) to `origin/main` on request.
- Asked to "keep going" on the backlog. Called `advisor` before starting #3/#4 given #3's size —
  it caught a real, already-shipped bug: `migrateSettings()` in `popup.js` always keyed the
  legacy-shape bucket as `''` regardless of the actual active language filter, so anyone with a
  filter set would load `getBucket(lang)` against a bucket that didn't exist and silently lose
  their saved voice/rate/pitch/volume. Also flagged that the migration wasn't persisted back to
  storage immediately, and that `background.js` had no fallback for the still-legacy shape
  (meaning right-click/hotkey speech could silently drop to the system default voice before the
  popup was ever reopened post-update) — exactly the failure class this project's North Star is
  about.
- Fixed all three: keyed the legacy bucket by `settings.lang || ''`; persist the migrated shape
  immediately on load; added `getSpeakBucket()` in `background.js` so it reads the legacy flat
  fields directly when `perLang` isn't present yet instead of falling back to nothing.
  Regression-tested the fix in isolation with a standalone Node script covering the advisor's
  exact repro case plus three other shapes (fresh install, already-migrated, no-filter-set) —
  all pass. Script was throwaway, not committed.
- Built backlog item #4: added `Resume` and `Stop` buttons next to the existing `Pause` in the
  popup, wired to new `resume`/`stop` messages in `background.js` (`chrome.tts.resume()` /
  `chrome.tts.stop()`, the latter also clearing the error badge). Kept them as three independent
  one-shot buttons rather than a Pause/Resume toggle, since the popup is ephemeral and has no
  reliable way to know mid-speech state across opens — advisor confirmed this was the right call.
  Verified button-row layout doesn't overflow at 320px width via the Browser pane preview.
- Advisor flagged backlog item #3 (read-along highlighting) as not safe to build blind — it needs
  `chrome.tts` `'word'` events with `charIndex`, which not all Windows/Edge SAPI voices fire, and
  the highlighting mechanism would run as a content script on every page. Added a temporary
  `console.log` diagnostic in `background.js`'s `onEvent` instead of writing the feature, so
  Grayson can answer the "does this even work here" question in ~5 minutes before any DOM code
  gets written.
- Bumped to 1.6. **None of this session's changes (parts 2 or 3) have been manually verified in
  a real loaded Edge extension yet** — flagged prominently above as the next step before
  anything else gets built on top.

### 2026-08-12 (part 2) — Popup UI pass, per-language voice memory, visible failure state
- Picked up; found the prior session's chrome.tts commit was already made and pushed (handoff
  had said "about to commit" — drift, noted and moved on).
- Did the UI pass the prior handoff flagged as next: grouped `popup.html` into labeled
  sections, added a status badge, styled sliders/buttons/dropdowns in `styles.css`. No
  functional changes. Verified structurally via a local static-file preview server
  (`.claude/launch.json`, new) since the popup can't run its real `chrome.*` calls outside an
  actual extension context — accessibility-tree read confirmed layout, computed-style check
  confirmed the new `.error` banner styling. Bumped to 1.4, committed as `80d516f`.
- Grayson asked for a North Star + five backlog items; proposed the one above and ranked five
  candidates. He picked 1 and 2 to build now, asked the rest logged here.
- Built #1 (per-language voice memory): reshaped `ttsSettings` storage from flat
  `{lang, voiceName, rate, pitch, volume}` to `{lang, perLang: {[lang]: {voiceName, rate,
  pitch, volume}}}`, with automatic migration of the old flat shape into the `''` bucket so
  existing installs don't lose their current settings. `popup.js` now applies the right
  bucket's settings whenever the language filter changes; `background.js`'s `speak()` reads
  the bucket matching the last-active language filter.
- Built #2 (visible failure state): `background.js` now sets a red toolbar badge + tooltip on
  a `chrome.tts` `'error'` event (clears on the next `'start'` event or after ~8s), and the
  popup's Preview button shows an inline red error banner (`#previewError` / `.error` in
  `styles.css`) on failure instead of failing silently.
- Bumped to 1.5. Neither change has been manually verified in Edge yet — flagged as the
  immediate next step above.

### 2026-08-12 — chrome.tts migration + voice language filter
- Picked up with two uncommitted changes already on disk (`rv-config.js` new file,
  `manifest.json`/`popup.html` wiring it in) meant to fix `Uncaught ReferenceError: rvApiKey
  is not defined` when ResponsiveVoice ran without a registered API key.
- Verified that fix worked (popup Preview spoke fine), but found a second bug via systematic
  debugging: `background.js` cached `ttsSettings` in a module-level variable that MV3 resets
  on every service-worker respawn, so right-click/hotkey speech requests went out with an
  empty voice and `responsiveVoice.speak()` silently no-op'd.
- Fixed that, retested — hit a *third*, different failure: GitHub's CSP blocked ResponsiveVoice's
  remote audio load outright (confirmed via the browser's own CSP violation message in
  DevTools). This was clearly an architectural limitation, not a one-line fix.
- Asked Grayson how to handle it; he chose to replace ResponsiveVoice with `chrome.tts`
  entirely rather than work around CSP or add an offscreen document. Rewrote
  `background.js`, `content.js`, `popup.js`, `popup.html`, `manifest.json` accordingly and
  deleted `responsivevoice.js`/`rv-config.js`. Retested — Preview and right-click both confirmed
  working, including on GitHub.
- Added the language-filter dropdown per Grayson's follow-up request (voice list from
  `chrome.tts.getVoices()` is long/unfiltered).
- Bumped `manifest.json` version 1.1 → 1.3 across the two meaningful changes, per this
  project's existing versioning convention (see README "Version" section).

### 2026-08-11 — Fix TTS pipeline for MV3 and add a live version stamp
- (Prior session, reconstructed from git log — commit `807962a`.)
