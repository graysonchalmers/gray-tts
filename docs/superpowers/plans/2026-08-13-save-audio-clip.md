# Save Audio Clip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Save as audio clip" context-menu item that records the spoken selection as a downloaded `.webm` file.

**Architecture:** A new `chrome.offscreen` document (reason `DISPLAY_MEDIA`) hosts `getDisplayMedia`/`MediaRecorder` capture, since `background.js`'s MV3 service worker has no document context of its own. `background.js` creates the offscreen document on click, waits for it to confirm the capture stream is ready, then calls the existing `chrome.tts.speak()` pipeline; when speech ends, it tells the offscreen document to finalize. Offscreen documents only support the `chrome.runtime` API (confirmed against Chrome's own offscreen-document reference), so the offscreen document never calls `chrome.downloads` or `chrome.offscreen` itself — it hands the finished recording back to `background.js` as a base64 `data:` URL over `chrome.runtime.sendMessage`, and `background.js` owns both starting the download and closing the offscreen document in every terminal case.

**Tech Stack:** Plain MV3 Chrome/Edge extension JS (no bundler, no framework), `chrome.offscreen`, `chrome.downloads`, `getDisplayMedia`, `MediaRecorder`. Node's built-in test runner (`node --test`) for the one pure-logic module this feature adds.

## Global Constraints

- Plain unpacked MV3 extension, **no bundler/build tooling** — every new file must be
  valid, directly browser-loadable JS/HTML (`<script src="...">` in HTML, `importScripts`
  in the service worker), no `import`/`export` syntax.
- Filename format: `graytts-clip-<YYYY-MM-DD-HHmmss>-<first-4-words-slugified>.webm`.
- Saved via `chrome.downloads.download({url, filename, saveAs: false})` — no subfolder, no
  "Save As" prompt.
