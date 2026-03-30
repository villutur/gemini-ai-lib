import type {
  ContentListUnion,
  GenerateContentConfig,
  GenerateContentResponse,
  Part,
} from "@google/genai";
import { GeminiBaseService } from "./base.js";
import { GeminiAttachmentHelper } from "./helpers.js";
import {
  GEMINI_IMAGE_MODELS,
  GEMINI_IMAGE_MODEL_DISPLAY_NAMES,
  getImageModelDisplayName,
  type KnownImageGenerationModel,
} from "./model-catalogs.js";

/**
 * Re-exported image-model catalogs and labels for convenience.
 */
export { GEMINI_IMAGE_MODELS, GEMINI_IMAGE_MODEL_DISPLAY_NAMES, getImageModelDisplayName };
export type { KnownImageGenerationModel };
export type {
  Content,
  ContentListUnion,
  GenerateContentConfig,
  GenerateContentResponse,
  GenerateImagesConfig,
  GenerateImagesParameters,
  GenerateImagesResponse,
  GeneratedImage,
  GeneratedImageMask,
  ImageConfig,
  ImageConfigImageOutputOptions,
  Part,
} from "@google/genai";
export { PersonGeneration } from "@google/genai";

/**
 * Supported Gemini models capable of image generation.
 * Known models are exported in the catalog, but explicit strings are allowed so
 * callers can stay forward-compatible when the SDK exposes new image models.
 */
export type GeminiImageModel =
  | KnownImageGenerationModel
  | string;

type ImageGenerationRoute = "gemini-generate-content" | "imagen-generate-images";

/**
 * Helper to check if a model is an Imagen model.
 * Imagen models use `generateImages(...)` compared to Gemini image models
 * using `generateContent(...)`.
 *
 * @param model The model ID to check.
 * @returns True if it is an Imagen model.
 */
export function isImagenImageModel(model: string) {
  return model === "imagen-4.0-generate-001";
}

/** Array of supported aspect ratios for Gemini flash image helpers. */
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
 * Supported image-size tiers for the normalized helper contract.
 */
export type GeminiImageSize = "256" | "512" | "1K" | "2K" | "4K";

/**
 * Options for configuring high-level image generation requests.
 */
export interface GenerateImageOptions {
  /** The specific image-generation model to use. Defaults to `gemini-2.5-flash-image`. */
  model?: GeminiImageModel;
  /** The desired width-to-height ratio of the generated image. */
  aspectRatio?: GeminiFlashAspectRatio;
  /** The resolution tier for the generated image when the selected route supports it. */
  imageSize?: GeminiImageSize;
  /** A Data URI of an existing image to use as a reference (legacy helper path). */
  existingImageUrl?: string | null;
  /** Filter strategy for generating images that include people. */
  personGeneration?: "ALLOW_ADULT" | "ALLOW_ALL" | "DONT_ALLOW";
  /** How many distinct images to generate in one request. High-level helper support is Imagen-only. */
  numberOfImages?: number;

  // Output format handling
  /** Desired MIME type for generated image binaries. High-level helper support is Imagen-only. */
  outputMimeType?: "image/png" | "image/jpeg" | "image/webp" | "image/heic";
  /** Compression control for lossy image outputs. High-level helper support is Imagen-only. */
  compressionQuality?: number;

  // Modality & text handling
  /** Response modalities for Gemini image-model `generateContent(...)` calls. */
  responseModalities?: Array<"image" | "text" | "IMAGE" | "TEXT">;
  /** MIME type for non-image response channels on Gemini image-model paths. */
  responseMimeType?: string;
  /** JSON schema for structured non-image response channels on Gemini image-model paths. */
  responseSchema?: GenerateContentConfig["responseSchema"];
}

/**
 * Raw Gemini image-model `generateContent(...)` request shape.
 * This mirrors the Gemini text service pattern: the caller passes `contents`
 * separately from the request object, while `request.config` remains a direct
 * SDK `GenerateContentConfig`.
 */
