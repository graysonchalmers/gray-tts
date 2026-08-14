# Spec — Clear native selection when a read starts

_Written: 2026-08-14. Design confirmed via `brainstorming`, approved by Grayson. Not yet built._

## Problem

After right-click → "Read with GrayTTS" (or the hotkey), the browser's own native text
selection (blue highlight) stays visible over the just-read words. This visually covers
GrayTTS's own read-along CSS Custom Highlight, so the word-by-word highlight isn't visible
until the user clicks elsewhere on the page to clear the native selection.

## Behavior

`content.js`'s `captureSelection()` clears the live `window.getSelection()` immediately
after cloning it into `activeRange`, for both callers:

- The right-click flow's `capture_selection_range` message (sent as `speak()` starts in
  `background.js`).
- The hotkey flow's `get_selection` message.

Right-click reading is unaffected functionally — the spoken text already came from Chrome's
native `info.selectionText` at click time, captured independently of this content-script
call. Clearing the visual selection only removes the now-redundant native highlight so
GrayTTS's own highlight/overlay is visible immediately instead of being hidden underneath it.

## Data flow / implementation

In `content.js`'s `captureSelection()`:

```js
function captureSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        activeRange = sel.getRangeAt(0).cloneRange();
        const text = sel.toString();
        sel.removeAllRanges();
        return text;
    }
    activeRange = null;
    return '';
}
```

`sel.toString()` is captured into a local variable before `removeAllRanges()` runs, since
clearing the selection empties `sel.toString()` too — the function must return the actual
selected text, not an empty string.

## Out of scope / explicitly not doing

- No change to the Preview button's flow (popup) — it has no page selection to clear.
- No change to which messages trigger `captureSelection()` — this only changes what the
  function does internally.

## Testing plan

Manual, in a loaded Edge extension (no automated coverage, consistent with this whole
project): select text on a normal page, right-click → Read → confirm the native blue
selection disappears immediately and the read-along highlight/overlay are visible without
needing to click elsewhere first. Repeat via the hotkey. Confirm "Save as audio clip" still
works (still reads Chrome's native `info.selectionText`, unaffected by this change).