- Every new failure path reuses the existing `showErrorBadge()` toolbar-badge mechanism in
  `background.js` — no silent failures (project North Star: "Reading any selected text on
  any page out loud should take one keystroke and never silently fail").
- Native `MediaRecorder` `.webm` (Opus) output is used as-is — no format conversion.
- Two new manifest permissions: `"offscreen"`, `"downloads"`.
- **Offscreen documents only support the `chrome.runtime` API** (confirmed against
  Chrome's own reference). `offscreen.js` must never call `chrome.downloads` or
  `chrome.offscreen` itself — only `background.js` may call
  `chrome.downloads.download()` or `chrome.offscreen.closeDocument()`.
- No automated browser-level test harness exists or should be introduced for this feature.
  Only pure-logic code (no `chrome.*`/DOM APIs) gets Node tests, following the existing
  `lib/settings.js` + `test/settings.test.js` pattern (`node --test`,
  `node:assert/strict`, dual `module.exports`/global-attach export at the bottom of the
  file). Everything touching `chrome.tts`/`chrome.offscreen`/`getDisplayMedia` is verified
  manually in a real loaded Edge extension — an agentic worker cannot click through Chrome's
  native screen-share picker or hear real speaker output, so Task 4's verification step is
  written as instructions for Grayson to run himself, not something the implementing agent
  can complete solo.
- Version bump convention (see `README.md`'s "Version" section): bump `manifest.json`'s
  `version` and `version_name` together, `version_name` becomes
  `"<version> (<local date> <local time>)"`; add a dated bullet to README's "Change Notes".

---

### Task 1: Clip filename logic (`lib/clipFilename.js`)

**Files:**
- Create: `lib/clipFilename.js`
- Test: `test/clipFilename.test.js`

**Interfaces:**
- Produces: `GrayTTSClipFilename.buildClipFilename(text, date)` — pure function, `text` is
  the spoken selection string, `date` is a JS `Date` instance (caller-supplied so the
  function stays deterministic/testable, mirroring how `lib/settings.js` takes plain data
  in and out with no hidden state). Returns a filename string ending in `.webm`. Consumed
  by `offscreen.js` in Task 2.

- [ ] **Step 1: Write the failing tests**

Create `test/clipFilename.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const {buildClipFilename} = require('../lib/clipFilename.js');

test('buildClipFilename: normal sentence uses first 4 words, slugified', () => {
    const date = new Date(2026, 7, 13, 14, 22, 1); // 2026-08-13 14:22:01 (month is 0-indexed)
    const result = buildClipFilename('The quick brown fox jumps over the lazy dog', date);
    assert.equal(result, 'graytts-clip-2026-08-13-142201-the-quick-brown-fox.webm');
});

test('buildClipFilename: fewer than 4 words uses all of them', () => {
    const date = new Date(2026, 0, 5, 9, 5, 0); // 2026-01-05 09:05:00
    const result = buildClipFilename('Hello world', date);
    assert.equal(result, 'graytts-clip-2026-01-05-090500-hello-world.webm');
});

test('buildClipFilename: strips punctuation from words', () => {
    const date = new Date(2026, 5, 1, 0, 0, 0); // 2026-06-01 00:00:00
    const result = buildClipFilename('Wait, really?! Yes indeed.', date);
    assert.equal(result, 'graytts-clip-2026-06-01-000000-wait-really-yes-indeed.webm');
});

test('buildClipFilename: collapses extra whitespace/newlines between words', () => {
    const date = new Date(2026, 7, 13, 1, 2, 3);
    const result = buildClipFilename('  Line one\n\nLine   two  ', date);
    assert.equal(result, 'graytts-clip-2026-08-13-010203-line-one-line-two.webm');
});

test('buildClipFilename: text that slugifies to nothing (symbols/non-Latin) falls back to timestamp-only', () => {
    const date = new Date(2026, 7, 13, 14, 22, 1);
    const result = buildClipFilename('!!! ??? ...', date);
    assert.equal(result, 'graytts-clip-2026-08-13-142201.webm');
});

test('buildClipFilename: empty string falls back to timestamp-only', () => {
    const date = new Date(2026, 7, 13, 14, 22, 1);
    const result = buildClipFilename('', date);
    assert.equal(result, 'graytts-clip-2026-08-13-142201.webm');
});

test('buildClipFilename: pads single-digit month/day/hour/minute/second', () => {
    const date = new Date(2026, 0, 1, 1, 1, 1); // 2026-01-01 01:01:01
    const result = buildClipFilename('hi', date);
    assert.equal(result, 'graytts-clip-2026-01-01-010101-hi.webm');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '../lib/clipFilename.js'`

- [ ] **Step 3: Write the implementation**

Create `lib/clipFilename.js`:

```js
// Pure filename-generation logic for the "Save as audio clip" feature, shared between the
// extension's offscreen document (loaded as a plain script — no bundler) and the Node
// test suite under test/. Same dual-export pattern as lib/settings.js: module.exports
// under Node, attaches to a global under a browser context.
(function (root) {

function pad(n) {
    return String(n).padStart(2, '0');
}

function formatTimestamp(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-` +
        `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

// Non-Latin/symbol-only text strips down to nothing under this ASCII-only slug — that's
// fine, buildClipFilename() falls back to a timestamp-only name rather than forcing a
// transliteration step nobody asked for.
function slugifyWords(text, maxWords) {
    return text
        .trim()
        .split(/\s+/)
        .slice(0, maxWords)
        .map((word) => word.toLowerCase().replace(/[^a-z0-9]+/g, ''))
        .filter(Boolean)
        .join('-');
}

function buildClipFilename(text, date) {
    const timestamp = formatTimestamp(date);
    const slug = slugifyWords(text || '', 4);
    return slug ? `graytts-clip-${timestamp}-${slug}.webm` : `graytts-clip-${timestamp}.webm`;
}

const api = {buildClipFilename};
if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
} else {
    root.GrayTTSClipFilename = api;
}

})(typeof self !== 'undefined' ? self : this);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — all 7 tests in `test/clipFilename.test.js` green, plus the existing
`test/settings.test.js` suite still passing.

- [ ] **Step 5: Commit**

```bash
git add lib/clipFilename.js test/clipFilename.test.js
git commit -m "Add pure clip-filename generation logic with Node tests"
```

---

### Task 2: Offscreen capture document (`offscreen.html`, `offscreen.js`)

**Files:**
- Create: `offscreen.html`
- Create: `offscreen.js`
- Modify: `manifest.json` (add `"offscreen"` and `"downloads"` permissions)

**Interfaces:**
- Produces: message-based protocol `background.js` (Task 3) sends/receives via
  `chrome.runtime.sendMessage`/`chrome.runtime.onMessage`. **Important:** offscreen
  documents only support the `chrome.runtime` API (Chrome's own offscreen-document
  reference states this explicitly) — `offscreen.js` never calls `chrome.downloads` or
  `chrome.offscreen` itself. It only ever sends plain `chrome.runtime` messages;
  `background.js` (Task 3) owns every `chrome.downloads.download()` call and every
  `chrome.offscreen.closeDocument()` call, in response to those messages.
  - Inbound to offscreen: `{message: 'start_capture'}`, `{message: 'stop_capture'}`,
    `{message: 'abort_capture'}` (no selection text needed here — filename generation now
    happens in `background.js`, which already has the text from `startClipCapture()`).
  - Outbound from offscreen: `{message: 'capture_ready'}` (stream obtained, recording
    started), `{message: 'capture_cancelled'}` (picker denied/cancelled),
    `{message: 'capture_no_audio'}` (no audio track in the captured stream),
    `{message: 'capture_finished', dataUrl}` (recording finalized — `dataUrl` is a base64
    `data:audio/webm;...` string, not a `blob:` object URL, since a `blob:` URL created in
    the offscreen document wouldn't resolve in `background.js`'s context, and `chrome.
    runtime.sendMessage` can carry a plain string but not a `Blob`), `{message:
    'capture_aborted'}` (either an explicit `abort_capture`, or a `stop_capture` that had
    nothing recorded).
  - `offscreen.js` never calls `chrome.offscreen.closeDocument()`. `background.js` closes
    the document itself upon receiving any of the five outbound messages above — this also
    means the document is never torn down before its own message has actually been
    delivered (no close-before-delivery race).

- [ ] **Step 1: Add the new permissions to `manifest.json`**

In `manifest.json`, change:

```json
  "permissions": [
    "tts", 
    "contextMenus",
    "storage"
  ],
```

to:

```json
  "permissions": [
    "tts",
    "contextMenus",
    "storage",
    "offscreen",
    "downloads"
  ],
```

- [ ] **Step 2: Create `offscreen.html`**

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
</head>
<body>
<!-- No UI — this document exists only to give getDisplayMedia()/MediaRecorder a
     document context, since background.js's MV3 service worker has none. Never shown. -->
<script src="lib/clipFilename.js"></script>
<script src="offscreen.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create `offscreen.js`**

```js
// offscreen.js — runs in the extension's offscreen document (see manifest.json's
// "offscreen" permission and chrome.offscreen.createDocument() in background.js).
// background.js's MV3 service worker has no document/window context of its own, so the
// getDisplayMedia()/MediaRecorder screen-audio-capture calls this feature needs have to
// happen here instead — the whole reason this file/document exists.
//
// Offscreen documents only support the chrome.runtime API (Chrome's own offscreen-document
// reference states this explicitly) — chrome.downloads and chrome.offscreen itself are NOT
// usable from inside this file. Every terminal path below only ever sends a chrome.runtime
// message; background.js owns calling chrome.downloads.download() and
// chrome.offscreen.closeDocument() in response, which also means this document is never
// torn down before its own message has actually been delivered.

let mediaRecorder = null;
let recordedChunks = [];
let displayStream = null;
// Set right before mediaRecorder.stop() so the onstop handler knows whether to finalize
// and hand off the recording, or discard it (e.g. a mid-capture chrome.tts error).
let stopPurpose = null; // 'finalize' | 'abort'

chrome.runtime.onMessage.addListener((request) => {
    if (request.message === 'start_capture') {
        startCapture();
    } else if (request.message === 'stop_capture') {
        stopPurpose = 'finalize';
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        } else {
            chrome.runtime.sendMessage({message: 'capture_aborted'});
            releaseStream();
        }
    } else if (request.message === 'abort_capture') {
        stopPurpose = 'abort';
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        } else {
            chrome.runtime.sendMessage({message: 'capture_aborted'});
            releaseStream();
        }
    }
});

async function startCapture() {
    try {
        displayStream = await navigator.mediaDevices.getDisplayMedia({video: true, audio: true});
    } catch (err) {
        // User cancelled/denied the picker. background.js closes this document once it
        // receives this message — this file never calls chrome.offscreen.closeDocument()
        // itself (unsupported here, see header comment).
        chrome.runtime.sendMessage({message: 'capture_cancelled'});
        return;
    }

    const audioTracks = displayStream.getAudioTracks();
    if (audioTracks.length === 0) {
        // Picked a specific window/tab without checking "share audio", or the chosen
        // source doesn't support audio capture at all.
        chrome.runtime.sendMessage({message: 'capture_no_audio'});
        releaseStream();
        return;
    }

    // Only the audio track matters here — stop the video track immediately rather than
    // letting it run unused for the whole capture.
    displayStream.getVideoTracks().forEach((t) => t.stop());

    const audioOnlyStream = new MediaStream(audioTracks);
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(audioOnlyStream);
    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
    };
    mediaRecorder.onstop = handleRecorderStop;
    mediaRecorder.start();

    chrome.runtime.sendMessage({message: 'capture_ready'});
}

