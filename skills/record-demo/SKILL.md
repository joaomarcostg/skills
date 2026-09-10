---
name: record-demo
description: Use when a change needs visual proof for an MR or Jira ticket, the user asks to "record a demo", "record the fix", "show the before and after", "make a video of this", or the repo's AGENTS.md asks for a screenshot or recording of a UI change.
argument-hint: "[what to show, in order] [env/account] [where it goes: MR | Jira | file]"
allowed-tools: [Bash, Read, Write]
---

# record-demo

Drives the running local app in a real Chrome window and records it, producing
a short MP4 that a reviewer can watch in the MR without pausing or scrubbing.

A reviewer reads a diff and takes your word that it works. A clip removes the
doubt, but only if it is short and every frame explains itself. A clip that is
mostly frozen screens with the caption arriving late gets skipped, and then it
has cost the recording time for nothing.

## Arguments

The user invoked this with: `$ARGUMENTS`

| Need | Default if unstated |
|---|---|
| States, in order | broken state first, fixed state second |
| Env + account | ask; never record against a real customer's account, prefer an internal or demo one |
| Where the file goes | ask: MR description, Jira, or just the file |

## The shape of a clip

A demo is this sequence. The template's helpers produce it in this order; use
them in this order and the clip comes out right.

| # | Part | Helper | Length |
|---|---|---|---|
| 1 | Title card: state name, branch @ sha, env | `titleCard()` | read time |
| 2 | Control state, shown once, evidence boxed | `announce` → `goAndSettleOn` → `spotlight` | ≤ 8s |
| 3 | Per state: announce, act, settle on a ready signal, box the evidence | same three | ≤ 10s each |
| 4 | End card: evidence crops side by side, labelled | ffmpeg, see below | 5s |

Two-state comparison: **under 40 seconds**. The `review-clip.sh` gate holds the
line at 45.

Three rules inside that shape:

**Caption first, then act.** `announce()` goes on screen before `goto`, so the
load, which is the longest part of every segment, is the part with an
explanation over it. Calling the caption after the load is how a clip ends up
55% unexplained.

**Wait on a ready signal, never a sleep.** `goAndSettleOn(url, locator)` returns
when an element that only exists after the data rendered is visible. The one
sleep in the template is `holdToRead()`, which is sized to the caption's word
count and capped at 5s, so it cannot produce a frozen run.

**Box the evidence.** `spotlight(locator, label)` dims the page, outlines the
element and labels it at 26px. Chart legends and table cells are ~11px, 1% of a
1080p frame, unreadable in GitLab's inline player. Unboxed evidence is not
evidence. The fade-in is also the only motion in a clip with no clicks, and it
is what stops a frame reading as frozen.

## Preflight

Each of these has bitten someone.

1. **Playwright's bundled ffmpeg.** Playwright will not use `/usr/bin/ffmpeg` for
   capture: `ls ~/.cache/ms-playwright/ | grep ffmpeg || npx playwright install ffmpeg`.
   A system `ffmpeg` is still wanted for post.
2. **`playwright-core` in a scratch directory**, never in a repo:
   `mkdir -p /tmp/rec && cd /tmp/rec && npm init -y && npm i playwright-core`.
3. **A display.** Recording runs headed, so `$DISPLAY` must be set and at least
   1920x1080: `xdpyinfo -display "${DISPLAY:-:1}" | grep dimensions`.
4. **The app is up on the right env.** Start it the way the repo documents.
   Confirm with a request: `curl -s -o /dev/null -w "%{http_code}\n" "$DEMO_BASE"`.
5. **A dedicated Chrome profile** at `$DEMO_CHROME_PROFILE` (default
   `~/.cache/demo-chrome-profile`). It keeps the signed-in session between
   runs. Only one Chrome may hold it; close other automation browsers first.

## Must run headed

Headless breaks Google login: Google accepts the profile's account and then
diverts to a password challenge. Headed, the same profile signs in with one
click. So `headless: false`, and let the user watch.

## Login stays out of the recording

The template's `ensureLoggedIn()` opens a non-recording context, clicks
through the buttons listed in `LOGIN_CLICKS` (your SSO button, a consent
dialog), picks `$DEMO_ACCOUNT` in a Google account chooser when one appears, and
waits up to 15 minutes if the identity provider wants a human. It closes, and
only then does the recording context open, already signed in. Redirects and
splash screens never reach the clip, and a human sign-in costs no footage.

Tell the user to expect a possible password prompt and to leave the window
alone. Never close it on them; never add a timeout shorter than a human.

## Writing the script

Copy [references/record-template.mjs](references/record-template.mjs) into the
scratch directory and fill in the STATES block. Keep the try/finally: the video
file is only written when the context closes.

**Two code states (before/after a fix)** are two recordings, since the UI
server has to be swapped between them. Show the control state in the first
recording only; it is identical in both. Put the branch and sha on each title
card so the viewer knows which build they are looking at. Run both from
worktrees so the main checkout is never switched.

**Selecting elements.** Much real-world markup has no `for`,
`aria-labelledby` or `data-testid`, so `getByLabel()` finds nothing and
generated class names are useless. Anchor on visible text with a regex that
excludes look-alikes, and for a group of items (a legend, a row of cells) pass
one locator that matches all of them; `spotlight` boxes the union.

## Post: end card, stitch, gate

```bash
# End card: the two evidence screenshots' subject region, side by side.
ffmpeg -y -i before-evidence.png -i after-evidence.png -filter_complex \
  "[0]crop=W:H:X:Y,scale=960:-1,drawtext=text='BEFORE':fontsize=48:fontcolor=white:x=20:y=20:box=1:boxcolor=#842029[a];
   [1]crop=W:H:X:Y,scale=960:-1,drawtext=text='AFTER':fontsize=48:fontcolor=white:x=20:y=20:box=1:boxcolor=#0f5132[b];
   [a][b]hstack,pad=1920:1080:0:(oh-ih)/2:black" -frames:v 1 endcard.png
ffmpeg -y -loop 1 -i endcard.png -t 5 -c:v libx264 -pix_fmt yuv420p -r 25 endcard.mp4

# Stitch. Each webm has no login footage, so no trimming is needed.
printf "file '%s'\n" before.webm after.webm endcard.mp4 > list.txt
ffmpeg -y -f concat -safe 0 -i list.txt \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -preset medium -crf 24 -pix_fmt yuv420p -movflags +faststart demo.mp4

# Gate. Exit 1 means do not upload.
./review-clip.sh demo.mp4
```

`review-clip.sh` (next to this file) writes a timestamped contact sheet and
fails on: length > 45s, frozen frames > 40%, any frozen run > 5s. Open the
contact sheet either way. Two identical neighbouring tiles are dead time.

## Attaching to a GitLab MR

```bash
curl -s --request POST --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  --form "file=@demo.mp4" "https://gitlab.com/api/v4/projects/<group>%2F<project>/uploads"
```

Embed the returned `markdown` in the description; image syntax renders a video
player. PUT the full description back over REST. `glab mr update` can 404 from
a worktree, and `glab mr view` can hang on its pager.

## Gotchas

- **`pkill -f` matches itself.** Kill the dev server by PID from
  `ss -lptn 'sport = :<port>'`.
- **Local data you insert to stage a demo** (a dashboard, a widget) must satisfy
  the same invariants the app enforces: a NULL where the UI expects `[]` renders
  the error page.
- **Scratch files vanish.** Upload before the session ends. Never commit the
  script or the video.

## Report

Give the file path, its length, the `review-clip.sh` verdict, and which states
were captured. If uploaded, confirm the embed is in the live description.
