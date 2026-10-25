# 🧭 Session Handoff — Tool-GrayTTS (GrayTTS)

_Last updated: 2026-08-14 15:03 CT_

## 🧭 North Star & Backlog
Moved to [`BACKLOG.md`](BACKLOG.md) — that's now the durable home for the roadmap so it
survives session-log churn here. Check it before starting new feature work. **North Star is
now Grayson-confirmed** (was previously just proposed).

## 🎯 Current state
Version **1.14**, on `main`, **pushed and level with `origin/main`** (`d44c243`) — but
**NOT yet Edge-verified**, unlike every prior session's handoff. This session built a
right-hand hotkey rebind + two new cancel paths via the full `brainstorming` → spec →
`writing-plans` → `subagent-driven-development` pipeline (4 tasks + a final whole-branch
review with 1 fix round), all reviewed clean, then pushed straight from a local Claude Code
session (no worktree — Grayson explicitly consented to working directly on `main`) on
Grayson's explicit `/github-push` invocation, ahead of the usual "hold until Edge-verified"
habit. **The 10-check manual verification list is the very next thing to run** — see
"Where we stopped" below for the full list.

**v1.14 (this session)** — hotkey suggested default moved from `Ctrl+Shift+Y` to
`Ctrl+Alt+L` (manifest.json only; Grayson's actual binding lives in
`chrome://extensions/shortcuts`, per-profile, and needs re-setting by hand). Added a shared
`stopSpeech()` helper (`chrome.tts.stop()` + clear badge + reset state), reused by the
popup's existing Stop button. Pressing the read hotkey again while speech is
speaking/paused now **always** cancels (via `chrome.tts.isSpeaking()`) instead of starting
a new read, even if the tab's selection changed. Added an **Escape** key listener in
`content.js` (capture phase, `!event.repeat` guard, never `preventDefault`/
`stopPropagation`) that sends the same `stop` message from any tab. The final whole-branch
review (dispatched on the most capable available model) caught two real Important findings
before any of this reached Grayson: `stopSpeech()` was unconditionally clearing the error
badge (a stray Escape could wipe an unread failure message), and the Escape listener was on
the bubble phase (a host page's own handler calling `stopPropagation()` could swallow it —
exactly the framework-heavy-page class this project has repeatedly had to design around).
Both fixed in one dispatch, scoped re-review confirmed clean. Full design:
`docs/superpowers/specs/hotkey-and-cancel.md`; full plan:
`docs/superpowers/plans/2026-08-14-hotkey-and-cancel.md`.

Prior state, still true — Version **1.13**, Backlog
items 1–9 are all built and Edge-verified — nothing outstanding on the pending-verification
front for the first time in several sessions. This session (2026-08-14) covered three
things: verifying + pushing the two versions left over from last session (v1.11, v1.12),
building and shipping backlog item 9 (v1.12), and a live-debugging + two-more-features pass
(v1.13) prompted by Grayson actually using the extension day-to-day.

**v1.11 (save-as-audio-clip)** — Edge-verified 2026-08-14, all 8 checks passed. The one
flagged risk (video-track-stop killing audio capture) turned out fine.

**v1.12 (clickable word-overlay pause/play, backlog item 9)** — built this session via the
full pipeline (`brainstorming` → spec → `writing-plans` → `subagent-driven-development`, 3
tasks + a final whole-branch review that caught and fixed a real Critical bug: the
`currentSpeakingTabId` tracker used `tabId` alone to decide when to clear itself, which
can't tell two utterances in the *same* tab apart — re-reading text mid-speech silently
broke the overlay's pause relay. Fixed with a per-utterance sequence token
(`speakSeq`/`mySeq`) instead. Also added a guard so pausing can't corrupt an in-progress
"Save as audio clip" recording. Edge-verified 2026-08-14, all 9 checks passed.

**v1.13 (this session, live-debugging-driven)** — after v1.11/v1.12 verified, Grayson hit a
real bug testing on a project he's actually using GrayTTS with
(`osmbench.streamlit.app/field-journal`): the read-along highlight and word overlay didn't
appear on that page, though audio still played. **Root cause:** that Streamlit page renders
its actual content inside a same-origin `<iframe>`, and `manifest.json`'s content script
never set `all_frames: true` — so `content.js` only ever ran in the top frame, never where
the real selection lived. Fixed with one line (`"all_frames": true`); `chrome.tabs.sendMessage`
already broadcasts to all frames by default, so no other code needed to change. This was a
pre-existing gap from the original v1.7/v1.8 work, not something earlier this session
introduced — it just took a real iframed page to surface it.

While verifying that fix, Grayson raised two more wanted changes, both built and shipped
this session:
1. **Clear the native page selection when a read starts** — previously the browser's own
   blue selection sat on top of GrayTTS's own highlight/overlay until you clicked elsewhere.
   `content.js`'s `captureSelection()` now clears it once the Range is cloned.
2. **Simplify the right-click menu to one item** — "Save as audio clip" used to force
   Chrome/Edge to nest both context-menu items into a "GrayTTS >" submenu. It moved to a new
   popup button ("🎙 Save as audio clip") that grabs the active tab's current selection the
   same way the hotkey already does; right-click is now a single "Read with GrayTTS" click.

**A whole-branch review of change #2 caught something bigger than its own scope**: the
naive fix for #1 (clearing selection on `get_selection`) was *also* silently breaking
read-along highlight/overlay for every hotkey-triggered read — not just the new popup
button — because `captureSelection()` was called twice per hotkey read (once to fetch text,
once to capture the Range) and the first call's clear destroyed what the second call
needed. Root-cause fixed by splitting into a report-only read (`captureSelection()`, no side
effects) and a capture-and-clear (`captureAndClearSelectionRange()`, the one point
guaranteed to run right before speech actually starts, for every trigger path). This also
fixed the reviewer's original finding for free (a cancelled clip-capture picker no longer
clears the selection either, since that point is never reached).

All of v1.13 is Edge-verified (2026-08-14, alongside the v1.11/v1.12 re-check) and pushed.

