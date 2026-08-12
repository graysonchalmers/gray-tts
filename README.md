# gray-tts
Simple Chrome TTS extension

## Version
1.5 (2026-08-12 03:15)

Chrome's manifest `version` field only accepts dot-separated integers, so it can't hold a
timestamp. The human-readable build stamp lives in `manifest.json`'s `version_name` field
instead — visible in `chrome://extensions` and in the popup footer, which reads it live from
the manifest so it can never go stale on its own. Bump both together on every meaningful
change: `version` gets a normal bump, `version_name` becomes `"<version> (<local date> <local time>)"`.

## Change Notes
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