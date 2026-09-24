const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

// scripts/build-stamp/derive.mjs is ESM; this test file is loaded by the
// project's CommonJS `node --test` harness, so pull it in dynamically.
const derivePath = path.join(__dirname, '..', 'scripts', 'build-stamp', 'derive.mjs');
const derivePromise = import('file://' + derivePath.replace(/\\/g, '/'));

// Parity vectors from build-stamp-standard.md section 7 — must match the
// other adopters (Tool-3dViewer, etc.) byte for byte, since the emoji/word
// lists are frozen and shared across every project that adopts the standard.
test('deriveStamp: vector 1 (all-zero sha)', async () => {
    const { deriveStamp } = await derivePromise;
    const result = deriveStamp('0'.repeat(40), '2026-01-01');
    assert.equal(result.stamp, '🦑 ABANDON · 000000 · 2026-01-01');
});

test('deriveStamp: vector 2 (ffffffff00000400 + zeros)', async () => {
    const { deriveStamp } = await derivePromise;
    const sha = 'ffffffff00000400' + '0'.repeat(24);
    const result = deriveStamp(sha, '2026-09-06');
    assert.equal(result.stamp, '🥁 ABANDON · ffffff · 2026-09-06');
});

test('deriveStamp: vector 3 (all-zero sha, versioned)', async () => {
    const { deriveStamp } = await derivePromise;
    const result = deriveStamp('0'.repeat(40), '2026-01-01', '1.2.0');
    assert.equal(result.stamp, 'v1.2.0 🦑 ABANDON · 000000 · 2026-01-01');
});

test('deriveStamp: vector 4 (ffffffff00000400 + zeros, versioned)', async () => {
    const { deriveStamp } = await derivePromise;
    const sha = 'ffffffff00000400' + '0'.repeat(24);
    const result = deriveStamp(sha, '2026-09-06', '1.2.0');
    assert.equal(result.stamp, 'v1.2.0 🥁 ABANDON · ffffff · 2026-09-06');
});

// Smoke-probe (per wave2-common.md): IF the committed build-stamp.json is
// present, it must be well-formed and its stamp string must match a fresh
// derivation from its own recorded sha/date/version — i.e. it wasn't
// hand-edited or corrupted after generation. It is NOT required to match
// current HEAD: this repo has no build step, so `npm run stamp` is a
// manual, occasional command (see README) and the file legitimately lags
// behind the latest commit between runs. A fresh checkout before the first
// `npm run stamp` run has no file at all, which is not a failure either.
test('build-stamp.json: internally consistent when present', async () => {
    const stampPath = path.join(__dirname, '..', 'build-stamp.json');
    let raw;
    try {
        raw = JSON.parse(readFileSync(stampPath, 'utf8'));
    } catch {
        return; // not generated yet in this checkout — see README
    }
    const { deriveStamp } = await derivePromise;
    assert.match(raw.sha, /^[0-9a-f]{40}$/);
    const fresh = deriveStamp(raw.sha, raw.date, raw.version);
    assert.equal(raw.stamp, fresh.stamp);
});