export interface GenerateImageContentRequest {
  /** The Gemini image model to call. Imagen models are intentionally unsupported here. */
  model?: GeminiImageModel;
  /** Raw SDK config passed through to `models.generateContent(...)`. */
  config?: GenerateContentConfig;
}

/**
 * The unified result of a normalized image generation request.
 */
export interface GenerateImageResult {
  /** The first generated image formatted as a Base64 Data URI string. */
  base64Image?: string;
  /** All generated images formatted as Base64 Data URI strings. */
  base64Images?: string[];
  /** Any descriptive or structured text returned alongside the image. */
  text?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPartLike(value: unknown): value is Part {
  if (!isRecord(value)) {
    return false;
  }

  return (
    "text" in value ||
    "inlineData" in value ||
    "fileData" in value ||
    "functionCall" in value ||
    "functionResponse" in value ||
    "executableCode" in value ||
    "codeExecutionResult" in value ||
    "videoMetadata" in value
  );
}

function isContentLike(value: unknown): value is { parts?: Part[] } {
  return isRecord(value) && "parts" in value;
}

function toDefinedRecord(entries: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(entries).filter(([, value]) => value !== undefined));
}

function toContentParts(contents: ContentListUnion): Part[] {
  if (typeof contents === "string") {
    return [{ text: contents }];
  }

  if (Array.isArray(contents)) {
    if (contents.length === 0) {
      return [];
    }

    if (isPartLike(contents[0])) {
      return contents as Part[];
    }

    return (contents as Array<{ parts?: Part[] }>).flatMap((content) => content.parts ?? []);
  }

  if (isContentLike(contents)) {
    return contents.parts ?? [];
  }

  return [];
}

function summarizeContents(contents: ContentListUnion) {
  const parts = toContentParts(contents);

  return {
    inputType: Array.isArray(contents)
      ? (contents.length > 0 && isPartLike(contents[0]) ? "part-array" : "content-array")
      : typeof contents === "string"
        ? "string"
        : "content-object",
    contentItemCount:
      typeof contents === "string"
        ? 1
        : Array.isArray(contents)
          ? contents.length
          : 1,
    partCount: parts.length,
    textPartCount: parts.filter((part) => typeof part.text === "string" && part.text.trim().length > 0).length,
    attachmentCount: parts.filter((part) => Boolean(part.inlineData || part.fileData)).length,
    inlineAttachmentCount: parts.filter((part) => Boolean(part.inlineData)).length,
    fileAttachmentCount: parts.filter((part) => Boolean(part.fileData)).length,
  };
}

function summarizeGenerateImageParts(parts: Part[]) {
  return {
    partCount: parts.length,
    textPartCount: parts.filter((part) => typeof part.text === "string" && part.text.trim().length > 0).length,
    attachmentCount: parts.filter((part) => Boolean(part.inlineData || part.fileData)).length,
    inlineAttachmentCount: parts.filter((part) => Boolean(part.inlineData)).length,
    fileAttachmentCount: parts.filter((part) => Boolean(part.fileData)).length,
  };
}

function summarizeImageOptions(options: GenerateImageOptions | undefined, route: ImageGenerationRoute) {
  return toDefinedRecord({
    route,
    aspectRatio: options?.aspectRatio,
    imageSize: options?.imageSize,
    personGeneration: options?.personGeneration,
    numberOfImages: route === "imagen-generate-images" ? options?.numberOfImages : undefined,
    outputMimeType: route === "imagen-generate-images" ? options?.outputMimeType : undefined,
    compressionQuality: route === "imagen-generate-images" ? options?.compressionQuality : undefined,
    responseModalities: route === "gemini-generate-content" ? options?.responseModalities : undefined,
    responseMimeType: route === "gemini-generate-content" ? options?.responseMimeType : undefined,
    hasResponseSchema: route === "gemini-generate-content" ? Boolean(options?.responseSchema) : undefined,
    hasExistingImageUrl: Boolean(options?.existingImageUrl),
  });
}

