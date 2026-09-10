// Template for a recorded demo. Copy into a scratch directory (never into a
// repo), fill in the STATES section, and run with:
//
//   cd /tmp/rec && DISPLAY=:1 node record.mjs <label> /tmp/rec/out
//
// Requires: npm i playwright-core, and `npx playwright install ffmpeg` once.
//
// The helpers below encode the shape of a clip (see SKILL.md, "The shape of a
// clip"). Use them in that order and the clip comes out short and legible. The
// two failure modes they exist to prevent, measured on a real clip that skipped
// them: 83% frozen frames, and the caption arriving after the load instead of
// before it, so 55% of the runtime had no explanation on screen.
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "fs";

const LABEL = process.argv[2] ?? "demo"; // e.g. "before" / "after"
const OUT = process.argv[3] ?? "/tmp/rec/out";
const BASE = process.env.DEMO_BASE ?? "http://localhost:3000";
// Account to pick in a Google account chooser. Leave unset to let the human pick.
const ACCOUNT = process.env.DEMO_ACCOUNT ?? "";
const PROFILE =
  process.env.DEMO_CHROME_PROFILE ?? `${process.env.HOME}/.cache/demo-chrome-profile`;
// Buttons the login flow may click on its own. Fill in for your app: the SSO
// button on your login page, the consent dialog after a fresh sign-in. Anything
// not listed here is left to the human at the keyboard.
const LOGIN_CLICKS = [
  (page) => page.getByRole("button", { name: /continue with google/i }),
  (page) => page.getByRole("button", { name: /^accept$/i }),
];
const SIZE = { width: 1920, height: 1080 };
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

// ------------------------------------------------------------------ AUTH ---
// Login runs in a context that is NOT recording. The profile keeps the session,
// so the recording context that follows opens already signed in. This is what
// keeps identity-provider redirects and splash screens out of the clip, and it means a
// human sign-in prompt costs no footage.
async function ensureLoggedIn() {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    channel: "chrome",
    headless: false, // headless makes Google demand a password
    viewport: SIZE,
    args: ["--no-first-run", "--no-default-browser-check"],
  });
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  const isGoogle = (u) => /accounts\.google\.com/.test(u);
  const needsHuman = (u) => /challenge|pwd|speedbump/.test(u);
  const arrived = () => page.url().startsWith(BASE);
  const clickFirst = async (cands) => {
    for (const make of cands) {
      try {
        const l = make().first();
        if (await l.isVisible({ timeout: 800 })) {
          await l.click({ timeout: 2500 });
          return true;
        }
      } catch {}
    }
    return false;
  };

  await page.goto(BASE, { waitUntil: "domcontentloaded" }).catch(() => {});
  const deadline = Date.now() + 15 * 60_000;
  let prompted = false;
  while (!arrived() && Date.now() < deadline) {
    const u = page.url();
    if (isGoogle(u) && needsHuman(u)) {
      if (!prompted) {
        log(`\n>>> Google wants a password. Sign in${ACCOUNT ? ` as ${ACCOUNT}` : ""} in the open window.`);
        log(">>> Waiting up to 15 min. The window will not close on you.\n");
        prompted = true;
      }
    } else if (isGoogle(u)) {
      if (ACCOUNT)
        await clickFirst([
          () => page.getByRole("link", { name: new RegExp(ACCOUNT, "i") }),
          () => page.getByText(ACCOUNT, { exact: false }),
        ]);
    } else {
      await clickFirst(LOGIN_CLICKS.map((make) => () => make(page)));
    }
    await sleep(1500);
  }
  const ok = arrived();
  if (!ok) log("AUTH TIMEOUT at", page.url());
  await ctx.close();
  return ok;
}

// ------------------------------------------------------------- RECORDING ---
if (!(await ensureLoggedIn())) process.exit(1);

const context = await chromium.launchPersistentContext(PROFILE, {
  channel: "chrome",
  headless: false,
  viewport: SIZE, // must match recordVideo.size
  recordVideo: { dir: OUT, size: SIZE },
  args: [
    "--no-first-run",
    "--no-default-browser-check",
    `--window-size=${SIZE.width},${SIZE.height}`,
    "--window-position=0,0",
  ],
});
const page = context.pages()[0] ?? (await context.newPage());
// about:blank never paints, so a title card injected into it records as white
// frames. Give the page real content first.
await page.setContent('<body style="margin:0;background:#111827"></body>');

