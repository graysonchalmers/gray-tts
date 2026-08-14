# Spec — Clickable word-overlay pause/play (backlog item 9)

_Written: 2026-08-14. Design locked via `brainstorming` session, approved by Grayson. Not yet
built. Scoped to the browser extension only — the desktop companion
(`Util-GrayTTS-Desktop`) equivalent is a separate, later brainstorming pass in that project's
own repo (it currently has no pause/resume concept at all)._

## Problem

The word overlay (bottom-center single-word display, built in v1.8) is currently
`pointer-events: none` and purely passive. Grayson wants to click it to pause speech —
freezing the current word and turning it red — and click again to resume, as a second,
more discoverable way to pause/resume beyond the popup's existing Pause/Resume button.

## Scope

Right-click/hotkey reads only — same scope as the overlay itself (anywhere a `tabId` is
known and `showOverlay` is on). Preview has no source tab and no overlay, so it's
unaffected, same as today.

## Behavior

- Clicking the overlay while speech is active pauses it (`chrome.tts.pause()`), the
  overlay's word text turns **red**, and the overlay freezes on the last word shown
  (stops updating — no more `'word'` events fire during a pause anyway).
- Clicking the overlay again resumes speech (`chrome.tts.resume()`), the text reverts to
  **white**, and word-swap updates resume normally.
- The overlay shows `cursor: pointer` on hover at all times (while visible), signaling it's
  interactive.
- **State is fully shared with the popup's existing Pause/Resume button** — not a separate,
  independent toggle:
  - Pausing via the overlay updates `speechState` in `chrome.storage.session` exactly like
    the popup button does today, so the popup's button label flips to "Resume" automatically
    (no popup-side changes needed — it already listens via `storage.onChanged`).
  - Pausing via the popup button must now also turn the overlay red and freeze it, and
    resuming via the popup must revert it — this is the one genuinely new piece of wiring,
    since today `background.js` only writes `speechState` to storage and never tells the
    content script that a pause/resume happened.
- The in-page CSS Custom Highlight (the separate "Highlight word on page" feature) is
  **unchanged** by this feature — it already implicitly freezes on the last word during a
  pause (no more `'word'` events to update it) and needs no new pause-awareness of its own.

## Data flow

Reuses the existing `pause`/`resume` runtime messages (already sent by the popup button) for
the overlay's click — no new inbound message type. Adds one new outbound relay from
`background.js` to the content script, since nothing today tells a tab that speech was
paused/resumed:

1. **`content.js`**: overlay host's shadow-root div gets a `click` listener. Tracks a local
   `overlayPaused` boolean (starts `false`, reset to `false` whenever the overlay is hidden by
   `clear_highlight` — a fresh read always starts unpaused). On click:
   - if `!overlayPaused`: `chrome.runtime.sendMessage({message: 'pause'})`
   - if `overlayPaused`: `chrome.runtime.sendMessage({message: 'resume'})`

   Does **not** flip `overlayPaused` or change styling itself on click — that only happens
   when the new `speech_paused`/`speech_resumed` message actually arrives (step 3 below), so
   the overlay's visual state always reflects confirmed `chrome.tts` state, never an
   optimistic guess. (If `chrome.tts.pause()` were to silently fail for some reason, the
   overlay simply wouldn't change — consistent with this project's existing "fail silently,
   don't lie about state" pattern elsewhere in `content.js`.)

2. **`background.js`**: `chrome.tts.onEvent`'s existing handlers for `event.type === 'pause'`
   and `event.type === 'resume'` (which already call `setSpeechState(...)`) each add one new
   line: if the current utterance's `tabId` is defined, relay to that tab —
   ```js
   } else if (event.type === 'pause') {
       setSpeechState('paused');
       if (tabId !== undefined) chrome.tabs.sendMessage(tabId, {message: 'speech_paused'});
   } else if (event.type === 'resume') {
       setSpeechState('speaking');
       if (tabId !== undefined) chrome.tabs.sendMessage(tabId, {message: 'speech_resumed'});
   }
   ```
   `tabId` here is whatever's already in scope for the current utterance in this handler
   (same variable the existing `'word'`/`'end'` branches use) — no new state to track.
   Fire-and-forget, same as every other `chrome.tabs.sendMessage` call in this file (errors
   ignored if the tab/content-script is gone).

3. **`content.js`**: two new handlers alongside the existing `highlight_progress` /
   `clear_highlight` cases in the message listener:
   ```js
   } else if (request.message === 'speech_paused') {
       overlayPaused = true;
       setOverlayPausedStyle(true);
   } else if (request.message === 'speech_resumed') {
       overlayPaused = false;
       setOverlayPausedStyle(false);
   }
   ```
   `setOverlayPausedStyle(paused)` toggles the shadow-root div's text color between red
   (paused) and white (default) on the existing overlay element — no new element, no
   recreate. Both handlers are no-ops if the overlay host doesn't exist yet (e.g. message
   arrives before any read has happened this page load) — same defensive pattern as
   `clearHighlight()` today.

