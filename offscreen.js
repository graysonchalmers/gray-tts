// offscreen.js — runs in the extension's offscreen document (see manifest.json's
// "offscreen" permission and chrome.offscreen.createDocument() in background.js).
// background.js's MV3 service worker has no document/window context of its own, so the
// getDisplayMedia()/MediaRecorder screen-audio-capture calls this feature needs have to
// happen here instead — the whole reason this file/document exists.
//
// Offscreen documents only support the chrome.runtime API (Chrome's own offscreen-document
// reference states this explicitly) — chrome.downloads and chrome.offscreen itself are NOT
// usable from inside this file. Every terminal path below only ever sends a chrome.runtime
// message; background.js owns calling chrome.downloads.download() and
// chrome.offscreen.closeDocument() in response, which also means this document is never
// torn down before its own message has actually been delivered.

let mediaRecorder = null;
let recordedChunks = [];
let displayStream = null;
// Set right before mediaRecorder.stop() so the onstop handler knows whether to finalize
// and hand off the recording, or discard it (e.g. a mid-capture chrome.tts error).
let stopPurpose = null; // 'finalize' | 'abort'

chrome.runtime.onMessage.addListener((request) => {
    if (request.message === 'start_capture') {
        startCapture();
    } else if (request.message === 'stop_capture') {
        stopPurpose = 'finalize';
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        } else {
            chrome.runtime.sendMessage({message: 'capture_aborted'});
            releaseStream();
        }
    } else if (request.message === 'abort_capture') {
        stopPurpose = 'abort';
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        } else {
            chrome.runtime.sendMessage({message: 'capture_aborted'});
            releaseStream();
        }
    }
});

async function startCapture() {
    try {
        displayStream = await navigator.mediaDevices.getDisplayMedia({video: true, audio: true});
    } catch (err) {
        // User cancelled/denied the picker. background.js closes this document once it
        // receives this message — this file never calls chrome.offscreen.closeDocument()
        // itself (unsupported here, see header comment).
        chrome.runtime.sendMessage({message: 'capture_cancelled'});
        return;
    }

    const audioTracks = displayStream.getAudioTracks();
    if (audioTracks.length === 0) {
        // Picked a specific window/tab without checking "share audio", or the chosen
        // source doesn't support audio capture at all.
        chrome.runtime.sendMessage({message: 'capture_no_audio'});
        releaseStream();
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
        const reader = new FileReader();
        reader.onloadend = () => {
            // chrome.downloads isn't usable from inside an offscreen document (see header
            // comment), so hand the finished recording to background.js as a data: URL
            // string — chrome.runtime messaging can carry a plain string, but a blob:
            // object URL created here would not resolve in background.js's context, and a
            // Blob itself can't cross this message boundary either.
            chrome.runtime.sendMessage({message: 'capture_finished', dataUrl: reader.result});
            releaseStream();
        };
        reader.readAsDataURL(blob);
    } else {
        // Either an explicit abort, or a finalize with nothing recorded (e.g. chrome.tts
        // ended near-instantly) — nothing to download.
        chrome.runtime.sendMessage({message: 'capture_aborted'});
        releaseStream();
    }
}

function releaseStream() {
    if (displayStream) {
        displayStream.getTracks().forEach((t) => t.stop());
        displayStream = null;
    }
    mediaRecorder = null;
    recordedChunks = [];
    stopPurpose = null;
    // Deliberately no chrome.offscreen.closeDocument() call here — unsupported inside an
    // offscreen document (see header comment). background.js closes the document once it
    // has received one of this file's outbound messages.
}
