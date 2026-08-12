# gray-tts
Simple Chrome TTS extension

## Version
1.7 (2026-08-12 05:20)

Chrome's manifest `version` field only accepts dot-separated integers, so it can't hold a
timestamp. The human-readable build stamp lives in `manifest.json`'s `version_name` field
instead — visible in `chrome://extensions` and in the popup footer, which reads it live from
the manifest so it can never go stale on its own. Bump both together on every meaningful
change: `version` gets a normal bump, `version_name` becomes `"<version> (<local date> <local time>)"`.

## Change Notes
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