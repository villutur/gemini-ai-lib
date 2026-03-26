The Lyria 3 series, launched in early 2026, represents the pinnacle of Google’s music generation technology. These models move beyond simple "loop generation" to provide structured, high-fidelity audio (48kHz stereo) with deep musical awareness, supporting both text and image-to-music workflows.

### 1. Model Capabilities & Output Table

| Feature | lyria-3-clip-preview | lyria-3-pro-preview |
| :--- | :--- | :--- |
| **Key Strength** | Speed & loops; optimized for social media assets. | Full-length song structure & cinematic scoring. |
| **Max Duration** | 30 Seconds | ~180 Seconds (3 Minutes) |
| **Output Format** | 48kHz Stereo MP3/WAV | 48kHz Stereo MP3/WAV |
| **Structural Awareness** | Linear (single musical idea) | Complex (Intros, Verses, Choruses, Bridges) |
| **Input Modalities** | Text, Image (Style Reference) | Text, Image (Style Reference) |
| **Watermarking** | Native SynthID (Required) | Native SynthID (Required) |
| **Best For** | Ad loops, UI sounds, quick prototyping. | Podcasts, Vlogs, professional music production. |

---

### 2. API Configuration Options (`MusicGenerationConfig`)

These parameters allow for granular control over the "vibe" and technical execution of the track.

| Option | Type | Default | Description / Help Hint |
| :--- | :--- | :--- | :--- |
| **bpm** | integer | 120 | Beats Per Minute. Range: 60–200. |
| **intensity** | float | 0.5 | Controls "busyness" and energy (0.0=Ambient, 1.0=Chaotic). |
| **generate_lyrics** | boolean | true | Set to false for strictly instrumental tracks. |
| **vocal_type** | string | "None" | Options: "Male", "Female", "Choral", "None". |
| **negative_prompt** | string | "" | Describe what to exclude (e.g., "no drums", "no vocals"). |
| **seed** | integer | Random | Use a fixed number for deterministic style replication. |
| **enhance_prompt** | boolean | true | Uses Gemini to expand your prompt into a musical script. |

---

### 3. TypeScript Implementation

This structure organizes the models by their primary production use case: speed vs. composition.

```typescript
export type LyriaVocalType = "Male" | "Female" | "Choral" | "None";

export interface LyriaModelMetadata {
  id: string;
  name: string;
  maxSeconds: number;
  description: string;
  helpHint: string;
  capabilities: {
    supportsLyrics: boolean;
    supportsImageRef: boolean;
    structuralAwareness: boolean;
  };
}

export const LYRIA_MODELS: Record<string, LyriaModelMetadata> = {
  "lyria-3-clip-preview": {
    id: "lyria-3-clip-preview",
    name: "Lyria 3 Clip",
    maxSeconds: 30,
    description: "Fast, high-fidelity loops and short clips.",
    helpHint: "Ideal for background loops. Generation takes ~30 seconds.",
    capabilities: {
      supportsLyrics: true,
      supportsImageRef: true,
      structuralAwareness: false
    }
  },
  "lyria-3-pro-preview": {
    id: "lyria-3-pro-preview",
    name: "Lyria 3 Pro",
    maxSeconds: 180,
    description: "Flagship model for full song compositions.",
    helpHint: "Supports complex structures like Verse/Chorus. Takes ~2-4 mins.",
    capabilities: {
      supportsLyrics: true,
      supportsImageRef: true,
      structuralAwareness: true
    }
  }
};
```

---

### 4. API Payload Formatter & Reset Logic

The logic for Lyria often involves handling "Image-to-Music" where an image provides the "vibe" (mood/lighting) for the track.

```typescript
// utils-lyria.ts
export const getLyriaDefaults = (modelId: string) => {
  return {
    bpm: 120,
    intensity: 0.5,
    vocalType: "None",
    generateLyrics: true,
    negativePrompt: ""
  };
};

export const formatLyriaApiPayload = (modelId: string, config: any, imageBase64?: string) => {
  const parts: any[] = [{ text: config.userPrompt }];
  
  // If an image is provided, add it to the multimodal parts
  if (imageBase64) {
    parts.push({
      inline_data: { mime_type: "image/jpeg", data: imageBase64 }
    });
  }

  return {
    model: modelId,
    contents: [{ parts }],
    config: {
      music_generation_config: {
        bpm: config.bpm,
        intensity: config.intensity,
        vocal_type: config.vocalType,
        generate_lyrics: config.generateLyrics,
        negative_prompt: config.negativePrompt || undefined,
        // Pro-specific: Model will respect [Verse] [Chorus] tags in text prompt
        structural_mode: LYRIA_MODELS[modelId].capabilities.structuralAwareness
      }
    }
  };
};
```

---

### 5. Advanced Dialog Implementation Notes

* **Structural Tagging:** For `Lyria 3 Pro`, encourage users to use bracketed tags in the prompt. Example: `[Intro: Solo Piano] [Verse 1: Soft vocals] [Chorus: Orchestral swell]`.
* **Image-to-Vibe:** The model doesn't "see" the image literally (e.g., "a cat") but rather translates visual textures and colors into musical timbre. A dark, rainy city image often results in Lo-Fi or Noir Jazz.
* **Lyrics Synchronization:** If `generate_lyrics` is true, the API returns a `lyrics_timestamps` object alongside the audio, allowing you to build a "karaoke-style" UI.
* **SynthID Watermarking:** Note that all audio contains a non-audible watermark. Post-processing or heavy compression can sometimes degrade the watermark, but it is highly robust to basic editing.

Would you like me to create a **"Prompt Architect" component** that helps users build a structured song prompt using those [Verse] and [Chorus] tags?
