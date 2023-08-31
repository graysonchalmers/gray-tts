document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', e => {
        if (e.target.id === 'read-aloud') {
            let selectedText = window.getSelection().toString();
            chrome.runtime.sendMessage({text: 'speak', selection: selectedText});
        }
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.text === 'speak') {
        // Your code here...
        sendResponse({});  // Send an empty response
    } else if (request.text === 'get_selection') {
        sendResponse({selection: window.getSelection().toString()});
    }
    return true; // Keep the message channel open until sendResponse is called
});
