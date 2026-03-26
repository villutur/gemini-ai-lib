import { Modality, type GenerateContentConfig, type GenerateContentResponse, type Part } from "@google/genai";
import { GeminiBaseService } from "./base.js";
import {
  GEMINI_MUSIC_MODELS,
  GEMINI_MUSIC_MODEL_DISPLAY_NAMES,
  getMusicModelDisplayName,
  type KnownMusicGenerationModel,
} from "./model-catalogs.js";

/**
 * Re-exported music-model catalogs and labels for convenience.
 */
export { GEMINI_MUSIC_MODELS, GEMINI_MUSIC_MODEL_DISPLAY_NAMES, getMusicModelDisplayName };
export type { KnownMusicGenerationModel };

/**
 * Supported models for music generation tasks.
 * Highlights the current Lyria 3 music-generation pair while still allowing
 * callers to pass an explicit model string when needed.
 */
export type GeminiMusicModel = KnownMusicGenerationModel | string;

/**
 * Options for configuring music generation requests to Lyria 3.
 *
 * v1 intentionally stays on the official stable `generateContent(...)` flow.
 * Richer musical controls remain prompt-driven for now rather than typed
 * config fields in this library.
 */
export interface GenerateMusicOptions {
  /** Specific Lyria model to use for generation. Defaults to `lyria-3-clip-preview`. */
  model?: GeminiMusicModel;
  /** Requested response modalities. Lyria commonly returns audio plus optional text metadata. */
  responseModalities?: readonly Modality[];
}

/**
 * Normalized audio output from a Lyria generation request.
 */
export interface GeminiGeneratedMusicResult {
  /** Original Gemini response part containing inline audio data. */
  part: Part;
  /** Decoded audio payload as a Node.js buffer. */
  audioBuffer: Buffer;
  /** MIME type reported by the model for this audio payload. */
  mimeType: string;
}

/**
 * Unified result of a completed music generation request.
 */
export interface GenerateMusicResult {
  /** Raw Gemini response payload. */
  response: GenerateContentResponse;
  /** First generated audio buffer for convenience. */
  audioBuffer?: Buffer;
  /** All generated audio buffers returned by the model. */
  audioBuffers?: Buffer[];
  /** MIME type of the first generated audio output. */
  mimeType?: string;
  /** MIME types for all returned audio outputs. */
  mimeTypes?: string[];
  /** Text metadata or lyrics returned alongside the audio. */
  text?: string;
  /** Normalized per-output audio results. */
  generatedAudio: GeminiGeneratedMusicResult[];
}

const DEFAULT_MUSIC_MODEL = "lyria-3-clip-preview";

/**
 * Service dedicated to non-realtime Lyria music generation.
 */
export class GeminiMusicService extends GeminiBaseService {
  /**
   * Generates music from multimodal Gemini parts.
   *
   * @param parts Input parts containing a text prompt and optional image reference.
   * @param options Configuration options for the selected Lyria model.
   * @returns A Promise resolving to normalized audio/text outputs.
   */
  public async generateMusic(parts: Part[], options?: GenerateMusicOptions): Promise<GenerateMusicResult> {
    if (!parts.length || !parts.some((part) => part.text || part.inlineData || part.fileData)) {
      throw new Error("Music generation requires at least one text or media input part");
    }

    const model = options?.model || DEFAULT_MUSIC_MODEL;
    const responseModalities = options?.responseModalities?.length
      ? [...options.responseModalities]
      : [Modality.AUDIO, Modality.TEXT];

    const config: GenerateContentConfig = {
      responseModalities,
    };

    await this.log({
      level: "info",
      source: "gemini.music",
      message: "Gemini music generation started.",
      status: "running",
      metadata: {
        model,
        inputPartCount: parts.length,
        hasImageInput: parts.some(
          (part) =>
            (part.inlineData?.mimeType?.startsWith("image/") ?? false) ||
            (part.fileData?.mimeType?.startsWith("image/") ?? false),
        ),
        requestedResponseModalities: responseModalities,
      },
    });

    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        config,
      });

      const result = this.normalizeMusicResult(response);

      await this.log({
        level: "info",
        source: "gemini.music",
        message: "Gemini music generation completed.",
        status: "success",
        metadata: {
          model,
          audioOutputCount: result.generatedAudio.length,
          firstMimeType: result.mimeType,
          hasText: Boolean(result.text),
        },
      });

      return result;
    } catch (error) {
      await this.log({
        level: "error",
        source: "gemini.music",
        message: "Gemini music generation failed.",
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
   * Generates music from a text prompt.
   *
   * @param prompt Prompt describing the desired musical output.
   * @param options Configuration options for the selected Lyria model.
   * @returns A Promise resolving to normalized audio/text outputs.
   */
  public async generateMusicFromPrompt(prompt: string, options?: GenerateMusicOptions): Promise<GenerateMusicResult> {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      throw new Error("Music generation requires a non-empty prompt");
    }

    return this.generateMusic([{ text: trimmedPrompt }], options);
  }

  /**
   * Generates music using an image reference and optional text prompt.
   *
   * @param imagePart Gemini part representing the reference image.
   * @param prompt Optional text prompt describing the target musical direction.
   * @param options Configuration options for the selected Lyria model.
   * @returns A Promise resolving to normalized audio/text outputs.
   */
  public async generateMusicFromImage(
    imagePart: Part,
    prompt?: string,
    options?: GenerateMusicOptions,
  ): Promise<GenerateMusicResult> {
    const parts: Part[] = [];
    const trimmedPrompt = prompt?.trim();

    if (trimmedPrompt) {
      parts.push({ text: trimmedPrompt });
    }

    parts.push(imagePart);
    return this.generateMusic(parts, options);
  }

  private normalizeMusicResult(response: GenerateContentResponse): GenerateMusicResult {
    const audioParts: GeminiGeneratedMusicResult[] = [];
    const textParts: string[] = [];

    for (const candidate of response.candidates ?? []) {
      for (const part of candidate.content?.parts ?? []) {
        if (part.text) {
          textParts.push(part.text);
          continue;
        }

        const inlineData = part.inlineData;
        if (!inlineData?.data || !inlineData.mimeType?.startsWith("audio/")) {
          continue;
        }

        audioParts.push({
          part,
          audioBuffer: Buffer.from(inlineData.data, "base64"),
          mimeType: inlineData.mimeType,
        });
      }
    }

    const text = textParts.join("\n").trim() || response.text || undefined;

    if (audioParts.length === 0 && !text) {
      throw new Error("No audio or text data returned from Gemini music generation");
    }

    return {
      response,
      audioBuffer: audioParts[0]?.audioBuffer,
      audioBuffers: audioParts.length ? audioParts.map((item) => item.audioBuffer) : undefined,
      mimeType: audioParts[0]?.mimeType,
      mimeTypes: audioParts.length ? audioParts.map((item) => item.mimeType) : undefined,
      text,
      generatedAudio: audioParts,
    };
  }
}