## Rendering changes (`content.js`)

- Shadow-root div: add `cursor: pointer` to its inline style block (only meaningful while the
  host is visible; harmless while hidden).
- Add a `click` listener on the div (not the host, so hit-testing matches the visible box
  exactly) at creation time, once, same lifecycle as the div itself.
- `setOverlayPausedStyle(paused)`: sets `div.style.color = paused ? '#ff5555' : '#fff'`
  (exact red shade not critical, pick something legible against the existing
  `rgba(20,20,24,0.9)` background — `#ff5555` is a reasonable default, adjust on sight during
  manual verification if it reads poorly).
- `overlayPaused` resets to `false` inside `clearHighlight()` (already runs on
  `end`/`interrupted`/`cancelled`/`error`, and now also implicitly whenever a fresh read
  starts, since `speak()` always stops any prior utterance first) — ensures a new read never
  inherits a stale "paused" look.

## Out of scope / explicitly not doing

- No change to the in-page CSS Custom Highlight — it already freezes naturally during a
  pause via the absence of further `'word'` events.
- No change to the popup's Pause/Resume button itself — it already works and already reflects
  shared state via `storage.onChanged`.
- No animation/transition on the red color change — instant swap, consistent with the
  overlay's existing "no animation" decision from the original word-overlay spec.
- Desktop companion equivalent — separate future item, own repo, own brainstorming session
  (desktop currently has no pause/resume concept; see `Util-GrayTTS-Desktop`'s `HANDOFF.md`
  for its deliberate one-hotkey-interrupt design decision, which this feature would need to
  revisit there).

## Testing plan

1. Throwaway static test page in the Browser pane first (same approach as the original
   overlay feature) — verify the click handler, red/white color swap, and cursor style
   without needing a real loaded extension.
2. Real verification in a loaded Edge extension, alongside (or as an extension of) the
   already-pending v1.11 Edge checklist:
   - Click overlay while speaking → turns red, freezes on last word, speech actually pauses
     (confirm via listening), popup (if opened) shows "Resume".
   - Click again → reverts to white, resumes updating, speech actually resumes.
   - Pause via the popup's Pause button (not the overlay) → overlay independently turns red.
   - Resume via the popup's Resume button → overlay independently reverts to white.
   - Start a fresh read while a previous one is paused (existing v1.9 override behavior) →
     overlay is not stuck red from the prior read.
   - Confirm Preview is unaffected (no overlay exists, nothing to click).
   - Confirm `showOverlay` off still means nothing is clickable (overlay isn't rendered).

## Version bump

Next available version after whatever's shipped by the time this is built (currently 1.11,
pending v1.11's own Edge verification and push) — follow this project's existing convention
(see `README.md` "Version" section).
