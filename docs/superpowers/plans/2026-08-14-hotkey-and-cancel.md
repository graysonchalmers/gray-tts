# Hotkey Rebind + Cancel-While-Speaking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the read hotkey's suggested default to the right-hand-reachable
`Ctrl+Alt+L`, and add two new ways to cancel an in-progress read — pressing the hotkey
again while speech is already going, and pressing Escape from any tab — both funneling
into the exact same cancel path the popup's existing Stop button already uses.

**Architecture:** A new `stopSpeech()` helper in `background.js` centralizes what
"cancel" means (`chrome.tts.stop()` + clear the badge + reset `speechState` to `'idle'`).
The existing `stop` message handler is refactored to call it. The hotkey's
`chrome.commands.onCommand` listener gains a `chrome.tts.isSpeaking()` check up front: if
true, call `stopSpeech()` and stop there — never touch the selection, never start a new
read. `content.js` gains a standalone `keydown` listener for `Escape` that sends the same
`{message: 'stop'}` the popup already sends. `manifest.json`'s suggested hotkey default
changes from `Ctrl+Shift+Y` to `Ctrl+Alt+L`.

**Tech Stack:** Plain MV3 Chrome/Edge extension JS (no bundler, no framework) — same as
the rest of this project. No new manifest permissions (only uses `chrome.tts`,
`chrome.commands`, `chrome.runtime.sendMessage`/`onMessage`, all already declared/used
today). No automated test suite exists for this extension; verification is manual, in a
real loaded browser.

## Global Constraints

- Plain unpacked MV3 extension, **no bundler/build tooling** — every change must be valid,
  directly browser-loadable JS, no `import`/`export` syntax.
- No new manifest permissions needed.
- `background.js` uses plain `function` declarations throughout, which are hoisted — code
  earlier in the file may call a function defined later (e.g. the existing context-menu
  handler at the top of the file already calls `speak()`, which isn't defined until much
  further down). `stopSpeech()` can safely be defined near `setSpeechState()` and called
  from both an earlier `onMessage` branch and the later `onCommand` listener with no
  reordering needed.
