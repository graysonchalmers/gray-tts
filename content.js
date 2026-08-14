// Lets right-click / hotkey speech highlight the word currently being spoken. Uses the
// CSS Custom Highlight API (Highlight + CSS.highlights) instead of wrapping text nodes in
// new elements, so it never touches the page's DOM structure — safe on framework-heavy
// pages (React, etc.) that re-render and would otherwise wipe out injected wrapper spans.
// Degrades silently to no highlighting on browsers/pages where it's unsupported.
const HIGHLIGHT_NAME = 'graytts-highlight';
const highlightSupported = typeof CSS !== 'undefined' && !!CSS.highlights && typeof Highlight !== 'undefined';

// The Range for whatever text is currently queued to be spoken, captured at the moment
// speech starts so later highlight_progress messages have something to map charIndex onto.
let activeRange = null;

// Report-only: returns the currently selected text without any side effects. Used to fetch
// text for a read/clip trigger before we know whether the read will actually start (e.g. a
// "Save as audio clip" trigger whose screen-share picker might still be cancelled) — must
// NOT clear the selection or touch activeRange, since capture_selection_range (below) is the
// one guaranteed point that does that, right before speech actually begins.
function captureSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        return sel.toString();
    }
    return '';
}

// The authoritative point that clones the current selection into activeRange AND clears the
// native selection. Called via the capture_selection_range message, which speak() sends
// unconditionally whenever it has a tabId — covering right-click reads, hotkey reads, and the
// internal speak() call inside a clip capture once its picker has already succeeded. Clearing
// here (not in captureSelection() above) means a trigger that never reaches this point (e.g. a
// cancelled clip-capture picker) leaves the user's selection completely untouched for an easy
// retry, and a hotkey read's earlier get_selection call no longer destroys what this needs.
function captureAndClearSelectionRange() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        activeRange = sel.getRangeAt(0).cloneRange();
        // Clear the native selection now that we've cloned what we need — otherwise it sits
        // on top of our own read-along highlight/overlay until the user clicks elsewhere.
        sel.removeAllRanges();
    } else {
        activeRange = null;
    }
}

// chrome.tts's word-event charIndex/length are positions in the exact string passed to
// chrome.tts.speak() — which is always this content script's captured Selection.toString().
// Range.toString() concatenates Text node values in document order respecting boundary
// offsets, so walking Text nodes the same way keeps our offsets in sync with what was
// actually spoken, even across inline markup (e.g. a word split by a <b> tag).
function getSubRange(baseRange, charIndex, length) {
    if (!baseRange || length <= 0) return null;
    const targetStart = charIndex;
    const targetEnd = charIndex + length;

    const walker = document.createTreeWalker(
        baseRange.commonAncestorContainer,
        NodeFilter.SHOW_TEXT,
        {acceptNode: node => baseRange.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT}
    );

    let cumulative = 0;
    let startPoint = null;
    let endPoint = null;
    let node;
    while ((node = walker.nextNode())) {
        const nodeStart = (node === baseRange.startContainer) ? baseRange.startOffset : 0;
        const nodeEnd = (node === baseRange.endContainer) ? baseRange.endOffset : node.nodeValue.length;
        const nodeLen = nodeEnd - nodeStart;
        if (nodeLen <= 0) continue;

        if (!startPoint && targetStart >= cumulative && targetStart < cumulative + nodeLen) {
            startPoint = {node, offset: nodeStart + (targetStart - cumulative)};
        }
        if (!endPoint && targetEnd > cumulative && targetEnd <= cumulative + nodeLen) {
            endPoint = {node, offset: nodeStart + (targetEnd - cumulative)};
        }
        cumulative += nodeLen;
        if (startPoint && endPoint) break;
    }

    if (!startPoint) return null;
    // chrome.tts occasionally reports a length that runs past the last text node (rounding,
    // trailing punctuation handling differs by engine) — clamp to the end of the selection
    // rather than dropping the highlight for the last word.
    if (!endPoint) endPoint = {node: baseRange.endContainer, offset: baseRange.endOffset};

    const subRange = document.createRange();
    try {
        subRange.setStart(startPoint.node, startPoint.offset);
        subRange.setEnd(endPoint.node, endPoint.offset);
    } catch (e) {
        return null;
    }
    return subRange;
}

function highlightProgress(charIndex, length) {
    if (!highlightSupported || !activeRange) return;
    const subRange = getSubRange(activeRange, charIndex, length);
    if (subRange) {
        CSS.highlights.set(HIGHLIGHT_NAME, new Highlight(subRange));
    }
}

