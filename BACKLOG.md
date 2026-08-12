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

6. **Word overlay** — built 2026-08-12 (v1.8), pending Edge verification. Bottom-center
   Shadow-DOM box showing the current spoken word (RSVP/karaoke-style), independently
   toggleable alongside the existing highlight via two new popup checkboxes. Full spec:
   `docs/superpowers/specs/word-overlay.md`.
7. **Save spoken output to an audio file** — requested 2026-08-12, not scoped/built.
   **Not a small add** — `chrome.tts` (chosen specifically to kill the CSP/ResponsiveVoice
   problems this project fought earlier) hands speech to the OS TTS engine directly and
   gives the extension no access to the audio bytes, so there's no "grab the buffer, save
   it" path today. Two real options, both real design decisions:
   - Add a second, optional network-based TTS provider (Google/Azure/Amazon/ElevenLabs-
     style) used only for the "save to file" path — reintroduces the exact CSP/API-key
     dependency the `chrome.tts` migration removed, so it'd need to be additive/opt-in,
     not a replacement.
   - Capture system audio via `getDisplayMedia({audio: true})` while it plays — no new
     dependency, but a heavy screen/audio-share permission prompt every time, and may not
     even work depending on how Windows routes SAPI audio to the OS mixer (unverified).
   Needs a scoping pass (probably `brainstorming`) before starting, not straight to code.
8. **Desktop TTS companion (read selected text outside the browser)** — requested
   2026-08-12, not scoped/built. Highlight text in *any* Windows app, hit a global
   hotkey, hear it read aloud. Key insight: `chrome.tts` on Windows already delegates to
   the OS SAPI voices, so a native tool would use the exact same voices and sound
   identical to GrayTTS. Likely shape: a small **AutoHotkey script** (~20–30 lines) —
   global hotkey copies the current selection and speaks it via the SAPI COM voice
   object; lives in the tray. Note: the Windows right-click shell menu only works on
   files, not highlighted text in arbitrary apps, so the hotkey route *is* the correct
   version of the idea. Would live as a sibling `Util-*` project (e.g.
   `Util-GrayTTS-Desktop`), **not** a folder inside this repo — the extension loader
   scans every folder under the extension root.

## Edge verification status

As of 2026-08-12, Grayson confirmed backlog items 1–5 work in a real loaded Edge
extension, including read-along highlighting (item 3) after trying it directly. Item 6
(word overlay) is built and needs Edge verification next. Item 7 (save-to-audio) is
logged but unscoped. Next additions should get appended here when a new idea comes up —
this file has no reason to go stale otherwise.