function handleRecorderStop() {
    if (stopPurpose === 'finalize' && recordedChunks.length > 0) {
        const blob = new Blob(recordedChunks, {type: 'audio/webm'});
        const reader = new FileReader();
        reader.onloadend = () => {
            // chrome.downloads isn't usable from inside an offscreen document (see header
            // comment), so hand the finished recording to background.js as a data: URL
            // string — chrome.runtime messaging can carry a plain string, but a blob:
            // object URL created here would not resolve in background.js's context, and a
            // Blob itself can't cross this message boundary either.
            chrome.runtime.sendMessage({message: 'capture_finished', dataUrl: reader.result});
            releaseStream();
        };
        reader.readAsDataURL(blob);
    } else {
        // Either an explicit abort, or a finalize with nothing recorded (e.g. chrome.tts
        // ended near-instantly) — nothing to download.
        chrome.runtime.sendMessage({message: 'capture_aborted'});
        releaseStream();
    }
}

function releaseStream() {
    if (displayStream) {
        displayStream.getTracks().forEach((t) => t.stop());
        displayStream = null;
    }
    mediaRecorder = null;
    recordedChunks = [];
    stopPurpose = null;
    // Deliberately no chrome.offscreen.closeDocument() call here — unsupported inside an
    // offscreen document (see header comment). background.js closes the document once it
    // has received one of this file's outbound messages.
}
```

- [ ] **Step 4: Syntax-check the new JS file**

Run: `node --check offscreen.js`
Expected: no output (silent success). This only checks syntax — `chrome`/`navigator`/
`MediaRecorder` aren't defined under Node, but `node --check` doesn't execute the file, so
that's fine. Real behavior is verified in Task 4, in a real loaded extension.

- [ ] **Step 5: Commit**

```bash
git add manifest.json offscreen.html offscreen.js
git commit -m "Add offscreen document for system-audio clip capture"
```

---

### Task 3: Wire "Save as audio clip" into `background.js`

**Files:**
- Modify: `background.js`

**Interfaces:**
- Consumes: `offscreen.js`'s message protocol from Task 2 — receives `capture_ready`,
  `capture_cancelled`, `capture_no_audio`, `capture_finished` (carries `dataUrl`),
  `capture_aborted`; sends `start_capture`, `stop_capture`, `abort_capture`. Also consumes
  `GrayTTSClipFilename.buildClipFilename(text, date)` from Task 1 (filename generation
  happens here now, not in `offscreen.js` — see Task 2's note on offscreen documents only
  supporting `chrome.runtime`).
- Produces: extends the existing `speak(text, tabId)` function (used by the context-menu
  `'read'` handler, the hotkey handler, and the popup's raw `{selection}` message path) to
  `speak(text, tabId, isClip)` — the new third parameter defaults to falsy, so none of the
  three existing call sites need to change.

- [ ] **Step 1: Load `lib/clipFilename.js` into the service worker**

`background.js` currently does filename generation nowhere — that logic now lives here
(not in `offscreen.js`, since offscreen documents can't call `chrome.downloads`; see Task
2). Change the top of `background.js`:

```js
importScripts('lib/settings.js');
```

to:

```js
importScripts('lib/settings.js', 'lib/clipFilename.js');
```

- [ ] **Step 2: Add the second context-menu item**

In `background.js`, `createContextMenu()` currently creates only the `'read'` item. Change:

```js
function createContextMenu() {
    chrome.contextMenus.create({
        id: 'read',
        title: 'Read with GrayTTS',
        contexts: ['selection']  // Only show the option when text is selected
    });
}
```

to:

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

- [ ] **Step 3: Branch the context-menu click handler on `menuItemId`**

Change:

```js
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (extensionEnabled) {
        speak(info.selectionText, tab && tab.id);
    }
});
```

to:

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

- [ ] **Step 4: Add the clip-capture state and orchestration functions**

Add near the top of `background.js`, alongside the existing `extensionEnabled`/
`ttsSettings` module-level variables:

```js
// State for the in-progress "Save as audio clip" flow, if any. 'idle' the rest of the
// time. A second save-clip trigger while this isn't 'idle' is ignored (see
// startClipCapture) rather than racing two offscreen captures against each other.
// 'finishing' covers the gap between telling the offscreen document to stop/abort and it
// actually confirming that back (capture_finished/capture_aborted) — without this state,
// a save-clip trigger during that gap could race a second offscreen document into
// existence before the first one's teardown message arrives.
let clipCaptureState = 'idle'; // 'idle' | 'awaiting_capture' | 'capturing' | 'finishing'
let clipCaptureText = null;
let clipCaptureTabId = null;

