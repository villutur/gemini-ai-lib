import type { GenerateContentConfig, Part, Schema } from "@google/genai";
import { GeminiBaseService } from "./base.js";
import { GeminiAttachmentHelper } from "./helpers.js";
import { geminiLog } from "./logger.js";
import {
  GEMINI_IMAGE_MODELS,
  GEMINI_IMAGE_MODEL_DISPLAY_NAMES,
  getImageModelDisplayName,
  type KnownImageGenerationModel,
} from "./model-catalogs.js";

/**
 * Supported Gemini models capable of image generation.
 */
export type GeminiImageModel =
  | KnownImageGenerationModel;

/**
 * Re-exported image-model catalogs and labels for convenience.
 */
export { GEMINI_IMAGE_MODELS, GEMINI_IMAGE_MODEL_DISPLAY_NAMES, getImageModelDisplayName };

/**
 * Helper to check if a model is an Imagen model.
 * Imagen models use a different API (generateImages) compared to standard Gemini models (generateContent).
 *
 * @param model The model ID to check.
 * @returns True if it's an Imagen model.
 */
export function isImagenImageModel(model: GeminiImageModel) {
  return model === "imagen-4.0-generate-001";
}

/** Array of supported aspect ratios for Gemini flash image */
export const FLASH_IMAGE_ASPECT_RATIOS = [
  "1:1",
  "1:4",
  "1:8",
  "2:3",
  "3:2",
  "3:4",
  "4:1",
  "4:3",
  "4:5",
  "5:4",
  "8:1",
  "9:16",
  "16:9",
  "21:9",
] as const;

export type GeminiFlashAspectRatio = (typeof FLASH_IMAGE_ASPECT_RATIOS)[number];

/**
 * Supported resolutions for image generation. Models vary in their support for these sizes (e.g., 3.1-flash supports up to 4K).
 */
export type GeminiImageSize = "256" | "512" | "1K" | "2K" | "4K";

/**
 * Options for configuring image generation requests to Gemini APIs.
 */
export interface GenerateImageOptions {
  /** The specific Gemini model targeting image generation. */
  model?: GeminiImageModel;
  /** The desired width-to-height ratio of the generated image. */
  aspectRatio?: GeminiFlashAspectRatio;
  /** The resolution category for the generated image. */
  imageSize?: GeminiImageSize;
  /** A Data URI of an existing image to use as a reference (e.g., for outpainting or editing). */
  existingImageUrl?: string | null;
  /** Filter strategy for generating images that include people. */
  personGeneration?: "ALLOW_ADULT" | "ALLOW_ALL" | "DONT_ALLOW";
  /** How many distinct images to generate in one request. Defaults to 1. */
  numberOfImages?: number;

  // Output format handling
  /** The desired MIME type of the returned image. In practice this is Imagen-only. */
  outputMimeType?: "image/png" | "image/jpeg" | "image/webp" | "image/heic";
  /** Compression control for supported image outputs. In practice this is Imagen-only. */
  compressionQuality?: number;

  // Modality & text handling
  /** Specifies what kind of content the model is allowed to return (e.g., ["image", "text"]). */
  responseModalities?: Array<"image" | "text" | "IMAGE" | "TEXT">;
  /** Desired MIME type for any structured text returned alongside the image. */
  responseMimeType?: string;
  /** JSON schema defining the required structure for the text response. */
  responseSchema?: Schema;
}

/**
 * The unified result of an image generation request.
 */
export interface GenerateImageResult {
  /** The generated image formatted as a Base64 Data URI string (e.g., data:image/png;base64,...). */
  base64Image?: string;
  /** All generated images formatted as Base64 Data URI strings. */
  base64Images?: string[];
  /** Any descriptive or structured text returned alongside the image (multimodal models only). */
  text?: string;
}

/**
 * Service dedicated to image generation and manipulation using Gemini.
 */
export class GeminiImageService extends GeminiBaseService {
  /**
   * Generates an image (and optionally text) based on a text prompt.
   * Can accept an existing image via options to perform outpainting or in-context edits.
   *
   * @param prompt The descriptive text prompt for the desired image.
   * @param options Extensive configuration covering model, size, aspect ratio, and multimodal responses.
   * @returns A Promise resolving to a GenerateImageResult containing the Data URI and/or descriptive text.
   */
  public async generateImageFromPrompt(prompt: string, options?: GenerateImageOptions): Promise<GenerateImageResult> {
    const parts: Part[] = [{ text: prompt }];

    // Add reference image if provided (legacy helper path)
    if (options?.existingImageUrl && options.existingImageUrl.startsWith("data:image")) {
      const match = options.existingImageUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (match) {
        parts.push(GeminiAttachmentHelper.CreateFromBase64(match[2], match[1]));
      }
    }

    return this.generateImage(parts, options);
  }

