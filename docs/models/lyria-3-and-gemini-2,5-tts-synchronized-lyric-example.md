To build a "karaoke-style" or "synchronized lyric" UI, you need to handle the **Time-Aligned Lyrics** that the Lyria 3 models (and Gemini 2.5 TTS) return.

In the 2026 API update, when you set `response_modalities` to `["AUDIO", "TEXT"]`, the model doesn't just return a block of text; it returns a structured JSON object within the `TEXT` part of the response.

### 1. The Lyrics Timestamp Schema

The API returns an array of "syllable" or "word" objects. Each object contains the text and the precise start/end offset relative to the audio start.

```json
{
  "lyrics_segments": [
    {
      "text": "In the ",
      "start_ms": 1200,
      "end_ms": 1450,
      "speaker_label": "Kore"
    },
    {
      "text": "neon ",
      "start_ms": 1450,
      "end_ms": 1800,
      "speaker_label": "Kore"
    },
    {
      "text": "rain...",
      "start_ms": 1800,
      "end_ms": 2500,
      "speaker_label": "Kore"
    }
  ]
}
```

---

### 2. Highlighting Component (React)

This component tracks the `currentTime` of an `<audio>` element and highlights the corresponding word in the lyric list.

```tsx
import React, { useState, useRef } from 'react';

interface LyricWord {
  text: string;
  start_ms: number;
  end_ms: number;
}

export const LyriaKaraokePlayer = ({ audioUrl, lyrics }: { audioUrl: string, lyrics: LyricWord[] }) => {
  const [activeMs, setActiveMs] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      // Convert seconds to milliseconds
      setActiveMs(audioRef.current.currentTime * 1000);
    }
  };

  return (
    <div className="p-6 bg-black text-white rounded-xl shadow-2xl">
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        onTimeUpdate={handleTimeUpdate} 
        controls 
        className="w-full mb-6"
      />

      <div className="flex flex-wrap gap-x-2 gap-y-3 text-2xl font-medium leading-relaxed">
        {lyrics.map((word, i) => {
          const isHighlighted = activeMs >= word.start_ms && activeMs <= word.end_ms;
          
          return (
            <span
              key={i}
              className={`transition-all duration-200 rounded px-1 ${
                isHighlighted 
                  ? "text-cyan-400 scale-110 shadow-[0_0_15px_rgba(34,211,238,0.5)] bg-cyan-400/10" 
                  : "text-gray-500"
              }`}
            >
              {word.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
```

---

### 3. Implementation Logic for Multi-Speaker

When using **Gemini 2.5 Pro TTS**, the timestamp object includes the `speaker_label`. You can use this to change the text color or position based on who is talking.

* **Logic:** Group the `lyrics_segments` by `speaker_label` to create "chat bubbles" or script-style blocks.
* **Pro Tip:** If a segment has a large gap between its `end_ms` and the next `start_ms`, your UI should automatically insert a "..." or a pause icon to indicate musical interludes or dramatic silences.

---

### 4. Handling "Prompt Rewriting"

Since Lyria 3 uses an internal **Gemini 3 Flash** rewriter to expand your prompts, the lyrics generated might be slightly different from what you requested.

* **Best Practice:** Always use the `lyrics_segments` returned by the API for your UI, rather than the original text you sent in the prompt, to ensure 100% sync accuracy.

