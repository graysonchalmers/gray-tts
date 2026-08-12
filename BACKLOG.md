# 🎯 GrayTTS — North Star & Backlog

This file is the durable home for "what's next" so it doesn't get buried in
`HANDOFF.md`'s session-log churn. `HANDOFF.md` still owns session-to-session state
(where we stopped, what's uncommitted, open questions from the last session) — this
file owns the standing roadmap. Update it whenever a backlog item ships or the
ranking changes; no need to touch it just because a session ended.

## North Star
_Proposed 2026-08-12, not yet explicitly confirmed by Grayson — treat as the working
filter for new feature ideas, but re-check before leaning on it too heavily._

**"Reading any selected text on any page out loud should take one keystroke and never
silently fail."**

Every fix this project has needed (CSP silently blocking ResponsiveVoice, the MV3
service worker silently resetting settings, the per-language migration bug, now the
visible-failure badge) has been in service of "never silently fail" — this just names
the thread that was already there.

## Backlog (ranked)

1. ~~**Voice memory per-language**~~ — done 2026-08-12. Voice/rate/pitch/volume are
   stored per language filter instead of one global bucket. Had a shipped bug (wrong
   migration bucket key), fixed same session.
2. ~~**Visible failure state**~~ — done 2026-08-12. A `chrome.tts.speak()` error sets
   a red toolbar badge + tooltip, and the popup's Preview button shows an inline error.
3. **Read-along highlighting** — blocked on a diagnostic (see below). `chrome.tts`
   supports word-boundary (`onEvent` type `'word'`) callbacks, but not every OS/engine
   voice fires them with a usable `charIndex`. If they don't fire on Grayson's setup,
   this item is dead on arrival and should be dropped or rescoped rather than built
   blind — the highlighting mechanism would need a content script running on every
   page (`content_scripts` matches `http://*/*`) relaying charIndex from background →
   content script → wrapping live text in a highlight span, which is real blast radius
   for a feature that might not even activate.
   - **Unblocking diagnostic (open):** a temporary `console.log('[GrayTTS diag] ...')`
     is sitting in `background.js`'s `onEvent` handler (as of commit `0770c73`). Read
     a paragraph aloud once, check the service worker console
     (`chrome://extensions` → GrayTTS → "service worker") for whether `'word'` events
     show up with a `charIndex`, then report back. Remove the diagnostic line either
     way once answered.
4. ~~**Queue / stop control**~~ — done 2026-08-12. Added `Resume` and `Stop` buttons
   next to `Pause`, as three independent one-shot buttons (not a stateful toggle,
   since the popup doesn't persist state across opens).
5. ~~**A backlog home**~~ — done 2026-08-12: this file.

## Edge verification status

As of 2026-08-12, Grayson confirmed items 1, 2, and 4 (voice memory, error badge,
Resume/Stop) all work in a real loaded Edge extension — general "looks good" check,
not a specific per-scenario walkthrough.

**Still open:** the word-event diagnostic. To answer it: read a paragraph aloud via
GrayTTS, then open `chrome://extensions` → GrayTTS → "service worker" → console, and
check whether `[GrayTTS diag] tts event: word charIndex: <number>` lines show up (vs.
only `start`/`end`/etc. with no `word` entries). That one data point decides whether
item 3 is buildable at all — report back what you see, then the diagnostic line gets
removed either way.
