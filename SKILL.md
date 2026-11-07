---
name: mahara-reels
description: Make a vertical Arabic reel (9:16, 30-90 s) from a voiceover in an editorial paper style - a headline at the top that builds word by word with the voice (key words in an orange box), numbered steps with a progress bar, simple UI mockups, hand-drawn X/circles, and black sections for emphasis. Renders to MP4 with Playwright and ffmpeg. Use when the user asks for a reel, short, tutorial video, explainer or "ريل / فيديو / مونتاج" with a voiceover.
---

# مهارة الريلز (Mahara Reels)

A reel is a web page whose state depends only on time `t`. A headless browser steps `t` at 30 fps, screenshots each frame, and ffmpeg encodes the MP4. Voice and music are separate audio files mixed at the end.

The `template/` folder next to this file is a complete working example (a 60 s reel with 3 steps). Copy it and change its content; do not start from an empty file.

## 0. Setup (once per project)
Check first, install only what is missing:
- Node 20+, ffmpeg and Python 3.10+ on PATH. Windows: `winget install OpenJS.NodeJS.LTS Gyan.FFmpeg Python.Python.3.12`. macOS: `brew install node ffmpeg python`.
- In the project folder: copy everything from `template/`, then run `npm install` and `npx playwright install chromium`.
- For word timings: `pip install faster-whisper numpy`.

## 1. Script first
- Ask the user for: the topic, who it is for, the dialect (write it exactly the way they speak), the length, and the call to action (for example "علّق كلمة X").
- Write the script as short sentences, one idea each. Hook in the first 2 seconds. Something new on screen every 2-4 seconds.
- Show the script and get an OK before making any voice (voice costs credits).

## 2. Voice
- The user records it, or it is generated with a text-to-speech tool (ElevenLabs works well for Arabic). Generate the whole script in one call so the tone stays the same.
- Save it as `audio/voice.mp3`. Tell the user you cannot hear audio and ask them to listen.

## 3. Timing of every word
```
python -I words.py audio/voice.mp3 out/words.json small
```
- This prints every word with its start time. Use `medium` instead of `small` if the machine has the memory.
- Also find the real pauses: `ffmpeg -i audio/voice.mp3 -af silencedetect=noise=-35dB:d=0.25 -f null -`. A sentence starts where a silence ends; use that as the start of the first word of each sentence (whisper is often a little early there).
- To insert a scene with no voice (for example a demo), cut the voice inside a pause and shift everything after it with `adelay`.

## 4. Build the reel (`reel.html`)
- `HEAD` is the list of headline lines: `[start, end, [[word, time, isKey], ...]]`. This is the on-screen caption, so there are no subtitles at the bottom. Mark 1-2 key words per line with `1`.
- `STEPS` sets the progress bar and the small step label.
- Everything else is on the GSAP timeline in `build()`: helpers `inUp`, `out`, `pop`, `slam`, `draw` (hand-drawn SVG paths) and `flash`. Put every cue on the time of the word it belongs to.
- Typing effects and counters go in `frame(t)` and must be computed from `t` only. No `Math.random()`, no CSS animations, no timers.
- Style rules: paper background `#EFEBE4`, ink `#141414`, one accent `#E8572B`, black sections for the most important part. No emojis. Free fonts only (Alexandria, Lalezar), unless the user has a license for another font.

## 5. Check by looking, not by reading code
```
node shot.mjs 1.5 4.9 8.6 12.0 ...
```
This saves frames at those seconds and a contact sheet `out/sheet.png`. Open the sheet and fix overlaps, cut text and anything that shows too early. Do at least 2 rounds. Note: old shots stay in `out/shots`, so ignore extra tiles from a longer earlier run.

## 6. Render and mix
```
node render.mjs
node music.mjs
ffmpeg -i out/silent.mp4 -i out/voice.wav -i out/music.wav -filter_complex "[1:a]volume=1[v];[2:a]volume=0.2[m];[v][m]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest out/final.mp4
```
- `out/voice.wav` must be exactly as long as the video: pad it with `apad=pad_dur=3,atrim=0:<duration>` in its own ffmpeg pass.
- In `music.mjs` set `DUR` and the cue times (whooshes on scene changes, impacts on big moments).
- Check the result: duration, loudness (`-af ebur128`, target about -14 LUFS), and a contact sheet of the final file (`-vf "fps=0.5,scale=180:320,tile=8x4"`).

## Rules
- Never say a file works without having rendered and looked at it.
- Do not copy another creator's characters, logo or exact design; reuse only the technique.
- Do not put brand logos you do not own in the video unless the user supplies them.
