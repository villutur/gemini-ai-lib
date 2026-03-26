To help you build a robust "Select Model" dialog, I’ve structured this into a clean, scalable TypeScript implementation. This includes an `ImageModelConfig` interface and a constant object containing the specific metadata for each model we discussed.

### TypeScript Definitions

First, let's define the types to ensure your UI components (like dropdowns, sliders, and toggles) are type-safe.

```typescript
export type AspectRatio =
  | "1:1"
  | "4:3"
  | "3:4"
  | "16:9"
  | "9:16"
  | "21:9"
  | "4:1"
  | "1:4"
  | "8:1"
  | "1:8"
  | "3:2"
  | "2:3"
  | "4:5"
  | "5:4";

export type ResolutionTier = "0.5K" | "1K" | "1.5K" | "2K" | "3K" | "4K";

export interface ImageModelMetadata {
  id: string;
  name: string;
  series: "Gemini" | "Imagen";
  description: string;
  helpHint: string;
  capabilities: {
    maxAttachments: number;
    supportedRatios: AspectRatio[];
    maxOutputCount: number;
    maxResolution: ResolutionTier;
    supportsNegativePrompt: boolean;
    supportsGrounding: boolean;
    supportsThinking: boolean;
  };
  apiConfig: {
    sizeFormat: "ratio" | "pixel" | "tier";
    modelEndpoint: string;
  };
}
```

---

### The Model Data Object

This object contains all the specific constraints and descriptions for the 2026 model lineup.

```typescript
export const IMAGE_GENERATION_MODELS: Record<string, ImageModelMetadata> = {
  "gemini-2.5-flash-image": {
    id: "gemini-2.5-flash-image",
    name: "Gemini 2.5 Flash Image",
    series: "Gemini",
    description: "High-speed, efficient generation for high-volume tasks.",
    helpHint: "Best for quick iterations and basic image editing via chat.",
    capabilities: {
      maxAttachments: 3,
      supportedRatios: ["1:1", "3:2", "2:3", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"],
      maxOutputCount: 10,
      maxResolution: "1.5K",
      supportsNegativePrompt: false,
      supportsGrounding: false,
      supportsThinking: false,
    },
    apiConfig: {
      sizeFormat: "ratio",
      modelEndpoint: "models/gemini-2.5-flash-image",
    },
  },
  "gemini-3.1-flash-image-preview": {
    id: "gemini-3.1-flash-image-preview",
    name: "Gemini 3.1 Flash (Nano Banana 2)",
    series: "Gemini",
    description: "Next-gen efficiency with Google Search grounding.",
    helpHint: "Use this when accuracy for real-world landmarks or objects is required.",
    capabilities: {
      maxAttachments: 14,
      supportedRatios: ["1:1", "3:2", "2:3", "3:4", "4:1", "1:4", "8:1", "1:8", "4:3", "4:5", "5:4", "9:16", "16:9"],
      maxOutputCount: 10,
      maxResolution: "4K",
      supportsNegativePrompt: false,
      supportsGrounding: true,
      supportsThinking: false,
    },
    apiConfig: {
      sizeFormat: "tier",
      modelEndpoint: "models/gemini-3.1-flash-image-preview",
    },
  },
  "gemini-3-pro-image-preview": {
    id: "gemini-3-pro-image-preview",
    name: "Gemini 3 Pro (Nano Banana Pro)",
    series: "Gemini",
    description: "Flagship reasoning model for complex compositions.",
    helpHint: "Ideal for maintainig character consistency and complex spatial logic.",
    capabilities: {
      maxAttachments: 14,
      supportedRatios: ["1:1", "3:2", "2:3", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9"],
      maxOutputCount: 4,
      maxResolution: "4K",
      supportsNegativePrompt: false,
      supportsGrounding: true,
      supportsThinking: true,
    },
    apiConfig: {
      sizeFormat: "tier",
      modelEndpoint: "models/gemini-3-pro-image-preview",
    },
  },
  "imagen-4.0-generate-001": {
    id: "imagen-4.0-generate-001",
    name: "Imagen 4.0 Ultra",
    series: "Imagen",
    description: "Professional standalone model with photographic precision.",
    helpHint: "Use for commercial-grade photography and when you need negative prompts.",
    capabilities: {
      maxAttachments: 1, // Usually for mask/reference
      supportedRatios: ["1:1", "3:4", "4:3", "9:16", "16:9"],
      maxOutputCount: 4,
      maxResolution: "3K",
      supportsNegativePrompt: true,
      supportsGrounding: false,
      supportsThinking: false,
    },
    apiConfig: {
      sizeFormat: "pixel",
      modelEndpoint: "models/imagen-4.0-generate-001",
    },
  },
};
```

---

### Implementation Tips for your Dialog:

1.  **Dynamic Ratios:** Use `capabilities.supportedRatios` to map out your aspect ratio selector. This prevents users from selecting "4:1" for Imagen 4.0, which would result in an API error.
2.  **Input UI:** Use `capabilities.maxAttachments` to set the limit on your file uploader.
3.  **Conditional Features:** Only show the "Negative Prompt" text field if `supportsNegativePrompt` is true. Similarly, show a "Thinking Mode" toggle only for the Pro model.
4.  **Tooltips:** Map `helpHint` to a small info icon next to the model name in your dropdown.

**Would you like me to write a React/Vue component skeleton using this data for the dialog?**