function summarizeGenerateContentConfig(config: GenerateContentConfig | undefined) {
  const imageConfig = isRecord(config?.imageConfig)
    ? toDefinedRecord(config.imageConfig as Record<string, unknown>)
    : undefined;

  return toDefinedRecord({
    responseModalities: config?.responseModalities as unknown,
    responseMimeType: config?.responseMimeType,
    hasResponseSchema: Boolean(config?.responseSchema),
    hasSystemInstruction: Boolean(config?.systemInstruction),
    imageConfig,
  });
}

function summarizeGenerateContentResponse(response: GenerateContentResponse) {
  const candidate = response.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  const imagePartCount = parts.filter((part) => Boolean(part.inlineData?.data)).length;
  const textPartCount = parts.filter((part) => typeof part.text === "string" && part.text.trim().length > 0).length;

  return {
    candidateCount: response.candidates?.length ?? 0,
    hasCandidate: Boolean(candidate),
    finishReason: candidate?.finishReason,
    finishMessage: candidate?.finishMessage,
    imagePartCount,
    textPartCount,
    hasText: Boolean(response.text),
    textLength: response.text?.length ?? 0,
    promptFeedback: response.promptFeedback,
  };
}

function summarizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    value: String(error),
  };
}

function isGenerationBlockedError(error: unknown) {
  return error instanceof Error && /^Generation blocked:/i.test(error.message);
}

function buildBlockReason(response: GenerateContentResponse) {
  const candidate = response.candidates?.[0];
  return (
    candidate?.finishMessage ||
    candidate?.finishReason ||
    response.promptFeedback?.blockReason ||
    response.promptFeedback?.blockReasonMessage ||
    undefined
  );
}

function isBlockedGenerateContentResponse(response: GenerateContentResponse) {
  const candidate = response.candidates?.[0];
  const finishReason = typeof candidate?.finishReason === "string" ? candidate.finishReason : undefined;

  if (!candidate) {
    return true;
  }

  if (response.promptFeedback?.blockReason || response.promptFeedback?.blockReasonMessage) {
    return true;
  }

  if (!finishReason) {
    return false;
  }

  return finishReason !== "STOP" && finishReason !== "MAX_TOKENS";
}

function buildGeminiImageConfig(options: GenerateImageOptions | undefined): GenerateContentConfig {
  const imageConfig = toDefinedRecord({
    aspectRatio: options?.aspectRatio,
    imageSize: options?.imageSize,
    personGeneration: options?.personGeneration === "DONT_ALLOW" ? "ALLOW_NONE" : options?.personGeneration,
  });

  return toDefinedRecord({
    responseModalities: options?.responseModalities
      ? (options.responseModalities as unknown as GenerateContentConfig["responseModalities"])
      : (["image"] as unknown as GenerateContentConfig["responseModalities"]),
    responseMimeType: options?.responseMimeType,
    responseSchema: options?.responseSchema,
    imageConfig: Object.keys(imageConfig).length > 0 ? imageConfig : undefined,
  }) as GenerateContentConfig;
}

function normalizeGenerateContentImages(response: GenerateContentResponse) {
  const candidate = response.candidates?.[0];
  const images: string[] = [];

  for (const part of candidate?.content?.parts ?? []) {
    if (part.inlineData?.data) {
      const mimeType = part.inlineData.mimeType || "image/png";
      images.push(`data:${mimeType};base64,${part.inlineData.data}`);
    }
  }

  return images;
}

/**
 * Service dedicated to image generation and manipulation using Gemini and Imagen.
 */
