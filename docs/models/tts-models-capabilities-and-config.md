The Gemini 2.5 Text-to-Speech (TTS) series, released in late 2025 and refined into 2026, brings Google’s multimodal reasoning to speech synthesis. Unlike traditional TTS, these models understand context and emotional subtext, allowing for natural-sounding multi-speaker dialogues within a single API call.

### 1. Model Capabilities & Output Table

| Feature | gemini-2.5-flash-preview-tts | gemini-2.5-pro-preview-tts |
| :--- | :--- | :--- |
| **Key Strength** | Ultra-low latency for real-time assistants. | Studio-quality for podcasts & audiobooks. |
| **Max Context** | 32,000 tokens | 32,000 tokens |
| **Max Speakers** | 2 (Native Dialogue) | 2 (Native Dialogue) |
| **Audio Quality** | High-fidelity (optimized for speed) | Premium (optimized for prosody/nuance) |
| **Input Modality** | Text only | Text only |
| **Output Modality** | Audio only | Audio only |
| **Best For** | Real-time AI, notifications, high-volume. | Long-form content, creative storytelling. |

---

### 2. API Configuration Options (`SpeechConfig`)

These options are nested within the `speech_config` object when calling `generate_content`.

| Option | Type | Default | Description / Help Hint |
| :--- | :--- | :--- | :--- |
| **voice_name** | string | "Kore" | Choose from 30+ voices (e.g., "Leda", "Kore", "Sulafat"). |
| **language_code** | string | "en-US" | Supports 24+ languages. Use BCP-47 tags (e.g., "fr-FR"). |
| **speaking_rate** | float | 1.0 | Range 0.5 to 2.0. Adjust for pacing. |
| **pitch** | float | 0.0 | Range -20.0 to 20.0 semitones. |
| **volume_gain_db**| float | 0.0 | Adjust the volume of the generated audio. |
| **response_modalities**| array | ["AUDIO"] | Must be set to "AUDIO" for these specific models. |

---

### 3. TypeScript Implementation

This setup provides a clean interface for a TTS dashboard that switches between the "Performance" (Flash) and "Quality" (Pro) engines.

```typescript
export type TTSVoice = "Kore" | "Leda" | "Sulafat" | "Achernar";
export type TTSLanguage = "en-US" | "fr-FR" | "de-DE" | "ja-JP";

export interface TTSModelMetadata {
  id: string;
  name: string;
  isFast: boolean;
  description: string;
  helpHint: string;
  capabilities: {
    maxSpeakers: number;
    supportedLanguages: number;
    contextWindow: string;
  };
}

export const TTS_MODELS: Record<string, TTSModelMetadata> = {
  "gemini-2.5-flash-preview-tts": {
    id: "gemini-2.5-flash-preview-tts",
    name: "Gemini 2.5 Flash TTS",
    isFast: true,
    description: "Lightning-fast speech synthesis for interactive apps.",
    helpHint: "Ideal for real-time responses. Near-instant generation.",
    capabilities: {
      maxSpeakers: 2,
      supportedLanguages: 24,
      contextWindow: "32k"
    }
  },
  "gemini-2.5-pro-preview-tts": {
    id: "gemini-2.5-pro-preview-tts",
    name: "Gemini 2.5 Pro TTS",
    isFast: false,
    description: "Cinematic, expressive audio for premium content.",
    helpHint: "Better at complex emotions and dramatic pauses. Slightly higher latency.",
    capabilities: {
      maxSpeakers: 2,
      supportedLanguages: 24,
      contextWindow: "32k"
    }
  }
};
```

---

### 4. API Payload Formatter & Reset Logic

This logic handles the conversion from a UI state into the specific `SpeechConfig` structure required by the Gemini API.

```typescript
// utils-tts.ts
export const getTTSDefaults = (modelId: string) => {
  return {
    voiceName: "Kore",
    languageCode: "en-US",
    speakingRate: 1.0,
    pitch: 0,
    multiSpeaker: false
  };
};

export const formatTTSApiPayload = (modelId: string, config: any) => {
  const model = TTS_MODELS[modelId];
  
  return {
    model: model.id,
    contents: [{ parts: [{ text: config.userText }] }],
    config: {
      response_modalities: ["AUDIO"],
      speech_config: {
        // Example for a single speaker setup
        voice_config: {
          prebuilt_voice_config: {
            voice_name: config.voiceName
          }
        }
      }
    }
  };
};
```

---

### 5. Advanced Dialog Implementation Notes

* **Emotion Tags:** You can use natural language or bracketed tags in the text input. Example: `[excited] "I can't believe we're finally doing this!"` or `[whisper] "Don't let them hear you."`
* **Multi-Speaker Format:** To trigger the native dialogue feature, use the `Speaker Name: Text` format in your prompt. You must map these names to specific voices in the `multi_speaker_voice_config` section of the API call.
* **SSML Support:** Both models support standard SSML (Speech Synthesis Markup Language) for fine control over breaks `<break time="500ms"/>` and phonemes.
* **Pro vs. Flash Nuance:** While Flash is great for literal reading, Pro is significantly better at "acting"—it understands when a sentence should sound like a question or a sarcastic remark based solely on the text.