// Read time for a caption: 0.25s a word plus a beat, capped so a long caption
// cannot turn into a frozen frame. This is the ONLY sleep the scenario uses.
const holdToRead = (text) =>
  page.waitForTimeout(Math.min(5000, 1500 + text.split(/\s+/).length * 250));

// Full-frame card. Opens a segment: says what is about to be shown and where the
// code came from, so the viewer never sees an unexplained screen.
async function titleCard(title, subtitle = "", tone = "info") {
  await page.evaluate(
    ({ title, subtitle, tone }) => {
      document.getElementById("__demo_title")?.remove();
      const el = document.createElement("div");
      el.id = "__demo_title";
      const bg = tone === "good" ? "#0f5132" : tone === "bad" ? "#842029" : "#111827";
      el.style.cssText =
        `position:fixed;inset:0;z-index:2147483647;background:${bg};color:#fff;` +
        "display:flex;flex-direction:column;align-items:center;justify-content:center;" +
        "font:700 54px/1.2 system-ui,sans-serif;text-align:center;padding:0 10%;" +
        "opacity:0;transition:opacity .5s ease"; // fade in: a cut with motion reads as a transition, not a freeze
      const h = document.createElement("div");
      h.textContent = title;
      el.appendChild(h);
      if (subtitle) {
        const s = document.createElement("div");
        s.style.cssText = "font:400 26px/1.4 ui-monospace,monospace;opacity:.85;margin-top:24px";
        s.textContent = subtitle;
        el.appendChild(s);
      }
      document.body.appendChild(el);
    },
    { title, subtitle, tone }
  );
  await holdToRead(title + " " + subtitle);
  await page.evaluate(() => document.getElementById("__demo_title")?.remove());
}

// Caption bar. Call it BEFORE the action it describes, then again after the
// result is on screen if the wording changes. The bar survives navigation
// because we re-inject it on every load.
let currentCaption = null;
async function announce(title, detail = "", tone = "info") {
  currentCaption = { title, detail, tone };
  await paintCaption();
}
async function paintCaption() {
  if (!currentCaption) return;
  await page
    .evaluate(({ title, detail, tone }) => {
      let el = document.getElementById("__demo_caption");
      if (!el) {
        el = document.createElement("div");
        el.id = "__demo_caption";
        el.style.cssText =
          "position:fixed;left:0;right:0;top:0;z-index:2147483646;" +
          "font:700 24px/1.3 system-ui,sans-serif;padding:18px 28px;text-align:center;" +
          "box-shadow:0 2px 18px rgba(0,0,0,.45)";
        document.body.appendChild(el);
      }
      el.style.background = tone === "good" ? "#0f5132" : tone === "bad" ? "#842029" : "#111827";
      el.style.color = "#fff";
      const h = document.createElement("div");
      h.textContent = title;
      el.replaceChildren(h);
      if (detail) {
        const d = document.createElement("div");
        d.style.cssText = "font-weight:400;font-size:18px;opacity:.9;margin-top:4px";
        d.textContent = detail;
        el.appendChild(d);
      }
    }, currentCaption)
    .catch(() => {});
}
page.on("load", () => paintCaption().catch(() => {}));

// Navigate and wait for a REAL signal that the screen is ready: a locator that
// only exists once the data is rendered. Never a fixed sleep.
async function goAndSettleOn(url, readyLocator, timeout = 90_000) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await paintCaption();
  await readyLocator.first().waitFor({ state: "visible", timeout });
}

// Dim everything except the element, draw a box round it, label it. This is
// what makes 11px evidence readable in an 800px inline player, and the fade-in
// is the motion that stops the frame reading as frozen.
// Union of the bounding boxes of every element the locator matches, so one
// locator can box a whole legend or a row of cells.
async function unionBox(locator) {
  const boxes = (await Promise.all((await locator.all()).map((l) => l.boundingBox()))).filter(Boolean);
  if (!boxes.length) return null;
  const x = Math.min(...boxes.map((b) => b.x)), y = Math.min(...boxes.map((b) => b.y));
  const r = Math.max(...boxes.map((b) => b.x + b.width)), btm = Math.max(...boxes.map((b) => b.y + b.height));
  return { x, y, width: r - x, height: btm - y, count: boxes.length };
}