  /**
   * Generates an image (and optionally text) based on multimodal parts.
   * Supports complex inputs including text prompts and multiple reference images.
   *
   * @param parts The array of input parts (text, inlineData, etc.).
   * @param options Extensive configuration covering model, size, aspect ratio, and multimodal responses.
   * @returns A Promise resolving to a GenerateImageResult.
   */
  public async generateImage(parts: Part[], options?: GenerateImageOptions): Promise<GenerateImageResult> {
    const model = options?.model || "gemini-2.5-flash-image";

    if (isImagenImageModel(model)) {
      // Imagen models only support a single text prompt
      const prompt = parts
        .map((p) => p.text)
        .filter(Boolean)
        .join(" ");

      const response = await this.ai.models.generateImages({
        model,
        prompt,
        config: {
          numberOfImages: options?.numberOfImages,
          aspectRatio: options?.aspectRatio,
          imageSize: options?.imageSize,
          personGeneration: options?.personGeneration as any,
          outputMimeType: options?.outputMimeType,
          outputCompressionQuality: options?.compressionQuality,
        },
      });

      const images: string[] = (response.generatedImages || [])
        .map((gi) => {
          const bytes = gi.image?.imageBytes;
          const mime = gi.image?.mimeType || options?.outputMimeType || "image/png";
          return bytes ? `data:${mime};base64,${bytes}` : null;
        })
        .filter((img): img is string => !!img);

      if (images.length === 0) {
        const blockReason = response.generatedImages?.[0]?.raiFilteredReason || "No images returned from Imagen";
        throw new Error(`Generation blocked: ${String(blockReason)}`);
      }

      return {
        base64Image: images[0],
        base64Images: images,
      };
    }

    const config: GenerateContentConfig = {
      responseModalities: options?.responseModalities
        ? (options.responseModalities as unknown as GenerateContentConfig["responseModalities"])
        : (["image"] as unknown as GenerateContentConfig["responseModalities"]),
      responseMimeType: options?.responseMimeType,
      responseSchema: options?.responseSchema,
      imageConfig: {
        aspectRatio: options?.aspectRatio,
        imageSize: options?.imageSize,
        personGeneration: options?.personGeneration === "DONT_ALLOW" ? "ALLOW_NONE" : options?.personGeneration,
      },
    };

    const response = await this.ai.models.generateContent({
      model: model,
      contents: [{ role: "user", parts: parts }],
      config: config,
    });

    const candidate = response.candidates?.[0];

    // Handle blocked or errored generation
    if (!candidate || !candidate.content?.parts) {
      geminiLog.warn("Gemini response:", response);
      const blockReason = candidate?.finishReason || candidate?.finishMessage || response.promptFeedback?.blockReason;
      throw new Error(blockReason ? `Generation blocked: ${String(blockReason)}` : "No image returned from Gemini");
    }

    const images: string[] = [];
    // Extract base64 images if present
    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        const mimeType = part.inlineData.mimeType || "image/png";
        images.push(`data:${mimeType};base64,${part.inlineData.data}`);
      }
    }

    const result: GenerateImageResult = {
      text: response.text,
      base64Image: images[0],
      base64Images: images.length > 0 ? images : undefined,
    };

    if (!result.base64Image && !result.text) {
      throw new Error("No image data or text in Gemini response");
    }

    return result;
  }

  /**
   * Generates an SVG image string based on a text prompt using a Gemini text model.
   * Can optionally take one or more reference SVGs to guide the generation.
   *
   * @param prompt The descriptive text prompt for the desired SVG.
   * @param options Configuration options including the model and reference SVG strings.
   * @returns A Promise resolving to a string containing the generated SVG markup.
   */
  public async generateSvgFromPrompt(
    prompt: string,
    options?: { model?: string; references?: string[] },
  ): Promise<string> {
    const parts: Part[] = [];

    if (options?.references && options.references.length > 0) {
      parts.push({ text: "Use the following SVG(s) as reference for style, structure, or elements:\n\n" });
      options.references.forEach((ref, index) => {
        parts.push({ text: `Reference SVG ${index + 1}:\n${ref}\n\n` });
      });
    }

    parts.push({ text: `Request: ${prompt}` });

    return this.generateSvg(parts, options);
  }

  /**
   * Generates an SVG image string based on multimodal parts.
   *
   * @param parts The array of input parts (text, inlineData, etc.).
   * @param options Configuration options including the model.
   * @returns A Promise resolving to a string containing the generated SVG markup.
   */
  public async generateSvg(
    parts: Part[],
    options?: { model?: string },
  ): Promise<string> {
    const model = options?.model || "gemini-3.1-flash-lite-preview";
    const systemInstruction = `You are an expert SVG designer. Generate a highly detailed, clean, and scalable SVG image based on the request.
Do NOT wrap the response in markdown code blocks. Return ONLY the raw <svg>...</svg> string.
Ensure the SVG uses a proper viewBox and modern, attractive styling.`;

    const response = await this.ai.models.generateContent({
      model,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    let svgText = response.text || "";
    // Clean up any markdown formatting just in case the model ignored instructions
    svgText = svgText.replace(/^```xml\s*/i, "");
    svgText = svgText.replace(/^```svg\s*/i, "");
    svgText = svgText.replace(/^```\s*/, "");
    svgText = svgText.replace(/```\s*$/, "");
    return svgText.trim();
  }
}
