importScripts('lib/settings.js', 'lib/clipFilename.js');

let extensionEnabled = true;  // Keep track of whether the extension is enabled
let ttsSettings = {};  // Store the TTS settings
// The tabId of whatever speak() call is currently active, or undefined if nothing is
// speaking/paused, or if the active speech has no source tab (Preview). Lets the top-level
// pause/resume message handlers below (already triggered by the popup's button) relay a
// speech_paused/speech_resumed message to the right tab for the clickable overlay — set
// here rather than read from chrome.tts's own event data, since pause/resume aren't
// reliably fired by every voice/engine (see setSpeechState's existing comment on the same
// gap for 'word' events).
let currentSpeakingTabId = undefined;
// Monotonically-increasing token identifying the most recent speak() call. tabId alone can't
// tell two utterances in the same tab apart (e.g. interrupting a still-speaking read with a
// fresh one) — only this token lets a terminal onEvent from an older, superseded speak() call
// recognize it's stale and avoid clobbering currentSpeakingTabId out from under the newer call.
let speakSeq = 0;

// State for the in-progress "Save as audio clip" flow, if any. 'idle' the rest of the
// time. A second save-clip trigger while this isn't 'idle' is ignored (see
// startClipCapture) rather than racing two offscreen captures against each other.
// 'finishing' covers the gap between telling the offscreen document to stop/abort and it
// actually confirming that back (capture_finished/capture_empty/capture_aborted) —
// without this state, a save-clip trigger during that gap could race a second offscreen
// document into existence before the first one's teardown message arrives.
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
    try {
        await ensureOffscreenDocument();
        chrome.runtime.sendMessage({message: 'start_capture'});
    } catch (err) {
        // ensureOffscreenDocument()/createDocument() rejecting is rare, but the
        // popup's save-clip message handler calls startClipCapture() without awaiting or
        // catching it — an uncaught rejection here would wedge clipCaptureState at
        // 'awaiting_capture' forever (every later save-clip click would hit the guard
        // above with no way out, since this failure never reaches the 'idle' state the
        // self-healing in ensureOffscreenDocument() depends on).
        console.error('GrayTTS clip capture failed to start:', err);
        showErrorBadge('Clip capture failed to start');
        resetClipCaptureState();
    }
}

function resetClipCaptureState() {
    clipCaptureState = 'idle';
    clipCaptureText = null;
    clipCaptureTabId = null;
}

chrome.runtime.onInstalled.addListener(() => {
    createContextMenu();
    // Get the current TTS settings from storage
    chrome.storage.sync.get('ttsSettings', function(data) {
        if (data.ttsSettings) {
            ttsSettings = data.ttsSettings;
        }
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!extensionEnabled) return;
    speak(info.selectionText, tab && tab.id);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'toggle') {
        extensionEnabled = !extensionEnabled;
        sendResponse({status: extensionEnabled});
    } else if (request.message === 'update_tts_settings') {
        // Save the new TTS settings to storage
        ttsSettings = request.ttsSettings;
        chrome.storage.sync.set({ttsSettings: ttsSettings}, function() {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
            }
        });
    } else if (request.message === 'pause') {
        if (clipCaptureState === 'capturing') return;
        chrome.tts.pause();
        // Set state here rather than waiting for chrome.tts's own 'pause' event — not every
        // voice/engine reliably fires it (same class of gap as 'word' events being
        // voice-dependent), and we already know the outcome: we just asked it to pause. Both
        // the popup's Pause button and the overlay's click handler (content.js) send this
        // message, and neither guarantees speech is actually 'speaking' at the time (e.g. a
        // stale/duplicate click). That's fine — chrome.tts.pause() on an already-paused or
        // idle utterance is a safe no-op, so an invalid transition here is harmless.
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
    } else if (request.message === 'save_clip_from_popup') {
        getActiveTabSelectionText((text, tabId) => {
            if (!text) { sendResponse({error: 'No text selected on the page'}); return; }
            startClipCapture(text, tabId);
            sendResponse({ok: true});
        });
        return true; // keep the message channel open for the async response above
    } else if (request.message === 'stop') {
        chrome.tts.stop();
        clearBadge();
        setSpeechState('idle');
    } else if (request.message === 'capture_ready') {
        if (clipCaptureState !== 'awaiting_capture') { chrome.offscreen.closeDocument(); return; }
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
    } else if (request.message === 'capture_empty') {
        if (clipCaptureState !== 'finishing') { chrome.offscreen.closeDocument(); return; }
        resetClipCaptureState();
        chrome.offscreen.closeDocument();
        showErrorBadge('Clip too short to save — nothing was recorded');
    } else if (request.message === 'capture_aborted') {
        if (clipCaptureState === 'capturing') {
            // The MediaRecorder stopped on its own — most likely the user clicked "Stop
            // sharing" on the browser's own screen-share indicator bar mid-capture,
            // ending things outside our own stop_capture/abort_capture flow entirely.
            // chrome.tts may still be speaking. Badge it — an explicit abort_capture we
            // sent ourselves (state already 'finishing' by the time this arrives, see
            // speak()) is handled by the branch below with no new badge, since
            // speak()'s own error handling already explained that one.
            chrome.offscreen.closeDocument();
            resetClipCaptureState();
            showErrorBadge('Clip capture stopped — screen sharing ended');
            return;
        }
        chrome.offscreen.closeDocument();
        resetClipCaptureState();
    } else if (request.selection) {
        speak(request.selection);
    }
});

