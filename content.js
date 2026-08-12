chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.text === 'get_selection') {
        sendResponse({selection: window.getSelection().toString()});
    }
    return true; // Keep the message channel open until sendResponse is called
});
