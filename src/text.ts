import { GenerateContentResponse } from "@google/genai";
import type { GenerateContentConfig, Part } from "@google/genai";
import { GeminiBaseService } from "./base.js";

/**
 * Supported models for text generation tasks.
 * Uses the current Gemini 3 preview models by default, while still allowing
 * callers to pass an explicit model string when needed.
 */
export type TextGenerationModel = "gemini-3-pro-preview" | "gemini-3-flash-preview" | string;

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
}

/**
 * Service for handling text-based interactions with Gemini.
 * Supports standard text generation, fast generation, and retrieving plain text strings.
 */
export class GeminiTextService extends GeminiBaseService {
  /**
   * Generates a standard text response from a given prompt or array of parts.
   * Optionally accepts an array of previous messages or mixed attachments (Parts).
   *
   * @param input The text prompt or an array of message objects containing roles and parts.
   * @param options Configuration options for the generation process (model, temperature, tools, etc.).
   * @returns A Promise resolving to the complete GenerateContentResponse object.
   */
  public async generateText(
    input: string | Array<{ role: "user" | "model"; parts: Part[] }>,
    options?: GenerateTextOptions,
  ): Promise<GenerateContentResponse> {
    const model = options?.model || "gemini-3-flash-preview";

    // Construct contents
    let contents;
    if (typeof input === "string") {
      contents = input;
    } else {
      contents = input;
    }

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
    };

    await this.log({
      level: "info",
      source: "gemini.text",
      message: "Gemini text generation started.",
      status: "running",
      metadata: {
        model,
        inputType: typeof input === "string" ? "string" : "content-array",
        toolCount: configTools?.length ?? 0,
        hasSystemInstruction: Boolean(options?.systemInstruction),
        responseMimeType: options?.responseMimeType,
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
    return this.generateText(prompt, {
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
    const response = await this.generateText(prompt, options);
    return response.text || "";
  }
}
