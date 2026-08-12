# Spec — Word Overlay (RSVP/karaoke-style single-word display)

_Written: 2026-08-12. Design locked via `brainstorming` session, not yet confirmed as final
by Grayson (last open item: "does this close it out, or anything to adjust?"). Not yet built._

## Problem

GrayTTS already highlights the currently-spoken word in-page via the CSS Custom Highlight API
(read-along highlighting, v1.7). Grayson wants a second, independent way to follow along: a
big, bold single-word display fixed to the bottom-center of the viewport — RSVP/karaoke style —
that works even when the source text is small, off-screen, or hard to visually track in place.

## Scope

Right-click/hotkey reads only (same scope as the existing highlight — anywhere a `tabId` is
known). Preview (popup button) has no source page and is explicitly out of scope, same as
today's highlighting.

## Settings

Two independent checkboxes in `popup.html`, in a **new `<section class="group">`** placed
between the existing rate/pitch/volume slider group and the Enable/Disable button group:

- **"Highlight word on page"** — gates the existing CSS Custom Highlight behavior (currently
  always-on; this makes it toggleable for the first time).
- **"Show word overlay"** — gates the new bottom-center overlay.

Both default to **on** (`true`) when the key is missing from storage — existing installs keep
today's highlighting behavior and gain the overlay automatically, no migration step needed.

Storage shape: two new **top-level** boolean keys on `ttsSettings`, siblings of `lang` and
`perLang` — *not* per-language, not nested in a bucket:

```js
ttsSettings = {
  lang: "en-US",
  perLang: { ... },       // existing, unchanged
  showHighlight: true,     // new
  showOverlay: true         // new
}
```

## Data flow

1. **`popup.js`**: two new checkbox elements, read/written alongside the existing controls.
   - On load, after `chrome.storage.sync.get('ttsSettings', ...)`, set each checkbox to
     `rawSettings.showHighlight !== false` / `rawSettings.showOverlay !== false` (missing key
     → `true`).
   - `sendTTSSettings()` currently builds `{lang, perLang}` and both saves it to
     `chrome.storage.sync` and messages `background.js` with `update_tts_settings`. It must be
     extended to also include `showHighlight`/`showOverlay` in that same object, or the two new
     flags will be silently dropped on every settings save (rate/pitch/volume/voice change,
     language filter change, or an overlay checkbox toggle itself). Simplest correct approach:
     read both checkboxes' `.checked` state inside `sendTTSSettings()` and include them in the
     object passed to both `chrome.storage.sync.set` and `chrome.runtime.sendMessage`.
   - Each checkbox gets a `change` listener that calls `sendTTSSettings()`.

2. **`background.js`**: `speak()` already does `chrome.storage.sync.get('ttsSettings', ...)`
   before calling `chrome.tts.speak()`. Read `showHighlight`/`showOverlay` from that same
   `settings` object (default `!== false`, matching the popup's convention) and attach both as
   flags on the existing `highlight_progress` message payload sent in the `'word'` event handler
   — **no new message type**:
   ```js
   chrome.tabs.sendMessage(tabId, {
       message: 'highlight_progress',
       charIndex: event.charIndex,
       length: event.length,
       showHighlight: settings.showHighlight !== false,
       showOverlay: settings.showOverlay !== false
   }, ...)
   ```
   Same gating applies to the `clear_highlight` message sent on `'end'`/`'interrupted'`/
   `'cancelled'`/`'error'` — the overlay needs to be hidden there too, so `clearHighlight()` on
   the content-script side must clear both, unconditionally (hiding an already-hidden overlay
   is a no-op, no need to gate the clear call itself).

3. **`content.js`**: the existing `highlight_progress` handler currently always calls
   `highlightProgress(charIndex, length)`. Change it to gate that call on `request.showHighlight`
   and add a new call gated on `request.showOverlay`:
   ```js
   } else if (request.message === 'highlight_progress') {
       if (request.showHighlight) highlightProgress(request.charIndex, request.length);
       if (request.showOverlay) renderOverlay(request.charIndex, request.length);
   }
   ```
   `renderOverlay` needs the spoken word's text, not just its position. Reuse `getSubRange()`
   (already computes the `Range` for `charIndex`/`length` against `activeRange`) and take
   `subRange.toString()` as the word text — do not duplicate the offset-mapping logic.

## Rendering (`content.js`)

New `renderOverlay(charIndex, length)` function:

- Resolve the word text via `getSubRange(activeRange, charIndex, length)` → `.toString()`. If
  `activeRange` is null or the sub-range can't be resolved, skip silently (same failure mode as
  `highlightProgress` today).
