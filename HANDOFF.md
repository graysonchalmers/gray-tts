# 🧭 Session Handoff — Tool-GrayTTS (GrayTTS)
_Last updated: 2026-10-25 · handoff split; history archived_

## 🎯 Current state
- Plain unpacked MV3 browser extension (Edge/Chrome), speaks via `chrome.tts`. No bundler, no build or test tooling (intentional). Roadmap lives in [`BACKLOG.md`](BACKLOG.md) (North Star Grayson-confirmed); check it before new feature work.
- Version **1.14** on `main`, pushed (`d44c243` as of 2026-08-14). Backlog items 1-9 built. v1.8-v1.13 are Edge-verified; **v1.14 is NOT Edge-verified** (pushed ahead of verification on an explicit one-off `/github-push`, not a standing policy).
- v1.14: hotkey default `Ctrl+Alt+L` (manifest suggestion only; the real binding is per-profile in `edge://extensions/shortcuts` and must be set by hand); shared `stopSpeech()` helper; hotkey while speaking/paused always cancels (via `chrome.tts.isSpeaking()`); capture-phase Escape listener in `content.js` sends `stop` from any tab. Spec `docs/superpowers/specs/hotkey-and-cancel.md`, plan `docs/superpowers/plans/2026-08-14-hotkey-and-cancel.md`.
- Features in place: per-language voice memory (`ttsSettings.perLang[lang]`), error badge + inline preview error, one state-aware Pause/Resume toggle, Stop, read-along highlight, bottom-center word overlay (clickable pause/play, v1.12), save-as-audio-clip (popup button), `all_frames: true` content script (iframed pages like Streamlit), native selection cleared on read start via `captureAndClearSelectionRange()` (report-only `captureSelection()` has no side effects), single-item right-click menu "Read with GrayTTS".
- Design traps: per-utterance `speakSeq`/`mySeq` token (tabId alone cannot tell same-tab rereads apart); keep selection capture split report-only vs capture-and-clear; design around framework-heavy host pages (capture-phase listeners, Shadow DOM overlay).
- Right-click read while speaking still interrupts and reads the new selection (by design; "always cancel" applies only to the hotkey).

## 📌 Where we stopped
v1.14 is code-complete and reviewed clean, pushed, but never run in a loaded Edge extension. Manual check list (10):
1. Set hotkey `Ctrl+Alt+L` in `edge://extensions/shortcuts`, reload unpacked extension; select text, press it: speech starts.
2. Press again while speaking: stops.
3. While speaking, select different text, press hotkey: just stops, does not read new text.
4. Pause in popup, press hotkey: cancels (tests that `isSpeaking()` is true while paused).
5. Start a read, press Escape: stops.
6. Read on Tab A, Escape on Tab B: Tab A stops.
7. Escape with nothing speaking: nothing happens; existing error badge stays.
8. Save-as-audio-clip, Escape mid-capture: partial clip downloads.
9. Kill the service worker mid-read, press Escape: overlay/highlight still clears.
10. Regression: popup Stop/Pause/Resume and right-click read unchanged.

## ▶️ Next concrete step
1. Run the 10-check list above in real Edge; nothing should be built on v1.14 until it passes.
2. Desktop companion (`Util-GrayTTS-Desktop`, separate project and session): check its own HANDOFF/memory first (unfixed cloud-voice word-fragmentation bug is higher priority). Then brainstorm the center-anchored caption redesign (active word centered, sentence streaming right) and port the browser pause/play improvements (needs real pause/resume designed there first).
3. Lower priority: confirm the first `_Backup\` run to V: (unverified; V:/Moby was unreachable when written).

## ❓ Open questions
- Desktop companion: port browser improvements and caption redesign (confirmed wanted, unscoped).
- Parked minor findings: stale-extension-context Escape logs an uncaught console error; hotkey-cancel is gated by `extensionEnabled` while Escape/Stop are not; spec/README overstate "any tab" scope (excludes `chrome://` pages and popup Preview); Escape listener still swallowable by a page capture listener using `stopImmediatePropagation`; selection could change between popup save-clip `get_selection` and `capture_selection_range` while the share picker is open.
- What prompted v1.10 (`532bc60`, button reorder and attribution text)? Unlogged, low stakes.
- "Many voices sound the same": low priority unless raised again.
- Unrelated tangent from 2026-08-14: osmbench.streamlit.app is a Streamlit app; the Portfolio site is static Vite on Cloudflare Pages. Belongs to OSM-bench/Portfolio, not here.

## 🗂️ Changed this session
- Split oversized handoff; full prior text in handoff-log/archive/HANDOFF-snapshot-2026-10-25.md

---
📜 Full session history: handoff-log/ (archive/ holds the pre-split snapshot)
