Building a dialog for image models is more complex because, unlike text models, they often mix "generation" and "editing" parameters.

As of March 2026, the **Gemini 3.1** and **Imagen 4** models follow a split logic: Gemini handles conversational reasoning and high-context image editing, while Imagen 4 focuses on high-fidelity, standalone text-to-image synthesis.

### 1. Image Model Capability & Attachment Table

| Model ID                           | Max Input Tokens | Max Attachments (Input) | Max Output (Images) | Resolution Support | Grounding      |
| :--------------------------------- | :--------------- | :---------------------- | :------------------ | :----------------- | :------------- |
| **gemini-2.5-flash-image**         | 32k              | 3 images                | 10                  | Up to 1.5K         | No             |
| **gemini-3.1-flash-image-preview** | 128k             | **14 images**           | 10+                 | **0.5K to 4K**     | Search + Image |
| **gemini-3-pro-image-preview**     | 64k              | **14 images**           | 1–4                 | **1K to 4K**       | Search + Image |
| **imagen-4.0-generate-001**        | 480 (Text)       | 1 (Mask only)           | 4                   | **1K to 3K**       | No             |

---

### 2. API Configuration Options (Image Specific)

| Option             | Type   | Default         | Description / Help Hint                                                    |
| :----------------- | :----- | :-------------- | :------------------------------------------------------------------------- |
| `aspectRatio`      | enum   | `"1:1"`         | Sets the shape. Gemini 3.1 supports extreme ratios like `4:1` and `1:8`.   |
| `imageSize`        | string | `"1K"`          | Tier-based resolution (0.5K, 1K, 2K, 4K). Note: 4K is Pro/3.1 only.        |
| `sampleCount`      | int    | 1               | Number of images to generate (1–10 for Gemini, 1–4 for Imagen).            |
| `negativePrompt`   | string | `""`            | **Imagen only.** Words to exclude (e.g., "blur, low quality").             |
| `personGeneration` | enum   | `"allow_adult"` | Control people generation: `dont_allow`, `allow_adult`, `allow_all`.       |
| `enhancePrompt`    | bool   | `true`          | Automatically expands your short prompt for better details.                |
| `outputMimeType`   | string | `"image/jpeg"`  | Currently `image/jpeg` is standard; `image/png` supported in some regions. |

---

### 3. TypeScript Implementation (Image-Specific)

This object separates the **Image API** logic from the Text API logic, specifically handling the `imageSize` tiers and `personGeneration` safety flags.

```typescript
export type ImageResolution = "0.5K" | "1K" | "2K" | "3K" | "4K";

export interface ImageModelMetadata {
  id: string;
  name: string;
  generation: "2.5" | "3.x" | "Imagen4";
  description: string;
  capabilities: {
    maxImages: number;
    supportedRatios: string[];
    resolutions: ImageResolution[];
    supportsNegativePrompt: boolean;
    supportsEdit: boolean;
  };
}

export const IMAGE_MODELS: Record<string, ImageModelMetadata> = {
  "gemini-3.1-flash-image-preview": {
    id: "gemini-3.1-flash-image-preview",
    name: "Gemini 3.1 Flash Image",
    generation: "3.x",
    description: "Fast, high-context image generation with 4K support.",
    capabilities: {
      maxImages: 10,
      supportedRatios: ["1:1", "4:3", "16:9", "9:16", "4:1", "1:8"],
      resolutions: ["0.5K", "1K", "2K", "4K"],
      supportsNegativePrompt: false,
      supportsEdit: true,
    },
  },
  "imagen-4.0-generate-001": {
    id: "imagen-4.0-generate-001",
    name: "Imagen 4.0 Ultra",
    generation: "Imagen4",
    description: "Professional text-to-image with negative prompting.",
    capabilities: {
      maxImages: 4,
      supportedRatios: ["1:1", "4:3", "3:4", "16:9", "9:16"],
      resolutions: ["1K", "2K", "3K"],
      supportsNegativePrompt: true,
      supportsEdit: false,
    },
  },
};
```

---

### 4. Helper: API Payload & Reset Logic (React/TS)

```tsx
// utils-image.ts

export const getImageModelDefaults = (modelId: string) => {
  const model = IMAGE_MODELS[modelId];
  return {
    aspectRatio: "1:1",
    imageSize: model.capabilities.resolutions.includes("1K") ? "1K" : model.capabilities.resolutions[0],
    sampleCount: 1,
    negativePrompt: "",
    enhancePrompt: true,
    personGeneration: "allow_adult",
    thinkingLevel: model.generation === "3.x" ? "minimal" : undefined,
  };
};

export const formatImageApiPayload = (modelId: string, config: any) => {
  const model = IMAGE_MODELS[modelId];

  // Base configuration structure
  const payload: any = {
    model: modelId,
    imageConfig: {
      aspectRatio: config.aspectRatio,
      imageSize: config.imageSize,
      sampleCount: config.sampleCount,
      enhancePrompt: config.enhancePrompt,
      personGeneration: config.personGeneration,
    },
  };

  // Add Imagen-specific negative prompting
  if (model.capabilities.supportsNegativePrompt) {
    payload.imageConfig.negativePrompt = config.negativePrompt;
  }

  // Add Gemini 3.x thinking config for "Visual Reasoning"
  if (model.generation === "3.x") {
    payload.thinkingConfig = { thinkingLevel: config.thinkingLevel };
  }

  return payload;
};
```

### 5. Summary for your Dialog

1.  **Thinking Logic:** For `gemini-3.1-flash-image`, set the `thinkingLevel` to `minimal` by default. Only increase it to `high` if the user is doing "Visual Reasoning" (e.g., "Modify the object based on the math equation in the background").
2.  **Resolution Constraints:** If the user selects `imagen-4.0`, hide the `4K` option, as it currently peaks at `3K` for Ultra.
3.  **Negative Prompt:** Only show the "Avoid these things..." text area when `imagen-4.0` is selected. Gemini models prefer negative constraints written directly in the main prompt.
