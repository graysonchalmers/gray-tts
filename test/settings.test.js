const test = require('node:test');
const assert = require('node:assert/strict');
const {migrateSettings, getBucket, getSpeakBucket} = require('../lib/settings.js');

test('migrateSettings: fresh install (empty object)', () => {
    const result = migrateSettings({});
    assert.deepEqual(result, {lang: '', perLang: {'': {}}});
});

test('migrateSettings: legacy flat shape with no language filter set', () => {
    const legacy = {voiceName: 'Microsoft David', rate: 1.2, pitch: 1, volume: 0.8};
    const result = migrateSettings(legacy);
    assert.deepEqual(result, {
        lang: '',
        perLang: {'': {voiceName: 'Microsoft David', rate: 1.2, pitch: 1, volume: 0.8}}
    });
});

// Exact repro case advisor caught: a legacy flat shape with a language filter already
// active must migrate into THAT language's bucket, not always into ''. The original bug
// hardcoded '' regardless of settings.lang, which silently lost the saved voice for anyone
// with a filter set (see HANDOFF.md, part 3).
test('migrateSettings: legacy flat shape with a language filter set', () => {
    const legacy = {lang: 'en-US', voiceName: 'Microsoft Zira', rate: 1, pitch: 1, volume: 1};
    const result = migrateSettings(legacy);
    assert.equal(result.lang, 'en-US');
    assert.deepEqual(result.perLang, {
        'en-US': {voiceName: 'Microsoft Zira', rate: 1, pitch: 1, volume: 1}
    });
    assert.equal(result.perLang[''], undefined);
});

test('migrateSettings: already-migrated shape passes through unchanged', () => {
    const migrated = {lang: 'fr-FR', perLang: {'fr-FR': {voiceName: 'X', rate: 1, pitch: 1, volume: 1}}};
    const result = migrateSettings(migrated);
    assert.deepEqual(result, migrated);
});

test('migrateSettings: legacy shape only carries fields that were actually set', () => {
    const result = migrateSettings({voiceName: 'X'});
    assert.deepEqual(result.perLang[''], {voiceName: 'X'});
});

test('getBucket: returns the matching bucket', () => {
    const perLang = {'en-US': {voiceName: 'A'}, '': {voiceName: 'B'}};
    assert.deepEqual(getBucket(perLang, 'en-US'), {voiceName: 'A'});
});

test('getBucket: missing bucket falls back to {}', () => {
    assert.deepEqual(getBucket({'en-US': {voiceName: 'A'}}, 'de-DE'), {});
});

test('getBucket: missing perLang entirely falls back to {}', () => {
    assert.deepEqual(getBucket(undefined, 'en-US'), {});
});

test('getSpeakBucket: reads the active-language bucket when perLang is present', () => {
    const settings = {lang: 'en-US', perLang: {'en-US': {voiceName: 'A', rate: 1.5}}};
    assert.deepEqual(getSpeakBucket(settings), {voiceName: 'A', rate: 1.5});
});

test('getSpeakBucket: perLang present but no bucket for the active language falls back to {}', () => {
    const settings = {lang: 'de-DE', perLang: {'en-US': {voiceName: 'A'}}};
    assert.deepEqual(getSpeakBucket(settings), {});
});

// The other half of the same advisor-caught bug: right-click/hotkey speech (which reads
// via getSpeakBucket, not the popup's migration path) must not silently drop to an empty
// bucket when storage still holds the pre-migration flat shape.
test('getSpeakBucket: falls back to legacy flat fields when perLang is absent', () => {
    const settings = {voiceName: 'Microsoft David', rate: 1.2, pitch: 1, volume: 0.8};
    assert.deepEqual(getSpeakBucket(settings), settings);
});

test('getSpeakBucket: empty settings object returns undefined fields, not a throw', () => {
    assert.deepEqual(getSpeakBucket({}), {
        voiceName: undefined, rate: undefined, pitch: undefined, volume: undefined
    });
});
