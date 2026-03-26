Here is a detailed comparison of the Google image generation models in English, including the latest **Gemini 3.1** and **Imagen 4** specifications for 2026.

### Comparison Table: Gemini & Imagen Models (2026)

| Feature                 | **Gemini 2.5 Flash Image** (Nano Banana) | **Gemini 3.1 Flash Image** (Nano Banana 2) | **Gemini 3 Pro Image** (Nano Banana Pro) | **Imagen 4.0** (Standard / Ultra) |
| :---------------------- | :--------------------------------------- | :----------------------------------------- | :--------------------------------------- | :-------------------------------- |
| **Status**              | Stable (GA)                              | Public Preview                             | Public Preview                           | Stable (API/Vertex)               |
| **Input (Multi-modal)** | Text + Images                            | Text + Images + Search Grounding           | Text + Images + "Thinking"               | Text (+ Mask for Inpaint)         |
| **Max Attachments**     | 3 images                                 | **14 images**                              | **14 images**                            | N/A (Text-centric)                |
| **Aspect Ratios**       | 1:1, 3:2, 4:3, 16:9, 21:9 + others       | **14 options** (incl. 4:1, 8:1, 1:4, 1:8)  | **14 options** (Same as Flash)           | 1:1, 3:4, 4:3, 9:16, 16:9         |
| **Output Count**        | Up to **10** images                      | Up to **10+** (Token-based)                | 1 – 4 (Focus on Quality)                 | Up to **4** images                |
| **Max Resolution**      | 1.5K (~1536px)                           | **4K** (4096px)                            | **4K** (4096px)                          | **2K / 3K** (Variant dependent)   |
| **Format for Size**     | Ratios or Pixels                         | String (e.g., `"2K"`) or Ratio             | String (e.g., `"4K"`) or Ratio           | Exact Pixels or `"1K/2K"`         |

---

### Detailed Breakdown

#### ## Gemini 2.5 Flash Image (Nano Banana)

The "workhorse" model, designed for high-speed workflows.

- **Input Types:** You can send text prompts and up to **3 images**. It uses these for basic style transfer or "conversational editing" (e.g., "Change the color of the car in the attached photo").
- **Aspect Ratios:** Supports standard photography and social media ratios: `1:1`, `3:2`, `2:3`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, and `21:9`.
- **Dimensions:** Typically outputs at **1K (1024x1024)** by default. You specify these as a ratio string or pixel dimensions.

#### ## Gemini 3.1 Flash Image Preview (Nano Banana 2)

The current efficiency leader, now featuring **Search Grounding**.

- **Input Types:** Text and up to **14 images**. It can use Google Search to verify what a specific object or person looks like before generating.
- **Aspect Ratios:** Massive expansion, adding ultra-wide and ultra-tall ratios like **4:1, 1:4, 8:1, and 1:8** (great for banners or UI assets).
- **Dimensions:** Supports **0.5K, 1K, 2K, and 4K** tiers. In the API, you use the `image_config` parameter with strings like `"2K"`.
- **Output:** Because it has a massive output token window (32k), it can technically generate a large batch of images in one go if requested.

#### ## Gemini 3 Pro Image Preview (Nano Banana Pro)

The flagship model for complex reasoning and professional aesthetics.

- **Thinking Mode:** This model "thinks" before it draws. It plans the layout and spatial relationships to ensure everything is physically logical.
- **Input Types:** Text and up to **14 images**. It is specifically tuned for **Subject Identity**—you can provide 5 photos of yourself, and it can generate you in a completely new setting with high consistency.
- **Dimensions:** Optimized for **2K and 4K** high-fidelity outputs.
- **Output:** Usually limited to **1–4** images to ensure the highest possible detail per generation.

#### ## Imagen 4.0 (imagen-4.0-generate-001)

The dedicated design and enterprise model, separate from the Gemini "chat" ecosystem.

- **Input Types:** Strictly text-to-image (with the exception of mask files for editing). It supports **Negative Prompts** (e.g., `"no people, no blur"`), which Gemini models handle via natural language instead.
- **Aspect Ratios:** Limited to the five most common: `1:1`, `3:4`, `4:3`, `9:16`, `16:9`.
- **Dimensions:** Specified in exact pixels. The **Ultra** variant supports high-res outputs like **2816x1536** or **2048x2048**.
- **Output:** Can generate exactly **1 to 4** images per prompt, controlled by the `sampleCount` parameter.

---
