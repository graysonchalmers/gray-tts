# Relocate Save-as-Audio-Clip to Popup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make right-click reading a single one-click "Read with GrayTTS" item (no
submenu) by moving "Save as audio clip" out of the context menu and into a new popup
button that saves the active tab's current selection.

**Architecture:** `background.js`'s context menu drops back to one item. The hotkey's
existing "get the active tab's current selection text" logic is extracted into a shared
helper, `getActiveTabSelectionText(callback)`, reused by both the hotkey handler and a new
`save_clip_from_popup` message handler that calls the existing, unchanged
`startClipCapture()`. `popup.js` gets a new button wired to that message, showing an
inline error only for the one new failure mode this introduces (nothing selected).

**Tech Stack:** Plain MV3 Chrome/Edge extension JS (no bundler, no framework) — same as the
rest of this project. No new npm dependencies, no new test files (this feature is 100%
`chrome.*`/DOM-driven, verified manually in a loaded extension).

## Global Constraints

- Plain unpacked MV3 extension, **no bundler/build tooling** — every change must be valid,
  directly browser-loadable JS, no `import`/`export` syntax.
- No new manifest permissions or content-menu contexts.
- The new popup button does **not** check `extensionEnabled` — matches existing
  Preview/Pause/Resume/Stop precedent, none of which gate on it today.
- The only new user-facing failure path is "nothing selected when the button is
  clicked" — shown inline in the popup via the existing `.error` CSS class (same style
  `previewError` already uses). Every other failure (capture already in progress, picker
  cancelled, no audio track, capture too short) keeps its existing toolbar-badge handling
  from the original save-audio-clip feature, unchanged.
- Version bump convention (see `README.md`'s "Version" section): bump `manifest.json`'s
  `version` and `version_name` together, `version_name` becomes
  `"<version> (<local date> <local time>)"`; add a dated bullet to README's "Change Notes".

---

### Task 1: Extract the shared selection-fetch helper and simplify the context menu (`background.js`)

**Files:**
- Modify: `background.js`

**Interfaces:**
- Produces: `getActiveTabSelectionText(callback)` — `callback(text, tabId)` where `text`
  is `''` when nothing usable was found (no active tab, no content script reachable, or no
  selection) and the real selected string otherwise; `tabId` is the active tab's ID (or
  `undefined` if there was no active tab at all). Consumed by Task 2's new
  `save_clip_from_popup` message handler.

- [ ] **Step 1: Add the shared helper**

In `background.js`, directly above the existing `chrome.commands.onCommand.addListener`
block (currently starting at line 315, right after `createContextMenu()`), add:

```js
// Shared by the hotkey handler and the popup's "Save as audio clip" button — both need
// "whatever text is currently selected on the active tab," fetched the same way.
function getActiveTabSelectionText(callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const tab = tabs[0];
        if (!tab) { callback('', undefined); return; }
        chrome.tabs.sendMessage(tab.id, {text: 'get_selection'}, function(response) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                callback('', tab.id);
                return;
            }
            callback((response && response.selection) || '', tab.id);
        });
    });
}
```

- [ ] **Step 2: Simplify the hotkey handler to use the new helper**

In `background.js`, the hotkey handler currently reads:

```js
// Listen for the hotkey command
chrome.commands.onCommand.addListener(function(command) {
    if (command === 'read_selection' && extensionEnabled) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const tab = tabs[0];
            if (!tab) return;
            chrome.tabs.sendMessage(tab.id, {text: 'get_selection'}, function(response) {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                    return;
                }
                if (response && response.selection) {
                    speak(response.selection, tab.id);
                }
            });
        });
    }
});
```

Change to:

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

- [ ] **Step 3: Drop the "Save as audio clip" context-menu item**

In `background.js`, `createContextMenu()` currently reads:

```js
function createContextMenu() {
    chrome.contextMenus.create({
        id: 'read',
        title: 'Read with GrayTTS',
        contexts: ['selection']  // Only show the option when text is selected
    });
    chrome.contextMenus.create({
        id: 'save-clip',
        title: 'Save as audio clip',
        contexts: ['selection']
    });
}
```

Change to:

```js
function createContextMenu() {
    chrome.contextMenus.create({
        id: 'read',
        title: 'Read with GrayTTS',
        contexts: ['selection']  // Only show the option when text is selected
    });
}
```

- [ ] **Step 4: Simplify the context-menu click handler**

In `background.js`, the click handler currently reads:

```js
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!extensionEnabled) return;
    if (info.menuItemId === 'save-clip') {
        startClipCapture(info.selectionText, tab && tab.id);
    } else {
        speak(info.selectionText, tab && tab.id);
    }
});
```

