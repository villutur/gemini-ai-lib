The **`gemini-2.5-flash-native-audio-preview-12-2025`** (often referred to in APIs as `gemini-live-2.5-flash-native-audio`) is a specialized low-latency model designed for bidirectional, real-time voice and video interactions.

Unlike standard models, the Live API operates over a stateful **WebSocket (WSS)** connection and introduces configuration fields specifically for audio behavior, "barge-in" (interruptions), and emotional intelligence.

### 1\. Live API Configuration Options

These options are typically part of the `LiveConnectConfig` (or `setup` message) when establishing the session.

| Category         | Option                        | Type       | Description / Help Hint                                                               |
| :--------------- | :---------------------------- | :--------- | :------------------------------------------------------------------------------------ |
| **Modality**     | `responseModalities`          | `string[]` | Set to `["AUDIO"]` for voice-only or `["TEXT", "AUDIO"]` for both.                    |
| **Speech**       | `voiceName`                   | `string`   | Choose a persona (e.g., `"Puck"`, `"Fenrir"`, `"Aoede"`). Default is `"Puck"`.        |
| **Speech**       | `speechConfig`                | `object`   | Contains `voiceConfig` to fine-tune pitch, volume, or specific prebuilt voices.       |
| **Audio**        | `enable_affective_dialog`     | `boolean`  | **New for 2.5:** Allows the model to hear and express emotion (tone, pace, laughter). |
| **Interruption** | `proactive_audio`             | `boolean`  | Part of `proactivity` config. Allows Gemini to decide when to listen vs. talk.        |
| **VAD**          | `start_of_speech_sensitivity` | `enum`     | Adjusts how easily Gemini thinks you've started talking (`Low`, `High`).              |
| **VAD**          | `end_of_speech_sensitivity`   | `enum`     | Adjusts how quickly Gemini responds after you stop (`Low`, `High`).                   |
| **Context**      | `max_context_size`            | `int`      | Defaults to `32K` for speed; can be increased to `128K`.                              |
| **Tools**        | `tools`                       | `array`    | List of `function_declarations` or `Google Search_retrieval`.                         |

---

### 2\. Technical Specs for the 12-2025 Model

- **Input Audio:** Raw 16-bit PCM, 16kHz, Little-Endian.
- **Output Audio:** Raw 16-bit PCM, 24kHz, Little-Endian.
- **Video Input:** Sent as individual JPEG/PNG frames (Max 1 FPS).
- **Latency:** Optimized for \< 1 second "glass-to-glass" (voice in to voice out).

---

### 3\. TypeScript Implementation

This structure represents the configuration required to initialize a `LiveSession`.

```typescript
export type LiveVoiceName = "Puck" | "Charon" | "Kore" | "Fenrir" | "Aoede";
export type Sensitivity = "low" | "medium" | "high";

export interface LiveModelConfig {
  model: "gemini-2.5-flash-native-audio-preview-12-2025";
  systemInstruction?: string;
  generationConfig: {
    responseModalities: ("TEXT" | "AUDIO")[];
    speechConfig?: {
      voiceConfig?: {
        prebuiltVoiceConfig?: {
          voiceName: LiveVoiceName;
        };
      };
    };
    // Standard params still apply
    temperature?: number;
    maxOutputTokens?: number;
  };
  liveConfig: {
    enableAffectiveDialog: boolean;
    proactiveAudio: boolean;
    vadSensitivity: {
      start: Sensitivity;
      end: Sensitivity;
    };
  };
  tools?: any[]; // Function declarations
}

export const DEFAULT_LIVE_CONFIG: LiveModelConfig = {
  model: "gemini-2.5-flash-native-audio-preview-12-2025",
  systemInstruction: "You are a helpful, conversational assistant. Speak naturally.",
  generationConfig: {
    responseModalities: ["AUDIO"],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: "Puck" },
      },
    },
    temperature: 1.0,
  },
  liveConfig: {
    enableAffectiveDialog: true,
    proactiveAudio: false, // Set true for "smart listening" mode
    vadSensitivity: {
      start: "low",
      end: "high",
    },
  },
};
```

### 4\. Payload Formatter for WebSockets

Since the Live API uses a `setup` message, your formatter needs to wrap these into the specific JSON structure the WebSocket expects.

```typescript
export const formatLiveSetupMessage = (config: LiveModelConfig) => {
  return {
    setup: {
      model: config.model,
      generation_config: {
        response_modalities: config.generationConfig.responseModalities,
        speech_config: config.generationConfig.speechConfig,
        temperature: config.generationConfig.temperature,
      },
      system_instruction: {
        parts: [{ text: config.systemInstruction }],
      },
      // Mapping the 12-2025 specific fields
      enable_affective_dialog: config.liveConfig.enableAffectiveDialog,
      proactivity_config: {
        proactive_audio: config.liveConfig.proactiveAudio,
      },
      threshold_config: {
        start_of_speech_sensitivity: config.liveConfig.vadSensitivity.start,
        end_of_speech_sensitivity: config.liveConfig.vadSensitivity.end,
      },
    },
  };
};
```

**Would you like me to provide the code for the AudioWorklet needed to handle the 16kHz input / 24kHz output streaming in the browser?**

[Gemini Live API Voice and Vision Setup](https://www.google.com/search?q=https://www.youtube.com/watch%3Fv%3D03n_4aKOfi0)
This video provides a practical walkthrough of setting up the Gemini Live API, including the real-time audio and vision configurations discussed above.
