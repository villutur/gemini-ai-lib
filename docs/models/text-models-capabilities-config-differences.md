Here is the comprehensive technical breakdown for the current **Gemini 2.5 and 3.x** text and multimodal models as of March 2026.

### 1. Capability Comparison: Text & Multimodal Models

| Model ID                          | Max Input Tokens | Max Output Tokens | Thinking Mode | Grounding | Key Strength                        |
| :-------------------------------- | :--------------- | :---------------- | :------------ | :-------- | :---------------------------------- |
| **gemini-2.5-flash-lite**         | 1M               | 64k               | No            | Supported | Lowest cost, extreme throughput.    |
| **gemini-2.5-flash**              | 1M               | 64k               | Supported     | Supported | Balanced speed and intelligence.    |
| **gemini-2.5-pro**                | 2M               | 64k               | Adaptive      | Supported | High-reasoning, large context.      |
| **gemini-3-flash-preview**        | 1M               | 32k               | PhD-level     | Supported | Rivaling Pro models at Flash speed. |
| **gemini-3.1-flash-lite-preview** | 1M               | 64k               | No            | Supported | Ultra-low latency agentic tasks.    |
| **gemini-3.1-pro-preview**        | 2M               | 128k              | Advanced      | Supported | Flagship reasoning & "Vibe Coding". |

---

### 2. Attachment Support (Multimodal)

All Gemini models listed above use the **Files API** for persistent storage (up to 48h) or **Inline Data** for small payloads.

| Attachment Type | Max per Prompt      | Max Size / Length         | Supported MIME Types               |
| :-------------- | :------------------ | :------------------------ | :--------------------------------- |
| **Images**      | 3,000               | 7MB (inline) / 30MB (GCS) | `png, jpeg, webp, heic, heif`      |
| **Video**       | 10                  | ~1 hour                   | `mp4, webm, mov, mpeg, avi, wmv`   |
| **Audio**       | 1 (up to 1M tokens) | ~8.4 hours                | `mp3, wav, flac, aac, m4a, ogg`    |
| **Documents**   | 3,000               | 50MB per file             | `pdf, text/plain, csv, docx, xlsx` |

---

### 3. API Configuration Options

These are the primary parameters used in the `generateContent` or `generate_content` calls:

| Option             | Type     | Default      | Description / Help                                         |
| :----------------- | :------- | :----------- | :--------------------------------------------------------- |
| `temperature`      | float    | 1.0          | Controls randomness (0.0 = deterministic, 2.0 = creative). |
| `topP`             | float    | 0.95         | Nucleus sampling: picks from top % of probability mass.    |
| `topK`             | int      | 64           | Pick from top K most likely tokens.                        |
| `maxOutputTokens`  | int      | Model Max    | Hard limit on response length to manage costs/time.        |
| `thinkingBudget`   | int      | -1           | `-1` (Auto), `0` (Off), or token count (e.g., `1024`).     |
| `responseMimeType` | string   | `text/plain` | Set to `application/json` for structured data output.      |
| `stopSequences`    | string[] | []           | Tokens that trigger the model to stop generating.          |
| `presencePenalty`  | float    | 0.0          | Penalizes tokens already in the text (reduces repetition). |
| `frequencyPenalty` | float    | 0.0          | Penalizes tokens based on frequency (reduces "echoing").   |

---

### 4. TypeScript Implementation

This object can be used to dynamically generate your UI config dialog.

```typescript
export type ThinkingLevel = "none" | "dynamic" | "advanced";

export interface TextModelMetadata {
  id: string;
  name: string;
  contextWindow: number;
  maxOutput: number;
  thinking: ThinkingLevel;
  description: string;
  attachments: {
    supportsVideo: boolean;
    supportsAudio: boolean;
    maxFiles: number;
  };
}

export const TEXT_MODELS: Record<string, TextModelMetadata> = {
  "gemini-3.1-pro-preview": {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    contextWindow: 2000000,
    maxOutput: 128000,
    thinking: "advanced",
    description: "State-of-the-art for coding and complex logic.",
    attachments: { supportsVideo: true, supportsAudio: true, maxFiles: 3000 },
  },
  "gemini-3.1-flash-lite-preview": {
    id: "gemini-3.1-flash-lite-preview",
    name: "Gemini 3.1 Flash-Lite",
    contextWindow: 1000000,
    maxOutput: 65536,
    thinking: "none",
    description: "Ultra-fast and cheap for high-volume agentic tasks.",
    attachments: { supportsVideo: true, supportsAudio: true, maxFiles: 3000 },
  },
  "gemini-3-flash-preview": {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    contextWindow: 1000000,
    maxOutput: 32768,
    thinking: "dynamic",
    description: "PhD-level reasoning with lightning speed.",
    attachments: { supportsVideo: true, supportsAudio: true, maxFiles: 3000 },
  },
  "gemini-2.5-pro": {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro (Stable)",
    contextWindow: 2000000,
    maxOutput: 65536,
    thinking: "dynamic",
    description: "Reliable flagship for production use cases.",
    attachments: { supportsVideo: true, supportsAudio: true, maxFiles: 3000 },
  },
};
```
