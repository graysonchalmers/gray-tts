// offscreen.js — runs in the extension's offscreen document (see manifest.json's
// "offscreen" permission and chrome.offscreen.createDocument() in background.js).
// background.js's MV3 service worker has no document/window context of its own, so the
// getDisplayMedia()/MediaRecorder screen-audio-capture calls this feature needs have to
// happen here instead — the whole reason this file/document exists.

let mediaRecorder = null;
let recordedChunks = [];
let displayStream = null;
let clipText = '';
// Set right before mediaRecorder.stop() so the onstop handler knows whether to finalize
// and download the recording, or discard it (e.g. a mid-capture chrome.tts error).
let stopPurpose = null; // 'finalize' | 'abort'

chrome.runtime.onMessage.addListener((request) => {
    if (request.message === 'start_capture') {
        clipText = request.text || '';
        startCapture();
    } else if (request.message === 'stop_capture') {
        stopPurpose = 'finalize';
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        } else {
            cleanupAndClose();
        }
    } else if (request.message === 'abort_capture') {
        stopPurpose = 'abort';
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        } else {
            cleanupAndClose();
        }
    }
});

async function startCapture() {
    try {
        displayStream = await navigator.mediaDevices.getDisplayMedia({video: true, audio: true});
    } catch (err) {
        // User cancelled/denied the picker.
        chrome.runtime.sendMessage({message: 'capture_cancelled'});
        cleanupAndClose();
        return;
    }

    const audioTracks = displayStream.getAudioTracks();
    if (audioTracks.length === 0) {
        // Picked a specific window/tab without checking "share audio", or the chosen
        // source doesn't support audio capture at all.
        chrome.runtime.sendMessage({message: 'capture_no_audio'});
        cleanupAndClose();
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
        const url = URL.createObjectURL(blob);
        const filename = GrayTTSClipFilename.buildClipFilename(clipText, new Date());
        chrome.downloads.download({url, filename, saveAs: false}, () => {
            if (chrome.runtime.lastError) {
                console.error('GrayTTS clip download failed:', chrome.runtime.lastError.message);
            }
            URL.revokeObjectURL(url);
            cleanupAndClose();
        });
    } else {
        cleanupAndClose();
    }
}

function cleanupAndClose() {
    if (displayStream) {
        displayStream.getTracks().forEach((t) => t.stop());
        displayStream = null;
    }
    mediaRecorder = null;
    recordedChunks = [];
    stopPurpose = null;
    chrome.offscreen.closeDocument();
}
