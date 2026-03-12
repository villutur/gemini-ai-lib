import type { GenerateContentConfig } from "@google/genai";
import { GeminiBaseService } from "./base.js";
import { geminiLog } from "./logger.js";

/**
 * Options for configuring audio generation (Text-to-Speech).
 */
export interface GenerateAudioOptions {
  /** The specific Gemini model to use for TTS. Defaults to 'gemini-2.5-flash-preview-tts'. */
  model?: string;
  /** The name of the voice to use (e.g., 'Kore', 'Puck'). */
  voiceName?: string;
}

/**
 * Service for handling audio generation and Text-to-Speech (TTS) interactions with Gemini.
 */
export class GeminiAudioService extends GeminiBaseService {
  /**
   * Synthesize text into an audio buffer (TTS).
   *
   * @param text The primary text content to synthesize.
   * @param prompt Optional prompt to prepend to the text, useful for guiding the tone or pronunciation.
   * @param options Configuration options including voice selection.
   * @returns A Promise resolving to a Node.js Buffer containing the generated audio data.
   */
  public async generateAudio(text: string, prompt?: string, options?: GenerateAudioOptions): Promise<Buffer> {
    const model = options?.model || "gemini-2.5-flash-preview-tts";
    const voiceName = options?.voiceName || "Kore";
    const combinedText = prompt ? `${prompt} ${text}` : text;

    const config: GenerateContentConfig = {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceName },
        },
      },
    };

    try {
      const response = await this.ai.models.generateContent({
        model: model,
        contents: combinedText,
        config: config,
      });

      // Handle deeply nested inlineData.data structure securely
      const content = response.candidates?.[0]?.content;
      if (!content || !content.parts || content.parts.length === 0) {
        throw new Error("No audio data returned from Gemini");
      }

      const data = content.parts[0].inlineData?.data;
      if (!data) {
        throw new Error("No audio data returned from Gemini (inline data missing)");
      }

      const audioBuffer = Buffer.from(data as string, "base64");
      return audioBuffer;
    } catch (error) {
      geminiLog.error("Error generating audio:", error);
      throw error;
    }
  }
}
