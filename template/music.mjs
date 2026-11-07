// Offline synth: soft beat (120 BPM) + whooshes and impacts on scene cues -> out/music.wav
import { writeFileSync } from "fs";
const SR = 44100, DUR = 59.5, N = Math.floor(SR * DUR);
const L = new Float32Array(N), R = new Float32Array(N);
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 * 2 - 1;
const add = (i, v, pan = 0) => { if (i >= 0 && i < N) { L[i] += v * (1 - pan); R[i] += v * (1 + pan); } };

function kick(t, g = 1) { const s = Math.floor(t * SR); let ph = 0;
  for (let k = 0; k < SR * .35; k++) { const x = k / SR; const f = 45 + 110 * Math.exp(-x * 28); ph += 2 * Math.PI * f / SR;
    add(s + k, Math.sin(ph) * Math.exp(-x * 9) * .55 * g); } }
function hat(t, g = 1) { const s = Math.floor(t * SR); let prev = 0;
  for (let k = 0; k < SR * .05; k++) { const n = rnd(); const hp = n - prev; prev = n; add(s + k, hp * Math.exp(-k / SR * 90) * .08 * g, .3); } }
function whoosh(t, d = .45, g = 1) { const s = Math.floor((t - d) * SR); let lp = 0;
  for (let k = 0; k < SR * d; k++) { const x = k / (SR * d); const a = Math.pow(x, 2.2); const c = .02 + .3 * x; lp += (rnd() - lp) * c;
    add(s + k, lp * a * .5 * g, Math.sin(x * 6) * .5); } }
function impact(t, g = 1) { kick(t, 1.6 * g); const s = Math.floor(t * SR); let lp = 0;
  for (let k = 0; k < SR * .9; k++) { lp += (rnd() - lp) * .08; add(s + k, lp * Math.exp(-k / SR * 5) * .35 * g); } }
function pad(t0, t1, freqs, g = .05) { for (let i = Math.floor(t0 * SR); i < Math.min(N, t1 * SR); i++) { const x = i / SR;
  const env = Math.min(1, (x - t0) / 1.5, (t1 - x) / 1.5); let v = 0; for (const f of freqs) v += Math.sin(2 * Math.PI * f * x) + .3 * Math.sin(4 * Math.PI * f * x);
  add(i, v / freqs.length * env * g); } }

const BEAT = .5;
for (let t = 3.9; t < 59; t += BEAT) {
  const inDemo = t >= 35.55 && t < 42.55;
  if (t >= 30.4 && t < 35.55) continue;            // calm under the terminal typing
  const g = inDemo ? 1.1 : .55;
  if (Math.round((t - 3.9) / BEAT) % 2 === 0 || inDemo) kick(t, g);
  hat(t + BEAT / 2, inDemo ? 1.4 : 1);
}
pad(0, 35.55, [110, 164.8, 220], .045); pad(42.55, 59.5, [98, 146.8, 196], .045); pad(35.55, 42.55, [130.8, 196, 261.6], .06);
for (const t of [2.45, 5.65, 7.55, 11.42, 17.17, 24.7, 30.5, 42.73, 52.05, 56.46]) whoosh(t);
for (const t of [0, 4.9, 35.55, 42.55, 57.59]) impact(t);
for (const t of [36.6, 38.1, 40.0, 41.4, 13.98, 20.06, 27.36]) whoosh(t, .3, .8);

// normalize to -3 dB and write 16-bit WAV
let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const k = .7 / peak, buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVEfmt ", 8); buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * k)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * k)) * 32767), 46 + i * 4); }
writeFileSync("out/music.wav", buf); console.log("music ok");
