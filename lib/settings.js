// Pure TTS-settings-shape logic, shared between the extension (loaded as a plain script —
// no bundler) and the Node test suite under test/. Same file, two environments: exports via
// module.exports under Node, attaches to a global under a browser/service-worker context.
(function (root) {

// Old flat settings shape (one global voice/rate/pitch/volume) becomes the "All languages"
// bucket so existing installs don't lose their settings. Keys the bucket by the settings'
// own `lang` (not always '') — an earlier version of this always used '' regardless of the
// active language filter, which silently dropped anyone's saved voice if they had a filter
// set (caught by advisor review, see HANDOFF.md).
function migrateSettings(settings) {
    if (settings.perLang) {
        return {lang: settings.lang || '', perLang: settings.perLang};
    }
    const legacyBucket = {};
    if (settings.voiceName !== undefined) legacyBucket.voiceName = settings.voiceName;
    if (settings.rate !== undefined) legacyBucket.rate = settings.rate;
    if (settings.pitch !== undefined) legacyBucket.pitch = settings.pitch;
    if (settings.volume !== undefined) legacyBucket.volume = settings.volume;
    const lang = settings.lang || '';
    return {lang, perLang: {[lang]: legacyBucket}};
}

function getBucket(perLang, lang) {
    return (perLang && perLang[lang]) || {};
}

// Reads whichever settings shape happens to be in storage — handles the case where the
// popup's per-language migration hasn't run yet (e.g. right-click/hotkey used right after an
// update, before the popup was ever reopened) by falling back to the old flat fields instead
// of silently reading an empty bucket and losing the saved voice.
function getSpeakBucket(settings) {
    if (settings.perLang) {
        return settings.perLang[settings.lang || ''] || {};
    }
    return {
        voiceName: settings.voiceName,
        rate: settings.rate,
        pitch: settings.pitch,
        volume: settings.volume
    };
}

const api = {migrateSettings, getBucket, getSpeakBucket};
if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
} else {
    root.GrayTTSSettings = api;
}

})(typeof self !== 'undefined' ? self : this);
