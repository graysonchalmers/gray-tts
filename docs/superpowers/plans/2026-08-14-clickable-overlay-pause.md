# Clickable Word-Overlay Pause/Play Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the bottom-center word overlay clickable — clicking pauses speech (word
turns red, freezes) and clicking again resumes — fully in sync with the popup's existing
Pause/Resume button.

**Architecture:** The overlay's shadow-root `<div>` gets a `click` listener that sends the
same `pause`/`resume` runtime messages the popup's button already sends. `background.js`
gains one new piece of state — `currentSpeakingTabId`, the tab ID of whatever's currently
speaking via `speak()` — and its existing top-level `pause`/`resume` message handlers (the
ones the popup already triggers) each add one line to relay a new `speech_paused`/
`speech_resumed` message to that tab. `content.js` reacts to those two new messages by
toggling the overlay's text color, independent of whether the pause was triggered by its
own click or the popup's button.

**Tech Stack:** Plain MV3 Chrome/Edge extension JS (no bundler, no framework) — same as the
rest of this project. No new npm dependencies; the one code path with pure logic
(`clipFilename`-style) doesn't apply here, so no new Node test file is needed — this
feature is 100% `chrome.*`/DOM-driven and verified manually in a loaded extension, same as
the original word-overlay and highlight features.

## Global Constraints

- Plain unpacked MV3 extension, **no bundler/build tooling** — every change must be valid,
  directly browser-loadable JS, no `import`/`export` syntax.
- No new manifest permissions needed — this only uses `chrome.tts`, `chrome.tabs.sendMessage`,
  and `chrome.runtime.sendMessage`/`onMessage`, all already declared/used today.
- `content.js`'s overlay `<div>` currently inherits `pointer-events: none` from its host
  element (`overlayHost`), which was correct when the overlay was purely passive but would
  silently swallow the new click handler if left unchanged — **the div itself must be given
  `pointer-events: auto`** (the host stays `pointer-events: none` so nothing outside the
  visible box is clickable). This is a correction to the original word-overlay spec/build,
  found while writing this plan — not a pre-existing bug report, just a gap the original
  feature never needed to close since it was never interactive.
- **State authority correction (also found while writing this plan):** the spec drafted
  during brainstorming assumed the new tab-relay would live inside `chrome.tts.onEvent`'s
  `'pause'`/`'resume'` branches (`background.js` lines 214–217). Reading the actual code
  shows those branches are **not** where `background.js` sets `speechState` today for the
  popup's own pause/resume — the top-level `chrome.runtime.onMessage` handler's `'pause'`/
  `'resume'` branches (lines 102–112) set state immediately, with a comment explicitly
  noting that `chrome.tts`'s own `'pause'`/`'resume'` events aren't reliably fired by every
  voice/engine (the same class of gap documented for `'word'` events). The new tab-relay
  must live in that same top-level handler, for the same reliability reason, not in
  `onEvent`.
