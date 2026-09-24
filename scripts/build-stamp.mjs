// scripts/build-stamp.mjs
// This project has no bundler/build step (plain unpacked MV3 extension), so
// there is no prebuild hook to wire this into. Run it by hand via
// `npm run stamp` after committing a change, then commit the regenerated
// build-stamp.json in a follow-up commit. See build-stamp-standard.md.
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { deriveStamp } from './build-stamp/derive.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function manifestVersion() {
  try { return JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8')).version || ''; }
  catch { return ''; }
}

function resolve() {
  const sha = process.env.BUILD_STAMP_SHA || git(['rev-parse', 'HEAD']);
  const date = process.env.BUILD_STAMP_DATE
    || git(['show', '-s', '--format=%cd', '--date=short', 'HEAD']);
  const version = process.env.BUILD_STAMP_VERSION || manifestVersion();
  return deriveStamp(sha, date, version);
}

const stamp = resolve();
if (process.argv.includes('--print')) {
  process.stdout.write(stamp.stamp + '\n');
} else {
  writeFileSync(join(root, 'build-stamp.json'), JSON.stringify(stamp, null, 2) + '\n');
  console.log('[build-stamp]', stamp.stamp);
}