// Bottom-center "spoken word" display, alongside (not replacing) the in-page highlight.
// Lazily built on first use inside a Shadow DOM root so it's immune to the host page's CSS —
// same reasoning as the CSS Custom Highlight API choice above, matters on framework-heavy
// pages like Gemini.
let overlayHost = null;
let overlayText = null;
// Whether the overlay is currently showing its "paused" look (red text, frozen word).
// Tracks confirmed state only — flipped by the speech_paused/speech_resumed messages in the
// listener below, never optimistically on click, so the overlay never lies about state if
// chrome.tts.pause()/resume() were to silently fail for some reason.
let overlayPaused = false;

function ensureOverlay() {
    if (overlayHost) return overlayText;
    overlayHost = document.createElement('div');
    overlayHost.style.cssText = 'position: fixed; bottom: 20px; left: 50%; ' +
        'transform: translateX(-50%); pointer-events: none; z-index: 2147483647; display: none;';
    const shadow = overlayHost.attachShadow({mode: 'open'});
    const style = document.createElement('style');
    style.textContent = `
        div { background: rgba(20, 20, 24, 0.9); border-radius: 8px;
              box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4); color: #fff; font-weight: bold;
              font-size: 22px; padding: 8px 22px; font-family: system-ui, sans-serif;
              pointer-events: auto; cursor: pointer; }
    `;
    overlayText = document.createElement('div');
    overlayText.addEventListener('click', (event) => {
        event.stopPropagation();
        chrome.runtime.sendMessage({message: overlayPaused ? 'resume' : 'pause'});
    });
    shadow.appendChild(style);
    shadow.appendChild(overlayText);
    document.body.appendChild(overlayHost);
    return overlayText;
}

function renderOverlay(charIndex, length) {
    if (!activeRange) return;
    const subRange = getSubRange(activeRange, charIndex, length);
    const word = subRange && subRange.toString();
    if (!word) return;
    const textEl = ensureOverlay();
    textEl.textContent = word;
    overlayHost.style.display = 'block';
}

// Sets the overlay's paused/not-paused look. Only ever called from the speech_paused/
// speech_resumed message handler below — never from the click handler itself, so the
// overlay's color always reflects background.js's confirmed chrome.tts state, not an
// optimistic guess about whether pause()/resume() actually took effect.
function setOverlayPausedStyle(paused) {
    if (!overlayText) return;
    overlayText.style.color = paused ? '#ff5555' : '#fff';
}

function clearOverlay() {
    if (overlayHost) overlayHost.style.display = 'none';
    overlayPaused = false;
    setOverlayPausedStyle(false);
}

function clearHighlight() {
    if (highlightSupported) {
        CSS.highlights.delete(HIGHLIGHT_NAME);
    }
    clearOverlay();
    activeRange = null;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.text === 'get_selection') {
        sendResponse({selection: captureSelection()});
    } else if (request.message === 'capture_selection_range') {
        captureAndClearSelectionRange();
    } else if (request.message === 'highlight_progress') {
        if (request.showHighlight) highlightProgress(request.charIndex, request.length);
        if (request.showOverlay) renderOverlay(request.charIndex, request.length);
    } else if (request.message === 'clear_highlight') {
        clearHighlight();
    } else if (request.message === 'speech_paused') {
        overlayPaused = true;
        setOverlayPausedStyle(true);
    } else if (request.message === 'speech_resumed') {
        overlayPaused = false;
        setOverlayPausedStyle(false);
    }
    return true; // Keep the message channel open until sendResponse is called
});

// Escape is a general "stop talking" panic key — works even before any overlay has
// appeared on this tab, and regardless of which tab is the one actually speaking (this
// just sends the same 'stop' message the popup's Stop button does, and background.js's
// single chrome.tts.stop() call handles the rest regardless of source tab). Registered on
// the capture phase (the trailing `true`) so a page's own keydown handler further down the
// tree calling stopPropagation() on Escape — common in modal/dialog libraries and
// framework-heavy editors — can't swallow it before it reaches here. Still never calls
// preventDefault()/stopPropagation() itself, so it never interferes with whatever the host
// page does with Escape once its own handlers run — this only ever piggybacks alongside
// them. Sending 'stop' when nothing is speaking is a harmless no-op, so this doesn't need
// to check speech state first. Ignores event.repeat so holding Escape down doesn't spam
// the message.
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !event.repeat) {
        chrome.runtime.sendMessage({message: 'stop'});
    }
}, true);
