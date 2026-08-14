const test = require('node:test');
const assert = require('node:assert/strict');
const {buildClipFilename} = require('../lib/clipFilename.js');

test('buildClipFilename: normal sentence uses first 4 words, slugified', () => {
    const date = new Date(2026, 7, 13, 14, 22, 1); // 2026-08-13 14:22:01 (month is 0-indexed)
    const result = buildClipFilename('The quick brown fox jumps over the lazy dog', date);
    assert.equal(result, 'graytts-clip-2026-08-13-142201-the-quick-brown-fox.webm');
});

test('buildClipFilename: fewer than 4 words uses all of them', () => {
    const date = new Date(2026, 0, 5, 9, 5, 0); // 2026-01-05 09:05:00
    const result = buildClipFilename('Hello world', date);
    assert.equal(result, 'graytts-clip-2026-01-05-090500-hello-world.webm');
});

test('buildClipFilename: strips punctuation from words', () => {
    const date = new Date(2026, 5, 1, 0, 0, 0); // 2026-06-01 00:00:00
    const result = buildClipFilename('Wait, really?! Yes indeed.', date);
    assert.equal(result, 'graytts-clip-2026-06-01-000000-wait-really-yes-indeed.webm');
});

test('buildClipFilename: collapses extra whitespace/newlines between words', () => {
    const date = new Date(2026, 7, 13, 1, 2, 3);
    const result = buildClipFilename('  Line one\n\nLine   two  ', date);
    assert.equal(result, 'graytts-clip-2026-08-13-010203-line-one-line-two.webm');
});

test('buildClipFilename: text that slugifies to nothing (symbols/non-Latin) falls back to timestamp-only', () => {
    const date = new Date(2026, 7, 13, 14, 22, 1);
    const result = buildClipFilename('!!! ??? ...', date);
    assert.equal(result, 'graytts-clip-2026-08-13-142201.webm');
});

test('buildClipFilename: empty string falls back to timestamp-only', () => {
    const date = new Date(2026, 7, 13, 14, 22, 1);
    const result = buildClipFilename('', date);
    assert.equal(result, 'graytts-clip-2026-08-13-142201.webm');
});

test('buildClipFilename: pads single-digit month/day/hour/minute/second', () => {
    const date = new Date(2026, 0, 1, 1, 1, 1); // 2026-01-01 01:01:01
    const result = buildClipFilename('hi', date);
    assert.equal(result, 'graytts-clip-2026-01-01-010101-hi.webm');
});