- Version bump convention (see `README.md`'s "Version" section): bump `manifest.json`'s
  `version` and `version_name` together, `version_name` becomes
  `"<version> (<local date> <local time>)"`; add a dated bullet to README's "Change Notes".
- Manual Edge verification is required before this ships — an agentic worker cannot hear
  real TTS audio or confirm visual color/cursor changes in a real browser tab. The final
  task's verification step is written as instructions for Grayson, not something the
  implementing agent completes solo.

---

### Task 1: Track the currently-speaking tab and relay pause/resume to it (`background.js`)

**Files:**
- Modify: `background.js`

**Interfaces:**
- Produces: a module-level `currentSpeakingTabId` variable (`number | undefined`), set at
  the start of `speak(text, tabId, isClip)` and cleared on every terminal `chrome.tts`
  event. Two new outbound messages, `{message: 'speech_paused'}` and
  `{message: 'speech_resumed'}`, sent via `chrome.tabs.sendMessage(currentSpeakingTabId,
  ...)` from the existing top-level `pause`/`resume` handlers. Consumed by `content.js` in
  Task 2.

- [ ] **Step 1: Add the `currentSpeakingTabId` module-level variable**

In `background.js`, alongside the existing module-level variables near the top of the file:

```js
let extensionEnabled = true;  // Keep track of whether the extension is enabled
let ttsSettings = {};  // Store the TTS settings
```

add, directly after those two lines:

```js
// The tabId of whatever speak() call is currently active, or undefined if nothing is
// speaking/paused, or if the active speech has no source tab (Preview). Lets the top-level
// pause/resume message handlers below (already triggered by the popup's button) relay a
// speech_paused/speech_resumed message to the right tab for the clickable overlay — set
// here rather than read from chrome.tts's own event data, since pause/resume aren't
// reliably fired by every voice/engine (see setSpeechState's existing comment on the same
// gap for 'word' events).
let currentSpeakingTabId = undefined;
```

- [ ] **Step 2: Set and clear `currentSpeakingTabId` inside `speak()`**

In `background.js`, `speak(text, tabId, isClip)` currently starts:

```js
function speak(text, tabId, isClip) {
    if (!text) return;
```

Change to:

```js
function speak(text, tabId, isClip) {
    if (!text) return;
    currentSpeakingTabId = tabId;
```

Then, inside the same function's `onEvent` handler, the `'error'` branch currently reads:

```js
                if (event.type === 'error') {
                    console.error('chrome.tts error:', event.errorMessage);
                    showErrorBadge(event.errorMessage);
                    setSpeechState('idle');
                    if (tabId !== undefined) sendClearHighlight(tabId);
```

Change to:

```js
                if (event.type === 'error') {
                    console.error('chrome.tts error:', event.errorMessage);
                    showErrorBadge(event.errorMessage);
                    setSpeechState('idle');
                    currentSpeakingTabId = undefined;
                    if (tabId !== undefined) sendClearHighlight(tabId);
```

And the end-family branch currently reads:

```js
                } else if (event.type === 'end' || event.type === 'interrupted' || event.type === 'cancelled') {
                    setSpeechState('idle');
                    if (tabId !== undefined) sendClearHighlight(tabId);
```

Change to:

```js
                } else if (event.type === 'end' || event.type === 'interrupted' || event.type === 'cancelled') {
                    setSpeechState('idle');
                    currentSpeakingTabId = undefined;
                    if (tabId !== undefined) sendClearHighlight(tabId);
```

(These are the exact same two branches Task 3 of the save-audio-clip plan already extended
with `isClip` handling — the added `currentSpeakingTabId = undefined;` lines sit alongside
that existing code, not replacing it.)

- [ ] **Step 3: Relay `speech_paused`/`speech_resumed` from the existing top-level handlers**

In `background.js`, the top-level `chrome.runtime.onMessage.addListener` currently has:

```js
    } else if (request.message === 'pause') {
        chrome.tts.pause();
        // Set state here rather than waiting for chrome.tts's own 'pause' event — not every
        // voice/engine reliably fires it (same class of gap as 'word' events being
        // voice-dependent), and we already know the outcome: we just asked it to pause. The
        // popup only ever sends this when it already knows we're 'speaking' (see popup.js),
        // so this is always a valid transition.
        setSpeechState('paused');
    } else if (request.message === 'resume') {
        chrome.tts.resume();
        setSpeechState('speaking');
```

Change to:

```js
    } else if (request.message === 'pause') {
        chrome.tts.pause();
        // Set state here rather than waiting for chrome.tts's own 'pause' event — not every
        // voice/engine reliably fires it (same class of gap as 'word' events being
        // voice-dependent), and we already know the outcome: we just asked it to pause. The
        // popup only ever sends this when it already knows we're 'speaking' (see popup.js),
        // so this is always a valid transition.
        setSpeechState('paused');
        if (currentSpeakingTabId !== undefined) {
            chrome.tabs.sendMessage(currentSpeakingTabId, {message: 'speech_paused'}, () => {
                if (chrome.runtime.lastError) { /* tab navigated away — ignore */ }
            });
        }
    } else if (request.message === 'resume') {
        chrome.tts.resume();
        setSpeechState('speaking');
        if (currentSpeakingTabId !== undefined) {
            chrome.tabs.sendMessage(currentSpeakingTabId, {message: 'speech_resumed'}, () => {
                if (chrome.runtime.lastError) { /* tab navigated away — ignore */ }
            });
        }
```

Note: this handler is triggered identically whether the `pause`/`resume` message came from
the popup's button or (after Task 2) the overlay's click — no branching on the sender is
needed, which is exactly what keeps both UI surfaces in sync for free.

- [ ] **Step 4: Syntax-check `background.js`**

Run: `node --check background.js`
Expected: no output (silent success).

- [ ] **Step 5: Commit**

```bash
git add background.js
git commit -m "Track current speaking tab and relay pause/resume to it"
```

---

### Task 2: Make the overlay clickable and pause-aware (`content.js`)

**Files:**
- Modify: `content.js`

**Interfaces:**
- Consumes: `{message: 'speech_paused'}` / `{message: 'speech_resumed'}` from Task 1.
- Produces: sends `{message: 'pause'}` / `{message: 'resume'}` via
  `chrome.runtime.sendMessage` on overlay click — the same messages `popup.js` already
  sends today, so no changes are needed on the `background.js` receiving side beyond Task 1.

- [ ] **Step 1: Add `pointer-events: auto` and `cursor: pointer` to the overlay's shadow style**

In `content.js`, `ensureOverlay()` currently sets the shadow root's `<style>` content:

```js
    const style = document.createElement('style');
    style.textContent = `
        div { background: rgba(20, 20, 24, 0.9); border-radius: 8px;
              box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4); color: #fff; font-weight: bold;
              font-size: 22px; padding: 8px 22px; font-family: system-ui, sans-serif; }
    `;
```