async function spotlight(locator, label) {
  const box = await unionBox(locator);
  if (!box) return log("spotlight: nothing matched for", label);
  // A text locator that also matches a table cell or a side panel makes the
  // union swallow half the page. Evidence is never that big; fail here, not in
  // the finished clip.
  if (box.width * box.height > 0.5 * SIZE.width * SIZE.height)
    throw new Error(`spotlight "${label}": box covers ${Math.round((box.width * box.height) / (SIZE.width * SIZE.height) * 100)}% of the frame; the locator matched outside the evidence`);
  log(`spotlight: ${label} (${box.count} elements)`);
  await page.evaluate(
    ({ box, label }) => {
      document.getElementById("__demo_spot")?.remove();
      const pad = 14;
      const x = box.x - pad, y = box.y - pad, w = box.width + pad * 2, h = box.height + pad * 2;
      const el = document.createElement("div");
      el.id = "__demo_spot";
      el.style.cssText =
        "position:fixed;inset:0;z-index:2147483645;pointer-events:none;" +
        "transition:opacity .6s ease;opacity:0";
      // Dimming ring via a huge box-shadow on the cut-out.
      const hole = document.createElement("div");
      hole.style.cssText =
        `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;` +
        "border:4px solid #facc15;border-radius:8px;" +
        "box-shadow:0 0 0 9999px rgba(0,0,0,.62)";
      el.appendChild(hole);
      const tag = document.createElement("div");
      tag.textContent = label;
      const above = y > 90;
      tag.style.cssText =
        `position:absolute;left:${x}px;top:${above ? y - 64 : y + h + 16}px;` +
        "background:#facc15;color:#111;font:700 26px/1 system-ui,sans-serif;" +
        "padding:12px 18px;border-radius:6px;white-space:nowrap";
      el.appendChild(tag);
      document.body.appendChild(el);
      requestAnimationFrame(() => (el.style.opacity = "1"));
    },
    { box, label }
  );
  await holdToRead(label);
}
const clearSpotlight = () =>
  page.evaluate(() => document.getElementById("__demo_spot")?.remove()).catch(() => {});

// Log any JSON response you want to quote in the MR. Comparing the wire payload
// with the rendered text is often the most convincing part of the evidence.
const wire = [];
page.on("response", async (r) => {
  if (r.request().method() !== "POST") return;
  if (!/YOUR_ENDPOINT_PATTERN/.test(r.url())) return;
  try {
    wire.push({ url: r.url(), status: r.status(), body: (await r.text()).slice(0, 400) });
  } catch {}
});

// ---------------------------------------------------------------- STATES ---
// Replace with the states being demonstrated. Keep the try/finally: the video
// is only written when the context closes.
try {
  await titleCard(`${LABEL.toUpperCase()}`, "branch @ sha, env, account");

  // Announce first, then act, then wait on the ready signal.
  await announce("Now: the report page", "control case, always correct");
  await goAndSettleOn(`${BASE}/some/path`, page.locator("text=Something only visible when loaded"));
  await spotlight(page.locator("css=.the-evidence"), "6 series in the legend");
  await clearSpotlight();

  await announce("Now: the same report as a dashboard widget", LABEL === "before" ? "the bug" : "the fix", LABEL === "before" ? "bad" : "good");
  await goAndSettleOn(`${BASE}/other/path`, page.locator("css=.widget-legend"));
  await spotlight(page.locator("css=.widget-legend"), LABEL === "before" ? "1 series" : "6 series");
  await page.screenshot({ path: `${OUT}/${LABEL}-evidence.png` });
  await clearSpotlight();
} catch (error) {
  log("scenario failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  writeFileSync(`${OUT}/${LABEL}-wire.json`, JSON.stringify(wire, null, 2));
  const video = page.video();
  await context.close(); // writes the file
  if (video) log("video:", await video.path());
}