Change to:

```js
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!extensionEnabled) return;
    speak(info.selectionText, tab && tab.id);
});
```

- [ ] **Step 5: Syntax-check `background.js`**

Run: `node --check background.js`
Expected: no output (silent success).

- [ ] **Step 6: Commit**

```bash
git add background.js
git commit -m "Simplify context menu to a single Read item; extract shared active-tab-selection helper"
```

---

### Task 2: Wire the popup's "Save as audio clip" button through to `startClipCapture()` (`background.js`, `popup.html`, `popup.js`)

**Files:**
- Modify: `background.js`
- Modify: `popup.html`
- Modify: `popup.js`

**Interfaces:**
- Consumes: `getActiveTabSelectionText(callback)` from Task 1 (same file, no new plumbing
  needed to call it). `startClipCapture(text, tabId)` — the existing, unmodified function
  from the save-audio-clip feature (`background.js`, unchanged signature).
- Produces: a new inbound message `{message: 'save_clip_from_popup'}` (no payload — the
  handler fetches the selection itself), responding with either `{ok: true}` or
  `{error: '<message>'}`. Sent by `popup.js`'s new button click handler.

- [ ] **Step 1: Add the new message handler in `background.js`**

In `background.js`, the top-level `chrome.runtime.onMessage.addListener`'s existing
`'resume'` branch currently reads:

```js
    } else if (request.message === 'resume') {
        chrome.tts.resume();
        setSpeechState('speaking');
        if (currentSpeakingTabId !== undefined) {
            chrome.tabs.sendMessage(currentSpeakingTabId, {message: 'speech_resumed'}, () => {
                if (chrome.runtime.lastError) { /* tab navigated away — ignore */ }
            });
        }
    } else if (request.message === 'stop') {
```

Add a new branch directly after the `'resume'` branch's closing `}` and before the
`'stop'` branch:

```js
    } else if (request.message === 'resume') {
        chrome.tts.resume();
        setSpeechState('speaking');
        if (currentSpeakingTabId !== undefined) {
            chrome.tabs.sendMessage(currentSpeakingTabId, {message: 'speech_resumed'}, () => {
                if (chrome.runtime.lastError) { /* tab navigated away — ignore */ }
            });
        }
    } else if (request.message === 'save_clip_from_popup') {
        getActiveTabSelectionText((text, tabId) => {
            if (!text) { sendResponse({error: 'No text selected on the page'}); return; }
            startClipCapture(text, tabId);
            sendResponse({ok: true});
        });
        return true; // keep the message channel open for the async response above
    } else if (request.message === 'stop') {
```

Note: `return true` here only applies to this specific `if`/`else if` chain branch — the
listener function itself doesn't need any other change, since JS `return` inside one
`else if` branch of a function exits that whole function call for this particular message,
which is exactly the "tell Chrome I'll respond asynchronously" signal
`chrome.runtime.onMessage` needs.

- [ ] **Step 2: Add the button and error paragraph to `popup.html`**

In `popup.html`, the Pause/Stop row currently reads:

```html
<section class="group row">
  <button id="pauseResume" class="secondary">Pause</button>
  <button id="stop" class="secondary">Stop</button>
</section>
```

Add directly after it:

```html
<section class="group row">
  <button id="pauseResume" class="secondary">Pause</button>
  <button id="stop" class="secondary">Stop</button>
</section>

<section class="group row">
  <button id="saveClip" class="secondary">🎙 Save as audio clip</button>
</section>
<p id="saveClipError" class="error"></p>
```

- [ ] **Step 3: Wire the button in `popup.js`**

In `popup.js`, the `stopButton` click handler currently reads:

```js
    stopButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({message: 'stop'});
    });
```

Add directly after it:

```js
    stopButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({message: 'stop'});
    });

    const saveClipButton = document.getElementById('saveClip');
    const saveClipError = document.getElementById('saveClipError');

    function showSaveClipError(message) {
        if (!saveClipError) return;
        saveClipError.textContent = `⚠ ${message}`;
        saveClipError.style.display = 'block';
    }

    function clearSaveClipError() {
        if (!saveClipError) return;
        saveClipError.style.display = 'none';
    }

    saveClipButton.addEventListener('click', () => {
        clearSaveClipError();
        chrome.runtime.sendMessage({message: 'save_clip_from_popup'}, (response) => {
            if (chrome.runtime.lastError) return; // popup already closed — nothing to show
            if (response && response.error) showSaveClipError(response.error);
        });
    });
```

(This mirrors the existing `previewError`/`showPreviewError`/`clearPreviewError` pattern
already in this file, at lines 203-212 — same shape, new element IDs.)

