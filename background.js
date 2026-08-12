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

chrome.contextMenus.onClicked.addListener((info) => {
    if (extensionEnabled) {
        speak(info.selectionText);
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
function speak(text) {
    if (!text) return;
    chrome.storage.sync.get('ttsSettings', function(data) {
        const settings = (data && data.ttsSettings) || ttsSettings || {};
        chrome.tts.speak(text, {
            voiceName: settings.voiceName,
            rate: settings.rate,
            pitch: settings.pitch,
            volume: settings.volume,
            onEvent: function(event) {
                if (event.type === 'error') {
                    console.error('chrome.tts error:', event.errorMessage);
                }
            }
        });
    });
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
                    speak(response.selection);
                }
            });
        });
    }
});
