# Spec — Relocate "Save as audio clip" to a popup button

_Written: 2026-08-14. Design confirmed via `brainstorming`, approved by Grayson. Not yet built._

## Problem

`background.js`'s `createContextMenu()` creates two top-level context-menu items ('read'
and 'save-clip'), which Chrome/Edge automatically nests under a parent "GrayTTS" flyout
whenever an extension has 2+ top-level items. Grayson wants right-click reading to be a
single, one-more-click "Read" action with no submenu, and for "Save as audio clip" to move
somewhere else — a popup button.

## Behavior

- Right-click on selected text now shows exactly one item, "Read with GrayTTS" — no
  submenu, since it's the only top-level item the extension creates.
- The popup gains a new button, "🎙 Save as audio clip", placed in its own row directly
  below the existing Pause/Stop row. Clicking it grabs the **active tab's current text
  selection** (the same way the hotkey already does) and saves it as a clip — identical
  underlying behavior to what right-click → "Save as audio clip" used to do, just
  triggered from the popup instead.
- The popup button does **not** check the Enable/Disable toggle — matching the existing
  Preview and Pause/Resume/Stop buttons, none of which gate on `extensionEnabled` today.
- If nothing is selected on the active tab when the button is clicked, the popup shows an
  inline red error (reusing the existing `.error` banner style Preview already uses) —
  `"⚠ No text selected on the page"`. This is the **only** new failure path this feature
  introduces; every other failure mode (capture already in progress, picker
  cancelled/denied, no audio track, capture too short, etc.) already has its toolbar-badge
  handling from the original save-audio-clip feature and is unchanged — the popup doesn't
  duplicate that handling, it just doesn't prevent it from firing.

## Data flow

1. **`background.js`**: the hotkey handler's existing "get the active tab's current
   selection text" logic (`chrome.tabs.query({active:true, currentWindow:true})` →
   `chrome.tabs.sendMessage(tab.id, {text:'get_selection'})`) is extracted into a shared
   helper:
   ```js
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
   `callback(text, tabId)` — `text` is `''` when nothing usable was found (no active tab,
   no content script on that page, or no selection); `tabId` is still passed through in the
   no-selection case so a future caller could use it, even though today's two callers don't
   need it when `text` is empty.

2. The existing hotkey handler becomes a thin caller:
   ```js
   chrome.commands.onCommand.addListener(function(command) {
       if (command === 'read_selection' && extensionEnabled) {
           getActiveTabSelectionText((text, tabId) => {
               if (text) speak(text, tabId);
           });
       }
   });
   ```

3. A new branch in the existing top-level `chrome.runtime.onMessage` listener:
   ```js
   } else if (request.message === 'save_clip_from_popup') {
       getActiveTabSelectionText((text, tabId) => {
           if (!text) { sendResponse({error: 'No text selected on the page'}); return; }
           startClipCapture(text, tabId);
           sendResponse({ok: true});
       });
       return true; // keep the message channel open for the async response
   ```
   `startClipCapture(text, tabId)` (Task 3/save-audio-clip's existing function) is called
   exactly as it already is from the context-menu handler today — unchanged internally.
   Its own "already in progress" guard (`showErrorBadge('Clip capture already in
   progress')`) still applies and is NOT surfaced through this new response — only the
   empty-selection case is.

4. **`popup.js`**: new button click handler, mirroring the existing `previewError` /
   `showPreviewError` / `clearPreviewError` pattern:
   ```js
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
   document.getElementById('saveClip').addEventListener('click', () => {
       clearSaveClipError();
       chrome.runtime.sendMessage({message: 'save_clip_from_popup'}, (response) => {
           if (chrome.runtime.lastError) return; // popup already closed — nothing to show
           if (response && response.error) showSaveClipError(response.error);
       });
   });
   ```
   The `chrome.runtime.lastError` guard covers the popup closing before the async response
   arrives (e.g. the user clicked away) — a silent no-op in that case, same defensive
   pattern used everywhere else `chrome.runtime.lastError` appears in this codebase.

## Context menu changes (`background.js`)

`createContextMenu()` drops back to one item:
```js
function createContextMenu() {
    chrome.contextMenus.create({
        id: 'read',
        title: 'Read with GrayTTS',
        contexts: ['selection']
    });
}
```
`chrome.contextMenus.onClicked` drops its `info.menuItemId === 'save-clip'` branch:
```js
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!extensionEnabled) return;
    speak(info.selectionText, tab && tab.id);
});
```

## Popup UI changes (`popup.html`)

New row directly below the existing Pause/Stop group:
```html
<section class="group row">
  <button id="saveClip" class="secondary">🎙 Save as audio clip</button>
</section>
<p id="saveClipError" class="error"></p>
```
(`saveClipError` sits outside the `row` section, same as `previewError` sits outside its
own button's row today — both use the existing shared `.error` CSS class, no new styles
needed.)

## Out of scope / explicitly not doing

- No change to `startClipCapture()`, the offscreen-document flow, or any of the existing
  `capture_*` message handling — all of that is reused exactly as-is.
- No new manifest permissions or content-menu contexts.
- No gating on `extensionEnabled` for the new button, matching existing popup-button
  precedent (Preview, Pause/Resume/Stop).
- No change to the hotkey's own behavior beyond the internal refactor — it still only
  fires when `extensionEnabled` is true, still reads the active tab's selection the same
  way, still calls `speak()` the same way.

## Testing plan

Manual, in a loaded Edge extension (no automated coverage for this file, consistent with
the rest of this project):
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

## Version bump

Next available version after whatever's shipped by the time this is built — follow this
project's existing convention (see `README.md`'s "Version" section).