Change to:

```js
    const style = document.createElement('style');
    style.textContent = `
        div { background: rgba(20, 20, 24, 0.9); border-radius: 8px;
              box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4); color: #fff; font-weight: bold;
              font-size: 22px; padding: 8px 22px; font-family: system-ui, sans-serif;
              pointer-events: auto; cursor: pointer; }
    `;
```

(`overlayHost`'s own inline style keeps `pointer-events: none` — unchanged, see the Global
Constraints note above. Only the inner `div` becomes interactive, so nothing outside the
visible box is clickable.)

- [ ] **Step 2: Add the `overlayPaused` state and click handler inside `ensureOverlay()`**

In `content.js`, near the top with the other overlay module-level variables:

```js
let overlayHost = null;
let overlayText = null;
```

Change to:

```js
let overlayHost = null;
let overlayText = null;
// Whether the overlay is currently showing its "paused" look (red text, frozen word).
// Tracks confirmed state only — flipped by the speech_paused/speech_resumed messages in the
// listener below, never optimistically on click, so the overlay never lies about state if
// chrome.tts.pause()/resume() were to silently fail for some reason.
let overlayPaused = false;
```

Then, in `ensureOverlay()`, after the existing `document.body.appendChild(overlayHost);`
line and before `return overlayText;`:

```js
function ensureOverlay() {
    if (overlayHost) return overlayText;
    overlayHost = document.createElement('div');
    overlayHost.style.cssText = 'position: fixed; bottom: 20px; left: 50%; ' +
        'transform: translateX(-50%); pointer-events: none; z-index: 2147483647; display: none;';
    const shadow = overlayHost.attachShadow({mode: 'open'});
    const style = document.createElement('style');
    style.textContent = `
        div { background: rgba(20, 20, 24, 0.9); border-radius: 8px;
              box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4); color: #fff; font-weight: bold;
              font-size: 22px; padding: 8px 22px; font-family: system-ui, sans-serif;
              pointer-events: auto; cursor: pointer; }
    `;
    overlayText = document.createElement('div');
    overlayText.addEventListener('click', () => {
        chrome.runtime.sendMessage({message: overlayPaused ? 'resume' : 'pause'});
    });
    shadow.appendChild(style);
    shadow.appendChild(overlayText);
    document.body.appendChild(overlayHost);
    return overlayText;
}
```

- [ ] **Step 3: Add `setOverlayPausedStyle()` and reset `overlayPaused` on clear**

In `content.js`, after the existing `renderOverlay()` function and before `clearOverlay()`:

```js
function renderOverlay(charIndex, length) {
    if (!activeRange) return;
    const subRange = getSubRange(activeRange, charIndex, length);
    const word = subRange && subRange.toString();
    if (!word) return;
    const textEl = ensureOverlay();
    textEl.textContent = word;
    overlayHost.style.display = 'block';
}
```

Add directly after it:

```js
// Sets the overlay's paused/not-paused look. Only ever called from the speech_paused/
// speech_resumed message handler below — never from the click handler itself, so the
// overlay's color always reflects background.js's confirmed chrome.tts state, not an
// optimistic guess about whether pause()/resume() actually took effect.
function setOverlayPausedStyle(paused) {
    if (!overlayText) return;
    overlayText.style.color = paused ? '#ff5555' : '#fff';
}
```

Then change `clearOverlay()` from:

```js
function clearOverlay() {
    if (overlayHost) overlayHost.style.display = 'none';
}
```

to:

```js
function clearOverlay() {
    if (overlayHost) overlayHost.style.display = 'none';
    overlayPaused = false;
    setOverlayPausedStyle(false);
}
```

