// Pure filename-generation logic for the "Save as audio clip" feature, shared between the
// extension's offscreen document (loaded as a plain script — no bundler) and the Node
// test suite under test/. Same dual-export pattern as lib/settings.js: module.exports
// under Node, attaches to a global under a browser context.
(function (root) {

function pad(n) {
    return String(n).padStart(2, '0');
}

function formatTimestamp(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-` +
        `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

// Non-Latin/symbol-only text strips down to nothing under this ASCII-only slug — that's
// fine, buildClipFilename() falls back to a timestamp-only name rather than forcing a
// transliteration step nobody asked for.
function slugifyWords(text, maxWords) {
    return text
        .trim()
        .split(/\s+/)
        .slice(0, maxWords)
        .map((word) => word.toLowerCase().replace(/[^a-z0-9]+/g, ''))
        .filter(Boolean)
        .join('-');
}

function buildClipFilename(text, date) {
    const timestamp = formatTimestamp(date);
    const slug = slugifyWords(text || '', 4);
    return slug ? `graytts-clip-${timestamp}-${slug}.webm` : `graytts-clip-${timestamp}.webm`;
}

const api = {buildClipFilename};
if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
} else {
    root.GrayTTSClipFilename = api;
}

})(typeof self !== 'undefined' ? self : this);