const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';

async function ensureOffscreenDocument() {
    // startClipCapture()'s own guard only calls this when clipCaptureState is 'idle'. Given
    // that background.js closes the offscreen document in every terminal branch (Step 5)
    // before ever returning to 'idle', an existing document at this point can only be a
    // stale leftover — most likely the MV3 service worker was torn down and respawned
    // (resetting this file's in-memory clipCaptureState back to 'idle') while the previous
    // capture's getDisplayMedia picker was still open, orphaning that document. There's no
    // way to tell a stale document apart from a legitimately-still-open one here, so always
    // close and recreate rather than reusing it — self-heals a stuck capture on the very
    // next attempt instead of leaving the extension unable to ever open a new one (Chrome
    // allows only one offscreen document at a time).
    if (await chrome.offscreen.hasDocument()) {
        await chrome.offscreen.closeDocument();
    }
    await chrome.offscreen.createDocument({
        url: OFFSCREEN_DOCUMENT_PATH,
        reasons: ['DISPLAY_MEDIA'],
        justification: 'Record system audio while chrome.tts speaks, to save the current selection as a downloadable audio clip.'
    });
}

async function startClipCapture(text, tabId) {
    if (!text) return;
    if (clipCaptureState !== 'idle') {
        showErrorBadge('Clip capture already in progress');
        return;
    }
    clipCaptureState = 'awaiting_capture';
    clipCaptureText = text;
    clipCaptureTabId = tabId;
    await ensureOffscreenDocument();
    chrome.runtime.sendMessage({message: 'start_capture'});
}

