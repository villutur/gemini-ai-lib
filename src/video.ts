import type {
  GeneratedVideo,
  GenerateVideosOperation,
  GenerateVideosResponse,
  Image,
  Video,
  VideoGenerationReferenceImage,
} from "@google/genai";
import { GeminiBaseService } from "./base.js";
import {
  GEMINI_VIDEO_MODELS,
  GEMINI_VIDEO_MODEL_DISPLAY_NAMES,
  getVideoModelDisplayName,
  type KnownVideoGenerationModel,
} from "./model-catalogs.js";

/**
 * Re-exported video-model catalogs and labels for convenience.
 */
export { GEMINI_VIDEO_MODELS, GEMINI_VIDEO_MODEL_DISPLAY_NAMES, getVideoModelDisplayName };
export type { KnownVideoGenerationModel };

/**
 * Supported models for video generation tasks.
 * Highlights the current Veo 3.1 preview pair while still allowing callers to
 * pass an explicit model string when needed.
 */
export type GeminiVideoModel = KnownVideoGenerationModel | string;

/**
 * Supported video aspect ratios for current Veo 3.1 generation paths.
 */
export type GeminiVideoAspectRatio = "16:9" | "9:16";

/**
 * Supported video resolutions for the current Veo 3.1 generation paths.
 */
export type GeminiVideoResolution = "720p" | "1080p" | "4k";

/**
 * Supported clip durations for the current Veo 3.1 generation paths.
 */
export type GeminiVideoDurationSeconds = 4 | 6 | 8;

/**
 * Person-generation policy values exposed by the current video-generation API.
 */
export type GeminiVideoPersonGeneration = "allow_adult" | "dont_allow";

/**
 * Source inputs accepted for Veo generation requests.
 */
export interface GenerateVideoInput {
  /**
   * Optional text prompt used to describe the target motion, scene, or sound.
   */
  prompt?: string;
  /**
   * Optional source image used for image-to-video generation.
   * Mutually exclusive with `video`.
   */
  image?: Image;
  /**
   * Optional source video used for video extension use cases.
   * Mutually exclusive with `image`.
   */
  video?: Video;
}

/**
 * Options for configuring Veo video generation requests.
 */
export interface GenerateVideoOptions {
  /** Specific Veo model to use for generation. Defaults to `veo-3.1-fast-generate-preview`. */
  model?: GeminiVideoModel;
  /** Width-to-height ratio for the generated video. */
  aspectRatio?: GeminiVideoAspectRatio;
  /** Resolution tier for the generated video. */
  resolution?: GeminiVideoResolution;
  /** Duration of the generated clip in seconds. */
  durationSeconds?: GeminiVideoDurationSeconds;
  /** Frames-per-second target for video generation. */
  fps?: number;
  /** Whether to generate native synchronized audio together with the video. */
  generateAudio?: boolean;
  /** Negative guidance describing what the model should avoid in the clip. */
  negativePrompt?: string;
  /** Number of output videos requested. Known Veo 3.1 models currently resolve to one output. */
  numberOfVideos?: number;
  /** Fixed seed used for deterministic reruns when the model path supports it. */
  seed?: number;
  /** Whether to enable prompt enhancement before generation. */
  enhancePrompt?: boolean;
  /** Person-generation policy used by the current video-generation API. */
  personGeneration?: GeminiVideoPersonGeneration;
  /** Optional Cloud Storage destination URI for generated outputs. */
  outputGcsUri?: string;
  /** Reference images used for asset/style conditioning. */
  referenceImages?: VideoGenerationReferenceImage[];
  /** Optional image used as the last frame for image-to-video generation. */
  lastFrame?: Image;
}

/**
 * Polling controls for long-running video generation operations.
 */
export interface GenerateVideoPollingOptions {
  /** Delay between status polls in milliseconds. Defaults to 10000ms. */
  pollIntervalMs?: number;
  /** Optional timeout in milliseconds. When omitted, polling continues until the operation completes. */
  timeoutMs?: number;
}

/**
 * Normalized per-video result returned by the convenience helpers.
 */
