# Word timestamps for the original voiceover -> out/words.json (times in the ORIGINAL file)
import json, sys, subprocess
import numpy as np
from faster_whisper import WhisperModel

# decode with ffmpeg (the installed PyAV is too new for this faster-whisper version)
raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", sys.argv[1] if len(sys.argv)>1 else "audio/voiceover.mp3",
                      "-f", "f32le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
audio = np.frombuffer(raw, dtype=np.float32)
model = WhisperModel(sys.argv[3] if len(sys.argv)>3 else "medium", device="cpu", compute_type="int8")
segs, info = model.transcribe(audio, language="ar", word_timestamps=True, beam_size=5,
                              initial_prompt="كلود، الاشتراك، Pro، المهارات، الربط، كروم، مهارة")
words = []
for s in segs:
    for w in s.words:
        words.append({"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2), "p": round(w.probability, 2)})
json.dump(words, open(sys.argv[2] if len(sys.argv)>2 else "out/words.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
sys.stdout.reconfigure(encoding="utf-8")
for w in words:
    print(f'{w["s"]:6.2f}-{w["e"]:6.2f} {w["p"]:.2f} {w["w"]}')

