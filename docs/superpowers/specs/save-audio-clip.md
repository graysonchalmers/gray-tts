# Design: Save spoken selection as an audio clip

_Status: approved 2026-08-13, ready for planning. Backlog item 7 in [`BACKLOG.md`](../../../BACKLOG.md)._

## Use case

Share a clip — capture a specific short selection (a paragraph, a quote) as a standalone
audio file to send to someone else. File cleanliness for a short clip matters more here
than robustness across long articles.

## Direction

**System audio capture** via `getDisplayMedia({audio: true})`, not a network TTS provider.
`chrome.tts` hands speech straight to the OS TTS engine with no access to the raw audio
buffer, so there's no "grab the buffer" path — capturing what the OS actually outputs is
the only way to get audio out of the existing `chrome.tts` pipeline without reintroducing
a network dependency.

**Explicitly deferred, not part of this design:** a second, optional network-based TTS
provider (e.g. ElevenLabs/Google/Azure) for a nicer/more natural voice. Grayson is
interested in this as a future enhancement but does not want it scoped or built now — it
would reintroduce the exact CSP/API-key dependency the `chrome.tts` migration removed, and
deserves its own design pass if picked up later.

### Feasibility spike (done, passed)

Before committing to this direction, a throwaway test page
(`audio-capture-spike.html`, project root, not committed) verified that
`getDisplayMedia({video: true, audio: true})` with "Entire Screen" + "Share system audio"
actually captures Windows SAPI voice audio (what `chrome.tts` plays through) — confirmed
2026-08-13: the recorded clip contained clear, audible speech. This was the one binary
blocker for the whole direction; it's cleared.

**Known hard constraint (not a bug, not fixable):** Chrome's screen-share picker cannot be
bypassed, pre-approved, or remembered across uses — every single clip save requires
clicking through "Entire Screen" + the audio checkbox, even once this is fully automated.
This is a Chromium security constraint on `getDisplayMedia`, not an implementation gap.

## Architecture

A new context-menu item, **"Save as audio clip"**, sits alongside the existing "Read with
GrayTTS" (added in `background.js`'s `createContextMenu()`). Flow when selected:

1. `background.js` captures the selection text (as it does today) and ensures an offscreen
   document exists via `chrome.offscreen.createDocument()` (reason `DISPLAY_MEDIA`),
   reusing one if already open (Chrome allows only one offscreen document per extension).
2. `background.js` messages the offscreen document to start capture.
3. `offscreen.js` calls `getDisplayMedia({video: true, audio: true})` — this is what shows
   the "Entire Screen + share system audio" picker. Because this call happens in direct
   response to the context-menu click, Chrome grants the offscreen document the transient
   activation `getDisplayMedia` requires without any extra click.
4. Once the picker resolves, `offscreen.js` extracts the audio track, starts a
   `MediaRecorder` on an audio-only `MediaStream`, and messages `background.js` that
   capture is ready.
5. Only now does `background.js` call `chrome.tts.speak()` — the same `speak()` path as a
   normal read, including the existing highlight/overlay relay to the source tab (no
   reason to lose that during a capture).
