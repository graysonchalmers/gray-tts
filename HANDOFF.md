# 🧭 Session Handoff — Tool-GrayTTS (GrayTTS)

_Last updated: 2026-08-12 03:15 CT_

## 🧭 North Star
_Proposed 2026-08-12, not yet explicitly confirmed by Grayson — treat as the working filter for
new feature ideas, but re-check with him before leaning on it too heavily:_
**"Reading any selected text on any page out loud should take one keystroke and never silently
fail."** Every fix so far (CSP blocking ResponsiveVoice, MV3 service-worker resetting settings,
now the visible-failure badge) has been in service of "never silently fail" without anyone
naming it explicitly until this session.

## 🎯 Current state
GrayTTS speaks natively via `chrome.tts`. Popup got a full visual pass (grouped sections,
styled controls, status badge — commit `80d516f`) and then two backlog items were built:
1. **Per-language voice memory** — voice/rate/pitch/volume are now stored per language
   (`ttsSettings.perLang[lang]`) instead of one global bucket, keyed off the Language filter
   dropdown. Switching the filter recalls what you last used for that language. Old
   single-bucket settings auto-migrate into the `''` ("All languages") bucket on first load.
2. **Visible failure state** — a `chrome.tts.speak()` error now sets a red badge + tooltip on
   the toolbar icon (auto-clears after ~8s or on the next successful speak), and the popup's
   Preview button shows an inline red error message under itself on failure.

Current version: 1.5 (2026-08-12 03:15). Both changes are code-complete and pass `node --check`
plus a structural render check in the Browser pane preview server, but **not yet manually
verified in Edge** (needs an actual failed-voice scenario and a real language switch to
confirm end-to-end).

## 📌 Where we stopped
Just finished writing items 1 and 2 above. **Not yet committed** as of this note being written —
commit immediately after, then this section goes stale; check `git log` for the real state.

## ▶️ Next concrete step
**Verify in Edge first** (unpacked reload): confirm the per-language voice memory actually
recalls the right voice when switching the Language filter back and forth, and confirm the
error badge appears on a real failure (e.g. temporarily request a voice name that doesn't
exist, or disable a TTS engine). Then pick the next backlog item below.

## 📋 Backlog (proposed 2026-08-12, ranked)
1. ~~Voice memory per-language~~ — **done this session**.
2. ~~Visible failure state~~ — **done this session**.
3. **Read-along highlighting** — `chrome.tts.speak` supports word-boundary (`onEvent` type
   `'word'`) callbacks; highlighting the spoken word/sentence in the page would need a new
   content-script message path (background → content script → highlight span) since
   `chrome.tts` events fire in the background, not the page. Biggest lift of the five, but the
   highest-leverage feature for actual reading use rather than just reliability polish.
4. **Queue / stop control** — there's a Pause button but no visible Stop, and it's unconfirmed
   whether triggering the hotkey mid-speech interrupts or queues (`chrome.tts.speak()` defaults
   to interrupting unless `enqueue: true` is passed, so it likely already interrupts — worth
   confirming, then decide if enqueue-by-default is actually more useful for multi-selection
   reading).
5. **A backlog home** — this section, living in `HANDOFF.md`, is the backlog home for now.
   Fine as long as sessions keep getting wrapped up; if this doc balloons, consider promoting
   this section to its own `BACKLOG.md`.

## ❓ Open questions
- North Star above — confirm with Grayson it's the right one-sentence filter, or replace it.
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
