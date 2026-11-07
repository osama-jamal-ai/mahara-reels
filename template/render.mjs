// Renders index.html frame by frame to out/silent.mp4 (30 fps) and out/poster.png
import { chromium } from "playwright";
import { spawn } from "child_process";
import { pathToFileURL } from "url";
import path from "path";

const FPS = 30;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const errors = []; page.on("pageerror", e => errors.push(e.message));
await page.goto(pathToFileURL(path.resolve(process.env.PAGE || "reel.html")).href);
await page.waitForFunction(() => window.__ready === true);
const DUR = await page.evaluate(() => window.__dur);
const frames = Math.round(DUR * FPS);
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "17", "-preset", "medium", "-r", String(FPS), "out/silent.mp4"], { stdio: ["pipe", "inherit", "inherit"] });
for (let i = 0; i < frames; i++) {
  await page.evaluate(t => window.__seek(t), i / FPS);
  const img = await page.screenshot({ type: "jpeg", quality: 92 });
  if (!ff.stdin.write(img)) await new Promise(r => ff.stdin.once("drain", r));
  if (i % 150 === 0) console.log(`frame ${i}/${frames}`);
}
ff.stdin.end();
await new Promise(r => ff.on("close", r));
await page.evaluate(t => window.__seek(t), 56.5);
await page.screenshot({ path: "out/poster.png" });
await browser.close();
console.log(errors.length ? "PAGE ERRORS: " + errors.join(" | ") : "render ok", frames, "frames");
