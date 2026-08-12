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
3. ~~**Read-along highlighting**~~ — done 2026-08-12. Word events confirmed firing with
   a usable `charIndex` on Grayson's setup, so it got built: `background.js` relays each
   `chrome.tts` `'word'` event to the source tab; `content.js` maps the offset onto the
   captured selection `Range` and highlights it using the **CSS Custom Highlight API**
   (not DOM wrapping — never mutates the page, so it survives re-renders on
   framework-heavy pages). Only fires for right-click/hotkey reads, not the popup's
   Preview (no source page to highlight on). Offset-mapping logic verified against a
   live DOM (including a word split across inline markup) — not yet tested in the real
   loaded extension. See `README.md` change notes for full detail.
4. ~~**Queue / stop control**~~ — done 2026-08-12. Added `Resume` and `Stop` buttons
   next to `Pause`, as three independent one-shot buttons (not a stateful toggle,
   since the popup doesn't persist state across opens).
5. ~~**A backlog home**~~ — done 2026-08-12: this file.

## Edge verification status

As of 2026-08-12, Grayson confirmed items 1, 2, and 4 (voice memory, error badge,
Resume/Stop) all work in a real loaded Edge extension — general "looks good" check,
not a specific per-scenario walkthrough. Item 3 (read-along highlighting) is
code-complete and its offset math is verified against a live DOM, but the actual
highlight has **not yet been seen in a real loaded extension on a real page** — that's
the current open item. Try it on both a plain page and a JS-heavy one (e.g. Gemini),
since surviving a re-rendering page without breaking is the whole reason it uses the
CSS Highlight API instead of wrapping text in new elements.

Backlog is now fully shipped (1–5 all done). Next additions should get appended here
when a new idea comes up — this file has no reason to go stale otherwise.