// chrome.tts speaks natively via the OS/browser TTS engine, entirely inside the
// extension — unlike the old ResponsiveVoice-over-remote-audio approach, it never touches
// a page's Content Security Policy (which is what silently blocked speech on CSP-strict
// sites like GitHub).
//
// The MV3 service worker gets torn down after ~30s idle and respawns fresh on the next
// event (e.g. a context-menu click or the hotkey), which resets the in-memory
// `ttsSettings` variable back to {}. Reading storage here instead of trusting that cache
// avoids losing saved settings whenever the service worker respawns.
// tabId, when provided, is the page whose selection is being read — used to relay
// read-along highlighting (see content.js) back to that page as speech progresses. Preview
// (spoken from the popup) has no source page, so it's called without a tabId and simply
// doesn't highlight anything.
function speak(text, tabId, isClip) {
    if (!text) return;
    const mySeq = ++speakSeq;
    currentSpeakingTabId = tabId;
    // A new read must always win, even over a *paused* utterance — chrome.tts.speak() is
    // documented to auto-interrupt any in-progress speech, but empirically a paused
    // utterance doesn't reliably get interrupted that way (observed: the new speak() call
    // gets silently cancelled instead of starting, with no indication anything went wrong).
    // Explicitly stopping first means a stuck paused state can never block a fresh read.
    chrome.tts.stop();
    if (tabId !== undefined) {
        // Capture the selection's Range on the content-script side right as speech starts,
        // since that's the last moment we can be confident the selection hasn't changed.
        chrome.tabs.sendMessage(tabId, {message: 'capture_selection_range'}, () => {
            if (chrome.runtime.lastError) { /* no content script on this tab (e.g. a chrome:// page) — ignore */ }
        });
    }
    chrome.storage.sync.get('ttsSettings', function(data) {
        const settings = (data && data.ttsSettings) || ttsSettings || {};
        const bucket = GrayTTSSettings.getSpeakBucket(settings);
        chrome.tts.speak(text, {
            voiceName: bucket.voiceName,
            rate: bucket.rate,
            pitch: bucket.pitch,
            volume: bucket.volume,
            onEvent: function(event) {
                if (event.type === 'error') {
                    console.error('chrome.tts error:', event.errorMessage);
                    showErrorBadge(event.errorMessage);
                    setSpeechState('idle');
                    if (speakSeq === mySeq) currentSpeakingTabId = undefined;
                    if (tabId !== undefined) sendClearHighlight(tabId);
                    if (isClip && clipCaptureState === 'capturing') {
                        chrome.runtime.sendMessage({message: 'abort_capture'});
                        clipCaptureState = 'finishing';
                    }
                } else if (event.type === 'start') {
                    clearBadge();
                    setSpeechState('speaking');
                } else if (event.type === 'pause') {
                    setSpeechState('paused');
                } else if (event.type === 'resume') {
                    setSpeechState('speaking');
                } else if (event.type === 'word' && tabId !== undefined) {
                    chrome.tabs.sendMessage(tabId, {
                        message: 'highlight_progress',
                        charIndex: event.charIndex,
                        length: event.length,
                        showHighlight: settings.showHighlight !== false,
                        showOverlay: settings.showOverlay !== false
                    }, () => { if (chrome.runtime.lastError) { /* tab navigated away mid-speech — ignore */ } });
                } else if (event.type === 'end' || event.type === 'interrupted' || event.type === 'cancelled') {
                    setSpeechState('idle');
                    if (speakSeq === mySeq) currentSpeakingTabId = undefined;
                    if (tabId !== undefined) sendClearHighlight(tabId);
                    if (isClip && clipCaptureState === 'capturing') {
                        chrome.runtime.sendMessage({message: 'stop_capture'});
                        clipCaptureState = 'finishing';
                    }
                }
            }
        });
    });
}

// Current speech state ('idle' | 'speaking' | 'paused'), persisted to chrome.storage.session
// (survives the service worker being torn down, unlike a plain in-memory variable) so the
// popup — which is ephemeral and reopens fresh each time — can show accurate Pause/Resume
// state on open instead of the old stateless "was it paused? no way to tell" gap.
function setSpeechState(state) {
    chrome.storage.session.set({speechState: state});
}

function sendClearHighlight(tabId) {
    chrome.tabs.sendMessage(tabId, {message: 'clear_highlight'}, () => {
        if (chrome.runtime.lastError) { /* tab navigated away mid-speech — ignore */ }
    });
}

// A silently-failed speak() is exactly the failure mode this extension has fought
// hardest to avoid (see the CSP/MV3-respawn bugs in the README). Surface it on the
// toolbar icon so a failed read is never just... nothing happening.
let badgeClearTimeout = null;
function showErrorBadge(message) {
    chrome.action.setBadgeText({text: '!'});
    chrome.action.setBadgeBackgroundColor({color: '#c62828'});
    chrome.action.setTitle({title: `GrayTTS error: ${message || 'speech failed'}`});
    clearTimeout(badgeClearTimeout);
    badgeClearTimeout = setTimeout(clearBadge, 8000);
}

function clearBadge() {
    clearTimeout(badgeClearTimeout);
    chrome.action.setBadgeText({text: ''});
    chrome.action.setTitle({title: 'GrayTTS'});
}

function createContextMenu() {
    chrome.contextMenus.create({
        id: 'read',
        title: 'Read with GrayTTS',
        contexts: ['selection']  // Only show the option when text is selected
    });
}

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

// Listen for the hotkey command
chrome.commands.onCommand.addListener(function(command) {
    if (command === 'read_selection' && extensionEnabled) {
        getActiveTabSelectionText((text, tabId) => {
            if (text) speak(text, tabId);
        });
    }
});
