document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', e => {
        if (e.target.id === 'read-aloud') {
            let selectedText = window.getSelection().toString();
            chrome.runtime.sendMessage({selection: selectedText});
        }
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'speak_text') {
        let options = {...request.ttsSettings};
        if (options.voice) {
            options.voiceName = options.voice;
            delete options.voice;
        }
        responsiveVoice.speak(request.text, request.ttsSettings.voiceName, options);
        sendResponse({});
    } else if (request.text === 'get_selection') {
        sendResponse({selection: window.getSelection().toString()});
    }
    return true; // Keep the message channel open until sendResponse is called
});