Backlog item 8 (desktop companion, `Util-GrayTTS-Desktop`) got a note this session too:
Grayson explicitly wants all of this session's browser-side improvements (especially the
clickable pause/play toggle) ported there eventually — not started, not scoped, logged in
that project's own memory file. Desktop's overlay is architecturally different (a Win32 GUI
window, not a webpage element) and has no pause/resume concept at all today, so porting
means designing real pause/resume there first — bigger than the browser side was. That
project also still has an **unfixed cloud-voice word-fragmentation bug** flagged as
higher-priority than the port (see that project's own `HANDOFF.md`/memory).

Since the last full handoff update, three more versions shipped before v1.11-v1.13:
- **v1.8** (`6555f3c`) — the **word overlay** got built per the locked design below: bottom-center
  Shadow-DOM box showing the current spoken word, independently toggleable alongside the in-page
  highlight via two new popup checkboxes. Spec landed at `docs/superpowers/specs/word-overlay.md`.
- **v1.9** (`053f4a8`) — a new read now overrides a paused utterance instead of getting stuck,
  and Pause/Resume merged into one state-aware toggle (superseding the earlier three-button call).
- **v1.10** (`532bc60`) — unlogged session, reconstructed from git: moved the Pause/Stop button
  row to the top of the popup (above the language filter, was previously above the hotkey hint),
  and changed the footer attribution from "Made by ChatGPT and Grayson Chalmers" to "Made by
  Grayson Chalmers and coding agents." Pure UI polish — no functional change. No session log
  entry exists for this commit; unclear whether it was prompted by the v1.8/v1.9 Edge check
  below or a separate unlogged session.

**v1.8/v1.9/v1.10 are now Edge-verified (2026-08-13).** Grayson confirmed all four checks pass:
overlay appears on right-click read and its checkbox toggles it, highlight checkbox toggles
independently, Pause becomes Resume, and a new read while paused actually speaks. v1.10's origin
(button reorder + attribution text) is still unconfirmed but is no longer blocking anything.

Older context (still true) — GrayTTS speaks natively via `chrome.tts`. Popup got a full visual
pass (commit `80d516f`), then three backlog items were built:
1. **Per-language voice memory** — voice/rate/pitch/volume stored per language
   (`ttsSettings.perLang[lang]`), keyed off the Language filter dropdown. Switching the filter
   recalls what you last used for that language. Old single-bucket settings auto-migrate on
   first load.
2. **Visible failure state** — a `chrome.tts.speak()` error sets a red badge + tooltip on the
   toolbar icon, and the popup's Preview button shows an inline red error on failure.
2b. **Migration bug fix** (found by advisor review before Grayson ever saw it) — the legacy
   settings shape was migrating into the wrong bucket key (always `''` instead of whatever
   language filter was active), which meant anyone with a language filter already set would
   have silently lost their saved voice on first load. Also fixed: migration wasn't being
   persisted immediately, and `background.js` had no fallback for reading the still-legacy
   shape, so right-click/hotkey speech could fall back to the system default voice before the
   popup was ever reopened. Regression-tested with a standalone Node script covering the exact
   repro case (see `README.md` change notes) — not committed, was throwaway.
4. **Stop / Resume controls** — added `Resume` (`chrome.tts.resume()`) and `Stop`
   (`chrome.tts.stop()`) buttons next to the existing `Pause`. Popup is ephemeral (no state to
   sync across opens), so these are separate one-shot buttons rather than a stateful toggle —
   deliberately avoids the fragility a Pause/Resume toggle would need.

Grayson confirmed on his setup the service worker console showed real `'word'` events with
`charIndex` values, so backlog item #3 (**read-along highlighting**) got built: the currently-
spoken word is now highlighted live on the page for right-click/hotkey reads, using the CSS
Custom Highlight API (no DOM mutation — safe on React-heavy pages like Gemini, which is
literally where this session's false-alarm `rvApiKey` scare happened — see below). Full
technical detail in `README.md`'s change notes; ranking/status in `BACKLOG.md`.

Also this session: Grayson saw an `Uncaught ReferenceError: rvApiKey is not defined` error on
`gemini.google.com` pointing at `responsivevoice.js` — alarming since that file was removed
back in the `chrome.tts` migration. Traced it to a **false alarm**: confirmed via Edge's Secure
Preferences that the extension loads from the correct, current `C:\Projects-local\Tool-GrayTTS`
folder (no responsivevoice.js anywhere on it), and the actual cause was a stale DevTools
console entry (likely "Preserve log") that survived an extension reload + tab refresh. Clearing
the console and hard-refreshing confirmed it's gone. Not a regression, no code changed for this.

Current version: 1.7 (2026-08-12 05:20, commit `52bd64c`, pushed). Grayson confirmed
2026-08-12 that per-language voice memory, the error badge, Resume/Stop, and now read-along
highlighting all work in a real loaded Edge extension.

## 📌 Where we stopped
v1.14 is code-complete, reviewed clean at every level (4 task reviews + 1 final
whole-branch review + 1 scoped fix re-review), and pushed to `origin/main` (`d44c243`,
confirmed synced: `git rev-list --left-right --count origin/main...HEAD` → `0  0`). **Not
yet run through a real loaded Edge extension.** This is the one loose end from this
session — pushing ahead of verification was an explicit, one-off deviation from the usual
habit (Grayson invoked `/github-push` directly), not a new standing policy.

**The manual verification checklist for next session (or Grayson directly) — 10 checks:**
1. Set the hotkey to `Ctrl+Alt+L` in `edge://extensions/shortcuts`, reload the unpacked
   extension. Select text, press it → speech starts.
2. While speaking, press it again → stops immediately.
3. While speaking, select *different* text, press it → still just stops, doesn't read the
   new selection.
4. Start a read, click **Pause** in the popup, press the hotkey → cancels, doesn't start a
   new read. (Tests the load-bearing assumption that `chrome.tts.isSpeaking()` reports
   `true` while paused, not just while actively speaking.)
5. Start a read, press **Escape** → stops.
6. Start a read on Tab A, switch to Tab B, press Escape there → Tab A's speech stops.
7. Press Escape with nothing speaking → nothing happens, and any existing error badge on
   the toolbar icon stays visible (this is what the final-review fix specifically gates).
8. Start "Save as audio clip," press Escape mid-capture → a partial clip downloads (same as
   clicking Stop today — it does not abort with nothing saved).
9. Mid-read, force-terminate the service worker in `edge://extensions`, press Escape →
   confirm the overlay/highlight on the page still clears.
10. Regression check: popup's Stop/Pause/Resume and right-click read still work unchanged.

There's also a genuinely **unstarted** second thread from this session: Grayson asked
whether the desktop companion's (`Util-GrayTTS-Desktop`) caption/overlay view should be
redesigned center-anchored (active word fixed in the middle, sentence streaming off to the
right) instead of the current layout. This was never brainstormed — got deferred in favor
of finishing the hotkey/cancel work first. Needs its own `brainstorming` session in that
project, not this one.

## ▶️ Next concrete step
1. **Run the 10-check manual verification list above** in a real loaded Edge extension —
   nothing else should be built on top of v1.14 until this passes, since it's already
   pushed and live for anyone tracking `origin/main`.
2. **Brainstorm the desktop companion's caption/overlay redesign** (center-anchored word,
   sentence streams right) — raised this session, not yet scoped. Run in
   `Util-GrayTTS-Desktop`, not here; check that project's own `HANDOFF.md`/memory first
   (it has an unfixed cloud-voice word-fragmentation bug flagged as higher-priority than
   any overlay work — see below).
3. Also still open from prior sessions, lower priority: port the browser extension's
   pause/play improvements to the desktop companion (see Open questions), and the
   still-unverified V: backup first run.

### Word-overlay design (locked 2026-08-12; since built in v1.8 — kept for reference)
- **Settings:** two independent checkboxes in the popup — "Highlight word on page" and "Show
  word overlay" — in a new `<section class="group">` between the rate/pitch/volume sliders and
  the Enable/Disable button. Stored as top-level `ttsSettings.showHighlight` /
  `ttsSettings.showOverlay` booleans (global, not per-language). Missing key = `true` (both on
  by default, no migration step needed — existing installs keep highlighting and gain the
  overlay automatically).
- **Data flow:** `background.js`'s `speak()` already reads `settings` before calling
  `chrome.tts.speak()`; read `showHighlight`/`showOverlay` there too (default `!== false`) and
  attach both as flags on the existing `highlight_progress` message — no new message type.
  `content.js`'s handler gates the existing CSS-highlight call and a new overlay-render call
  independently. Same scope as today: only fires when `tabId` is set (right-click/hotkey), so
  Preview is untouched. Word text for the overlay is free — `getSubRange()` already returns the
  matching `Range`, so `subRange.toString()` is the spoken word.
- **Rendering:** new `renderOverlay(word)` / folded into the existing `clearHighlight()` for
  hiding, in `content.js`. Lazily-created host element with a **Shadow DOM** root (isolates
  from host-page CSS, same reasoning as the CSS Custom Highlight API choice for the in-page
  highlight — matters on framework-heavy pages like Gemini). `pointer-events: none`, very high
  `z-index`, fixed `bottom: 20px; left: 50%; transform: translateX(-50%)`.
- **Visual style** (chosen via the brainstorming skill's visual companion, Grayson clicked
  through mockups): dark rounded box (`rgba(20,20,24,0.9)`, `border-radius: 8px`, drop shadow),
  white bold **22px** text (the "compact" size, not the larger 30px/42px options shown), padding
  `8px 22px`. Runs *alongside* the in-page highlight, not replacing it — independently toggled.
- **Testing plan:** throwaway static test page in the Browser pane first (same approach used
  for the original highlight feature), then real verification in a loaded Edge extension —
  both checkboxes independently, plus confirming Preview stays unaffected.

## ❓ Open questions
- **v1.14 not yet Edge-verified** — pushed ahead of manual testing this session (explicit
  one-off, not new policy). See the 10-check list under "Where we stopped."
- **Desktop caption/overlay redesign** — center-anchored active word, sentence streaming
  right — raised this session, not yet brainstormed or scoped. Separate project
  (`Util-GrayTTS-Desktop`), separate session.
- **Desktop-companion port** — Grayson wants this session's browser-side improvements
  (clickable overlay pause/play especially) mirrored in `Util-GrayTTS-Desktop`, explicitly
  confirmed but not yet scoped or started. See Next concrete step above.
- **Minor findings parked, not acted on** (from this session's final review, low-priority):
  a content script whose extension context was invalidated (e.g. after an unpacked reload)
  logs an uncaught console error on Escape rather than failing silently; the hotkey-cancel
  path is gated by the `extensionEnabled` toggle while Escape/Stop aren't (pre-existing gate
  placement, arguably correct); the spec/README slightly overstate "any tab"/"unaffected"
  scope (excludes `chrome://` pages and the popup's own Preview, which the new cancel paths
  do actually affect); the capture-phase Escape listener is still swallowable by a page's
  own `window`-level capture listener calling `stopImmediatePropagation` (narrower edge case
  than the bug that was actually fixed).
- **Scope note, not a bug:** right-click "Read with GrayTTS" while something's already
  speaking still interrupts and reads the new selection immediately — the "always cancel"
  rule from this session only applies to the hotkey, by design (per the approved spec).
- **Selection-clearing edge case (out-of-scope observation from the last review, not
  blocking):** the page selection could theoretically change between a popup save-clip's
  `get_selection` snapshot (used for the spoken/clipped text) and the later
  `capture_selection_range` call that builds the highlight Range, if the user alters the
  selection while the screen-share picker dialog is open. Pre-existing two-call structure,
  not introduced by this session's fix — flagged for awareness only.
- **What prompted v1.10?** (`532bc60` — Pause/Stop button reorder + attribution text.) No
  session log entry exists for it, and it's still unconfirmed whether it was fallout from the
  v1.8/v1.9 Edge check or a separate unlogged session — low-stakes now that it's verified
  working either way, but flagging in case it matters later.
- **V: backup unverified.** `_Backup\` (see below) was written, but V: showed as
  `Unavailable` in `net use` and the UNC path `\\Moby\vault\Projects work` also didn't resolve
  from this session's shell — could be the NAS genuinely being down, or this session's shell
  not reaching the LAN the way an interactive desktop session does. Grayson said to skip
  verifying for now; first backup run is still unconfirmed whenever V: is next available.
- Does Grayson want the "many voices sound the same" issue investigated further (e.g. is it a
  Windows/Edge TTS engine limitation, or are duplicate voice entries actually distinct)? He
  said he's fine with it for now ("I love what we got") — treat as low-priority unless raised
  again.
- No test/build tooling exists for this project (it's a plain unpacked MV3 extension, no
  bundler) — confirmed intentional enough to not touch; a `.claude/launch.json` was added a
  prior session purely to preview `popup.html`'s static rendering in the Browser pane, not as a
  test harness.

## 🗂️ Changed this session (2026-08-14, part 14)
- Branch: `main` directly — no worktree this time, Grayson explicitly consented to working
  on `main` given the small scope (4 mechanical tasks). Files: `manifest.json`,
  `background.js`, `content.js`, `README.md`, plus
  `docs/superpowers/specs/hotkey-and-cancel.md` and
  `docs/superpowers/plans/2026-08-14-hotkey-and-cancel.md`.
- Answered a tangent first: confirmed via the Browser pane that both "OSM Bench" and the
  "GRIP" site are the same live Streamlit Community Cloud app at `osmbench.streamlit.app`
  (it had gone to sleep from inactivity, woke on navigation). Explored whether that could
  move off Streamlit onto Grayson's own webpage — corrected an assumption mid-conversation
  (checked `DEPLOY.md` in `C:\Projects-local\Portfolio`: the real site is a static Vite SPA
  on **Cloudflare Pages**, not Vercel, with zero backend) — Python server-side logic isn't
  directly portable there; real options are porting scoring logic to TS/Cloudflare Pages
  Functions, a separate small Python host, or an iframe embed. Not acted on further, no
  code changed for this — belongs to `OSM-bench`/`Portfolio`/`GRIP`, not this repo.
- Full `brainstorming` → spec → `writing-plans` → `subagent-driven-development` pipeline for
  the hotkey rebind + cancel-while-speaking feature (see Current state above for the full
  technical summary). 4 tasks, each with its own clean task-scoped review; 1 final
  whole-branch review (most capable available model) that caught 2 real Important findings;
  1 fix dispatch + 1 scoped re-review, confirmed clean. Version bumped to 1.14.
- Pushed directly from this local Claude Code session (`git push origin main` — no PAT/cloud
  flow needed, already on the real working tree) on Grayson's explicit `/github-push`
  invocation. Confirmed sync after push (`0  0` ahead/behind).
- Verified and pushed v1.11 (save-as-audio-clip, left over from last session).
- Built v1.12 end-to-end (backlog item 9, clickable word-overlay pause/play):
  `brainstorming` → spec → `writing-plans` → `subagent-driven-development` (3 tasks + final
  whole-branch review, 1 fix round — caught and fixed a real Critical same-tab-reread race).
  Merged to `main`, Edge-verified, pushed.
- Debugged and fixed the iframe/`all_frames` bug live (Grayson hit it testing on a real
  Streamlit project) — one-line `manifest.json` fix, root-caused via the Browser pane
  inspecting the actual failing page's DOM rather than guessing.
- Built two more small features via the same `brainstorming` → spec → plan →
  `subagent-driven-development` pipeline: clearing the native selection on read, and
  relocating "Save as audio clip" to a popup button (single-item context menu). The second
  one's final review caught that the first one's naive fix was also breaking hotkey-read
  highlighting — root-caused and fixed together as v1.13.
- Logged a durable memory note in `Util-GrayTTS-Desktop`'s own project memory: Grayson wants
  this session's improvements ported there, not yet started.

---

## 🕓 Session log
### 2026-08-14 (part 14) — Right-hand hotkey + cancel-while-speaking (v1.14), pushed unverified
- Opened on a tangent unrelated to this repo: confirmed the "OSM Bench"/"GRIP" Streamlit
  site (`osmbench.streamlit.app`) is live (it had gone to sleep, woke on navigation via the
  Browser pane), then explored moving it off Streamlit onto Grayson's own webpage. Corrected
  a wrong initial assumption (guessed Vercel; the real site is a static Vite SPA on
  Cloudflare Pages, `C:\Projects-local\Portfolio`, zero backend) before giving a grounded
  feasibility answer. No code touched — belongs to other projects, not this one.
- Grayson asked for a right-hand-reachable hotkey (currently `Ctrl+Alt+S`, entirely
  left-hand, set via `chrome://extensions/shortcuts` — not reflected in `manifest.json`,
  which still suggested the stale `Ctrl+Shift+Y` default). Also asked for two new ways to
  cancel an in-progress read: Escape, and pressing the hotkey again while already speaking.
  He also raised redesigning the desktop companion's caption view (center-anchored word,
  sentence streams right) — deferred, see Open questions, never brainstormed this session.
