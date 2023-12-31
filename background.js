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
        let options = {...ttsSettings};
        if (options.voice) {
            options.voiceName = options.voice;
            delete options.voice;
        }
        // Add error handling
        responsiveVoice.speak(info.selectionText, ttsSettings.voiceName, options);
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'toggle') {
        extensionEnabled = !extensionEnabled;
        sendResponse({status: extensionEnabled});
    } else if (request.message === 'update_tts_settings') {
        // Save the new TTS settings to storage
        ttsSettings = request.ttsSettings;
        // Add error handling
        chrome.storage.sync.set({ttsSettings: ttsSettings}, function() {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
            }
        });
        // Apply the new TTS settings
        responsiveVoice.setDefaultVoice(ttsSettings.voiceName);
    } else if (request.message === 'pause') {
        chrome.tts.pause();
    } else if (request.selection) {
        let options = {...ttsSettings};
        if (options.voice) {
            options.voiceName = options.voice;
            delete options.voice;
        }
        // Add error handling
        responsiveVoice.speak(request.selection, ttsSettings.voiceName, options);
    }
});

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
            chrome.tabs.sendMessage(tabs[0].id, {text: 'get_selection'}, function(response) {
                let options = {...ttsSettings};
                if (options.voice) {
                    options.voiceName = options.voice;
                    delete options.voice;
                }
                // Add error handling
                responsiveVoice.speak(response.selection, ttsSettings.voiceName, options);
            });
        });
    }
});