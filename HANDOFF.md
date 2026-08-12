# 🧭 Session Handoff — Tool-GrayTTS (GrayTTS)

_Last updated: 2026-08-12 01:15 CT_

## 🎯 Current state
GrayTTS now speaks natively via `chrome.tts` instead of ResponsiveVoice's remote-audio
approach. Both the popup Preview button and the right-click "Read with GrayTTS" context menu
(plus the Ctrl+Shift+Y hotkey) are confirmed working — including on CSP-strict sites like
GitHub, which is exactly what broke under the old ResponsiveVoice approach. The popup now has
a Language filter dropdown above the Voice list so the (large, OS-supplied) voice list is
easier to work with; the filter persists across popup opens like the other TTS settings.
Current version: 1.3 (2026-08-12 01:04).

## 📌 Where we stopped
All changes are made and manually verified in Edge (unpacked load), but **uncommitted** —
about to make the wrap-up commit now. Nothing is pushed to GitHub yet.

## ▶️ Next concrete step
Grayson wants a **UI pass on the popup** — his words: "a bunch of the voices came out sounding
the same" (likely just OS/Edge TTS engine limitation, not much to fix code-side) and the popup
itself could use visual polish (it's plain unstyled HTML controls right now — see `styles.css`,
which is barely used). Alternatives:
- Quick win: sort/group the voice dropdown by quality or mark "Natural"-tier voices if the
  `chrome.tts.getVoices()` metadata exposes anything like that (some platforms return
  `remote`/`extensionId`/quality hints) — worth checking before assuming it's not possible.
  Also: right now the language filter list dumps raw BCP-47 codes through
  `Intl.DisplayNames`, which is decent already — the visual pass is really about `styles.css`,
  not data.
- Bigger lift: give popup.html real layout/styling (spacing, grouped sections, maybe a search
  box on top of the language filter for the voice list itself).

## ❓ Open questions
- Does Grayson want the "many voices sound the same" issue investigated further (e.g. is it a
  Windows/Edge TTS engine limitation, or are duplicate voice entries actually distinct)? He
  said he's fine with it for now ("I love what we got") — treat as low-priority unless raised
  again.
- No test/build tooling exists for this project (it's a plain unpacked MV3 extension, no
  bundler) — confirm that's intentional before adding any tooling.

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
