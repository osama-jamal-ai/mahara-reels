// Usage: node shot.mjs 1.6 4.2 ...  -> out/shots/<t>.png + out/sheet.png
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { execFileSync } from "child_process";
import { pathToFileURL } from "url";
import path from "path";

const times = process.argv.slice(2).map(Number);
mkdirSync("out/shots", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
const errors = [];
page.on("pageerror", e => errors.push(e.message));
await page.goto(pathToFileURL(path.resolve(process.env.PAGE || "reel.html")).href);
await page.waitForFunction(() => window.__ready === true);
const files = [];
for (const [i, t] of times.entries()) {
  await page.evaluate(t => window.__seek(t), t);
  const f = `out/shots/${String(i).padStart(3, "0")}.png`;
  await page.screenshot({ path: f });
  files.push(f);
}
await browser.close();
if (errors.length) console.log("PAGE ERRORS:", errors);
const cols = Math.min(6, files.length), rows = Math.ceil(files.length / cols);
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", "out/shots/%03d.png",
  "-vf", `scale=270:480,tile=${cols}x${rows}:padding=6:color=white`, "-frames:v", "1", "out/sheet.png"]);
console.log("sheet ok", files.length);