export class GeminiImageService extends GeminiBaseService {
  /**
   * Raw Gemini image-model `generateContent(...)` wrapper.
   * Returns the SDK response unchanged and logs the request lifecycle.
   *
   * Imagen models are intentionally unsupported here because they use a
   * different endpoint (`generateImages(...)`).
   */
  public async generateContent(
    contents: ContentListUnion,
    request?: GenerateImageContentRequest,
  ): Promise<GenerateContentResponse> {
    const model = request?.model || "gemini-2.5-flash-image";

    if (isImagenImageModel(model)) {
      throw new Error(
        "GeminiImageService.generateContent(...) only supports Gemini image models. Use generateImage(...) for Imagen routes.",
      );
    }

    const contentSummary = summarizeContents(contents);
    const configSummary = summarizeGenerateContentConfig(request?.config);

    await this.log({
      level: "info",
      source: "gemini.image.raw",
      message: "Gemini image generateContent started.",
      status: "running",
      metadata: {
        model,
        route: "gemini-generate-content",
        ...contentSummary,
        requestConfig: configSummary,
      },
    });

    try {
      const response = await this.ai.models.generateContent({
        model,
        contents,
        config: request?.config,
      });

      const responseSummary = summarizeGenerateContentResponse(response);
      const isBlocked = isBlockedGenerateContentResponse(response);

      await this.log({
        level: isBlocked ? "warn" : "info",
        source: "gemini.image.raw",
        message: isBlocked
          ? "Gemini image generateContent completed with blocked response."
          : "Gemini image generateContent completed.",
        status: isBlocked ? "error" : "success",
        metadata: {
          model,
          route: "gemini-generate-content",
          ...responseSummary,
          blockReason: isBlocked ? buildBlockReason(response) : undefined,
        },
      });

      return response;
    } catch (error) {
      await this.log({
        level: "error",
        source: "gemini.image.raw",
        message: "Gemini image generateContent failed.",
        status: "error",
        metadata: {
          model,
          route: "gemini-generate-content",
          ...contentSummary,
          requestConfig: configSummary,
          error: summarizeError(error),
        },
      });

      throw error;
    }
  }

  /**
   * Generates an image (and optionally text) based on a text prompt.
   * Can accept an existing image via options to perform outpainting or edits.
   */
  public async generateImageFromPrompt(prompt: string, options?: GenerateImageOptions): Promise<GenerateImageResult> {
    const parts: Part[] = [{ text: prompt }];

    if (options?.existingImageUrl && options.existingImageUrl.startsWith("data:image")) {
      const match = options.existingImageUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (match) {
        parts.push(GeminiAttachmentHelper.CreateFromBase64(match[2], match[1]));
      }
    }

    return this.generateImage(parts, options);
  }

