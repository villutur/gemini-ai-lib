The **Gemini Embedding** series, as of 2026, has shifted from text-only models to natively multimodal engines. The **gemini-embedding-2-preview** is a generational leap, allowing you to project text, images, video, and audio into a single, unified vector space.

### 1. Model Capabilities & Output Table

| Feature | gemini-embedding-001 | gemini-embedding-2-preview |
| :--- | :--- | :--- |
| **Key Strength** | Stable, high-efficiency text search. | Natively multimodal (all-in-one RAG). |
| **Input Modalities** | Text only | Text, Image, Video, Audio, PDF |
| **Context Window** | 2,048 Tokens | **8,192 Tokens** |
| **Default Dimensions** | 768 or 3,072 | 3,072 |
| **MRL Support** | Yes (Flexible dimensions) | Yes (Flexible dimensions) |
| **Video Support** | N/A | Up to 120–128 seconds |
| **Languages** | 100+ | 100+ (Improved cross-lingual) |
| **Best For** | Legacy text-only apps, low-cost RAG. | Multimodal search, Video/Audio retrieval. |

---

### 2. API Configuration Options (`EmbedContentConfig`)

These options are used within the `embed_content` method. Note that `task_type` is critical for ensuring the vectors are optimized for your specific use case.

| Option | Type | Default | Description / Help Hint |
| :--- | :--- | :--- | :--- |
| **task_type** | enum | `RETRIEVAL_QUERY` | Options: `RETRIEVAL_QUERY`, `RETRIEVAL_DOCUMENT`, `SEMANTIC_SIMILARITY`, `CLASSIFICATION`, `CLUSTERING`. |
| **output_dimensionality** | int | 3,072 | Uses MRL to truncate. Recommended: 768, 1536, 3072. |
| **title** | string | "" | Only for `RETRIEVAL_DOCUMENT`. Helps index quality. |
| **auto_truncate** | boolean | true | If false, throws error if input exceeds token limit. |

---

### 3. TypeScript Implementation

This structure helps manage the shift from text-only inputs to the complex multimodal payloads required for Version 2.

```typescript
export type EmbeddingTaskType = 
  | "RETRIEVAL_QUERY" 
  | "RETRIEVAL_DOCUMENT" 
  | "SEMANTIC_SIMILARITY" 
  | "CLASSIFICATION";

export interface EmbeddingModelMetadata {
  id: string;
  name: string;
  maxTokens: number;
  description: string;
  capabilities: {
    multimodal: boolean;
    supportsVideo: boolean;
    recommendedDims: number[];
  };
}

export const EMBEDDING_MODELS: Record<string, EmbeddingModelMetadata> = {
  "gemini-embedding-001": {
    id: "gemini-embedding-001",
    name: "Gemini Embedding v1",
    maxTokens: 2048,
    description: "Standard text embedding for stable search pipelines.",
    capabilities: {
      multimodal: false,
      supportsVideo: false,
      recommendedDims: [768, 1536, 3072]
    }
  },
  "gemini-embedding-2-preview": {
    id: "gemini-embedding-2-preview",
    name: "Gemini Embedding 2 (Multimodal)",
    maxTokens: 8192,
    description: "Natively embeds text, images, video, and audio.",
    capabilities: {
      multimodal: true,
      supportsVideo: true,
      recommendedDims: [768, 1536, 3072] // 768 is the 2026 'sweet spot'
    }
  }
};
```

---

### 4. API Payload Formatter (Multimodal Logic)

The biggest change in Version 2 is the ability to "interleave" modalities. You can embed a video and a text description together to get a single vector representing that specific scene.

```typescript
// utils-embeddings.ts
export const formatEmbeddingPayload = (modelId: string, input: any, config: any) => {
  const isV2 = modelId.includes("embedding-2");
  
  // Build multimodal parts for V2
  const parts = [];
  if (typeof input === "string") {
    parts.push({ text: input });
  } else if (isV2 && Array.isArray(input)) {
    // Handle mixed input: [{text: "..."}, {inline_data: {mime_type: "video/mp4", data: "..."}}]
    parts.push(...input);
  }

  return {
    model: modelId,
    content: { parts },
    taskType: config.taskType || "RETRIEVAL_QUERY",
    outputDimensionality: config.dimensions || 768,
    // Title is highly recommended for indexing documents
    title: config.taskType === "RETRIEVAL_DOCUMENT" ? config.title : undefined
  };
};
```

---

### 5. Advanced Implementation Notes

* **The "Incompatibility" Trap:** Vectors from `gemini-embedding-001` and `gemini-embedding-2-preview` live in different mathematical spaces. You **cannot** compare a v1 query vector against a v2 document index. Upgrading requires a full re-index of your database.
* **Matryoshka Learning (MRL):** In 2026, Google explicitly recommends **768 dimensions** for V2. It retains ~98% of the accuracy of 3,072 dimensions while cutting your storage costs and search latency by 75%.
* **Video Embedding Strategy:** When embedding video, the model captures semantic motion. A query for "person falling" will match a video of a fall better than a static image of someone on the ground.
* **Task Type Pairing:** Always pair your tasks. If your database is embedded as `RETRIEVAL_DOCUMENT`, your search bar **must** use `RETRIEVAL_QUERY` to get the best distance match.

