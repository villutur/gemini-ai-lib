import type { ContentListUnion, GenerateContentConfig, GenerateContentResponse } from "@google/genai";
import { GeminiBaseService } from "./base.js";
import {
  GEMINI_TEXT_MODELS,
  GEMINI_TEXT_MODEL_DISPLAY_NAMES,
  getTextModelDisplayName,
  type KnownTextGenerationModel,
} from "./model-catalogs.js";

/**
 * Re-exported text-model catalogs and labels for convenience.
 */
export { GEMINI_TEXT_MODELS, GEMINI_TEXT_MODEL_DISPLAY_NAMES, getTextModelDisplayName };
export type { KnownTextGenerationModel };
export type { Content, ContentListUnion, Part } from "@google/genai";

/**
 * Supported models for text generation tasks.
 * Highlights the common text-first Gemini 2.5 and 3.x models used in the
 * workspace, while still allowing callers to pass an explicit model string
 * when needed.
 */
export type TextGenerationModel =
  | KnownTextGenerationModel
  | string;

/**
 * Options for generating text responses using Gemini.
 */
export interface GenerateTextOptions {
  /** The specific Gemini model to use for generation. Defaults to 'gemini-3-flash-preview'. */
  model?: TextGenerationModel;
  /** System instructions to guide the model's behavior and persona. */
  systemInstruction?: string;
  /** Controls the randomness of the output. Higher values produce more creative responses. */
  temperature?: number;
  /** Tools (like standard search or custom functions) the model can use during generation. */
  tools?: GenerateContentConfig["tools"];
  /** Configuration for safety filters (e.g., blocking hate speech, dangerous content). */
  safetySettings?: GenerateContentConfig["safetySettings"];
  /** Identifier for cached content, useful for large context reuse. */
  cachedContent?: string;
  /** Requested MIME type for the response, typically "text/plain" or "application/json". */
  responseMimeType?: "text/plain" | "application/json";
  /** The schema definition if a structured JSON response is requested. */
  responseSchema?: GenerateContentConfig["responseSchema"];
  /** Optional config for model thinking features when the selected model supports them. */
  thinkingConfig?: GenerateContentConfig["thinkingConfig"];
}

/**
 * Service for handling text-based interactions with Gemini.
 * Supports standard text generation, fast generation, and retrieving plain text strings.
 */
export class GeminiTextService extends GeminiBaseService {
  /**
   * Generates content from any Gemini SDK `ContentListUnion` input shape.
   * This is the canonical text-generation method for the service.
   *
   * @param contents The prompt, content object, content array, or parts payload to send to Gemini.
   * @param options Configuration options for the generation process (model, temperature, tools, etc.).
   * @returns A Promise resolving to the complete GenerateContentResponse object.
   */
  public async generateContent(
    contents: ContentListUnion,
    options?: GenerateTextOptions,
  ): Promise<GenerateContentResponse> {
    const model = options?.model || "gemini-3-flash-preview";

    // Merge tools
    const configTools = options?.tools || this.defaultTools;

    const config: GenerateContentConfig = {
      systemInstruction: options?.systemInstruction,
      temperature: options?.temperature,
      tools: configTools,
      safetySettings: options?.safetySettings,
      cachedContent: options?.cachedContent,
      responseMimeType: options?.responseMimeType,
      responseSchema: options?.responseSchema,
      thinkingConfig: options?.thinkingConfig,
    };

    await this.log({
      level: "info",
      source: "gemini.text",
      message: "Gemini text generation started.",
      status: "running",
      metadata: {
        model,
        inputType: Array.isArray(contents) ? "content-array" : typeof contents === "string" ? "string" : "content-object",
        toolCount: configTools?.length ?? 0,
        hasSystemInstruction: Boolean(options?.systemInstruction),
        responseMimeType: options?.responseMimeType,
        thinkingConfig: options?.thinkingConfig,
      },
    });

    try {
      const response = await this.ai.models.generateContent({
        model: model,
        contents: contents,
        config: config,
      });

      await this.log({
        level: "info",
        source: "gemini.text",
        message: "Gemini text generation completed.",
        status: "success",
        metadata: {
          model,
          textLength: response.text?.length ?? 0,
          hasText: Boolean(response.text),
        },
      });

      return response;
    } catch (error) {
      await this.log({
        level: "error",
        source: "gemini.text",
        message: "Gemini text generation failed.",
        status: "error",
        metadata: {
          model,
          error:
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                }
              : { value: String(error) },
        },
      });

      throw error;
    }
  }

  /**
   * Backward-compatible alias for `generateContent(...)`.
   *
   * @deprecated Use `generateContent(...)` instead. This alias is kept for backward compatibility.
   *
   * @param contents The prompt, content object, content array, or parts payload to send to Gemini.
   * @param options Configuration options for the generation process (model, temperature, tools, etc.).
   * @returns A Promise resolving to the complete GenerateContentResponse object.
   */
  public async generateText(
    contents: ContentListUnion,
    options?: GenerateTextOptions,
  ): Promise<GenerateContentResponse> {
    return this.generateContent(contents, options);
  }

  /**
   * High-speed text generation optimized for low latency tasks.
   * Uses `gemini-3-flash-preview` by default for a fast general-purpose path.
   *
   * @param prompt The string prompt for the fast generation task.
   * @param options Configuration options (excluding the model overrides).
   * @returns A Promise resolving to the GenerateContentResponse object.
   */
  public async generateFastText(
    prompt: string,
    options?: Omit<GenerateTextOptions, "model">,
  ): Promise<GenerateContentResponse> {
    return this.generateContent(prompt, {
      ...options,
      model: "gemini-3-flash-preview",
    });
  }

  /**
   * Helper to return just the string text from the generation, abstracting the response object.
   * Ideal for quick extractions where full response metadata is not required.
   *
   * @param prompt The string prompt to send to the model.
   * @param options Configuration options for generation.
   * @returns A Promise resolving directly to the generated text string.
   */
  public async generateTextString(prompt: string, options?: GenerateTextOptions): Promise<string> {
    const response = await this.generateContent(prompt, options);
    return response.text || "";
  }
}
