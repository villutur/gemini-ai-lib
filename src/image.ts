import type { GenerateContentConfig, Part, Schema } from "@google/genai";
import { GeminiBaseService } from "./base.js";
import { GeminiAttachmentHelper } from "./helpers.js";
import { geminiLog } from "./logger.js";

/**
 * Supported Gemini models capable of image generation.
 */
export type GeminiImageModel =
  | "gemini-2.5-flash-image"
  | "gemini-3-pro-image-preview"
  | "gemini-3.1-flash-image-preview";

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
  /** The desired MIME type of the returned image. */
  outputMimeType?: "image/png" | "image/jpeg" | "image/webp" | "image/heic";
  /** If supported by the format (like jpeg/webp), the quality setting (1-100 or 0.0-1.0 depending on SDK interpretation). */
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
  public async generateImage(
    prompt: string,
    options?: GenerateImageOptions,
  ): Promise<GenerateImageResult> {
    const model = options?.model || "gemini-2.5-flash-image";
    const parts: Part[] = [];

    // Add prompt
    parts.push({ text: prompt });

    // Add reference image if provided
    if (
      options?.existingImageUrl &&
      options.existingImageUrl.startsWith("data:image")
    ) {
      const match = options.existingImageUrl.match(
        /^data:(image\/[^;]+);base64,(.+)$/,
      );
      if (match) {
        parts.push(GeminiAttachmentHelper.CreateFromBase64(match[2], match[1]));
      }
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
        personGeneration: options?.personGeneration,
        outputMimeType: options?.outputMimeType,
        compressionQuality: options?.compressionQuality,
        numberOfImages: options?.numberOfImages,
      } as any, // Cast to any to support new flash image parameters not yet fully typed
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
      const blockReason =
        candidate?.finishReason ||
        candidate?.finishMessage ||
        response.promptFeedback?.blockReason;
      throw new Error(
        blockReason
          ? `Generation blocked: ${String(blockReason)}`
          : "No image returned from Gemini",
      );
    }

    const result: GenerateImageResult = {
      text: response.text,
    };

    // Extract base64 image if present
    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        const mimeType = part.inlineData.mimeType || "image/png";
        result.base64Image = `data:${mimeType};base64,${part.inlineData.data}`;
        break; // Only picking the first image for now
      }
    }

    if (!result.base64Image && !result.text) {
      throw new Error("No image data or text in Gemini response");
    }

    return result;
  }
}