function resetClipCaptureState() {
    clipCaptureState = 'idle';
    clipCaptureText = null;
    clipCaptureTabId = null;
}
```

**Accepted residual risk (not fixed, by design):** `clipCaptureState`/`clipCaptureText`/
`clipCaptureTabId` are plain in-memory variables, not persisted to
`chrome.storage.session` the way `speechState` is. If the MV3 service worker respawns
*during* the one specific capture attempt whose `getDisplayMedia` picker is still open
(possible if the user takes >~30s idle to respond to it), that one attempt silently
produces no clip and no error badge — `ensureOffscreenDocument()`'s self-healing above
means the *next* "Save as audio clip" click still works normally, so this doesn't leave
the extension stuck, but the interrupted attempt itself is a real (rare, narrow-window)
exception to "never silently fail." Full correctness would mean persisting and
rehydrating this state the way `speechState` is, which is a larger change than this
feature's scope justifies right now — flagged here rather than silently accepted with no
record.

- [ ] **Step 5: Handle the offscreen document's reply messages**

In the existing `chrome.runtime.onMessage.addListener` in `background.js`, add these more
`else if` branches (after the existing `'stop'` branch, before the existing
`else if (request.selection)` branch). `background.js` owns every
`chrome.downloads.download()` and `chrome.offscreen.closeDocument()` call — `offscreen.js`
(Task 2) never calls either itself, since offscreen documents only support `chrome.runtime`:

```js
    } else if (request.message === 'capture_ready') {
        if (clipCaptureState !== 'awaiting_capture') return;
        clipCaptureState = 'capturing';
        speak(clipCaptureText, clipCaptureTabId, true);
    } else if (request.message === 'capture_cancelled' || request.message === 'capture_no_audio') {
        if (clipCaptureState !== 'awaiting_capture') { chrome.offscreen.closeDocument(); return; }
        resetClipCaptureState();
        chrome.offscreen.closeDocument();
        showErrorBadge(request.message === 'capture_no_audio'
            ? "No audio in capture — pick Entire Screen + check 'share audio'"
            : 'Clip capture cancelled');
    } else if (request.message === 'capture_finished') {
        if (clipCaptureState !== 'finishing') { chrome.offscreen.closeDocument(); return; }
        const filename = GrayTTSClipFilename.buildClipFilename(clipCaptureText, new Date());
        chrome.downloads.download({url: request.dataUrl, filename, saveAs: false}, () => {
            if (chrome.runtime.lastError) {
                console.error('GrayTTS clip download failed:', chrome.runtime.lastError.message);
                showErrorBadge('Clip download failed');
            }
            chrome.offscreen.closeDocument();
        });
        resetClipCaptureState();
    } else if (request.message === 'capture_aborted') {
        chrome.offscreen.closeDocument();
        resetClipCaptureState();
```

- [ ] **Step 6: Extend `speak()` to accept and act on `isClip`**

Change the function signature and the `'error'` / end-family branches inside its
`onEvent` handler. Current:

```js
function speak(text, tabId) {
```

becomes:

```js
function speak(text, tabId, isClip) {
```

Current `'error'` branch:

```js
                if (event.type === 'error') {
                    console.error('chrome.tts error:', event.errorMessage);
                    showErrorBadge(event.errorMessage);
                    setSpeechState('idle');
                    if (tabId !== undefined) sendClearHighlight(tabId);
```

becomes:

```js
                if (event.type === 'error') {
                    console.error('chrome.tts error:', event.errorMessage);
                    showErrorBadge(event.errorMessage);
                    setSpeechState('idle');
                    if (tabId !== undefined) sendClearHighlight(tabId);
                    if (isClip) {
                        chrome.runtime.sendMessage({message: 'abort_capture'});
                        clipCaptureState = 'finishing';
                    }
```

Current end-family branch:

```js
                } else if (event.type === 'end' || event.type === 'interrupted' || event.type === 'cancelled') {
                    setSpeechState('idle');
                    if (tabId !== undefined) sendClearHighlight(tabId);
                }
```

becomes:

```js
                } else if (event.type === 'end' || event.type === 'interrupted' || event.type === 'cancelled') {
                    setSpeechState('idle');
                    if (tabId !== undefined) sendClearHighlight(tabId);
                    if (isClip) {
                        chrome.runtime.sendMessage({message: 'stop_capture'});
                        clipCaptureState = 'finishing';
                    }
                }
```

Note: neither branch calls `resetClipCaptureState()` directly — that only happens once
`capture_finished`/`capture_aborted`/`capture_cancelled`/`capture_no_audio` actually
arrives back from the offscreen document (Step 5). Resetting immediately here, before the
offscreen document has confirmed it's actually done, would let a second "Save as audio
clip" click slip through `startClipCapture()`'s `clipCaptureState !== 'idle'` guard and
race a brand-new offscreen document into existence while the old one is still tearing down
(Chrome only allows one at a time).

- [ ] **Step 7: Syntax-check `background.js`**

Run: `node --check background.js`
Expected: no output (silent success).

- [ ] **Step 8: Commit**

```bash
git add background.js
git commit -m "Wire Save as audio clip into background.js's context menu and speak() flow"
```

---

### Task 4: Version bump, changelog, and manual Edge verification

**Files:**
- Modify: `manifest.json` (`version`, `version_name`)
- Modify: `README.md` (Version section, Change Notes)

**Interfaces:**
- None — this task packages up Tasks 1–3 for release and hands verification to Grayson. No
  new code interfaces.

- [ ] **Step 1: Bump the version**

In `manifest.json`, bump `"version"` from `"1.10"` to `"1.11"`. In the same file, update
`"version_name"` to `"1.11 (<today's local date> <current local time>)"` — e.g.
`"1.11 (2026-08-13 16:40)"` — using the actual current local date/time at the moment this
step is executed, following the existing convention documented in `README.md`'s "Version"
section (the popup footer reads this value live from the manifest).

- [ ] **Step 2: Update README**

In `README.md`, update the top "Version" line to match the new version/date, and add a new
bullet at the top of "Change Notes":

```markdown
- <today's date>: Added **"Save as audio clip"** — a new right-click context-menu item next
  to "Read with GrayTTS" that records the spoken selection as a downloaded `.webm` file.
  Since `chrome.tts` hands speech straight to the OS TTS engine with no access to the raw
  audio buffer, this works by capturing system audio via `getDisplayMedia({audio: true})`
  while the selection is read aloud — hosted in a new `chrome.offscreen` document (reason
  `DISPLAY_MEDIA`), since the MV3 service worker in `background.js` has no document context
  of its own to call `getDisplayMedia`/`MediaRecorder` from. Auto-downloads with a filename
  like `graytts-clip-2026-08-13-142201-the-quick-brown-fox.webm` (timestamp + first 4 words
  of the selection) once the reading finishes; falls back to a timestamp-only filename for
  symbol-only/non-Latin selections. Every failure path (picker cancelled, wrong picker
  choice, a capture already in progress, a `chrome.tts` error mid-capture) shows the
  existing toolbar error badge rather than failing silently. Full design:
  `docs/superpowers/specs/save-audio-clip.md`. Chrome's screen-share picker can't be
  bypassed or remembered, so every clip save requires clicking through "Entire Screen" +
  the audio checkbox — a hard platform constraint, not a bug.
```

- [ ] **Step 3: Commit the version bump**

```bash
git add manifest.json README.md
git commit -m "Bump to v1.11: Save as audio clip"
```

- [ ] **Step 4: Manual verification in a real loaded Edge extension (Grayson, not the implementing agent)**

This step needs a human at a real keyboard — an agentic worker cannot click through
Chrome's native screen-share picker or confirm real speaker audio. Reload the unpacked
extension in Edge (`edge://extensions` → reload), then run through all 7 checks from
`docs/superpowers/specs/save-audio-clip.md`'s testing plan:

1. **Golden path** — select text, right-click → Save as audio clip → Entire Screen + audio
   → speech plays → a `.webm` file lands in Downloads → play it back, confirm it matches
   the selected text.
2. **Cancel path** — trigger it, cancel/deny the picker → confirm no speech happens, the
   "Clip capture cancelled" badge shows, nothing downloads.
3. **Wrong picker choice** — pick a specific window, or leave the audio checkbox unchecked
   → confirm the "No audio in capture" badge, no speech, no download.
4. **Double-trigger** — fire "Save as audio clip" twice quickly → confirm the second shows
   "Clip capture already in progress" and is ignored, while the first still completes.
5. **Highlight/overlay still fire** on the page during a clip capture, same as a normal
   read.
6. **Regression check** — plain "Read with GrayTTS" still never shows the screen-share
   picker.
7. **Cleanup** — after any capture (success or cancelled), Edge's "you are sharing your
   screen" indicator bar disappears.

Report back pass/fail per check. Any failure means back to Task 2 or 3 to fix, then
re-verify — don't mark backlog item 7 done in `BACKLOG.md` until all 7 pass.

---

## Plan self-review notes

- **Spec coverage:** Architecture (Task 3's message flow + Task 2's offscreen document),
  Components (`offscreen.html`/`offscreen.js` in Task 2, `background.js` changes in Task
  3, manifest permissions in Task 2), File naming (Task 1), Error handling (Task 3 Step 4
  + Step 5, all five cases from the spec), Testing plan (Task 4 Step 4, all 7 checks) are
  each covered by a task above. Deferred items (network TTS provider, clickable overlay
  toggle) are intentionally out of scope per the spec and not represented here.
- **Type/interface consistency:** `GrayTTSClipFilename.buildClipFilename(text, date)`
  (Task 1) is called with `(clipCaptureText, new Date())` in `background.js` (Task 3, via
  the new `importScripts('lib/settings.js', 'lib/clipFilename.js')`) — matches. The
  `start_capture` / `stop_capture` / `abort_capture` / `capture_ready` /
  `capture_cancelled` / `capture_no_audio` / `capture_finished` / `capture_aborted`
  message names are used identically in both Task 2 (`offscreen.js`) and Task 3
  (`background.js`). `speak(text, tabId, isClip)`'s new third parameter is additive-only —
  the three pre-existing call sites (`speak(info.selectionText, tab && tab.id)` in the
  `'read'` menu branch, `speak(response.selection, tab.id)` in the hotkey handler,
  `speak(request.selection)` in the raw-selection message branch) are untouched and keep
  working with `isClip` undefined.
- **Architecture correction (made mid-implementation, after Task 2's first pass):**
  Chrome's offscreen-document reference states "the runtime API is the only extensions API
  supported by offscreen documents" — confirmed directly against
  `https://developer.chrome.com/docs/extensions/reference/api/offscreen`. The original
  version of this plan had `offscreen.js` calling `chrome.downloads.download()` and
  `chrome.offscreen.closeDocument()` directly, which would have thrown at runtime. Task
  2's implementer flagged this (DONE_WITH_CONCERNS) after independently checking Chrome's
  own docs; the fix moves both
  calls into `background.js` (Task 3), with `offscreen.js` only ever sending
  `chrome.runtime` messages. This also fixed two related races the same implementer
  flagged: a `blob:`-URL-revoked-before-download-finishes risk (replaced with a `data:`
  URL sent whole over the message channel) and a close-before-message-delivered race
  (fixed by having `background.js`, not `offscreen.js`, decide when to close).
- **Second correction (made mid-implementation, after Task 3's first pass):** Task 3's
  implementer flagged that `clipCaptureState` is plain in-memory state that a MV3
  service-worker respawn (a real, previously-encountered failure mode in this codebase —
  see `speechState`'s use of `chrome.storage.session` for the same reason) could reset
  mid-capture while `getDisplayMedia`'s picker is still open, orphaning the offscreen
  document and permanently blocking future captures (Chrome allows only one at a time).
  Fixed `ensureOffscreenDocument()` to close-then-recreate rather than reuse an existing
  document, which self-heals this on the very next attempt. A narrower residual risk (the
  one interrupted attempt itself silently produces nothing) remains and is documented as
  an accepted, scope-appropriate tradeoff rather than fixed with full state persistence.
