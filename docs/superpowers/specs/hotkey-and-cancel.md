# Spec — Right-hand hotkey rebind + cancel-while-speaking (Escape and hotkey toggle)

_Written: 2026-08-14. Design locked via `brainstorming` session, approved by Grayson._

## Problem

Grayson's current hotkey (`Ctrl+Alt+S`, set via `chrome://extensions/shortcuts` — not
reflected in `manifest.json`, which still suggests the stale `Ctrl+Shift+Y` default) is
entirely left-hand. He wants a right-hand-reachable hotkey instead.

Separately, there is currently no way to cancel an in-progress read except clicking the
popup's Stop button. He wants two more ways to do it: Escape, and pressing the read hotkey
again while something is already speaking.

## Scope

Browser extension (`Tool-GrayTTS`) only. Right-click/hotkey reads and the popup's existing
Pause/Resume/Stop controls. Preview (spoken from the popup, no source tab) is unaffected by
the new cancel paths, same as it already is for the overlay/highlight.

## Behavior

### 1. Hotkey suggested default → `Ctrl+Alt+L`

- `manifest.json`'s `commands.read_selection.suggested_key.default` changes from
  `Ctrl+Shift+Y` to `Ctrl+Alt+L` — same three-key shape Grayson is already used to, moved to
  the right-hand side of the keyboard (L sits directly under the right-hand modifier
  cluster).
- This only changes what a *fresh* install suggests. Grayson's existing override lives in
  Chrome's own per-profile shortcut settings and has to be re-set by hand in
  `chrome://extensions/shortcuts` — no code path can push that for him.

### 2. Hotkey pressed while already speaking → cancel, unconditionally

- In `background.js`'s `chrome.commands.onCommand` listener (currently ~line 330), before
  doing the existing "grab the active tab's selection and call `speak()`" flow: check
  `chrome.tts.isSpeaking()`.
  - If **true** — an utterance is speaking *or* paused-but-queued — send the same `stop`
    message the popup's Stop button sends (`chrome.runtime.sendMessage`-equivalent internal
    call, or inline the `chrome.tts.stop()` the `stop` handler already does) and return.
    Do **not** touch the current selection at all, even if it changed since the last read —
    a second hotkey press always means "cancel," full stop.
  - If **false** — proceed exactly as today: capture the active tab's selection and `speak()`
    it.
- `chrome.tts.isSpeaking()` (the live browser API) is used instead of the extension's own
  `speechState` value in `chrome.storage.session`, so this can never drift out of sync with
  what `chrome.tts` is actually doing — consistent with the existing rationale for calling
  `chrome.tts.stop()` unconditionally at the top of `speak()` (see the comment there about
  paused utterances not reliably auto-interrupting).

### 3. Escape cancels, from any focused tab

- `content.js` gets a new `document`-level `keydown` listener (not scoped to the overlay
  element, so it works even before any overlay has appeared, and on tabs other than the one
  currently being read from) that sends the `stop` message whenever `event.key === 'Escape'`.
- No `preventDefault()` / `stopPropagation()` — the extension's Escape handling runs
  alongside whatever the page itself does with Escape (closing its own modal, etc.), it
  never suppresses it.
- Since `content.js` already runs on every `http(s)` page via `all_frames: true`, this needs
  no new permissions and works tab-wide immediately.
- Sending `stop` when nothing is speaking is a harmless no-op (`chrome.tts.stop()` with
  nothing queued does nothing) — no need to gate this on speech state first, matching how
  the popup's Stop button already behaves unconditionally.

### Interaction with clip capture

Both new cancel paths reuse the exact same `stop` message the popup's Stop button already
sends, so `chrome.tts.stop()` handles all of it through the single existing code path —
including cleanly aborting an in-progress "Save as audio clip" capture, since that already
listens for the `end`/`interrupted`/`cancelled` `chrome.tts` event and tears down the
capture accordingly. No new special-casing needed for clip capture.

## Out of scope

- Changing the popup's Pause/Resume/Stop buttons themselves.
- Any change to the read-along highlight/overlay visuals.
- The desktop companion (`Util-GrayTTS-Desktop`) — it has its own, separate cancel/pause
  story and is not touched by this spec.

## Testing

Manual, in an actual loaded Chrome window (this extension has no automated test suite):

1. Set the new hotkey to `Ctrl+Alt+L` in `chrome://extensions/shortcuts`.
2. Select text on a page, press the hotkey → speech starts as before.
3. While it's speaking, press the hotkey again → speech stops immediately; nothing new
   starts, even if a different selection is active.
4. While it's speaking, select different text, press the hotkey → per the "always cancel"
   rule, this still just stops the current read (does not start reading the new selection).
5. Start a read, press Escape → speech stops.
6. Start a read on Tab A, switch focus to Tab B (also running the extension's content
   script), press Escape there → speech started from Tab A stops.
7. Press Escape with nothing speaking → no error, nothing visibly happens.
8. Start a "Save as audio clip" capture, press Escape mid-capture → capture aborts cleanly
   (same as clicking Stop already does today).
