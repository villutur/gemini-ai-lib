import { Modality, type GenerateContentConfig, type MultiSpeakerVoiceConfig } from "@google/genai";
import { GeminiBaseService } from "./base.js";
import { geminiLog } from "./logger.js";

/**
 * Options for configuring audio generation (Text-to-Speech).
 */
export interface GenerateAudioOptions {
  /**
   * Specific Gemini TTS model to use for synthesis.
   * Defaults to `gemini-2.5-flash-preview-tts`.
   */
  model?: string;
  /**
   * Name of the prebuilt voice to use for single-speaker synthesis.
   * This is ignored when `multiSpeakerVoiceConfig` is provided.
   */
  voiceName?: string;
  /**
   * Optional BCP-47/ISO language code hint for speech synthesis.
   * Use values such as `en-US` or `fr-FR` when the consumer needs explicit
   * language control.
   */
  languageCode?: string;
  /**
   * Requested response modalities for the TTS call.
   * TTS models are expected to use `AUDIO` output.
   */
  responseModalities?: readonly Modality[];
  /**
   * Multi-speaker voice mapping used for native dialogue generation.
   * When provided, this is mutually exclusive with the single-speaker
   * `voiceName` path in the underlying SDK contract.
   */
  multiSpeakerVoiceConfig?: MultiSpeakerVoiceConfig;
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
    const responseModalities = options?.responseModalities?.length ? [...options.responseModalities] : [Modality.AUDIO];

    const config: GenerateContentConfig = {
      responseModalities,
      speechConfig: options?.multiSpeakerVoiceConfig
        ? {
            languageCode: options.languageCode,
            multiSpeakerVoiceConfig: options.multiSpeakerVoiceConfig,
          }
        : {
            languageCode: options?.languageCode,
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
    };

    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: combinedText,
        config,
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