- Ran the full pipeline: `brainstorming` (one clarifying question resolved the "always
  cancel vs. only if selection unchanged" ambiguity in favor of always-cancel; a second
  resolved Escape's scope to "any focused tab") → spec
  (`docs/superpowers/specs/hotkey-and-cancel.md`) → `writing-plans`
  (`docs/superpowers/plans/2026-08-14-hotkey-and-cancel.md`) → `subagent-driven-development`.
  Grayson explicitly consented to working directly on `main` (no worktree) given the small,
  4-task scope, matching this repo's established direct-to-main habit.
- 4 tasks, haiku/sonnet implementers per task complexity, each with its own clean
  spec+quality review: hotkey rebind (manifest.json), `stopSpeech()` helper +
  `chrome.tts.isSpeaking()`-gated hotkey cancel (background.js), Escape listener
  (content.js), version bump + changelog (v1.14).
- Final whole-branch review (dispatched on the most capable available model, per this
  skill's Model Selection guidance) caught 2 real Important findings the task-level reviews
  missed: `stopSpeech()` was unconditionally clearing the error badge (a stray Escape with
  nothing speaking could wipe an unread failure message — the extension's only error
  surface), and the Escape listener was bubble-phase (a host page's own `stopPropagation()`
  could swallow it, the same framework-heavy-page problem this project has hit before).
  Also flagged 3 corrections to the manual-verification checklist (a missing paused-hotkey
  check, a missing service-worker-respawn check, and wrong expected wording on the
  clip-capture check) and several Minor findings, parked (see Open questions).
- Asked Grayson directly which way to resolve finding #1 (gate the badge-clear on actual
  speaking state, vs. leave it unconditional) rather than guessing — he chose gating. One
  fix dispatch covered both Important findings; one scoped re-review confirmed both
  addressed with no new breakage beyond a Minor, parked edge case.
- Committed the plan doc itself (previously missed — the `writing-plans` skill saves the
  file but doesn't commit it; caught by checking how the prior `clickable-overlay-pause`
  plan was committed, matched that convention before pushing).
- Grayson invoked `/github-push` (this being a local Claude Code session with direct repo
  access, not a Cowork/cloud session, so a plain `git push origin main` was correct — the
  `github-push` skill's PAT/clone flow is for cloud sessions without direct access). Pushed
  7 commits, confirmed synced with `origin/main`. This is **before** manual Edge
  verification, an explicit deviation from the usual "hold until verified" habit — flagged
  clearly in Current state/Where we stopped above so it isn't mistaken for a verified ship.

### 2026-08-14 (part 13) — v1.11/v1.12 verified+pushed, backlog item 9 built, live-debugging pass (v1.13)
- Picked up from part 12: v1.11 merged but unverified/unpushed, backlog item 9 raised but
  unscoped. Grayson asked specifically about the clickable overlay pause/play idea.
- Ran `brainstorming` → spec (`docs/superpowers/specs/clickable-overlay-pause.md`) →
  `writing-plans` → `subagent-driven-development` for backlog item 9. Built in worktree
  `clickable-overlay-pause`: 3 tasks (background.js relay via a `currentSpeakingTabId`
  tracker + `speakSeq` sequence token, content.js click handler + red/white state sync,
  version bump to 1.12). Final whole-branch review caught a real Critical bug — the
  original `tabId`-based clear guard couldn't tell two utterances in the same tab apart, so
  re-reading text broke the overlay relay permanently — fixed with the sequence token.
  Also added a guard against pausing mid-"Save as audio clip" capture. Merged to `main`.
- Grayson confirmed all v1.11 (8 checks) and v1.12 (9 checks) Edge-verification checks
  passed. Pushed all pending commits to `origin/main` on explicit request ("push it
  anyway" — confirmed he'd already run the checks despite the push happening first in the
  conversation's literal order).
- Grayson then reported a real bug found through actual use: highlight/overlay not
  appearing on `osmbench.streamlit.app/field-journal` (one of his own projects), audio
  still working. Used `superpowers:systematic-debugging` — ruled out a stale-extension
  reload, page-specific narrowing (works on Wikipedia, fails on that Streamlit page),
  then used the Browser pane to inspect the live page's DOM directly rather than guessing:
  found the actual content lives inside a same-origin `<iframe>`, and `manifest.json`'s
  content script never set `all_frames: true`. Fixed with one line; confirmed by Grayson.
- Grayson raised two more wanted changes while testing: clear the native selection on read
  (so GrayTTS's own highlight isn't hidden under it), and simplify the right-click menu to
  one item (move "Save as audio clip" out of the auto-generated submenu). Ran
  `brainstorming` for both — decomposed the selection-clear as a tiny sub-project (built
  directly, no subagent pipeline needed) and the menu/relocation as a full spec → plan →
  `subagent-driven-development` sub-project (3 tasks, worktree `relocate-save-clip`).
- The relocation branch's final whole-branch review caught that the selection-clear fix
  (already merged to `main` moments earlier) was *also* silently breaking read-along
  highlight/overlay for every hotkey-triggered read, not just the new popup button —
  `captureSelection()` was called twice per hotkey read and the first call's clear
  destroyed what the second call needed. Root-cause fixed by splitting into a report-only
  read and a capture-and-clear function, resolving both the reviewer's original finding and
  the broader pre-existing regression in one change. Merged as v1.13.
- Grayson confirmed all three (v1.11/v1.12/v1.13) Edge-verified in one pass ("I checked all
  that. Let's call it confirmed."), and explicitly authorized pushing before that
  confirmation had fully landed in the conversation — asked a clarifying question first
  since it deviated from the hold-until-verified house rule, got explicit "yes push anyway,"
  pushed, then he confirmed verification moments later. Updated `BACKLOG.md`'s Edge
  verification status to close out items 7 and 9 and fixed an accidental duplicate item 7
  entry introduced while editing.
- Logged a project-memory note in `Util-GrayTTS-Desktop` (backlog item 3 there): Grayson
  explicitly wants this session's improvements ported to desktop, not started/scoped yet —
  flagged that its overlay is architecturally different (Win32 GUI, not a webpage) and has
  no pause/resume concept today, and that its known cloud-voice fragmentation bug should be
  fixed first.

### 2026-08-13 (part 12) — Built and merged save-as-audio-clip (backlog item 7)
- Picked up from part 11: repo clean, backlog item 7 was the agreed next step.
- Ran `brainstorming` to scope item 7. Grayson picked **system audio capture** over a
  network TTS provider (deferred as a future item — logged in `BACKLOG.md`). Built and ran
  a throwaway feasibility spike (`audio-capture-spike.html`, project root, not committed)
  before committing to the design — confirmed `getDisplayMedia({audio:true})` with "Entire
  Screen + share system audio" actually captures Windows SAPI voice audio. Also logged a
  new backlog item 9 (clickable word-overlay pause/play toggle) raised mid-brainstorm,
  explicitly deferred rather than folded into this design.
- Wrote and committed the spec (`docs/superpowers/specs/save-audio-clip.md`): a new "Save
  as audio clip" context-menu item, hosted in a `chrome.offscreen` document since
  `background.js`'s MV3 service worker has no document context to call
  `getDisplayMedia`/`MediaRecorder` from.
- Ran `writing-plans` → 4-task plan (`docs/superpowers/plans/2026-08-13-save-audio-clip.md`).
- Ran `subagent-driven-development` in worktree `.worktrees/save-audio-clip` (branch
  `save-audio-clip`, deleted after merge): Task 1 (`lib/clipFilename.js` + Node tests, 19/19
  passing), Task 2 (`offscreen.html`/`offscreen.js`), Task 3 (wire into `background.js`),
  Task 4 (version bump to 1.11, README changelog, commit — manual Edge verification handed
  to Grayson, not agent-executable). Task review caught and fixed real bugs before they ever
  reached Edge: offscreen documents can only use `chrome.runtime` (not `chrome.downloads`/
  `chrome.offscreen` themselves — moved that ownership to `background.js`), a stale offscreen
  document could wedge all future captures after an MV3 service-worker respawn mid-picker
  (self-heals now via close-then-recreate), a successful-but-empty recording (e.g. an
  extremely short selection) produced no badge (split into a distinct `capture_empty`
  message), and an `ensureOffscreenDocument()` rejection could wedge state forever (now
  caught). The final whole-branch review found one more real gap — clicking "Stop sharing"
  on Chrome's own screen-share indicator mid-capture skipped every guard and silently reset
  state while `chrome.tts` kept talking — fixed in one more round (all clean after).
- Merged `save-audio-clip` → `main` on Grayson's explicit call ("Merge to main locally
  now"), **before** Edge verification — flagged that gap clearly first. 19/19 tests pass on
  the merged result. Worktree and branch cleaned up.
- **Not pushed** (22 commits ahead of `origin/main`) — per house rule, holding until
  Grayson runs the manual Edge verification pass. See Next concrete step above.

### 2026-08-13 (part 11) — Pickup, Edge verification confirmed, North Star reconfirmed
- Ran `pickup`: repo clean and level with `origin/main`, `HANDOFF.md` already caught up to
  v1.10 (part 10's work) — no drift this time.
- Grayson confirmed all four outstanding Edge checks passed: word overlay (v1.8) appears on
  right-click and toggles independently of highlight; pause/resume toggle (v1.9) works
  including a new read overriding a paused utterance; v1.10's popup polish reads fine. Recorded
  this in `BACKLOG.md`'s Edge verification status and closed out `HANDOFF.md`'s open questions
  on it. v1.10's origin is still technically unconfirmed but no longer blocking.
- Asked whether there's a North Star to work from — confirmed the existing one (set
  2026-08-12, unchanged) is still the right frame; no new backlog items requested. Only open
  backlog item is #7 (save-to-audio, unscoped, needs `brainstorming`).

### 2026-08-12/13 (part 10) — Backlog item 8 built as a sibling project
- Same session as part 9's doc catch-up. Grayson asked to start planning/setup for backlog
  item 8 (desktop TTS companion). Scaffolded `C:\Projects-local\Util-GrayTTS-Desktop` as its
  own git repo and built it end-to-end via `brainstorming` → spec → `writing-plans` →
  `subagent-driven-development` (9 tasks) → whole-branch review → merge to that project's own
  `main`. Grayson confirmed it works for real. Full detail lives in that project's own
  `HANDOFF.md` — not duplicated here. Marked item 8 done in `BACKLOG.md`.
- No changes to this repo's own code this session — docs-only (this entry + part 9's catch-up).
- Edge-verification status for v1.8/v1.9/v1.10 is still open from part 9 — unrelated to the
  desktop companion work, still the right next thing to confirm whenever Grayson returns to
  this project specifically.

### 2026-08-12 (part 9) — Pickup, caught HANDOFF/BACKLOG up to v1.10
- Ran `pickup`: repo clean and level with `origin/main`, but found a commit (`532bc60`, v1.10 —
  moved the popup's Pause/Stop row to the top, changed the footer attribution text) that
  post-dated the last logged session (part 8, `1996b29`) with no session-log entry of its own.
  Flagged the drift and that it's unclear whether v1.10 was fallout from the still-unconfirmed
  v1.8/v1.9 Edge check or a separate unlogged session.
- Grayson asked to catch the handoff docs up to v1.10 now rather than wait on the verification
  answer. Updated `HANDOFF.md`'s Current state / Where we stopped / Next step / Open questions
  to include v1.10 and the new open question about its origin; updated `BACKLOG.md`'s Edge
  verification status section to note v1.10 shipped too, also unverified.
- Edge-verification status for v1.8/v1.9/v1.10 is still open — first thing to confirm next
  session.

### 2026-08-12 (part 8) — Pickup, backlog item 8, handoff catch-up
- Ran `pickup`: found HANDOFF.md a session behind git — v1.8 (word overlay, `6555f3c`) and
  v1.9 (pause toggle/override fix, `053f4a8`) were built and pushed in an unlogged session;
  BACKLOG.md had partially caught up (overlay marked "pending Edge verification"). Flagged the
  drift and that the pushes predate any recorded Edge verification.
- Grayson brought a new idea: system-wide read-selected-text (any app, global hotkey).
  Assessed feasibility — global-hotkey AHK + SAPI is the right shape (Windows right-click
  shell menu can't see text selections in arbitrary apps); logged it as `BACKLOG.md` item 8.
- Grayson took the v1.8/v1.9 Edge check himself; session wrapped before the result came back.

### Earlier session context (superseded sections below preserved as history)
- Branch: `main` · Files: `BACKLOG.md` (North Star confirmed), new `.gitignore` (excludes
  `.superpowers/`, the brainstorming skill's throwaway mockup workspace) · New: `Backup\`
  (backup tooling, see below)
- **Decision:** Set up a two-layer local→V: backup (`Backup\backup-graytts.ps1` +
  `Backup\Backup GrayTTS to V.bat`, via the `project-backup` skill) mirroring to
  `V:\Projects work\GrayTTS\current\` plus dated zip snapshots in `\snapshots\` (keeps last
  10). **Named `Backup\`, not the skill's usual `_Backup\`** — Chrome/Edge refuses to load an
  unpacked extension with any root folder starting with `_` ("reserved for use by the system"),
  which is exactly what happened here; caught and fixed same session by renaming. Worth
  remembering for any future browser-extension project using this skill.
- **Decision:** North Star (in `BACKLOG.md`) explicitly confirmed by Grayson, no wording
  changes requested.
- Brainstormed (not yet built) the word-overlay feature — see "Next concrete step" above for
  the full locked-in design.

### 2026-08-12 (part 7) — Backup setup, extension-load fix, word-overlay brainstorm
- Ran `pickup`: confirmed everything through v1.7 clean and in sync with `origin/main`, no
  drift. Grayson asked to set up a project backup.
- Ran `project-backup`: wrote `_Backup\backup-graytts.ps1` + `.bat`, mirroring to
  `V:\Projects work\GrayTTS`, excluding `.git`/`node_modules`, keeping 10 snapshots. V: wasn't
  mounted in this session's shell when tested (`Test-Path 'V:\'` → false); flagged as unverified
  rather than assumed working.
- Grayson said "V: should be connected" and asked to retry — still unreachable, and this time
  traced further: `net use` showed V: mapped to `\\Moby\vault` but status **Unavailable**, and
  the raw UNC path was also unreachable. Surfaced both possibilities (NAS actually down vs. this
  session's shell not reaching the LAN) rather than guessing; Grayson said skip it for now.
- Confirmed the North Star wording in `BACKLOG.md` — no changes requested, just a sign-off.
- Grayson asked about the read-along highlighting feature again, seemingly having forgotten it
  already shipped in v1.7 — clarified it's built and working (right-click/hotkey only, not
  Preview), pointed him at how to trigger it, and used the moment to distinguish it from a
  *different* idea he was actually describing: a bottom-center single-word overlay display.
- Grayson tried loading the extension in Edge and hit `Cannot load extension with file or
  directory name _Backup. Filenames starting with "_" are reserved for use by the system.` —
  root cause: Chrome/Edge's unpacked-extension loader scans every folder under the extension
  root and rejects underscore-prefixed names, and `_Backup\` from the project-backup skill's
  default naming landed right inside `C:\Projects-local\Tool-GrayTTS` (the extension's own
  root). Fixed by renaming to `Backup\` — no code inside the scripts referenced the old name
  (`$PSScriptRoot` / `%~dp0` are both relative), so the rename was a clean `mv` with no other
  changes needed. Grayson reloaded the extension and confirmed it works.
- Grayson confirmed wanting the word-overlay feature built. Ran `brainstorming`: walked through
  design questions one at a time (overlay runs alongside the highlight, not replacing it; a
  settings toggle rather than hardcoding it on; default both-on). Used the brainstorming skill's
  visual companion (browser mockup server) for the two genuinely visual questions — overlay
  style (offered 3: minimal pill, caption bar, big spotlight — Grayson picked **spotlight** by
  clicking the mockup) and size (offered 3: 22px/30px/42px — Grayson picked **22px/compact** via
  chat after a browser click didn't register that round). Landed on two independent popup
  checkboxes (not a four-way mode picker) after discussing tradeoffs. Design detail above.
- Visual companion server exited on its own partway through (background task reported failed,
  exit 127) — didn't block anything since the visual questions were already answered by then;
  noted for awareness, not investigated further since it wasn't blocking.
- Design's last confirmation round was still open when `/wrap-up + /github-push` was invoked —
  session ended before code was written.

### 2026-08-12 (part 6) — Read-along highlighting, and a false-alarm rvApiKey scare
### 2026-08-12 (part 6) — Read-along highlighting, and a false-alarm rvApiKey scare
- Grayson reported `Uncaught ReferenceError: rvApiKey is not defined` on `gemini.google.com`,
  pointing at `extensions://<id>/responsivevoice.js` — alarming since that file was removed in
  the `chrome.tts` migration two sessions ago. Investigated methodically rather than assuming:
  confirmed via `git log`/filesystem that no copy of `responsivevoice.js` exists in the repo;
  searched common local folders for stray copies (none found); then read Edge's own
  `Secure Preferences` JSON for the extension ID in the error and confirmed it's loading from
  exactly `C:\Projects-local\Tool-GrayTTS` — the correct, current folder. Ruled out a duplicate
  install. Landed on the real cause: a stale DevTools console entry (consistent with "Preserve
  log" being on) that survived an extension reload + tab refresh. Confirmed resolved after
  clearing the console and hard-refreshing. No code changes — this was a false alarm, not a bug.
- Confirmed word events fire on Grayson's setup (the diagnostic from part 3 — "looks good"),
  which unblocked backlog item #3. Built **read-along highlighting**:
  - `content.js`: captures the active selection's `Range` on demand, and maps a
    `chrome.tts` word event's `charIndex`/`length` onto that Range by walking its text nodes —
    handles a spoken word split across inline markup (e.g. `<b>`) correctly.
  - Uses the **CSS Custom Highlight API** (`CSS.highlights` + `Highlight`, via a new
    `content.css` declared in `manifest.json`'s `content_scripts`) instead of wrapping spoken
    text in new DOM elements — chosen specifically because it never mutates the page's DOM,
    which matters on a framework-heavy page like Gemini (the same page from the false alarm
    above) that could otherwise wipe out or duplicate injected wrapper spans on a re-render.
    Degrades silently if unsupported.
  - `background.js`: `speak()` now takes an optional `tabId`, sent by both the context-menu and
    hotkey call sites (not the popup's Preview, which has no source page). Relays `'word'`
    events to that tab as `highlight_progress` messages, and clears the highlight on
    `'end'`/`'interrupted'`/`'cancelled'`/`'error'`.
  - Removed the temporary diagnostic `console.log` from `background.js` now that it's answered.
  - **Verified the offset-mapping logic against a live DOM** in the Browser pane (not just
    `node --check`): built a throwaway test page with a word split across a `<b>` tag, confirmed
    `getSubRange()` correctly highlights exactly `"brown"` across that boundary, confirmed
    ordinary words and the last word in a string, confirmed an intentionally-overrun `length`
    value clamps to the end instead of dropping the highlight, and confirmed `clearHighlight()`
    actually removes it. Test file was throwaway, not committed.
  - **Not yet tested in the real loaded extension on a real page** — that's the next step.
- Bumped to 1.7.

### 2026-08-12 (part 5) — Edge verification confirmed (partial)
- Grayson said it's "working good" on his side. Asked specifically whether that covered the
  word-event diagnostic (a more technical check than the others) or just the general feel —
  it was the general feel; the diagnostic itself hadn't been checked yet at that point (it was
  confirmed working in part 6 above).
- Updated `HANDOFF.md` and `BACKLOG.md` to mark items 1/2/4 as Edge-confirmed and narrow the
  remaining open item down to just the word-event check, with clear step-by-step instructions
  for what to look for in the service worker console.

### 2026-08-12 (part 4) — Promoted the backlog to BACKLOG.md
- Pushed part 3's commit (`0770c73`) to `origin/main` on explicit request (`/github-push`),
  without confirmation the Edge verification pass had happened yet — flagged that gap in chat
  rather than blocking, since invoking the push skill directly reads as explicit "ship it".
- Asked what "next task" meant (ambiguous — could've meant doing the Edge pass, this backlog
  move, or something unrelated); Grayson picked backlog item #5.
- Created `BACKLOG.md`: North Star + ranked backlog, moved out of `HANDOFF.md` verbatim (plus a
  new "Not yet Edge-verified" section restating the four outstanding checks so they're not lost
  in the move). `HANDOFF.md` now just links to it instead of duplicating the content.

### 2026-08-12 (part 3) — Migration bug fix, Stop/Resume controls, word-event diagnostic
- Pushed part 2's commit (`418a5b7`) to `origin/main` on request.
- Asked to "keep going" on the backlog. Called `advisor` before starting #3/#4 given #3's size —
  it caught a real, already-shipped bug: `migrateSettings()` in `popup.js` always keyed the
  legacy-shape bucket as `''` regardless of the actual active language filter, so anyone with a
  filter set would load `getBucket(lang)` against a bucket that didn't exist and silently lose
  their saved voice/rate/pitch/volume. Also flagged that the migration wasn't persisted back to
  storage immediately, and that `background.js` had no fallback for the still-legacy shape
  (meaning right-click/hotkey speech could silently drop to the system default voice before the
  popup was ever reopened post-update) — exactly the failure class this project's North Star is
  about.
- Fixed all three: keyed the legacy bucket by `settings.lang || ''`; persist the migrated shape
  immediately on load; added `getSpeakBucket()` in `background.js` so it reads the legacy flat
  fields directly when `perLang` isn't present yet instead of falling back to nothing.
  Regression-tested the fix in isolation with a standalone Node script covering the advisor's
  exact repro case plus three other shapes (fresh install, already-migrated, no-filter-set) —
  all pass. Script was throwaway, not committed.
- Built backlog item #4: added `Resume` and `Stop` buttons next to the existing `Pause` in the
  popup, wired to new `resume`/`stop` messages in `background.js` (`chrome.tts.resume()` /
  `chrome.tts.stop()`, the latter also clearing the error badge). Kept them as three independent
  one-shot buttons rather than a Pause/Resume toggle, since the popup is ephemeral and has no
  reliable way to know mid-speech state across opens — advisor confirmed this was the right call.
  Verified button-row layout doesn't overflow at 320px width via the Browser pane preview.
- Advisor flagged backlog item #3 (read-along highlighting) as not safe to build blind — it needs
  `chrome.tts` `'word'` events with `charIndex`, which not all Windows/Edge SAPI voices fire, and
  the highlighting mechanism would run as a content script on every page. Added a temporary
  `console.log` diagnostic in `background.js`'s `onEvent` instead of writing the feature, so
  Grayson can answer the "does this even work here" question in ~5 minutes before any DOM code
  gets written.
- Bumped to 1.6. **None of this session's changes (parts 2 or 3) have been manually verified in
  a real loaded Edge extension yet** — flagged prominently above as the next step before
  anything else gets built on top.

### 2026-08-12 (part 2) — Popup UI pass, per-language voice memory, visible failure state
- Picked up; found the prior session's chrome.tts commit was already made and pushed (handoff
  had said "about to commit" — drift, noted and moved on).
- Did the UI pass the prior handoff flagged as next: grouped `popup.html` into labeled
  sections, added a status badge, styled sliders/buttons/dropdowns in `styles.css`. No
  functional changes. Verified structurally via a local static-file preview server
  (`.claude/launch.json`, new) since the popup can't run its real `chrome.*` calls outside an
  actual extension context — accessibility-tree read confirmed layout, computed-style check
  confirmed the new `.error` banner styling. Bumped to 1.4, committed as `80d516f`.
- Grayson asked for a North Star + five backlog items; proposed the one above and ranked five
  candidates. He picked 1 and 2 to build now, asked the rest logged here.
- Built #1 (per-language voice memory): reshaped `ttsSettings` storage from flat
  `{lang, voiceName, rate, pitch, volume}` to `{lang, perLang: {[lang]: {voiceName, rate,
  pitch, volume}}}`, with automatic migration of the old flat shape into the `''` bucket so
  existing installs don't lose their current settings. `popup.js` now applies the right
  bucket's settings whenever the language filter changes; `background.js`'s `speak()` reads
  the bucket matching the last-active language filter.
- Built #2 (visible failure state): `background.js` now sets a red toolbar badge + tooltip on
  a `chrome.tts` `'error'` event (clears on the next `'start'` event or after ~8s), and the
  popup's Preview button shows an inline red error banner (`#previewError` / `.error` in
  `styles.css`) on failure instead of failing silently.
- Bumped to 1.5. Neither change has been manually verified in Edge yet — flagged as the
  immediate next step above.

### 2026-08-12 — chrome.tts migration + voice language filter
- Picked up with two uncommitted changes already on disk (`rv-config.js` new file,
  `manifest.json`/`popup.html` wiring it in) meant to fix `Uncaught ReferenceError: rvApiKey
  is not defined` when ResponsiveVoice ran without a registered API key.
- Verified that fix worked (popup Preview spoke fine), but found a second bug via systematic
  debugging: `background.js` cached `ttsSettings` in a module-level variable that MV3 resets
  on every service-worker respawn, so right-click/hotkey speech requests went out with an
  empty voice and `responsiveVoice.speak()` silently no-op'd.
- Fixed that, retested — hit a *third*, different failure: GitHub's CSP blocked ResponsiveVoice's
  remote audio load outright (confirmed via the browser's own CSP violation message in
  DevTools). This was clearly an architectural limitation, not a one-line fix.
- Asked Grayson how to handle it; he chose to replace ResponsiveVoice with `chrome.tts`
  entirely rather than work around CSP or add an offscreen document. Rewrote
  `background.js`, `content.js`, `popup.js`, `popup.html`, `manifest.json` accordingly and
  deleted `responsivevoice.js`/`rv-config.js`. Retested — Preview and right-click both confirmed
  working, including on GitHub.
- Added the language-filter dropdown per Grayson's follow-up request (voice list from
  `chrome.tts.getVoices()` is long/unfiltered).
- Bumped `manifest.json` version 1.1 → 1.3 across the two meaningful changes, per this
  project's existing versioning convention (see README "Version" section).

### 2026-08-11 — Fix TTS pipeline for MV3 and add a live version stamp
- (Prior session, reconstructed from git log — commit `807962a`.)
