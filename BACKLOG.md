# 🎯 GrayTTS — North Star & Backlog

This file is the durable home for "what's next" so it doesn't get buried in
`HANDOFF.md`'s session-log churn. `HANDOFF.md` still owns session-to-session state
(where we stopped, what's uncommitted, open questions from the last session) — this
file owns the standing roadmap. Update it whenever a backlog item ships or the
ranking changes; no need to touch it just because a session ended.

## North Star
_Confirmed by Grayson 2026-08-12._

**"Reading any selected text on any page out loud should take one keystroke and never
silently fail."**

Every fix this project has needed (CSP silently blocking ResponsiveVoice, the MV3
service worker silently resetting settings, the per-language migration bug, now the
visible-failure badge) has been in service of "never silently fail" — this just names
the thread that was already there.

## Backlog (ranked)

1. ~~**Voice memory per-language**~~ — done 2026-08-12. Voice/rate/pitch/volume are
   stored per language filter instead of one global bucket. Had a shipped bug (wrong
   migration bucket key), fixed same session.
2. ~~**Visible failure state**~~ — done 2026-08-12. A `chrome.tts.speak()` error sets
   a red toolbar badge + tooltip, and the popup's Preview button shows an inline error.
3. ~~**Read-along highlighting**~~ — done 2026-08-12. Word events confirmed firing with
   a usable `charIndex` on Grayson's setup, so it got built: `background.js` relays each
   `chrome.tts` `'word'` event to the source tab; `content.js` maps the offset onto the
   captured selection `Range` and highlights it using the **CSS Custom Highlight API**
   (not DOM wrapping — never mutates the page, so it survives re-renders on
   framework-heavy pages). Only fires for right-click/hotkey reads, not the popup's
   Preview (no source page to highlight on). Offset-mapping logic verified against a
   live DOM (including a word split across inline markup) — not yet tested in the real
   loaded extension. See `README.md` change notes for full detail.
4. ~~**Queue / stop control**~~ — done 2026-08-12. Added `Resume` and `Stop` buttons
   next to `Pause`, as three independent one-shot buttons (not a stateful toggle,
   since the popup doesn't persist state across opens).
5. ~~**A backlog home**~~ — done 2026-08-12: this file.

6. ~~**Word overlay**~~ — done 2026-08-12 (v1.8), Edge-verified 2026-08-13. Bottom-center
   Shadow-DOM box showing the current spoken word (RSVP/karaoke-style), independently
   toggleable alongside the existing highlight via two new popup checkboxes. Full spec:
   `docs/superpowers/specs/word-overlay.md`.
7. **Save spoken output to an audio file** — scoped 2026-08-13 via `brainstorming`, ready
   for planning. **Direction: system audio capture**, not a network TTS provider. A
   feasibility spike confirmed `getDisplayMedia({audio:true})` with "Entire Screen + share
   system audio" does capture Windows SAPI voice audio (what `chrome.tts` plays through).
   Architecture: a new "Save as audio clip" context-menu item, using a `chrome.offscreen`
   document (reason `DISPLAY_MEDIA`) to host the capture since `background.js`'s MV3
   service worker has no document context of its own; auto-downloads a `.webm` file via
   `chrome.downloads` when `chrome.tts` finishes speaking. Full design:
   [`docs/superpowers/specs/save-audio-clip.md`](docs/superpowers/specs/save-audio-clip.md).
   **Known hard constraint:** Chrome's screen-share picker can't be bypassed or
   remembered — every clip save requires clicking through it, even fully automated.
   A second, optional network-based TTS provider (nicer voice) was explicitly discussed
   and **deferred** — not part of this scope, would need its own design pass later.
   Next step: `writing-plans` to turn the spec into an implementation plan.
8. ~~**Desktop TTS companion (read selected text outside the browser)**~~ — done
   2026-08-13, as a sibling project: `C:\Projects-local\Util-GrayTTS-Desktop`, merged to its
   own `main`. See that project's `HANDOFF.md` for full detail; next up there is expanding
   past the 2 default Windows SAPI voices currently installed. Original scoping note below,
   kept for context. Highlight text in *any* Windows app, hit a global
   hotkey, hear it read aloud. Key insight: `chrome.tts` on Windows already delegates to
   the OS SAPI voices, so a native tool would use the exact same voices and sound
   identical to GrayTTS. Likely shape: a small **AutoHotkey script** (~20–30 lines) —
   global hotkey copies the current selection and speaks it via the SAPI COM voice
   object; lives in the tray. Note: the Windows right-click shell menu only works on
   files, not highlighted text in arbitrary apps, so the hotkey route *is* the correct
   version of the idea. Would live as a sibling `Util-*` project (e.g.
   `Util-GrayTTS-Desktop`), **not** a folder inside this repo — the extension loader
   scans every folder under the extension root.
9. ~~**Clickable word overlay as a pause/play toggle**~~ — browser-extension side built
   2026-08-14 (v1.12), pending Edge verification (see below). Clicking the overlay pauses/
   resumes speech in sync with the popup's Pause/Resume button. The desktop-companion
   equivalent (`Util-GrayTTS-Desktop`) is a separate, not-yet-scoped follow-on — that app
   currently has no pause/resume concept at all, only a one-hotkey-interrupt model.

## Edge verification status

As of 2026-08-13, Grayson confirmed backlog items 1–6 all work in a real loaded Edge
extension: word overlay (v1.8) appears on right-click reads and toggles independently
of the highlight checkbox, the v1.9 pause/resume state-aware toggle works (including a
new read overriding a paused utterance), and v1.10's popup polish (button reorder +
attribution text) reads fine. Item 8 (desktop companion) is done and verified in its
own sibling project. Item 7 (save-to-audio) is now scoped (spec at
`docs/superpowers/specs/save-audio-clip.md`) and ready for `writing-plans`, not yet built
or Edge-verified. Item 9 (clickable overlay pause/play) has its browser-extension side
built (v1.12), pending Edge verification — same status noted in the item 9 entry above.
Next additions should get appended here when a new idea comes up — this file has no
reason to go stale otherwise.