6. On `chrome.tts`'s `'end'` / `'interrupted'` / `'cancelled'` / `'error'` event,
   `background.js` messages the offscreen document to stop. `offscreen.js` finalizes the
   `.webm` blob, stops all stream tracks (this is what clears Chrome's "you are sharing
   your screen" indicator bar), and hands the finished recording back to `background.js` as
   a base64 `data:` URL over `chrome.runtime.sendMessage`.
7. `background.js` — not `offscreen.js` — calls `chrome.downloads.download()` to save the
   file and `chrome.offscreen.closeDocument()` to tear down the offscreen document.
   **This ownership split is load-bearing, not a style choice:** offscreen documents only
   support the `chrome.runtime` API (per Chrome's own offscreen-document reference), so
   `offscreen.js` cannot call `chrome.downloads` or `chrome.offscreen` itself — it can only
   ever send a `chrome.runtime` message and let `background.js` act on it.

Two new manifest permissions: `offscreen`, `downloads`.

## Components

- **`offscreen.html`** — no visible UI, just loads `offscreen.js`.
- **`offscreen.js`** — owns the `MediaStream`/`MediaRecorder` lifecycle: `startCapture()`,
  listens for `background.js`'s `start_capture` / `stop_capture` / `abort_capture`
  messages. Only ever calls `chrome.runtime.sendMessage()` in response — never
  `chrome.downloads` or `chrome.offscreen` (unsupported inside an offscreen document).
  Hands a finished recording to `background.js` as a base64 `data:` URL.
- **`background.js`** — new case in the context-menu listener for a `'save-clip'` menu id,
  a state flag (idle → awaiting-capture → capturing → finishing) so a normal "Read with
  GrayTTS" click and a "Save as audio clip" click can't interfere with each other and so a
  second "Save as audio clip" click while one is already running is ignored rather than
  racing, and now also owns the `chrome.downloads.download()` and
  `chrome.offscreen.closeDocument()` calls (see Architecture above).
- **`manifest.json`** — add `"offscreen"` and `"downloads"` to `permissions`.

## File naming and format

Native `MediaRecorder` output — `.webm` (Opus audio) — used as-is, no conversion. Plays
fine in browsers, VLC, and most modern messaging apps; revisit only if a specific target
app turns out not to accept it.

Filename: `graytts-clip-<YYYY-MM-DD-HHmmss>-<first-4-words-slugified>.webm`, e.g.
`graytts-clip-2026-08-13-142201-the-quick-brown-fox.webm`. Saved to the browser's default
Downloads folder, no subfolder, `saveAs: false` (auto-downloads with zero extra clicks).

## Error handling

Every failure path reuses the existing `showErrorBadge()` mechanism (the same red toolbar
badge + tooltip a failed `chrome.tts.speak()` already shows) — consistent with the North
Star of never failing silently:

- **Picker cancelled/denied** → no speech happens at all (this was a save request, not a
  read request). Badge: "Clip capture cancelled."
- **Wrong picker choice** (a specific window/tab instead of Entire Screen, or the audio
  checkbox left unchecked) → no audio track comes through (same check the spike page
  does). Aborted before speaking. Badge: "No audio in capture — pick Entire Screen + check
  'share audio'."
- **`chrome.tts` errors mid-capture** (existing error path) → the in-progress recording is
  discarded via `abort_capture` (not downloaded as a broken/silent file), in addition to
  the existing badge behavior.
- **Second "Save as audio clip" trigger while one is already running** → ignored, with a
  quick badge ("Clip capture already in progress") rather than racing two captures.
- **`chrome.downloads.download()` fails** (disk full, permissions) → badged the same way.
- **A normal, successful read finalizes with nothing actually recorded** (e.g. an
  extremely short selection) → distinct from an explicit abort (which is already
  explained by whatever error triggered it) — badged as "Clip too short to save" rather
  than silently producing nothing, since a successful `chrome.tts` read with no error of
  its own would otherwise leave no signal that the save itself failed.
- **`ensureOffscreenDocument()`/`chrome.offscreen.createDocument()` itself rejects**
  (rare) → badged as "Clip capture failed to start" and state resets, rather than
  leaving every subsequent "Save as audio clip" click permanently blocked.

## Testing plan

Can't be meaningfully tested with a throwaway static page like the highlight/overlay
features were — this depends on real `chrome.offscreen`, `chrome.tts`, and `contextMenus`
behavior. Built directly in the extension, verified manually in a loaded Edge:

1. **Golden path** — select text, right-click → Save as audio clip → Entire Screen + audio
   → speech plays → file lands in Downloads → play it back, confirm it matches the
   selected text.
2. **Cancel path** — trigger it, cancel/deny the picker → confirm no speech, badge shows,
   nothing downloads.
3. **Wrong picker choice** — pick a specific window, or leave the audio box unchecked →
   confirm the "no audio" badge, no speech, no download.
4. **Double-trigger** — fire it twice quickly → confirm the second is ignored/badged and
   the first still completes cleanly.
5. **Highlight/overlay still fire** during a clip capture, same as a normal read.
6. **Regression check** — plain "Read with GrayTTS" still never shows a picker.
7. **Cleanup** — after any capture (success or cancel), Edge's "you are sharing your
   screen" indicator bar actually disappears.
8. **Empty recording** — Save as audio clip on a very short selection (a word or two) →
   confirm either a valid (if brief) file downloads, or the "Clip too short to save"
   badge shows — either is fine, silence is not.

## Out of scope / deferred

- **Network TTS provider for a nicer voice** — future item, not this design (see
  Direction above).
- **Clickable word overlay as a pause/play toggle** — new idea raised during this
  brainstorm (click the overlay word to freeze + highlight red, click again to resume).
  Unrelated to save-to-audio; logged as a new `BACKLOG.md` item instead of folded in here.
