let extensionEnabled = true;  // Keep track of whether the extension is enabled
let ttsSettings = {};  // Store the TTS settings

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
    if (extensionEnabled) {
        speak(info.selectionText, tab && tab.id);
    }
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
        chrome.tts.pause();
    } else if (request.message === 'resume') {
        chrome.tts.resume();
    } else if (request.message === 'stop') {
        chrome.tts.stop();
        clearBadge();
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
function speak(text, tabId) {
    if (!text) return;
    if (tabId !== undefined) {
        // Capture the selection's Range on the content-script side right as speech starts,
        // since that's the last moment we can be confident the selection hasn't changed.
        chrome.tabs.sendMessage(tabId, {message: 'capture_selection_range'}, () => {
            if (chrome.runtime.lastError) { /* no content script on this tab (e.g. a chrome:// page) — ignore */ }
        });
    }
    chrome.storage.sync.get('ttsSettings', function(data) {
        const settings = (data && data.ttsSettings) || ttsSettings || {};
        const bucket = getSpeakBucket(settings);
        chrome.tts.speak(text, {
            voiceName: bucket.voiceName,
            rate: bucket.rate,
            pitch: bucket.pitch,
            volume: bucket.volume,
            onEvent: function(event) {
                if (event.type === 'error') {
                    console.error('chrome.tts error:', event.errorMessage);
                    showErrorBadge(event.errorMessage);
                    if (tabId !== undefined) sendClearHighlight(tabId);
                } else if (event.type === 'start') {
                    clearBadge();
                } else if (event.type === 'word' && tabId !== undefined) {
                    chrome.tabs.sendMessage(tabId, {
                        message: 'highlight_progress',
                        charIndex: event.charIndex,
                        length: event.length
                    }, () => { if (chrome.runtime.lastError) { /* tab navigated away mid-speech — ignore */ } });
                } else if ((event.type === 'end' || event.type === 'interrupted' || event.type === 'cancelled') && tabId !== undefined) {
                    sendClearHighlight(tabId);
                }
            }
        });
    });
}

function sendClearHighlight(tabId) {
    chrome.tabs.sendMessage(tabId, {message: 'clear_highlight'}, () => {
        if (chrome.runtime.lastError) { /* tab navigated away mid-speech — ignore */ }
    });
}

// Reads whichever settings shape happens to be in storage. Handles the case where the
// popup's per-language migration hasn't run yet (e.g. right-click/hotkey used right after
// an update, before the popup was ever reopened) by falling back to the old flat fields
// instead of silently reading an empty bucket and losing the saved voice.
function getSpeakBucket(settings) {
    if (settings.perLang) {
        return settings.perLang[settings.lang || ''] || {};
    }
    return {
        voiceName: settings.voiceName,
        rate: settings.rate,
        pitch: settings.pitch,
        volume: settings.volume
    };
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
