# gray-tts
Simple Chrome TTS extension

## Version
1.13 (2026-08-14 03:07)

Chrome's manifest `version` field only accepts dot-separated integers, so it can't hold a
timestamp. The human-readable build stamp lives in `manifest.json`'s `version_name` field
instead — visible in `chrome://extensions` and in the popup footer, which reads it live from
the manifest so it can never go stale on its own. Bump both together on every meaningful
change: `version` gets a normal bump, `version_name` becomes `"<version> (<local date> <local time>)"`.

## Change Notes
- 2026-08-14: **"Save as audio clip" moved from the right-click context menu to a popup
  button.** Right-click now shows a single "Read with GrayTTS" item — no submenu, since
  Chrome/Edge only nests an extension's items into a flyout when there are 2 or more
  top-level ones. The popup gained a "🎙 Save as audio clip" button (below the Pause/Stop
  row) that grabs the active tab's current text selection the same way the hotkey already
  does, then runs through the exact same capture flow as before. Selecting nothing before
  clicking it shows an inline error in the popup; every other failure (capture already in
  progress, picker cancelled, etc.) still uses the existing toolbar badge. Full design:
  `docs/superpowers/specs/relocate-save-clip-to-popup.md`.
- 2026-08-14: The bottom-center word overlay (v1.8) is now **clickable** — clicking it
  pauses speech (the word turns red and freezes on the last word shown), clicking again
  resumes. Fully in sync with the popup's existing Pause/Resume button in both directions:
  pausing via the overlay updates the popup's button label, and pausing via the popup turns
  the overlay red too, since both now drive and reflect the same `chrome.tts` pause/resume
  state in `background.js`. No change to the separate in-page CSS Custom Highlight, which
  already freezes naturally during a pause. Full design:
  `docs/superpowers/specs/clickable-overlay-pause.md`.
- 2026-08-13: Added **"Save as audio clip"** — a new right-click context-menu item next to "Read with GrayTTS" that records the spoken selection as a downloaded `.webm` file. Since `chrome.tts` hands speech straight to the OS TTS engine with no access to the raw audio buffer, this works by capturing system audio via `getDisplayMedia({audio: true})` while the selection is read aloud — hosted in a new `chrome.offscreen` document (reason `DISPLAY_MEDIA`), since the MV3 service worker in `background.js` has no document context of its own to call `getDisplayMedia`/`MediaRecorder` from. Auto-downloads with a filename like `graytts-clip-2026-08-13-142201-the-quick-brown-fox.webm` (timestamp + first 4 words of the selection) once the reading finishes; falls back to a timestamp-only filename for symbol-only/non-Latin selections. Every failure path (picker cancelled, wrong picker choice, a capture already in progress, a `chrome.tts` error mid-capture) shows the existing toolbar error badge rather than failing silently. Full design: `docs/superpowers/specs/save-audio-clip.md`. Chrome's screen-share picker can't be bypassed or remembered, so every clip save requires clicking through "Entire Screen" + the audio checkbox — a hard platform constraint, not a bug.
- 2026-08-12: Added **read-along highlighting** — the word `chrome.tts` is currently speaking
  is now highlighted live on the page for right-click/hotkey reads (not the popup's Preview,
  which has no source page). Uses the CSS Custom Highlight API (`CSS.highlights` + `Highlight`,
  declared via a new `content.css` in `manifest.json`'s `content_scripts`) rather than wrapping
  spoken text in new DOM elements, so it never mutates the page's DOM tree — safe on
  framework-heavy pages (React, etc.) that re-render and would otherwise wipe out or duplicate
  injected wrapper spans. `background.js` relays each `chrome.tts` `'word'` event's
  `charIndex`/`length` to the source tab; `content.js` maps those offsets onto the actual
  selection `Range` by walking its text nodes (handles a spoken word split across inline
  markup, e.g. `<b>`, correctly). Degrades silently (no highlight, no error) if the API isn't
  supported. Verified against a live DOM in the Browser pane, including a word split across a
  `<b>` boundary and an intentionally-overrun `length` value.
- 2026-08-12: Added **Resume** and **Stop** buttons next to Pause (`chrome.tts.resume()` /
  `chrome.tts.stop()`). Previously there was no way to resume a paused read or forcibly stop
  one from the popup.
- 2026-08-12: Fixed a bug in the per-language migration added earlier the same session: the
  legacy flat settings shape was migrated into a bucket keyed `''` (All languages) regardless
  of which language filter was actually active, so anyone with a language filter set lost their
  saved voice/rate/pitch/volume on first load after the update. Also: the migrated shape is now
  persisted back to storage immediately (previously only happened once a control was touched),
  and `background.js` now falls back to reading the legacy flat fields directly if the popup
  hasn't migrated storage yet — closing a window where right-click/hotkey speech would silently
  fall back to the system default voice. Caught by a second pair of eyes before it reached
  Grayson; regression-tested with a standalone Node script (not committed — throwaway).
- 2026-08-12: Voice/rate/pitch/volume are now remembered **per language** (keyed by the
  Language filter), instead of one global set. Switching the filter now recalls what you last
  used for that language instead of carrying over whatever was picked for the previous one.
  Existing single-bucket settings are migrated automatically into the "All languages" bucket
  on first load, so no one loses their current voice pick.
- 2026-08-12: chrome.tts failures are no longer silent. A `chrome.tts.speak()` error now shows
  a red badge on the toolbar icon (with the error in the tooltip, auto-clearing after ~8s or on
  the next successful speak) and, for the popup's Preview button specifically, an inline error
  message under the button.
- 2026-08-12: Visual pass on the popup — grouped the controls into labeled sections (Voice,
  Sliders, Actions), added a status badge, styled the sliders/buttons/dropdowns, and gave the
  Preview button an icon. No functional changes; all element IDs and `popup.js` logic are
  unchanged.
- 2026-08-12: Added a language filter dropdown above the voice list in the popup, since
  `chrome.tts.getVoices()` returns every installed system voice unfiltered (long list). The
  filter persists across popup opens like the other TTS settings.
- 2026-08-12: Replaced ResponsiveVoice with the native `chrome.tts` API. ResponsiveVoice played
  audio by fetching from `responsivevoice.org` inside the content script, which inherits the
  host page's Content Security Policy — CSP-strict sites (GitHub, etc.) silently blocked the
  audio load with no visible error. `chrome.tts` speaks natively via the OS/browser TTS engine
  from the background service worker, so it's never subject to a page's CSP. Also fixed
  background.js caching `ttsSettings` in a variable that reset to `{}` every time the MV3
  service worker respawned (~30s idle), silently losing the selected voice/rate/pitch/volume.
  Removed responsivevoice.js and rv-config.js (no longer used).
- 2026-08-11: Fixed popup.html never loading responsivevoice.js (popup threw on open), an
  undeclared `previewing` variable in popup.js, and background.js calling responsiveVoice
  from the MV3 service worker (no window/document there) instead of relaying to the content
  script. Added the version_name build stamp described above.
- 2023-08-02: Initial release