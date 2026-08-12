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

function captureSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        activeRange = sel.getRangeAt(0).cloneRange();
        return sel.toString();
    }
    activeRange = null;
    return '';
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

function clearHighlight() {
    if (highlightSupported) {
        CSS.highlights.delete(HIGHLIGHT_NAME);
    }
    activeRange = null;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.text === 'get_selection') {
        sendResponse({selection: captureSelection()});
    } else if (request.message === 'capture_selection_range') {
        captureSelection();
    } else if (request.message === 'highlight_progress') {
        highlightProgress(request.charIndex, request.length);
    } else if (request.message === 'clear_highlight') {
        clearHighlight();
    }
    return true; // Keep the message channel open until sendResponse is called
});
