The **Veo 3.1** series represents Google’s cutting-edge video generation technology for 2026. These models are unique because they generate **native synchronized audio** alongside the video, supporting complex cinematic instructions and multi-image references.

### 1. Model Capabilities & Output Table

| Feature | **veo-3.1-generate-preview** | **veo-3.1-fast-generate-preview** |
| :--- | :--- | :--- |
| **Key Strength** | Maximum cinematic realism & physics. | 2x faster, optimized for rapid iteration. |
| **Max Resolution** | **4K (Upscaled)**, 1080p, 720p | 1080p, 720p |
| **Video Length** | 4, 6, or **8 seconds** | 4, 6, or **8 seconds** |
| **Audio** | Native Sync Audio + Dialogue | Native Sync Audio + Dialogue |
| **Input Modalities** | Text, Image, Video (for extend) | Text, Image, Video (for extend) |
| **Max Attachments** | **3 Reference Images** | **3 Reference Images** |
| **Aspect Ratios** | 16:9 (Landscape), 9:16 (Portrait) | 16:9 (Landscape), 9:16 (Portrait) |

---

### 2. API Configuration Options (`GenerateVideosConfig`)

These options are passed within the configuration object of the `generate_videos` method.

| Option | Type | Default | Description / Help Hint |
| :--- | :--- | :--- | :--- |
| **`aspect_ratio`** | string | `"16:9"` | Use `"9:16"` for TikTok/Shorts vertical format. |
| **`resolution`** | string | `"1080p"` | Options: `"720p"`, `"1080p"`, `"4k"`. (4K is Standard only). |
| **`duration_seconds`** | int | `8` | Options: `4`, `6`, `8`. Sets the clip length. |
| **`fps`** | int | `24` | Native cinematic frame rate. |
| **`generate_audio`** | boolean | `true` | Set to `false` if you only want silent video. |
| **`negative_prompt`** | string | `""` | Describe things to avoid (e.g., "shaky cam, low res"). |
| **`sample_count`** | int | `1` | Number of variations to generate (Max 4). |
| **`seed`** | int | Random | Use a fixed number to reproduce a specific motion style. |
| **`enhance_prompt`** | boolean | `true` | Uses Gemini to rewrite your prompt into a cinematic one. |

---

### 3. TypeScript Implementation

This structure allows your UI to toggle between high-quality (Standard) and speed-oriented (Fast) workflows.

```typescript
export type VeoResolution = "720p" | "1080p" | "4k";
export type VeoDuration = 4 | 6 | 8;
export type VeoAspectRatio = "16:9" | "9:16";

export interface VeoModelMetadata {
  id: string;
  name: string;
  isFast: boolean;
  description: string;
  helpHint: string;
  capabilities: {
    maxImages: number;
    resolutions: VeoResolution[];
    durations: VeoDuration[];
    supportsAudio: boolean;
  };
}

export const VEO_MODELS: Record<string, VeoModelMetadata> = {
  "veo-3.1-generate-preview": {
    id: "veo-3.1-generate-preview",
    name: "Veo 3.1 Standard",
    isFast: false,
    description: "Highest fidelity for professional film production.",
    helpHint: "Supports 4K and complex physics. Generation takes ~2-4 minutes.",
    capabilities: {
      maxImages: 3,
      resolutions: ["720p", "1080p", "4k"],
      durations: [4, 6, 8],
      supportsAudio: true
    }
  },
  "veo-3.1-fast-generate-preview": {
    id: "veo-3.1-fast-generate-preview",
    name: "Veo 3.1 Fast",
    isFast: true,
    description: "Optimized for social media and rapid prototyping.",
    helpHint: "Generates in under 60 seconds with 1080p quality.",
    capabilities: {
      maxImages: 3,
      resolutions: ["720p", "1080p"],
      durations: [4, 6, 8],
      supportsAudio: true
    }
  }
};
```

---

### 4. API Payload Formatter & Reset Logic

```typescript
// utils-veo.ts

export const getVeoDefaults = (modelId: string) => {
  const model = VEO_MODELS[modelId];
  return {
    aspectRatio: "16:9",
    resolution: model.id.includes("fast") ? "1080p" : "4k",
    durationSeconds: 8,
    generateAudio: true,
    enhancePrompt: true,
    sampleCount: 1,
    negativePrompt: ""
  };
};

export const formatVeoApiPayload = (modelId: string, config: any) => {
  const model = VEO_MODELS[modelId];
  
  return {
    model: model.id,
    prompt: config.userPrompt,
    config: {
      aspect_ratio: config.aspectRatio,
      resolution: config.resolution,
      duration_seconds: config.durationSeconds,
      generate_audio: config.generateAudio,
      enhance_prompt: config.enhancePrompt,
      sample_count: config.sampleCount,
      negative_prompt: config.negativePrompt || undefined
    }
  };
};
```

### 5. Advanced Dialog Implementation Notes

1. **Audio Prompting:** Remind users in the help hint that they can describe sounds. Example: *"Add a soft piano melody and the sound of distant waves."*
2. **Image-to-Video:** If an image is provided, the model treats it as the **first frame**. If two images are provided, it can perform an **interpolation/transition** between them.
3. **The "Fast" Trade-off:** In your UI, note that while the visual quality of "Fast" is nearly identical to "Standard," complex liquid physics or fine hair textures are better handled by the non-fast version.