- [ ] **Step 4: Syntax-check both changed JS files**

Run: `node --check background.js && node --check popup.js`
Expected: no output (silent success on both).

- [ ] **Step 5: Commit**

```bash
git add background.js popup.html popup.js
git commit -m "Add popup button for Save as audio clip, using the active tab's current selection"
```

---

### Task 3: Version bump and changelog

**Files:**
- Modify: `manifest.json` (`version`, `version_name`)
- Modify: `README.md` (Version section, Change Notes)

**Interfaces:**
- None — this task packages up Tasks 1–2 for release and hands verification to Grayson.

- [ ] **Step 1: Bump the version**

In `manifest.json`, bump `"version"` from `"1.12"` to `"1.13"`. Update `"version_name"` to
`"1.13 (<today's local date> <current local time>)"` — e.g. `"1.13 (2026-08-14 15:10)"` —
using the actual current local date/time at the moment this step is executed, following the
existing convention documented in `README.md`'s "Version" section.

- [ ] **Step 2: Update README**

In `README.md`, update the "Version" line to match (`1.13 (<same timestamp as above>)`),
and add a new bullet at the top of "Change Notes":

```markdown
- 2026-08-14: **"Save as audio clip" moved from the right-click context menu to a popup
  button.** Right-click now shows a single "Read with GrayTTS" item — no submenu, since
  Chrome/Edge only nests an extension's items into a flyout when there are 2 or more
  top-level ones. The popup gained a "🎙 Save as audio clip" button (below the Pause/Stop
  row) that grabs the active tab's current text selection the same way the hotkey already
  does, then runs through the exact same capture flow as before. Selecting nothing before
  clicking it shows an inline error in the popup; every other failure (capture already in
  progress, picker cancelled, etc.) still uses the existing toolbar badge. Full design:
  `docs/superpowers/specs/relocate-save-clip-to-popup.md`.
```

- [ ] **Step 3: Commit the version bump**

```bash
git add manifest.json README.md
git commit -m "Bump to v1.13: relocate Save as audio clip to a popup button"
```

- [ ] **Step 4: Manual verification in a real loaded Edge extension (Grayson, not the implementing agent)**

This step needs a human at a real keyboard. Reload the unpacked extension in Edge
(`edge://extensions` → reload), then run through all 6 checks from
`docs/superpowers/specs/relocate-save-clip-to-popup.md`'s testing plan:

1. Right-click selected text → confirm exactly one item, "Read with GrayTTS", no submenu,
   and it still reads correctly.
2. Select text on a page, open the popup, click "🎙 Save as audio clip" → confirm the same
   picker flow as before starts and a clip downloads correctly.
3. Open the popup with **no** text selected on the page, click the button → confirm the
   inline "⚠ No text selected on the page" error appears and no picker/capture starts.
4. Trigger a save-clip from the popup, then immediately try again before the first
   finishes → confirm the toolbar badge still shows "Clip capture already in progress"
   (unchanged existing behavior).
5. Confirm the hotkey (`Ctrl+Shift+Y`) still reads the active tab's selection correctly
   after the refactor.
6. Confirm Preview and Pause/Resume/Stop are unaffected.

Report back pass/fail per check. Any failure means back to Task 1 or 2 to fix, then
re-verify.

---

## Plan self-review notes

- **Spec coverage:** Single-item context menu (Task 1 Steps 3-4), shared selection-fetch
  helper (Task 1 Step 1) reused by both the hotkey (Task 1 Step 2) and the new popup
  button (Task 2 Step 1), popup button + inline error UI (Task 2 Steps 2-3), version bump
  and testing plan (Task 3) — every section of the spec maps to a task above. "Out of
  scope" items (no change to `startClipCapture()` internals, no new permissions, no
  `extensionEnabled` gating on the new button) are correctly not represented as tasks.
- **Type/interface consistency:** `getActiveTabSelectionText(callback)`'s
  `callback(text, tabId)` shape (defined Task 1 Step 1) is used identically by its two
  callers — the hotkey handler (Task 1 Step 2: `(text, tabId) => { if (text) speak(text,
  tabId); }`) and the new message handler (Task 2 Step 1: `(text, tabId) => { ... }`).
  `save_clip_from_popup`'s response shape (`{ok: true}` / `{error: string}}`, Task 2 Step
  1) matches exactly what `popup.js`'s handler reads (Task 2 Step 3: `response.error`).
  Element IDs `saveClip`/`saveClipError` are consistent between `popup.html` (Task 2 Step
  2) and `popup.js` (Task 2 Step 3).