(`clearOverlay()` is already called from `clearHighlight()`, which runs on
`end`/`interrupted`/`cancelled`/`error` and at the start of every new `speak()` call via
`sendClearHighlight()` — so a fresh read never inherits a stale red/paused look, matching
the spec's requirement.)

- [ ] **Step 4: Handle the two new messages in the `chrome.runtime.onMessage` listener**

In `content.js`, the listener currently ends:

```js
    } else if (request.message === 'clear_highlight') {
        clearHighlight();
    }
    return true; // Keep the message channel open until sendResponse is called
});
```

Change to:

```js
    } else if (request.message === 'clear_highlight') {
        clearHighlight();
    } else if (request.message === 'speech_paused') {
        overlayPaused = true;
        setOverlayPausedStyle(true);
    } else if (request.message === 'speech_resumed') {
        overlayPaused = false;
        setOverlayPausedStyle(false);
    }
    return true; // Keep the message channel open until sendResponse is called
});
```

- [ ] **Step 5: Syntax-check `content.js`**

Run: `node --check content.js`
Expected: no output (silent success). `chrome`/`document`/`CSS`/`Highlight` aren't defined
under Node, but `node --check` only parses, it doesn't execute — real behavior is verified
in Task 3.

- [ ] **Step 6: Commit**

```bash
git add content.js
git commit -m "Make the word overlay clickable to pause/resume speech"
```

---

### Task 3: Version bump, changelog, and manual Edge verification

**Files:**
- Modify: `manifest.json` (`version`, `version_name`)
- Modify: `README.md` (Version section, Change Notes)
- Modify: `BACKLOG.md` (mark item 9 done, pending verification)

**Interfaces:**
- None — this task packages up Tasks 1–2 for release and hands verification to Grayson.

- [ ] **Step 1: Bump the version**

In `manifest.json`, bump `"version"` from `"1.11"` to `"1.12"`. Update `"version_name"` to
`"1.12 (<today's local date> <current local time>)"` — e.g. `"1.12 (2026-08-14 15:10)"` —
using the actual current local date/time at the moment this step is executed, following the
existing convention documented in `README.md`'s "Version" section.

- [ ] **Step 2: Update README**

In `README.md`, update the "Version" line to match (`1.12 (<same timestamp as above>)`), and
add a new bullet at the top of "Change Notes":

```markdown
- 2026-08-14: The bottom-center word overlay (v1.8) is now **clickable** — clicking it
  pauses speech (the word turns red and freezes on the last word shown), clicking again
  resumes. Fully in sync with the popup's existing Pause/Resume button in both directions:
  pausing via the overlay updates the popup's button label, and pausing via the popup turns
  the overlay red too, since both now drive and reflect the same `chrome.tts` pause/resume
  state in `background.js`. No change to the separate in-page CSS Custom Highlight, which
  already freezes naturally during a pause. Full design:
  `docs/superpowers/specs/clickable-overlay-pause.md`.
```

- [ ] **Step 3: Mark backlog item 9 in `BACKLOG.md`**

In `BACKLOG.md`, find the existing entry:

```markdown
9. **Clickable word overlay as a pause/play toggle** — raised 2026-08-13 during the item 7
   brainstorm, not scoped. Idea: clicking the word-overlay box (built in v1.8) would freeze
   the current word, highlight it red, and pause speech; clicking again resumes. Would
   need its own design pass — e.g. how it interacts with the existing Pause/Resume popup
   toggle from v1.9, and whether the overlay needs to become a real clickable element
   (currently `pointer-events: none` by design, see the word-overlay spec).
```

Replace it with:

```markdown
9. ~~**Clickable word overlay as a pause/play toggle**~~ — browser-extension side built
   2026-08-14 (v1.12), pending Edge verification (see below). Clicking the overlay pauses/
   resumes speech in sync with the popup's Pause/Resume button. The desktop-companion
   equivalent (`Util-GrayTTS-Desktop`) is a separate, not-yet-scoped follow-on — that app
   currently has no pause/resume concept at all, only a one-hotkey-interrupt model.
```

- [ ] **Step 4: Commit the version bump**

```bash
git add manifest.json README.md BACKLOG.md
git commit -m "Bump to v1.12: clickable word-overlay pause/play"
```

- [ ] **Step 5: Manual verification in a real loaded Edge extension (Grayson, not the implementing agent)**

This step needs a human at a real keyboard — an agentic worker cannot hear real TTS audio
or confirm a color/cursor change actually renders. Reload the unpacked extension in Edge
(`edge://extensions` → reload), then run through all 9 checks from
`docs/superpowers/specs/clickable-overlay-pause.md`'s testing plan:

1. **Golden path** — right-click read a selection with the overlay on → hover shows a
   pointer cursor over the box → click it → speech actually pauses (confirm by listening),
   the word turns red and stops updating, the popup (if opened) shows "Resume".
2. **Resume via overlay** — click the (now red) overlay again → speech actually resumes,
   text reverts to white, word updates resume, popup shows "Pause".
3. **Pause via popup reaches the overlay** — with speech playing, click the popup's Pause
   button instead of the overlay → overlay independently turns red and freezes.
4. **Resume via popup reaches the overlay** — click the popup's Resume button → overlay
   independently reverts to white and resumes updating.
5. **Fresh read after a paused one** — pause a read (either way), then start a brand-new
   right-click/hotkey read before resuming the old one (existing v1.9 override behavior) →
   the new read's overlay is not stuck showing red from the prior one.
6. **Preview unaffected** — use the popup's Preview button → confirm no overlay appears at
   all (no source tab), nothing to click, no error.
7. **`showOverlay` off** — uncheck "Show word overlay" in the popup, do a right-click read →
   confirm nothing renders and there's nothing to click (the highlight, if on, still works
   independently).