export interface GeminiGeneratedVideoResult {
  /** Original SDK generated-video wrapper. */
  generatedVideo: GeneratedVideo;
  /** Normalized video payload for convenience. */
  video?: Video;
  /** Remote or local URI exposed by the SDK result. */
  uri?: string;
  /** MIME type of the generated video when available. */
  mimeType?: string;
  /** Base64 payload when the SDK response already contains bytes. */
  videoBytes?: string;
}

/**
 * Unified result of a completed video generation request.
 */
export interface GenerateVideoResult {
  /** Final long-running operation state returned by the SDK. */
  operation: GenerateVideosOperation;
  /** Raw SDK response payload. */
  response: GenerateVideosResponse;
  /** Normalized generated-video wrappers. */
  generatedVideos: GeminiGeneratedVideoResult[];
  /** Count of outputs filtered by RAI policies when reported by the API. */
  raiMediaFilteredCount?: number;
  /** RAI failure reasons when the API reports them. */
  raiMediaFilteredReasons?: string[];
}

/**
 * Service dedicated to Veo video generation and long-running-operation polling.
 */
export class GeminiVideoService extends GeminiBaseService {
  /**
   * Starts a Veo generation operation without waiting for completion.
   */
  public async startVideoGeneration(
    input: GenerateVideoInput,
    options?: GenerateVideoOptions,
  ): Promise<GenerateVideosOperation> {
    const model = options?.model || "veo-3.1-fast-generate-preview";
    this.assertValidVideoInput(input, options);

    await this.log({
      level: "info",
      source: "gemini.video",
      message: "Gemini video generation started.",
      status: "running",
      metadata: {
        model,
        sourceType: this.getVideoSourceType(input),
        aspectRatio: options?.aspectRatio,
        resolution: options?.resolution,
        durationSeconds: options?.durationSeconds,
        fps: options?.fps,
        generateAudio: options?.generateAudio,
        numberOfVideos: options?.numberOfVideos,
        referenceImageCount: options?.referenceImages?.length ?? 0,
        hasLastFrame: Boolean(options?.lastFrame),
      },
    });

    try {
      const operation = await this.ai.models.generateVideos({
        model,
        prompt: input.prompt,
        image: input.image,
        video: input.video,
        config: {
          aspectRatio: options?.aspectRatio,
          resolution: options?.resolution,
          durationSeconds: options?.durationSeconds,
          fps: options?.fps,
          generateAudio: options?.generateAudio,
          negativePrompt: options?.negativePrompt,
          numberOfVideos: options?.numberOfVideos,
          seed: options?.seed,
          enhancePrompt: options?.enhancePrompt,
          personGeneration: options?.personGeneration,
          outputGcsUri: options?.outputGcsUri,
          referenceImages: options?.referenceImages,
          lastFrame: options?.lastFrame,
        },
      });

      await this.log({
        level: "info",
        source: "gemini.video",
        message: "Gemini video generation operation created.",
        status: "success",
        metadata: {
          model,
          operationName: operation.name,
          done: operation.done ?? false,
        },
      });

      return operation;
    } catch (error) {
      await this.log({
        level: "error",
        source: "gemini.video",
        message: "Gemini video generation failed to start.",
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
   * Fetches the latest state for a previously created video-generation operation.
   */
  public async getVideoOperation(operation: GenerateVideosOperation): Promise<GenerateVideosOperation> {
    const latestOperation = await this.ai.operations.getVideosOperation({ operation });
    return latestOperation;
  }

  /**
   * Polls a long-running video-generation operation until it completes.
   */
  public async waitForVideoOperation(
    operation: GenerateVideosOperation,
    options?: GenerateVideoPollingOptions,
  ): Promise<GenerateVideoResult> {
    const pollIntervalMs = options?.pollIntervalMs ?? 10_000;
    const startedAt = Date.now();
    let latestOperation = operation;

    while (!latestOperation.done) {
      if (options?.timeoutMs != null && Date.now() - startedAt > options.timeoutMs) {
        throw new Error(`Video generation timed out after ${options.timeoutMs}ms`);
      }

      await wait(pollIntervalMs);
      latestOperation = await this.getVideoOperation(latestOperation);
    }

    if (latestOperation.error) {
      await this.log({
        level: "error",
        source: "gemini.video",
        message: "Gemini video generation operation failed.",
        status: "error",
        metadata: {
          operationName: latestOperation.name,
          error: latestOperation.error,
        },
      });

      throw new Error(`Video generation failed: ${JSON.stringify(latestOperation.error)}`);
    }

    if (!latestOperation.response) {
      throw new Error("Video generation completed without a response payload");
    }

    const result = this.normalizeVideoResult(latestOperation, latestOperation.response);

    await this.log({
      level: "info",
      source: "gemini.video",
      message: "Gemini video generation completed.",
      status: "success",
      metadata: {
        operationName: latestOperation.name,
        generatedVideoCount: result.generatedVideos.length,
        raiMediaFilteredCount: result.raiMediaFilteredCount,
      },
    });

    return result;
  }

  /**
   * Convenience helper that starts a generation operation and waits for completion.
   */
  public async generateVideo(
    input: GenerateVideoInput,
    options?: GenerateVideoOptions,
    pollingOptions?: GenerateVideoPollingOptions,
  ): Promise<GenerateVideoResult> {
    const operation = await this.startVideoGeneration(input, options);
    return this.waitForVideoOperation(operation, pollingOptions);
  }

  /**
   * Prompt-only video generation convenience helper.
   */
  public async generateVideoFromPrompt(
    prompt: string,
    options?: GenerateVideoOptions,
    pollingOptions?: GenerateVideoPollingOptions,
  ): Promise<GenerateVideoResult> {
    return this.generateVideo({ prompt }, options, pollingOptions);
  }

  /**
   * Image-to-video convenience helper.
   */
  public async generateVideoFromImage(
    image: Image,
    prompt?: string,
    options?: GenerateVideoOptions,
    pollingOptions?: GenerateVideoPollingOptions,
  ): Promise<GenerateVideoResult> {
    return this.generateVideo({ image, prompt }, options, pollingOptions);
  }

  /**
   * Video-extension convenience helper.
   */
  public async extendVideo(
    video: Video,
    prompt?: string,
    options?: GenerateVideoOptions,
    pollingOptions?: GenerateVideoPollingOptions,
  ): Promise<GenerateVideoResult> {
    return this.generateVideo({ video, prompt }, options, pollingOptions);
  }

  private normalizeVideoResult(
    operation: GenerateVideosOperation,
    response: GenerateVideosResponse,
  ): GenerateVideoResult {
    const generatedVideos = (response.generatedVideos ?? []).map((generatedVideo) => ({
      generatedVideo,
      video: generatedVideo.video,
      uri: generatedVideo.video?.uri,
      mimeType: generatedVideo.video?.mimeType,
      videoBytes: generatedVideo.video?.videoBytes,
    }));

    return {
      operation,
      response,
      generatedVideos,
      raiMediaFilteredCount: response.raiMediaFilteredCount,
      raiMediaFilteredReasons: response.raiMediaFilteredReasons,
    };
  }

  private assertValidVideoInput(input: GenerateVideoInput, options?: GenerateVideoOptions) {
    if (!input.prompt && !input.image && !input.video) {
      throw new Error("Video generation requires at least one input: prompt, image, or video");
    }

    if (input.image && input.video) {
      throw new Error("Video generation input cannot include both image and video sources in the same request");
    }

    if (options?.referenceImages?.length && !input.prompt) {
      throw new Error("Reference-image video generation requires a text prompt");
    }

    if (options?.referenceImages?.length && (input.image || input.video || options.lastFrame)) {
      throw new Error("Reference-image video generation cannot be combined with image, video, or last-frame inputs");
    }

    if (options?.lastFrame && !input.image) {
      throw new Error("Last-frame guidance is only supported for image-to-video requests");
    }
  }

  private getVideoSourceType(input: GenerateVideoInput) {
    if (input.video) {
      return "video";
    }
    if (input.image) {
      return "image";
    }
    return "prompt";
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