- Version bump convention (see `README.md`'s "Version" section): bump `manifest.json`'s
  `version` and `version_name` together on every meaningful change, `version_name` becomes
  `"<version> (<local date> <local time>)"`. Current version is `1.13`.
- Grayson's *actual* hotkey binding lives in `chrome://extensions/shortcuts`
  (per-browser-profile, not in this repo) — changing `manifest.json`'s `suggested_key`
  only affects what a fresh install proposes. He re-binds it himself; no task here can do
  that for him.
- Manual verification in a real loaded extension is required before this ships — an
  agentic worker cannot hear real TTS audio, and the "always cancel, even if the selection
  changed" behavior can only be confirmed by actually pressing the hotkey twice in a real
  browser. The final task's verification step is written as instructions for Grayson, not
  something the implementing agent completes solo.

---

### Task 1: Rebind the hotkey suggested default (`manifest.json`)

**Files:**
- Modify: `manifest.json:38-43`

**Interfaces:**
- None — this only changes the suggested default for fresh installs.

- [ ] **Step 1: Change the suggested key**

In `manifest.json`, the `commands` block currently reads:

```json
  "commands": {
    "read_selection": {
      "suggested_key": {
        "default": "Ctrl+Shift+Y"
      },
      "description": "Read selected text with GrayTTS"
    }
  }
```

Change `"Ctrl+Shift+Y"` to `"Ctrl+Alt+L"`:

```json
  "commands": {
    "read_selection": {
      "suggested_key": {
        "default": "Ctrl+Alt+L"
      },
      "description": "Read selected text with GrayTTS"
    }
  }
```

- [ ] **Step 2: Validate the JSON**

Run: `node --check manifest.json` will fail (it's JSON, not JS) — instead validate with:

```bash
node -e "JSON.parse(require('fs').readFileSync('manifest.json', 'utf8')); console.log('valid JSON')"
```

Expected output: `valid JSON`

- [ ] **Step 3: Commit**

```bash
git add manifest.json
git commit -m "Rebind suggested hotkey default to Ctrl+Alt+L"
```

---

### Task 2: `stopSpeech()` helper + hotkey-while-speaking cancels (`background.js`)

**Files:**
- Modify: `background.js:142-145` (existing `stop` message handler)
- Modify: `background.js:276-278` (add `stopSpeech()` after `setSpeechState()`)
- Modify: `background.js:329-336` (existing hotkey `onCommand` listener)

**Interfaces:**
- Produces: `stopSpeech()` — no parameters, no return value. Called from the existing
  `stop` message handler (this task) and from `content.js`'s new Escape listener in Task 3
  (indirectly, via the existing `{message: 'stop'}` path — Task 3 doesn't call
  `stopSpeech()` directly, it just sends the message this handler already receives).

- [ ] **Step 1: Add the `stopSpeech()` helper**

In `background.js`, `setSpeechState()` currently reads:

```js
function setSpeechState(state) {
    chrome.storage.session.set({speechState: state});
}
```

Add directly after it:

```js
// Shared by the popup's Stop button, Escape (content.js), and pressing the read hotkey
// again while something is already speaking — all three cancel exactly the same way, so
// there's one place that does it.
function stopSpeech() {
    chrome.tts.stop();
    clearBadge();
    setSpeechState('idle');
}
```

- [ ] **Step 2: Use it from the existing `stop` message handler**

In `background.js`, the top-level `chrome.runtime.onMessage` listener currently has:

```js
    } else if (request.message === 'stop') {
        chrome.tts.stop();
        clearBadge();
        setSpeechState('idle');
    } else if (request.message === 'capture_ready') {
```

Change to:

```js
    } else if (request.message === 'stop') {
        stopSpeech();
    } else if (request.message === 'capture_ready') {
```

- [ ] **Step 3: Check `chrome.tts.isSpeaking()` before starting a new read from the hotkey**

In `background.js`, the hotkey listener currently reads:

```js
// Listen for the hotkey command
chrome.commands.onCommand.addListener(function(command) {
    if (command === 'read_selection' && extensionEnabled) {
        getActiveTabSelectionText((text, tabId) => {
            if (text) speak(text, tabId);
        });
    }
});
```

Change to:

```js
// Listen for the hotkey command
chrome.commands.onCommand.addListener(function(command) {
    if (command === 'read_selection' && extensionEnabled) {
        // chrome.tts.isSpeaking() reflects real chrome.tts state — true whenever an
        // utterance is speaking OR paused-but-still-queued — so this can never drift out
        // of sync the way tracking our own speechState here instead would. A second
        // hotkey press always cancels, even if the selection changed since the first
        // press; it never starts a new read on its own.
        chrome.tts.isSpeaking((speaking) => {
            if (speaking) {
                stopSpeech();
                return;
            }
            getActiveTabSelectionText((text, tabId) => {
                if (text) speak(text, tabId);
            });
        });
    }
});
```

- [ ] **Step 4: Syntax-check `background.js`**

Run: `node --check background.js`
Expected: no output (silent success).

- [ ] **Step 5: Commit**

```bash
git add background.js
git commit -m "Add stopSpeech() helper; hitting the hotkey while speaking now cancels"
```

---

### Task 3: Escape cancels speech (`content.js`)

**Files:**
- Modify: `content.js` (add a new listener at the end of the file, after line 192)

**Interfaces:**
- Consumes: nothing new — sends the existing `{message: 'stop'}`, already handled by
  `background.js`'s `stop` branch (Task 2, Step 2).

- [ ] **Step 1: Add the Escape listener**

In `content.js`, the file currently ends:

```js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.text === 'get_selection') {
        sendResponse({selection: captureSelection()});
    } else if (request.message === 'capture_selection_range') {
        captureAndClearSelectionRange();
    } else if (request.message === 'highlight_progress') {
        if (request.showHighlight) highlightProgress(request.charIndex, request.length);
        if (request.showOverlay) renderOverlay(request.charIndex, request.length);
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

Add after it (new, at the end of the file):

```js

// Escape is a general "stop talking" panic key — works even before any overlay has
// appeared on this tab, and regardless of which tab is the one actually speaking (this
// just sends the same 'stop' message the popup's Stop button does, and background.js's
// single chrome.tts.stop() call handles the rest regardless of source tab). Never calls
// preventDefault()/stopPropagation(), so it never interferes with whatever the host page
// itself does with Escape (closing its own modal, etc.) — this just piggybacks alongside
// it. Sending 'stop' when nothing is speaking is a harmless no-op, so this doesn't need to
// check speech state first.
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        chrome.runtime.sendMessage({message: 'stop'});
    }
});
```

- [ ] **Step 2: Syntax-check `content.js`**

Run: `node --check content.js`
Expected: no output (silent success). `chrome`/`document` aren't defined under Node, but
`node --check` only parses, it doesn't execute — real behavior is verified in Task 4.

- [ ] **Step 3: Commit**

```bash
git add content.js
git commit -m "Escape cancels speech from any tab"
```

---

### Task 4: Version bump, changelog, and manual Edge verification

**Files:**
- Modify: `manifest.json` (`version`, `version_name`)
- Modify: `README.md` (Version section, Change Notes)

**Interfaces:**
- None — this task packages up Tasks 1–3 for release and hands verification to Grayson.

- [ ] **Step 1: Bump the version**

In `manifest.json`, bump `"version"` from `"1.13"` to `"1.14"`. Update `"version_name"` to
`"1.14 (<today's local date> <current local time>)"` — e.g. `"1.14 (2026-08-14 16:30)"` —
using the actual current local date/time at the moment this step is executed, following
the convention documented in `README.md`'s "Version" section.

- [ ] **Step 2: Update README**

In `README.md`, update the "Version" line (currently `1.13 (2026-08-14 03:07)`) to match
the new timestamp from Step 1, and add a new bullet at the top of "Change Notes":

```markdown
- 2026-08-14: **Hotkey moved to `Ctrl+Alt+L`** (suggested default only — existing
  installs keep whatever's set in `chrome://extensions/shortcuts` until re-bound by hand)
  for a right-hand-reachable chord. Speech can now be **cancelled** two new ways, both
  routing through the same `chrome.tts.stop()` path the popup's Stop button already used:
  pressing the read hotkey again while something is already speaking (always cancels —
  even if a different selection is active, it never starts reading that instead), and
  pressing **Escape**, which works from any tab regardless of which one is actually
  speaking. Full design: `docs/superpowers/specs/hotkey-and-cancel.md`.
```

- [ ] **Step 3: Commit the version bump**

```bash
git add manifest.json README.md
git commit -m "Bump to v1.14: right-hand hotkey + cancel while speaking"
```

- [ ] **Step 4: Manual verification in a real loaded Edge extension (Grayson, not the implementing agent)**

This step needs a human at a real keyboard — an agentic worker cannot hear real TTS audio
or press a physical hotkey. Reload the unpacked extension in Edge (`edge://extensions` →
reload), set the new hotkey to `Ctrl+Alt+L` in `edge://extensions/shortcuts`, then run
through all 8 checks from `docs/superpowers/specs/hotkey-and-cancel.md`'s testing plan:

1. Select text on a page, press `Ctrl+Alt+L` → speech starts as before.
2. While it's speaking, press `Ctrl+Alt+L` again → speech stops immediately; nothing new
   starts.
3. While it's speaking, select *different* text, then press `Ctrl+Alt+L` → per the
   "always cancel" rule, this still just stops the current read — it does not start
   reading the new selection.
4. Start a read, press Escape → speech stops.
5. Start a read on Tab A, switch focus to Tab B (also loaded with the extension's content
   script), press Escape there → the speech started from Tab A stops.
6. Press Escape with nothing speaking → no error, nothing visibly happens.
7. Start a "Save as audio clip" capture, press Escape mid-capture → the capture aborts
   cleanly (same as clicking Stop already does today).
8. Confirm the popup's existing Stop button, Pause/Resume, and right-click read still work
   unchanged (regression check on the shared `stopSpeech()` path).

Report back pass/fail per check. Any failure means back to Task 2 or 3 to fix, then
re-verify.

---

## Plan self-review notes

- **Spec coverage:** Hotkey rebind → Task 1. Hotkey-while-speaking cancels
  (`chrome.tts.isSpeaking()`, "always cancel" rule) → Task 2, Step 3. Escape cancels from
  any tab, no `preventDefault`/`stopPropagation` → Task 3. Interaction with clip capture
  (no special-casing needed, reuses the existing `stop` path) → covered structurally by
  routing both new triggers through the same `stopSpeech()`/`{message: 'stop'}` path, and
  explicitly verified in Task 4's check 7. Out-of-scope items (popup buttons, overlay
  visuals, desktop companion) are correctly not represented as tasks here. Testing plan →
  Task 4, all 8 checks.
- **Type/interface consistency:** `stopSpeech()` takes no arguments and returns nothing,
  used identically in both call sites (Task 2's `stop` handler and `onCommand` listener).
  The Escape listener in Task 3 never calls `stopSpeech()` directly — it only sends
  `{message: 'stop'}`, which is exactly the message name the `stop` branch (unchanged by
  Task 2 beyond its body) already matches on. No naming drift between tasks.
- **Placeholder scan:** no TBD/TODO markers; every step shows the exact before/after code.
- **Scope check:** single subsystem (this repo's hotkey + cancel behavior), no
  decomposition needed beyond the desktop-companion work already excluded per the spec's
  "Out of scope" section.