  /**
   * High-level normalized image generation helper.
   * For Gemini image models it uses the raw `generateContent(...)` wrapper and
   * normalizes the response into a consistent `GenerateImageResult`.
   * For Imagen it continues using `generateImages(...)`.
   */
  public async generateImage(parts: Part[], options?: GenerateImageOptions): Promise<GenerateImageResult> {
    const model = options?.model || "gemini-2.5-flash-image";
    const route: ImageGenerationRoute = isImagenImageModel(model) ? "imagen-generate-images" : "gemini-generate-content";
    const partSummary = summarizeGenerateImageParts(parts);

    await this.log({
      level: "info",
      source: "gemini.image",
      message: "Gemini image generation started.",
      status: "running",
      metadata: {
        model,
        route,
        ...partSummary,
        requestedOptions: summarizeImageOptions(options, route),
      },
    });

    if (isImagenImageModel(model)) {
      const prompt = parts
        .map((part) => part.text)
        .filter((text): text is string => typeof text === "string" && text.trim().length > 0)
        .join(" ");

      try {
        const response = await this.ai.models.generateImages({
          model,
          prompt,
          config: toDefinedRecord({
            numberOfImages: options?.numberOfImages,
            aspectRatio: options?.aspectRatio,
            imageSize: options?.imageSize,
            personGeneration: options?.personGeneration,
            outputMimeType: options?.outputMimeType,
            outputCompressionQuality: options?.compressionQuality,
          }),
        });

        const images: string[] = (response.generatedImages || [])
          .map((generatedImage) => {
            const bytes = generatedImage.image?.imageBytes;
            const mime = generatedImage.image?.mimeType || options?.outputMimeType || "image/png";
            return bytes ? `data:${mime};base64,${bytes}` : null;
          })
          .filter((image): image is string => Boolean(image));

        if (images.length === 0) {
          const blockReason = response.generatedImages?.[0]?.raiFilteredReason || "No images returned from Imagen";

          await this.log({
            level: "warn",
            source: "gemini.image",
            message: "Imagen image generation completed with blocked response.",
            status: "error",
            metadata: {
              model,
              route,
              ...partSummary,
              requestedOptions: summarizeImageOptions(options, route),
              generatedImageCount: response.generatedImages?.length ?? 0,
              blockReason,
            },
          });

          throw new Error(`Generation blocked: ${String(blockReason)}`);
        }

        await this.log({
          level: "info",
          source: "gemini.image",
          message: "Imagen image generation completed.",
          status: "success",
          metadata: {
            model,
            route,
            generatedImageCount: images.length,
          },
        });

        return {
          base64Image: images[0],
          base64Images: images,
        };
      } catch (error) {
        if (isGenerationBlockedError(error)) {
          throw error;
        }

        await this.log({
          level: "error",
          source: "gemini.image",
          message: "Imagen image generation failed.",
          status: "error",
          metadata: {
            model,
            route,
            ...partSummary,
            requestedOptions: summarizeImageOptions(options, route),
            error: summarizeError(error),
          },
        });

        throw error;
      }
    }

    const config = buildGeminiImageConfig(options);

    try {
      const response = await this.generateContent([{ role: "user", parts }], {
        model,
        config,
      });
      const images = normalizeGenerateContentImages(response);
      const result: GenerateImageResult = {
        text: response.text,
        base64Image: images[0],
        base64Images: images.length > 0 ? images : undefined,
      };

      if (!result.base64Image && !result.text) {
        const blockReason = buildBlockReason(response) || "No image returned from Gemini";

        await this.log({
          level: "warn",
          source: "gemini.image",
          message: "Gemini image generation completed with unusable response.",
          status: "error",
          metadata: {
            model,
            route,
            ...summarizeGenerateContentResponse(response),
            blockReason,
          },
        });

        throw new Error(`Generation blocked: ${String(blockReason)}`);
      }

      await this.log({
        level: "info",
        source: "gemini.image",
        message: "Gemini image generation completed.",
        status: "success",
        metadata: {
          model,
          route,
          imageCount: images.length,
          hasText: Boolean(result.text),
          textLength: result.text?.length ?? 0,
        },
      });

      return result;
    } catch (error) {
      if (isGenerationBlockedError(error)) {
        throw error;
      }

      await this.log({
        level: "error",
        source: "gemini.image",
        message: "Gemini image generation failed.",
        status: "error",
        metadata: {
          model,
          route,
          ...partSummary,
          requestedOptions: summarizeImageOptions(options, route),
          error: summarizeError(error),
        },
      });

      throw error;
    }
  }

  /**
   * Generates an SVG image string based on a text prompt using a Gemini text model.
   * Can optionally take one or more reference SVGs to guide the generation.
   */
  public async generateSvgFromPrompt(
    prompt: string,
    options?: { model?: string; references?: string[] },
  ): Promise<string> {
    const parts: Part[] = [];

    if (options?.references && options.references.length > 0) {
      parts.push({ text: "Use the following SVG(s) as reference for style, structure, or elements:\n\n" });
      options.references.forEach((reference, index) => {
        parts.push({ text: `Reference SVG ${index + 1}:\n${reference}\n\n` });
      });
    }

    parts.push({ text: `Request: ${prompt}` });

    return this.generateSvg(parts, options);
  }

  /**
   * Generates an SVG image string based on multimodal parts.
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
    svgText = svgText.replace(/^```xml\s*/i, "");
    svgText = svgText.replace(/^```svg\s*/i, "");
    svgText = svgText.replace(/^```\s*/, "");
    svgText = svgText.replace(/```\s*$/, "");
    return svgText.trim();
  }
}