8. **Re-read while speaking, same tab** — start a right-click/hotkey read, then before it
   finishes, select different text and trigger another right-click/hotkey read in the SAME
   tab (interrupting the first) → click the overlay during the second read → confirm it
   turns red and speech genuinely pauses.
9. **Overlay doesn't block page UI** — on a page with important UI near the bottom-center of
   the viewport (e.g. a chat input box, like Gemini's prompt field), start a read → confirm
   the overlay doesn't make that underlying UI unreachable for the duration of the read
   (sanity check on an accepted tradeoff; doesn't block merge if it reads badly).

Report back pass/fail per check. Any failure means back to Task 1 or 2 to fix, then
re-verify — don't mark backlog item 9 fully done (drop the "pending Edge verification" note
in `BACKLOG.md`) until all 9 pass.

---

## Plan self-review notes

- **Spec coverage:** Behavior (click-to-pause/resume, red/white color swap, freeze-on-pause,
  cursor affordance) → Task 2. Data flow (shared `pause`/`resume` messages, new
  `speech_paused`/`speech_resumed` relay) → Task 1 (relay) + Task 2 (consume). Rendering
  changes (`pointer-events`, `cursor`, click listener, `setOverlayPausedStyle`) → Task 2.
  Out-of-scope items (in-page highlight unchanged, no animation, desktop deferred) are
  correctly not represented as tasks here. Testing plan → Task 3 Step 5, all 9 checks.
- **Type/interface consistency:** `speech_paused`/`speech_resumed` are the exact message
  names sent in Task 1 (`background.js`) and matched in Task 2's `content.js` listener.
  `currentSpeakingTabId` is set/read only within `background.js` (Task 1) — `content.js`
  never needs to know a tab ID, it only reacts to messages already routed to it, consistent
  with every other `chrome.tabs.sendMessage(tabId, ...)` call in this file. `overlayPaused`
  and `setOverlayPausedStyle(paused)` are used identically in both places they appear within
  Task 2 (the click handler reads `overlayPaused`; only the message handlers ever write it
  or call `setOverlayPausedStyle`).
- **Correction found while writing this plan (before any code was written):** the approved
  spec assumed the new relay would live inside `chrome.tts.onEvent`'s `'pause'`/`'resume'`
  branches. Reading the actual current `background.js` showed `speechState` for pause/resume
  is set in the **top-level** `chrome.runtime.onMessage` handler instead, specifically
  because `chrome.tts`'s own `pause`/`resume` events aren't reliable across every
  voice/engine (an existing code comment states this explicitly, mirroring the same
  documented gap for `'word'` events). Moved the new relay into that same top-level handler
  in Task 1 — the correct, more reliable location — rather than replicating an unreliable
  pattern.
- **Correction found while writing this plan (before any code was written):** the spec's
  Rendering section didn't account for `overlayHost`'s existing `pointer-events: none`
  inline style, which would have silently swallowed any click on the inner div. Fixed by
  adding `pointer-events: auto` to the div's own style (inside the shadow root) while
  leaving the host's `pointer-events: none` untouched, so only the visible box — not the
  full-width fixed-position host area around it — is ever clickable.
