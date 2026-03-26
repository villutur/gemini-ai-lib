
### 1. Gemini 2.5 Flash Image (Nano Banana)

Optimized for high-speed generation and high-volume tasks.

- **Input (besides prompt):** Text and images. Supports "conversational editing" where you can refer back to previous images in the chat.
- **Attachments (Count):** Up to **3 images** per prompt for reference or editing.
- **Aspect Ratios:** 1:1, 3:2, 2:3, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, and 21:9.
- **Sizes & Format:** Specified via predefined ratios or pixels. Max output is approximately 1536x1536 (or pixel equivalent for other ratios).
- **Output (Count):** Up to **10 images** simultaneously per request.

### 2. Gemini 3.1 Flash Image Preview (Nano Banana 2)

The new high-efficiency model in the 3rd generation series. It is faster and features improved text rendering compared to the 2.5 version.

- **Input (besides prompt):** Text and images. Supports **Grounding with Google Search** to generate accurate details of famous landmarks or objects.
- **Attachments (Count):** Supports up to **14 reference images** simultaneously.
- **Aspect Ratios:** 1:1, 3:2, 2:3, 3:4, 4:1, 4:3, 4:5, 5:4, 9:16, 16:9.
- **Sizes & Format:** Supports resolutions up to **4K** (via upscaling/processing). Usually specified as a string (e.g., `"16:9"`).
- **Output (Count):** Limited by the output token window (max 32,768 tokens), practically allowing for multiple images (up to 10+ depending on implementation).

### 3. Gemini 3 Pro Image Preview (Nano Banana Pro)

The flagship image generation model that utilizes "Thinking" (reasoning) to understand extremely complex instructions.

- **Input (besides prompt):** Text and images. Unique for its "Thinking Process," allowing it to plan composition before generating.
- **Attachments (Count):** Up to **14 reference images**. Strongest at maintaining **Subject Identity** (keeping characters/objects consistent) across multiple images.
- **Aspect Ratios:** Same broad support as 3.1 Flash (1:1, 4:3, 16:9, 9:16, etc.).
- **Sizes & Format:** Native **1K** output, but with built-in intelligent upscaling to **2K and 4K**.
- **Output (Count):** Typically generates 1–4 high-quality images per request to maximize detail density.

### 4. Imagen 4.0 (imagen-4.0-generate-001)

The latest standalone image model (separate from the Gemini multimodal architecture). This model comes in three variants: _Fast_, _Standard_, and _Ultra_.

- **Input (besides prompt):** Primarily text. (Specific versions support image masking for inpainting). Also supports **Negative Prompting** (specifying what _not_ to include in the image).
- **Attachments (Count):** Generally limited to mask files or single reference images depending on API configuration.
- **Aspect Ratios:** 1:1, 3:4, 4:3, 9:16, 16:9.
- **Sizes & Format:** Specified in exact pixel dimensions.
  - _Standard:_ 1024x1024, 896x1280, 1280x896, 768x1408, 1408x768.
  - _Ultra:_ Supports native **2K** (e.g., 2048x2048, 2560x1792, 2816x1536).
- **Output (Count):** Up to **4 images** simultaneously per prompt.

---

### Summary of Differences

- **Gemini 3 models** are best if you want to "chat" your way to a result, use many reference images (up to 14!), or need "Thinking" for complicated scenes.
- **Imagen 4** is best for pure photographic quality, exact pixel control, and when you need to use negative prompts.