- Lazily create a **Shadow DOM** host element on first use (module-level variable, created once
  per content-script lifetime, same reasoning as the CSS Custom Highlight choice for the
  in-page highlight: isolates from host-page CSS, matters on framework-heavy pages like
  Gemini). Append the host to `document.body` once; do not recreate it on every word.
- Host element positioning: `position: fixed; bottom: 20px; left: 50%; transform:
  translateX(-50%); pointer-events: none; z-index: 2147483647` (max safe z-index, to sit above
  virtually any page content) set directly on the host element's inline style (not inside the
  shadow root, so it's unaffected by shadow content).
- Inside the shadow root, a single `<div>` styled as:
  - `background: rgba(20, 20, 24, 0.9)`
  - `border-radius: 8px`
  - `box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4)` (drop shadow, exact values not critical)
  - `color: #fff`
  - `font-weight: bold`
  - `font-size: 22px`
  - `padding: 8px 22px`
  - `font-family: system-ui, sans-serif` (page fonts aren't reliably available/appropriate here)
- On each call, set the div's `textContent` to the resolved word and ensure the host is
  visible (e.g. toggle a `display: none` → `block`, or set it created-but-hidden until first
  word).

Hiding: fold into the existing `clearHighlight()` function (rename mentally to "clear
everything reading-related", but no need to rename the function itself) — set the overlay
host's `display` to `none` (don't remove/recreate it; cheaper and avoids re-triggering Shadow
DOM creation on every read). Runs unconditionally on `clear_highlight`, regardless of the
`showOverlay` flag's last-known value, so a mid-speech settings change can't leave a stale
overlay stuck on screen.

## Interaction with existing highlight

Overlay and in-page highlight are **independent** — both, either, or neither can be active per
the two checkboxes. Neither replaces the other; this is additive, not a mode switch. No shared
state beyond both being driven by the same `highlight_progress` message and both being cleared
by the same `clear_highlight` message.

## Out of scope / explicitly not doing

- No four-way single "highlight mode" picker — two independent checkboxes only (already decided
  during brainstorming, avoids a more complex settings shape for a two-boolean feature).
- No per-language setting for either flag — both are global.
- No Preview-button support — Preview has no source tab/page to render an overlay onto.
- No animation/transition on the overlay (word swaps instantly) — not discussed, keep it simple
  unless raised.

## Testing plan

1. Throwaway static test page in the Browser pane first (same approach used for the original
   highlight feature) — verify `renderOverlay` positioning, style, and word-swap behavior
   without needing a real loaded extension.
2. Real verification in a loaded Edge extension:
   - Both checkboxes on (default) — confirm highlight + overlay both appear and track speech.
   - Highlight off, overlay on — confirm only the overlay appears.
   - Overlay off, highlight on — confirm only the highlight appears.
   - Both off — confirm neither appears (word events still fire/no errors).
   - Confirm Preview is unaffected in all cases (no overlay, no error).
   - Confirm the overlay hides cleanly when speech ends, is stopped, or errors.

## Version bump

Next available version number after whatever's shipped by the time this is built (currently
1.7) — follow this project's existing convention (see `README.md` "Version" section).
