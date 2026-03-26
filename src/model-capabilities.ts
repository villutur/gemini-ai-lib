import type { GenerateAudioOptions } from "./audio.js";
import type { GenerateImageOptions, GeminiFlashAspectRatio, GeminiImageSize } from "./image.js";
import type { LiveChatSessionOptions } from "./live.js";
import type { GenerateMusicOptions } from "./music.js";
import type { GenerateTextOptions } from "./text.js";
import type {
  GenerateVideoOptions,
  GeminiVideoAspectRatio,
  GeminiVideoDurationSeconds,
  GeminiVideoResolution,
} from "./video.js";
import {
  GEMINI_AUDIO_MODELS,
  GEMINI_IMAGE_MODELS,
  GEMINI_LIVE_MODELS,
  GEMINI_MUSIC_MODELS,
  GEMINI_TEXT_MODELS,
  GEMINI_VIDEO_MODELS,
  type KnownAudioGenerationModel,
  type KnownImageGenerationModel,
  type KnownLiveGenerationModel,
  type KnownMusicGenerationModel,
  type KnownTextGenerationModel,
  type KnownVideoGenerationModel,
} from "./model-catalogs.js";
import {
  getGeminiThinkingSupportForModel,
  type GeminiThinkingModelSupport,
  type GeminiThinkingProfileLevel,
} from "./response-metadata.js";

/**
 * Discriminates where a returned capability record came from.
 * Known models resolve from the explicit catalog, while unknown model IDs
 * return a conservative fallback to keep consumer UIs resilient.
 */
export type GeminiCapabilitySource = "catalog" | "fallback";

/**
 * Supported value-shape categories for config options.
 */
export type GeminiConfigOptionKind = "string" | "number" | "boolean" | "array" | "object";

/**
 * Shared descriptor shape used by image/text/audio/music/video/live config option catalogs.
 * Consumers can use this to render generic model configuration controls.
 */
export interface GeminiConfigOptionDescriptor<TKey extends string = string> {
  /**
   * Stable option key matching the service option contract.
   */
  key: TKey;
  /**
   * Short user-facing label suitable for forms.
   */
  label: string;
  /**
   * Human-readable explanation of what the option controls.
   */
  description: string;
  /**
   * Primitive UI control type that best fits this option.
   */
  kind: GeminiConfigOptionKind;
  /**
   * Recommended default value if the consumer needs one.
   * This is guidance, not strict runtime enforcement.
   */
  defaultValue?: unknown;
  /**
   * Allowed values for enum-like options.
   */
  allowedValues?: readonly string[];
  /**
   * Numeric range constraints for number-like options.
   */
  min?: number;
  /**
   * Numeric upper bound for number-like options.
   */
  max?: number;
  /**
   * Suggested slider/input increment for numeric controls.
   */
  step?: number;
  /**
   * Optional note for SDK/runtime caveats and model-specific behavior.
   */
  note?: string;
}

/**
 * Image option keys exported for dynamic UI/config generation.
 * These keys map to `GenerateImageOptions`.
 */
export type GeminiImageConfigOptionKey =
  | "aspectRatio"
  | "imageSize"
  | "numberOfImages"
  | "personGeneration"
  | "outputMimeType"
  | "compressionQuality"
  | "responseModalities"
  | "responseMimeType"
  | "responseSchema";

/**
 * Text option keys exported for dynamic UI/config generation.
 * These keys map to `GenerateTextOptions`.
 */
export type GeminiTextConfigOptionKey =
  | "temperature"
  | "tools"
  | "safetySettings"
  | "cachedContent"
  | "responseMimeType"
  | "responseSchema"
  | "thinkingConfig";

/**
 * Audio/TTS option keys exported for dynamic UI/config generation.
 * These keys map to `GenerateAudioOptions`.
 */
export type GeminiAudioConfigOptionKey =
  | "voiceName"
  | "languageCode"
  | "responseModalities"
  | "multiSpeakerVoiceConfig";

/**
 * Music-generation option keys exported for dynamic UI/config generation.
 * These keys map to `GenerateMusicOptions`.
 */
export type GeminiMusicConfigOptionKey = "responseModalities";

/**
 * Video option keys exported for dynamic UI/config generation.
 * These keys map to `GenerateVideoOptions`.
 */
export type GeminiVideoConfigOptionKey =
  | "aspectRatio"
  | "resolution"
  | "durationSeconds"
  | "fps"
  | "generateAudio"
  | "negativePrompt"
  | "numberOfVideos"
  | "seed"
  | "enhancePrompt"
  | "personGeneration";

/**
 * Live-session option keys exported for dynamic UI/config generation.
 * These keys map to `LiveChatSessionOptions`.
 */
export type GeminiLiveConfigOptionKey =
  | "systemInstruction"
  | "voiceName"
  | "tools"
  | "enableGoogleSearch"
  | "enableAffectiveDialog"
  | "enableProactiveAudio"
  | "thinkingBudget"
  | "includeThoughts"
  | "vadConfig"
  | "audioWorkletModulePath";

/**
 * Attachment constraints for image generation model inputs.
 */
export interface GeminiImageAttachmentLimits {
  /**
   * Maximum number of reference images supported for one request.
   * Null means unknown and should be treated conservatively by consumers.
   */
  maxReferenceImages: number | null;
}

/**
 * Model-specific image output constraints.
 */
export interface GeminiImageOutputLimits {
  /**
   * Minimum image count accepted by this model path.
   */
  minImages: number;
  /**
   * Maximum image count accepted by this model path.
   */
  maxImages: number;
  /**
   * Recommended default output count when no explicit value is provided.
   */
  defaultImages: number;
}

/**
 * Canonical capability payload for image generation models.
 */
export interface GeminiImageModelCapabilities {
  /**
   * Raw model id requested by the caller.
   */
  model: string;
  /**
   * True when the model exists in the known image model catalog.
   */
  isKnownModel: boolean;
  /**
   * Indicates whether this record comes from catalog data or a fallback.
   */
  source: GeminiCapabilitySource;
  /**
   * Attachment constraints for image references and edit-style inputs.
   */
  attachmentLimits: GeminiImageAttachmentLimits;
  /**
   * Output cardinality constraints.
   */
  outputLimits: GeminiImageOutputLimits;
  /**
   * Which config keys are available for this model.
   */
  supportedOptions: readonly GeminiImageConfigOptionKey[];
  /**
   * Which config keys are intentionally unsupported for this model.
   */
  unsupportedOptions: readonly GeminiImageConfigOptionKey[];
  /**
   * Allowed aspect ratios for this model path.
   */
  allowedAspectRatios: readonly string[];
  /**
   * Allowed image-size tiers for this model path.
   */
  allowedImageSizes: readonly string[];
  /**
   * Allowed image MIME types for model paths that expose output format control.
   */
  allowedOutputMimeTypes: readonly string[];
  /**
   * Allowed people-generation policy values for model paths that expose them.
   */
  allowedPersonGenerationModes: readonly string[];
}

/**
 * Attachment support metadata for text/multimodal models.
 */
export interface GeminiTextAttachmentLimits {
  /**
   * Whether image attachments are supported.
   */
  supportsImages: boolean;
  /**
   * Whether video attachments are supported.
   */
  supportsVideo: boolean;
  /**
   * Whether audio attachments are supported.
   */
  supportsAudio: boolean;
  /**
   * Whether document/file attachments are supported.
   */
  supportsDocuments: boolean;
  /**
   * Maximum number of files per request when known.
   * Null means unknown and should be treated conservatively by consumers.
   */
  maxFiles: number | null;
}

/**
 * Thinking metadata exposed for model-aware text configuration UIs.
 */
export interface GeminiTextThinkingCapabilities {
  /**
   * Underlying thinking support contract used by the library.
   */
  support: GeminiThinkingModelSupport | null;
  /**
   * Friendly mode label for generic consumers.
   */
  mode: "none" | "level" | "budget";
  /**
   * Allowed thinking levels when `mode` is `level`.
   */
  supportedLevels: readonly GeminiThinkingProfileLevel[];
}

/**
 * Canonical capability payload for text generation models.
 */
export interface GeminiTextModelCapabilities {
  /**
   * Raw model id requested by the caller.
   */
  model: string;
  /**
   * True when the model exists in the known text model catalog.
   */
  isKnownModel: boolean;
  /**
   * Indicates whether this record comes from catalog data or a fallback.
   */
  source: GeminiCapabilitySource;
  /**
   * Attachment/multimodal limits for this model.
   */
  attachmentLimits: GeminiTextAttachmentLimits;
  /**
   * Model-aware thinking support hints.
   */
  thinking: GeminiTextThinkingCapabilities;
  /**
   * Which config keys are available for this model.
   */
  supportedOptions: readonly GeminiTextConfigOptionKey[];
  /**
   * Which config keys are intentionally unsupported for this model.
   */
  unsupportedOptions: readonly GeminiTextConfigOptionKey[];
}

/**
 * Input constraints for Gemini TTS/audio generation models.
 */
export interface GeminiAudioInputLimits {
  /**
   * Whether plain text input is supported.
   */
  supportsTextInput: boolean;
  /**
   * Whether file/image/audio attachments are part of the request contract.
   */
  supportsAttachments: boolean;
  /**
   * Maximum input context length when known.
   * Null means unknown and should be treated conservatively by consumers.
   */
  maxContextTokens: number | null;
}

/**
 * Speaker constraints for Gemini TTS/audio generation models.
 */
export interface GeminiAudioSpeakerLimits {
  /**
   * Whether the model supports the standard single-speaker voice path.
   */
  supportsSingleSpeaker: boolean;
  /**
   * Whether the model supports native multi-speaker dialogue.
   */
  supportsMultiSpeaker: boolean;
  /**
   * Maximum number of speakers supported when known.
   * Null means unknown.
   */
  maxSpeakers: number | null;
  /**
   * Required speaker count for the current SDK-backed multi-speaker request
   * contract when known.
   */
  multiSpeakerExactCount: number | null;
}

/**
 * Canonical capability payload for audio/TTS generation models.
 */
export interface GeminiAudioModelCapabilities {
  /**
   * Raw model id requested by the caller.
   */
  model: string;
  /**
   * True when the model exists in the known audio model catalog.
   */
  isKnownModel: boolean;
  /**
   * Indicates whether this record comes from catalog data or a fallback.
   */
  source: GeminiCapabilitySource;
  /**
   * Input-shape limits for the audio request.
   */
  inputLimits: GeminiAudioInputLimits;
  /**
   * Speaker-count and speaker-mode limits for the audio request.
   */
  speakerLimits: GeminiAudioSpeakerLimits;
  /**
   * Output modalities this model is expected to emit.
   */
  allowedResponseModalities: readonly string[];
  /**
   * Which config keys are available for this model.
   */
  supportedOptions: readonly GeminiAudioConfigOptionKey[];
  /**
   * Which config keys are intentionally unsupported for this model.
   */
  unsupportedOptions: readonly GeminiAudioConfigOptionKey[];
}

/**
 * Input constraints for Gemini music-generation models.
 */
export interface GeminiMusicAttachmentLimits {
  /**
   * Whether plain text prompts are supported.
   */
  supportsTextPrompt: boolean;
  /**
   * Whether image-guided music generation is supported.
   */
  supportsImageInput: boolean;
  /**
   * Whether the stable exported contract includes timed lyrics metadata.
   */
  supportsTimedLyricsMetadata: boolean;
}

/**
 * Output constraints for Gemini music-generation models.
 */
export interface GeminiMusicOutputLimits {
  /**
   * Whether the model returns generated audio.
   */
  supportsAudioOutput: boolean;
  /**
   * Best-fit descriptive use case for the model.
   */
  bestFor: string;
  /**
   * Maximum duration in seconds when the model has a stable documented cap.
   * Null means descriptive prompt-driven duration rather than fixed numeric
   * enforcement in the stable library contract.
   */
  maxDurationSeconds: number | null;
  /**
   * Allowed output MIME types documented for this model path.
   */
  allowedOutputMimeTypes: readonly string[];
}

/**
 * Canonical capability payload for music-generation models.
 */
export interface GeminiMusicModelCapabilities {
  /**
   * Raw model id requested by the caller.
   */
  model: string;
  /**
   * True when the model exists in the known music model catalog.
   */
  isKnownModel: boolean;
  /**
   * Indicates whether this record comes from catalog data or a fallback.
   */
  source: GeminiCapabilitySource;
  /**
   * Input/source constraints for the music request.
   */
  attachmentLimits: GeminiMusicAttachmentLimits;
  /**
   * Output constraints for the music request.
   */
  outputLimits: GeminiMusicOutputLimits;
  /**
   * Which config keys are available for this model.
   */
  supportedOptions: readonly GeminiMusicConfigOptionKey[];
  /**
   * Which config keys are intentionally unsupported for this model.
   */
  unsupportedOptions: readonly GeminiMusicConfigOptionKey[];
  /**
   * Allowed response modalities for the selected model path.
   */
  allowedResponseModalities: readonly string[];
}

/**
 * Input constraints for Gemini video-generation models.
 */
export interface GeminiVideoAttachmentLimits {
  /**
   * Whether prompt-only generation is supported.
   */
  supportsTextPrompt: boolean;
  /**
   * Whether image-to-video generation is supported.
   */
  supportsImageInput: boolean;
  /**
   * Whether video-extension input is supported.
   */
  supportsVideoInput: boolean;
  /**
   * Whether reference-image conditioning is supported.
   */
  supportsReferenceImages: boolean;
  /**
   * Whether a dedicated last-frame input is supported.
   */
  supportsLastFrame: boolean;
  /**
   * Maximum number of reference images supported when known.
   * Null means unknown.
   */
  maxReferenceImages: number | null;
}

/**
 * Output constraints for Gemini video-generation models.
 */
export interface GeminiVideoOutputLimits {
  /**
   * Whether the model can generate synchronized audio with the video.
   */
  supportsAudioOutput: boolean;
  /**
   * Minimum number of videos accepted by the request path.
   */
  minVideos: number;
  /**
   * Maximum number of videos accepted by the request path.
   */
  maxVideos: number;
  /**
   * Recommended default number of videos when not explicitly set.
   */
  defaultVideos: number;
  /**
   * Recommended default clip duration in seconds.
   */
  defaultDuration: GeminiVideoDurationSeconds | null;
  /**
   * Recommended default frame rate.
   */
  defaultFps: number | null;
}

/**
 * Canonical capability payload for video-generation models.
 */
export interface GeminiVideoModelCapabilities {
  /**
   * Raw model id requested by the caller.
   */
  model: string;
  /**
   * True when the model exists in the known video model catalog.
   */
  isKnownModel: boolean;
  /**
   * Indicates whether this record comes from catalog data or a fallback.
   */
  source: GeminiCapabilitySource;
  /**
   * Input/source constraints for the video request.
   */
  attachmentLimits: GeminiVideoAttachmentLimits;
  /**
   * Output constraints for the video request.
   */
  outputLimits: GeminiVideoOutputLimits;
  /**
   * Which config keys are available for this model.
   */
  supportedOptions: readonly GeminiVideoConfigOptionKey[];
  /**
   * Which config keys are intentionally unsupported for this model.
   */
  unsupportedOptions: readonly GeminiVideoConfigOptionKey[];
  /**
   * Allowed aspect ratios for the selected model path.
   */
  allowedAspectRatios: readonly string[];
  /**
   * Allowed output resolutions for the selected model path.
   */
  allowedResolutions: readonly string[];
  /**
   * Allowed clip durations for the selected model path.
   */
  allowedDurations: readonly number[];
  /**
   * Allowed person-generation policy values for the selected model path.
   */
  allowedPersonGenerationModes: readonly string[];
}

/**
 * Live-session limits exposed for consumer controls.
 */
export interface GeminiLiveModelLimits {
  /**
   * Maximum thinking budget supported by this live model where known.
   * Null means unknown.
   */
  maxThinkingBudget: number | null;
  /**
   * Minimum thinking budget supported by this live model where known.
   * Null means unknown.
   */
  minThinkingBudget: number | null;
}

/**
 * Canonical capability payload for live-session models.
 */
export interface GeminiLiveModelCapabilities {
  /**
   * Raw model id requested by the caller.
   */
  model: string;
  /**
   * True when the model exists in the known live model catalog.
   */
  isKnownModel: boolean;
  /**
   * Indicates whether this record comes from catalog data or a fallback.
   */
  source: GeminiCapabilitySource;
  /**
   * Controls whether key live features are expected to be available.
   */
  featureFlags: {
    supportsAudioInput: boolean;
    supportsAudioOutput: boolean;
    supportsToolCalling: boolean;
    supportsGoogleSearch: boolean;
    supportsAffectiveDialog: boolean;
    supportsProactiveAudio: boolean;
    supportsVadConfig: boolean;
  };
  /**
   * Numeric bounds and constraints for key live controls.
   */
  limits: GeminiLiveModelLimits;
  /**
   * Which config keys are available for this model.
   */
  supportedOptions: readonly GeminiLiveConfigOptionKey[];
  /**
   * Which config keys are intentionally unsupported for this model.
   */
  unsupportedOptions: readonly GeminiLiveConfigOptionKey[];
}

/**
 * Complete image config option catalog.
 * Consumers can filter this per model with `getImageModelConfigOptions(...)`.
 */
export const GEMINI_IMAGE_CONFIG_OPTIONS: Record<
  GeminiImageConfigOptionKey,
  GeminiConfigOptionDescriptor<GeminiImageConfigOptionKey>
> = {
  /**
   * Image width:height ratio preference.
   */
  aspectRatio: {
    key: "aspectRatio",
    label: "Aspect ratio",
    description: "Controls the width-to-height ratio of generated images.",
    kind: "string",
    defaultValue: "1:1",
  },
  /**
   * Resolution tier used by image generation paths that support it.
   */
  imageSize: {
    key: "imageSize",
    label: "Image size",
    description: "Controls output resolution tier when the selected model supports size control.",
    kind: "string",
    defaultValue: "1K",
  },
  /**
   * Number of images requested in a single generation call.
   */
  numberOfImages: {
    key: "numberOfImages",
    label: "Number of images",
    description: "Controls how many images are requested in one generation run.",
    kind: "number",
    min: 1,
    max: 1,
    step: 1,
    defaultValue: 1,
  },
  /**
   * Policy controlling whether people can appear in generated images.
   */
  personGeneration: {
    key: "personGeneration",
    label: "Person generation policy",
    description: "Controls people-generation policy where supported by the model path.",
    kind: "string",
    allowedValues: ["ALLOW_ADULT", "ALLOW_ALL", "DONT_ALLOW"],
    defaultValue: "ALLOW_ADULT",
  },
  /**
   * Desired MIME type for generated image binaries (Imagen paths only).
   */
  outputMimeType: {
    key: "outputMimeType",
    label: "Output image MIME type",
    description: "Selects output image MIME type on model paths that support explicit format selection.",
    kind: "string",
    allowedValues: ["image/png", "image/jpeg", "image/webp", "image/heic"],
    defaultValue: "image/png",
    note: "Gemini image-model routes generally return native output format and may ignore this option.",
  },
  /**
   * Compression quality for formats that expose lossy-quality controls.
   */
  compressionQuality: {
    key: "compressionQuality",
    label: "Compression quality",
    description: "Controls compression quality when the selected output format/model path supports it.",
    kind: "number",
    min: 1,
    max: 100,
    step: 1,
    defaultValue: 90,
  },
  /**
   * Response modality selection for multimodal Gemini content responses.
   */
  responseModalities: {
    key: "responseModalities",
    label: "Response modalities",
    description: "Controls whether the model may return image output, text output, or both.",
    kind: "array",
    allowedValues: ["image", "text", "IMAGE", "TEXT"],
    defaultValue: ["image"],
  },
  /**
   * MIME type for text/structured response channels.
   */
  responseMimeType: {
    key: "responseMimeType",
    label: "Response MIME type",
    description: "Sets MIME type for non-image response channels, for example JSON text output.",
    kind: "string",
    defaultValue: "text/plain",
  },
  /**
   * JSON schema definition for structured non-image responses.
   */
  responseSchema: {
    key: "responseSchema",
    label: "Response schema",
    description: "Supplies a JSON schema for structured non-image responses where supported.",
    kind: "object",
  },
};

/**
 * Complete text config option catalog.
 * Consumers can filter this per model with `getTextModelConfigOptions(...)`.
 */
export const GEMINI_TEXT_CONFIG_OPTIONS: Record<
  GeminiTextConfigOptionKey,
  GeminiConfigOptionDescriptor<GeminiTextConfigOptionKey>
> = {
  /**
   * Sampling temperature for response creativity vs determinism.
   */
  temperature: {
    key: "temperature",
    label: "Temperature",
    description: "Controls response randomness. Lower values are more deterministic.",
    kind: "number",
    min: 0,
    max: 2,
    step: 0.1,
    defaultValue: 1,
  },
  /**
   * Tool declarations available for model tool calling.
   */
  tools: {
    key: "tools",
    label: "Tools",
    description: "Defines callable tools available to the model during generation.",
    kind: "array",
  },
  /**
   * Safety settings used to tune content filtering behavior.
   */
  safetySettings: {
    key: "safetySettings",
    label: "Safety settings",
    description: "Configures safety policy behavior for generation requests.",
    kind: "array",
  },
  /**
   * Cached-content handle for context reuse.
   */
  cachedContent: {
    key: "cachedContent",
    label: "Cached content handle",
    description: "References cached context content to reduce repeated prompt payloads.",
    kind: "string",
  },
  /**
   * MIME type for text output payload channel.
   */
  responseMimeType: {
    key: "responseMimeType",
    label: "Response MIME type",
    description: "Controls text output MIME type such as plain text or JSON.",
    kind: "string",
    allowedValues: ["text/plain", "application/json"],
    defaultValue: "text/plain",
  },
  /**
   * JSON schema for structured JSON output generation.
   */
  responseSchema: {
    key: "responseSchema",
    label: "Response schema",
    description: "Supplies a JSON schema for structured text output.",
    kind: "object",
  },
  /**
   * Thinking configuration object for model reasoning behavior.
   */
  thinkingConfig: {
    key: "thinkingConfig",
    label: "Thinking configuration",
    description: "Controls reasoning behavior using model-supported thinking parameters.",
    kind: "object",
  },
};

/**
 * Complete audio/TTS config option catalog.
 * Consumers can filter this per model with `getAudioModelConfigOptions(...)`.
 */
export const GEMINI_AUDIO_CONFIG_OPTIONS: Record<
  GeminiAudioConfigOptionKey,
  GeminiConfigOptionDescriptor<GeminiAudioConfigOptionKey>
> = {
  /**
   * Prebuilt voice name used for single-speaker synthesis.
   */
  voiceName: {
    key: "voiceName",
    label: "Voice name",
    description: "Selects the prebuilt voice used for single-speaker synthesis.",
    kind: "string",
    defaultValue: "Kore",
  },
  /**
   * Language hint passed to the TTS speech configuration.
   */
  languageCode: {
    key: "languageCode",
    label: "Language code",
    description: "Supplies an optional language hint such as en-US or fr-FR for speech synthesis.",
    kind: "string",
    defaultValue: "en-US",
  },
  /**
   * Requested response modalities for the TTS response.
   */
  responseModalities: {
    key: "responseModalities",
    label: "Response modalities",
    description:
      "Controls the requested response modalities for the TTS call. TTS models are expected to return audio.",
    kind: "array",
    allowedValues: ["AUDIO"],
    defaultValue: ["AUDIO"],
    note: "The current SDK-backed TTS flow is audio-only. Consumers should treat non-AUDIO values as unsupported.",
  },
  /**
   * Multi-speaker voice mapping for dialogue generation.
   */
  multiSpeakerVoiceConfig: {
    key: "multiSpeakerVoiceConfig",
    label: "Multi-speaker voice config",
    description: "Maps prompt speaker names to voices for native multi-speaker dialogue synthesis.",
    kind: "object",
    note: "The current @google/genai SDK contract exposes exactly two speaker voice configs for this path.",
  },
};

/**
 * Complete music-generation config option catalog.
 * Consumers can filter this per model with `getMusicModelConfigOptions(...)`.
 */
export const GEMINI_MUSIC_CONFIG_OPTIONS: Record<
  GeminiMusicConfigOptionKey,
  GeminiConfigOptionDescriptor<GeminiMusicConfigOptionKey>
> = {
  /**
   * Requested response modalities for the Lyria response.
   */
  responseModalities: {
    key: "responseModalities",
    label: "Response modalities",
    description:
      "Controls whether Lyria returns audio, text metadata, or both through the stable generateContent flow.",
    kind: "array",
    allowedValues: ["AUDIO", "TEXT"],
    defaultValue: ["AUDIO", "TEXT"],
    note: "Lyria v1 in this library uses generateContent(...) with text/image input and audio/text output. Richer musical controls remain prompt-driven rather than typed config fields.",
  },
};

/**
 * Complete video config option catalog.
 * Consumers can filter this per model with `getVideoModelConfigOptions(...)`.
 */
export const GEMINI_VIDEO_CONFIG_OPTIONS: Record<
  GeminiVideoConfigOptionKey,
  GeminiConfigOptionDescriptor<GeminiVideoConfigOptionKey>
> = {
  /**
   * Controls the output video aspect ratio.
   */
  aspectRatio: {
    key: "aspectRatio",
    label: "Aspect ratio",
    description: "Controls the output aspect ratio for generated videos.",
    kind: "string",
    allowedValues: ["16:9", "9:16"],
    defaultValue: "16:9",
  },
  /**
   * Controls the output video resolution.
   */
  resolution: {
    key: "resolution",
    label: "Resolution",
    description: "Controls the output resolution for generated videos.",
    kind: "string",
    allowedValues: ["720p", "1080p", "4k"],
    defaultValue: "1080p",
    note: "Current Veo 3.1 paths require 8 seconds for 1080p and 4k generation. Video extension is limited to 720p.",
  },
  /**
   * Controls generated clip duration in seconds.
   */
  durationSeconds: {
    key: "durationSeconds",
    label: "Duration",
    description: "Controls generated clip duration in seconds.",
    kind: "number",
    min: 4,
    max: 8,
    step: 2,
    defaultValue: 8,
    note: "Reference-image generation currently requires 8 seconds.",
  },
  /**
   * Controls generated frames per second.
   */
  fps: {
    key: "fps",
    label: "Frames per second",
    description: "Controls the target frame rate for generated videos.",
    kind: "number",
    min: 1,
    max: 60,
    step: 1,
    defaultValue: 24,
  },
  /**
   * Controls whether the model should generate synchronized audio.
   */
  generateAudio: {
    key: "generateAudio",
    label: "Generate audio",
    description: "Controls whether synchronized audio should be generated together with the video.",
    kind: "boolean",
    defaultValue: true,
  },
  /**
   * Negative prompt content used to discourage unwanted output.
   */
  negativePrompt: {
    key: "negativePrompt",
    label: "Negative prompt",
    description: "Describes visuals or artifacts the model should avoid in the generated video.",
    kind: "string",
  },
  /**
   * Number of videos requested from the generation path.
   */
  numberOfVideos: {
    key: "numberOfVideos",
    label: "Number of videos",
    description: "Controls how many videos are requested in one generation run.",
    kind: "number",
    min: 1,
    max: 1,
    step: 1,
    defaultValue: 1,
  },
  /**
   * Fixed random seed used for deterministic reruns when supported.
   */
  seed: {
    key: "seed",
    label: "Seed",
    description: "Sets a random seed to make repeated generations more reproducible.",
    kind: "number",
    min: 0,
    step: 1,
  },
  /**
   * Controls whether prompt enhancement should run before generation.
   */
  enhancePrompt: {
    key: "enhancePrompt",
    label: "Enhance prompt",
    description: "Enables prompt enhancement before the Veo generation call.",
    kind: "boolean",
    defaultValue: true,
  },
  /**
   * Controls whether person videos are allowed for the generation request.
   */
  personGeneration: {
    key: "personGeneration",
    label: "Person generation policy",
    description: "Controls people-generation policy where supported by the video model path.",
    kind: "string",
    allowedValues: ["allow_adult", "dont_allow"],
    defaultValue: "allow_adult",
  },
};

/**
 * Complete live-session config option catalog.
 * Consumers can filter this per model with `getLiveModelConfigOptions(...)`.
 */
export const GEMINI_LIVE_CONFIG_OPTIONS: Record<
  GeminiLiveConfigOptionKey,
  GeminiConfigOptionDescriptor<GeminiLiveConfigOptionKey>
> = {
  /**
   * Top-level behavioral/system instruction for the live assistant.
   */
  systemInstruction: {
    key: "systemInstruction",
    label: "System instruction",
    description: "Defines assistant behavior and constraints for the live session.",
    kind: "string",
  },
  /**
   * Prebuilt voice name used for model audio output.
   */
  voiceName: {
    key: "voiceName",
    label: "Voice name",
    description: "Selects prebuilt voice identity for audio responses.",
    kind: "string",
    defaultValue: "Aoede",
  },
  /**
   * Function/tool declarations available during the session.
   */
  tools: {
    key: "tools",
    label: "Tools",
    description: "Declares callable tools available to the live model.",
    kind: "array",
  },
  /**
   * Enables built-in Google Search grounding support.
   */
  enableGoogleSearch: {
    key: "enableGoogleSearch",
    label: "Enable Google Search",
    description: "Allows the live model to use built-in Google Search grounding.",
    kind: "boolean",
    defaultValue: false,
  },
  /**
   * Enables affective-dialog voice behavior where supported.
   */
  enableAffectiveDialog: {
    key: "enableAffectiveDialog",
    label: "Enable affective dialog",
    description: "Enables emotional adaptation in native-audio model responses.",
    kind: "boolean",
    defaultValue: false,
    note: "This currently requires alpha API behavior in the live service.",
  },
  /**
   * Enables proactive turn-taking behavior where supported.
   */
  enableProactiveAudio: {
    key: "enableProactiveAudio",
    label: "Enable proactive audio",
    description: "Allows the model to proactively decide when to speak/listen.",
    kind: "boolean",
    defaultValue: false,
    note: "This currently requires alpha API behavior in the live service.",
  },
  /**
   * Token budget for model reasoning during live responses.
   */
  thinkingBudget: {
    key: "thinkingBudget",
    label: "Thinking budget",
    description: "Allocates reasoning token budget when live thinking is enabled.",
    kind: "number",
    min: 0,
    max: 24576,
    step: 1,
  },
  /**
   * Include model thought traces when supported.
   */
  includeThoughts: {
    key: "includeThoughts",
    label: "Include thoughts",
    description: "Returns model thought traces with responses when available.",
    kind: "boolean",
    defaultValue: false,
  },
  /**
   * Voice activity detection controls for speech boundary detection.
   */
  vadConfig: {
    key: "vadConfig",
    label: "VAD configuration",
    description: "Fine-tunes start/end speech detection and silence thresholds.",
    kind: "object",
  },
  /**
   * URL/path to the audio worklet module used for microphone processing.
   */
  audioWorkletModulePath: {
    key: "audioWorkletModulePath",
    label: "Audio worklet module path",
    description: "Specifies audio worklet module path used for live microphone capture.",
    kind: "string",
    defaultValue: "/audio-processor.js",
  },
};

const IMAGE_OPTION_KEYS = Object.keys(GEMINI_IMAGE_CONFIG_OPTIONS) as GeminiImageConfigOptionKey[];
const TEXT_OPTION_KEYS = Object.keys(GEMINI_TEXT_CONFIG_OPTIONS) as GeminiTextConfigOptionKey[];
const AUDIO_OPTION_KEYS = Object.keys(GEMINI_AUDIO_CONFIG_OPTIONS) as GeminiAudioConfigOptionKey[];
const MUSIC_OPTION_KEYS = Object.keys(GEMINI_MUSIC_CONFIG_OPTIONS) as GeminiMusicConfigOptionKey[];
const VIDEO_OPTION_KEYS = Object.keys(GEMINI_VIDEO_CONFIG_OPTIONS) as GeminiVideoConfigOptionKey[];
const LIVE_OPTION_KEYS = Object.keys(GEMINI_LIVE_CONFIG_OPTIONS) as GeminiLiveConfigOptionKey[];

const FLASH_IMAGE_ASPECT_RATIOS: readonly GeminiFlashAspectRatio[] = [
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
];

const IMAGEN_IMAGE_ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"] as const;
const IMAGE_SIZE_TIERS = ["256", "512", "1K", "2K", "4K"] as const satisfies readonly GeminiImageSize[];
const VIDEO_ASPECT_RATIOS = ["16:9", "9:16"] as const satisfies readonly GeminiVideoAspectRatio[];
const VIDEO_DURATIONS = [4, 6, 8] as const satisfies readonly GeminiVideoDurationSeconds[];
const STANDARD_VIDEO_RESOLUTIONS = ["720p", "1080p", "4k"] as const satisfies readonly GeminiVideoResolution[];
const FAST_VIDEO_RESOLUTIONS = ["720p", "1080p"] as const satisfies readonly GeminiVideoResolution[];
const VIDEO_PERSON_GENERATION_MODES = ["allow_adult", "dont_allow"] as const;

const COMMON_TEXT_ATTACHMENT_LIMITS: GeminiTextAttachmentLimits = {
  supportsImages: true,
  supportsVideo: true,
  supportsAudio: true,
  supportsDocuments: true,
  maxFiles: 3000,
};

function toUnsupportedOptions<T extends string>(supportedOptions: readonly T[], allOptions: readonly T[]) {
  const supportedSet = new Set(supportedOptions);
  return allOptions.filter((option) => !supportedSet.has(option));
}

const KNOWN_IMAGE_MODEL_CAPABILITIES: Record<KnownImageGenerationModel, GeminiImageModelCapabilities> = {
  "gemini-2.5-flash-image": {
    model: "gemini-2.5-flash-image",
    isKnownModel: true,
    source: "catalog",
    attachmentLimits: {
      maxReferenceImages: 3,
    },
    outputLimits: {
      minImages: 1,
      maxImages: 10,
      defaultImages: 1,
    },
    supportedOptions: [
      "aspectRatio",
      "imageSize",
      "personGeneration",
      "responseModalities",
      "responseMimeType",
      "responseSchema",
    ],
    unsupportedOptions: [],
    allowedAspectRatios: FLASH_IMAGE_ASPECT_RATIOS,
    allowedImageSizes: IMAGE_SIZE_TIERS,
    allowedOutputMimeTypes: [],
    allowedPersonGenerationModes: ["ALLOW_ADULT", "ALLOW_ALL", "DONT_ALLOW"],
  },
  "gemini-3.1-flash-image-preview": {
    model: "gemini-3.1-flash-image-preview",
    isKnownModel: true,
    source: "catalog",
    attachmentLimits: {
      maxReferenceImages: 14,
    },
    outputLimits: {
      minImages: 1,
      maxImages: 10,
      defaultImages: 1,
    },
    supportedOptions: [
      "aspectRatio",
      "imageSize",
      "personGeneration",
      "responseModalities",
      "responseMimeType",
      "responseSchema",
    ],
    unsupportedOptions: [],
    allowedAspectRatios: FLASH_IMAGE_ASPECT_RATIOS,
    allowedImageSizes: IMAGE_SIZE_TIERS,
    allowedOutputMimeTypes: [],
    allowedPersonGenerationModes: ["ALLOW_ADULT", "ALLOW_ALL", "DONT_ALLOW"],
  },
  "gemini-3-pro-image-preview": {
    model: "gemini-3-pro-image-preview",
    isKnownModel: true,
    source: "catalog",
    attachmentLimits: {
      maxReferenceImages: 14,
    },
    outputLimits: {
      minImages: 1,
      maxImages: 4,
      defaultImages: 1,
    },
    supportedOptions: [
      "aspectRatio",
      "imageSize",
      "personGeneration",
      "responseModalities",
      "responseMimeType",
      "responseSchema",
    ],
    unsupportedOptions: [],
    allowedAspectRatios: FLASH_IMAGE_ASPECT_RATIOS,
    allowedImageSizes: IMAGE_SIZE_TIERS,
    allowedOutputMimeTypes: [],
    allowedPersonGenerationModes: ["ALLOW_ADULT", "ALLOW_ALL", "DONT_ALLOW"],
  },
  "imagen-4.0-generate-001": {
    model: "imagen-4.0-generate-001",
    isKnownModel: true,
    source: "catalog",
    attachmentLimits: {
      maxReferenceImages: 1,
    },
    outputLimits: {
      minImages: 1,
      maxImages: 4,
      defaultImages: 1,
    },
    supportedOptions: [
      "aspectRatio",
      "imageSize",
      "numberOfImages",
      "personGeneration",
      "outputMimeType",
      "compressionQuality",
    ],
    unsupportedOptions: [],
    allowedAspectRatios: IMAGEN_IMAGE_ASPECT_RATIOS,
    allowedImageSizes: ["1K", "2K", "4K"],
    allowedOutputMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/heic"],
    allowedPersonGenerationModes: ["ALLOW_ADULT", "ALLOW_ALL", "DONT_ALLOW"],
  },
};

const KNOWN_TEXT_MODEL_CAPABILITIES: Record<KnownTextGenerationModel, GeminiTextModelCapabilities> = {
  "gemini-2.5-flash-lite": {
    model: "gemini-2.5-flash-lite",
    isKnownModel: true,
    source: "catalog",
    attachmentLimits: COMMON_TEXT_ATTACHMENT_LIMITS,
    thinking: {
      support: getGeminiThinkingSupportForModel("gemini-2.5-flash-lite") ?? null,
      mode: "budget",
      supportedLevels: [],
    },
    supportedOptions: TEXT_OPTION_KEYS,
    unsupportedOptions: [],
  },
  "gemini-2.5-flash": {
    model: "gemini-2.5-flash",
    isKnownModel: true,
    source: "catalog",
    attachmentLimits: COMMON_TEXT_ATTACHMENT_LIMITS,
    thinking: {
      support: getGeminiThinkingSupportForModel("gemini-2.5-flash") ?? null,
      mode: "budget",
      supportedLevels: [],
    },
    supportedOptions: TEXT_OPTION_KEYS,
    unsupportedOptions: [],
  },
  "gemini-2.5-pro": {
    model: "gemini-2.5-pro",
    isKnownModel: true,
    source: "catalog",
    attachmentLimits: COMMON_TEXT_ATTACHMENT_LIMITS,
    thinking: {
      support: getGeminiThinkingSupportForModel("gemini-2.5-pro") ?? null,
      mode: "budget",
      supportedLevels: [],
    },
    supportedOptions: TEXT_OPTION_KEYS,
    unsupportedOptions: [],
  },
  "gemini-3-flash-preview": {
    model: "gemini-3-flash-preview",
    isKnownModel: true,
    source: "catalog",
    attachmentLimits: COMMON_TEXT_ATTACHMENT_LIMITS,
    thinking: {
      support: getGeminiThinkingSupportForModel("gemini-3-flash-preview") ?? null,
      mode: "level",
      supportedLevels: ["minimal", "low", "medium", "high"],
    },
    supportedOptions: TEXT_OPTION_KEYS,
    unsupportedOptions: [],
  },
  "gemini-3.1-flash-lite-preview": {
    model: "gemini-3.1-flash-lite-preview",
    isKnownModel: true,
    source: "catalog",
    attachmentLimits: COMMON_TEXT_ATTACHMENT_LIMITS,
    thinking: {
      support: getGeminiThinkingSupportForModel("gemini-3.1-flash-lite-preview") ?? null,
      mode: "level",
      supportedLevels: ["minimal", "low", "medium", "high"],
    },
    supportedOptions: TEXT_OPTION_KEYS,
    unsupportedOptions: [],
  },
  "gemini-3.1-pro-preview": {
    model: "gemini-3.1-pro-preview",
    isKnownModel: true,
    source: "catalog",
    attachmentLimits: COMMON_TEXT_ATTACHMENT_LIMITS,
    thinking: {
      support: getGeminiThinkingSupportForModel("gemini-3.1-pro-preview") ?? null,
      mode: "level",
      supportedLevels: ["low", "high"],
    },
    supportedOptions: TEXT_OPTION_KEYS,
    unsupportedOptions: [],
  },
};

const KNOWN_AUDIO_MODEL_CAPABILITIES: Record<KnownAudioGenerationModel, GeminiAudioModelCapabilities> = {
  "gemini-2.5-flash-preview-tts": {
    model: "gemini-2.5-flash-preview-tts",
    isKnownModel: true,
    source: "catalog",
    inputLimits: {
      supportsTextInput: true,
      supportsAttachments: false,
      maxContextTokens: 32000,
    },
    speakerLimits: {
      supportsSingleSpeaker: true,
      supportsMultiSpeaker: true,
      maxSpeakers: 2,
      multiSpeakerExactCount: 2,
    },
    allowedResponseModalities: ["AUDIO"],
    supportedOptions: AUDIO_OPTION_KEYS,
    unsupportedOptions: [],
  },
  "gemini-2.5-pro-preview-tts": {
    model: "gemini-2.5-pro-preview-tts",
    isKnownModel: true,
    source: "catalog",
    inputLimits: {
      supportsTextInput: true,
      supportsAttachments: false,
      maxContextTokens: 32000,
    },
    speakerLimits: {
      supportsSingleSpeaker: true,
      supportsMultiSpeaker: true,
      maxSpeakers: 2,
      multiSpeakerExactCount: 2,
    },
    allowedResponseModalities: ["AUDIO"],
    supportedOptions: AUDIO_OPTION_KEYS,
    unsupportedOptions: [],
  },
};

const KNOWN_MUSIC_MODEL_CAPABILITIES: Record<KnownMusicGenerationModel, GeminiMusicModelCapabilities> = {
  "lyria-3-clip-preview": {
    model: "lyria-3-clip-preview",
    isKnownModel: true,
    source: "catalog",
    attachmentLimits: {
      supportsTextPrompt: true,
      supportsImageInput: true,
      supportsTimedLyricsMetadata: false,
    },
    outputLimits: {
      supportsAudioOutput: true,
      bestFor: "short clips, loops, previews",
      maxDurationSeconds: 30,
      allowedOutputMimeTypes: ["audio/mpeg"],
    },
    supportedOptions: MUSIC_OPTION_KEYS,
    unsupportedOptions: [],
    allowedResponseModalities: ["AUDIO", "TEXT"],
  },
  "lyria-3-pro-preview": {
    model: "lyria-3-pro-preview",
    isKnownModel: true,
    source: "catalog",
    attachmentLimits: {
      supportsTextPrompt: true,
      supportsImageInput: true,
      supportsTimedLyricsMetadata: false,
    },
    outputLimits: {
      supportsAudioOutput: true,
      bestFor: "full-length songs and structured compositions",
      maxDurationSeconds: null,
      allowedOutputMimeTypes: ["audio/mpeg", "audio/wav"],
    },
    supportedOptions: MUSIC_OPTION_KEYS,
    unsupportedOptions: [],
    allowedResponseModalities: ["AUDIO", "TEXT"],
  },
};

const KNOWN_VIDEO_MODEL_CAPABILITIES: Record<KnownVideoGenerationModel, GeminiVideoModelCapabilities> = {
  "veo-3.1-generate-preview": {
    model: "veo-3.1-generate-preview",
    isKnownModel: true,
    source: "catalog",
    attachmentLimits: {
      supportsTextPrompt: true,
      supportsImageInput: true,
      supportsVideoInput: true,
      supportsReferenceImages: true,
      supportsLastFrame: true,
      maxReferenceImages: 3,
    },
    outputLimits: {
      supportsAudioOutput: true,
      minVideos: 1,
      maxVideos: 1,
      defaultVideos: 1,
      defaultDuration: 8,
      defaultFps: 24,
    },
    supportedOptions: VIDEO_OPTION_KEYS,
    unsupportedOptions: [],
    allowedAspectRatios: VIDEO_ASPECT_RATIOS,
    allowedResolutions: STANDARD_VIDEO_RESOLUTIONS,
    allowedDurations: VIDEO_DURATIONS,
    allowedPersonGenerationModes: VIDEO_PERSON_GENERATION_MODES,
  },
  "veo-3.1-fast-generate-preview": {
    model: "veo-3.1-fast-generate-preview",
    isKnownModel: true,
    source: "catalog",
    attachmentLimits: {
      supportsTextPrompt: true,
      supportsImageInput: true,
      supportsVideoInput: true,
      supportsReferenceImages: true,
      supportsLastFrame: true,
      maxReferenceImages: 3,
    },
    outputLimits: {
      supportsAudioOutput: true,
      minVideos: 1,
      maxVideos: 1,
      defaultVideos: 1,
      defaultDuration: 8,
      defaultFps: 24,
    },
    supportedOptions: VIDEO_OPTION_KEYS,
    unsupportedOptions: [],
    allowedAspectRatios: VIDEO_ASPECT_RATIOS,
    allowedResolutions: FAST_VIDEO_RESOLUTIONS,
    allowedDurations: VIDEO_DURATIONS,
    allowedPersonGenerationModes: VIDEO_PERSON_GENERATION_MODES,
  },
};

const LIVE_MODEL_THINKING_SUPPORT =
  getGeminiThinkingSupportForModel("gemini-2.5-flash-native-audio-preview-12-2025") ?? null;

const KNOWN_LIVE_MODEL_CAPABILITIES: Record<KnownLiveGenerationModel, GeminiLiveModelCapabilities> = {
  "gemini-2.5-flash-native-audio-preview-12-2025": {
    model: "gemini-2.5-flash-native-audio-preview-12-2025",
    isKnownModel: true,
    source: "catalog",
    featureFlags: {
      supportsAudioInput: true,
      supportsAudioOutput: true,
      supportsToolCalling: true,
      supportsGoogleSearch: true,
      supportsAffectiveDialog: true,
      supportsProactiveAudio: true,
      supportsVadConfig: true,
    },
    limits: {
      minThinkingBudget:
        LIVE_MODEL_THINKING_SUPPORT?.parameter === "thinkingBudget" ? LIVE_MODEL_THINKING_SUPPORT.minBudget : null,
      maxThinkingBudget:
        LIVE_MODEL_THINKING_SUPPORT?.parameter === "thinkingBudget" ? LIVE_MODEL_THINKING_SUPPORT.maxBudget : null,
    },
    supportedOptions: LIVE_OPTION_KEYS,
    unsupportedOptions: [],
  },
  "gemini-2.5-flash-native-audio-preview-09-2025": {
    model: "gemini-2.5-flash-native-audio-preview-09-2025",
    isKnownModel: true,
    source: "catalog",
    featureFlags: {
      supportsAudioInput: true,
      supportsAudioOutput: true,
      supportsToolCalling: true,
      supportsGoogleSearch: true,
      supportsAffectiveDialog: true,
      supportsProactiveAudio: true,
      supportsVadConfig: true,
    },
    limits: {
      minThinkingBudget:
        LIVE_MODEL_THINKING_SUPPORT?.parameter === "thinkingBudget" ? LIVE_MODEL_THINKING_SUPPORT.minBudget : null,
      maxThinkingBudget:
        LIVE_MODEL_THINKING_SUPPORT?.parameter === "thinkingBudget" ? LIVE_MODEL_THINKING_SUPPORT.maxBudget : null,
    },
    supportedOptions: LIVE_OPTION_KEYS,
    unsupportedOptions: [],
  },
};

for (const model of GEMINI_IMAGE_MODELS) {
  KNOWN_IMAGE_MODEL_CAPABILITIES[model].unsupportedOptions = toUnsupportedOptions(
    KNOWN_IMAGE_MODEL_CAPABILITIES[model].supportedOptions,
    IMAGE_OPTION_KEYS,
  );
}

for (const model of GEMINI_TEXT_MODELS) {
  KNOWN_TEXT_MODEL_CAPABILITIES[model].unsupportedOptions = toUnsupportedOptions(
    KNOWN_TEXT_MODEL_CAPABILITIES[model].supportedOptions,
    TEXT_OPTION_KEYS,
  );
}

for (const model of GEMINI_AUDIO_MODELS) {
  KNOWN_AUDIO_MODEL_CAPABILITIES[model].unsupportedOptions = toUnsupportedOptions(
    KNOWN_AUDIO_MODEL_CAPABILITIES[model].supportedOptions,
    AUDIO_OPTION_KEYS,
  );
}

for (const model of GEMINI_MUSIC_MODELS) {
  KNOWN_MUSIC_MODEL_CAPABILITIES[model].unsupportedOptions = toUnsupportedOptions(
    KNOWN_MUSIC_MODEL_CAPABILITIES[model].supportedOptions,
    MUSIC_OPTION_KEYS,
  );
}

for (const model of GEMINI_VIDEO_MODELS) {
  KNOWN_VIDEO_MODEL_CAPABILITIES[model].unsupportedOptions = toUnsupportedOptions(
    KNOWN_VIDEO_MODEL_CAPABILITIES[model].supportedOptions,
    VIDEO_OPTION_KEYS,
  );
}

for (const model of GEMINI_LIVE_MODELS) {
  KNOWN_LIVE_MODEL_CAPABILITIES[model].unsupportedOptions = toUnsupportedOptions(
    KNOWN_LIVE_MODEL_CAPABILITIES[model].supportedOptions,
    LIVE_OPTION_KEYS,
  );
}

/**
 * Public image-capability catalog keyed by known image model IDs.
 */
export const GEMINI_IMAGE_MODEL_CAPABILITIES: Readonly<
  Record<KnownImageGenerationModel, GeminiImageModelCapabilities>
> = KNOWN_IMAGE_MODEL_CAPABILITIES;

/**
 * Public text-capability catalog keyed by known text model IDs.
 */
export const GEMINI_TEXT_MODEL_CAPABILITIES: Readonly<Record<KnownTextGenerationModel, GeminiTextModelCapabilities>> =
  KNOWN_TEXT_MODEL_CAPABILITIES;

/**
 * Public audio/TTS capability catalog keyed by known audio model IDs.
 */
export const GEMINI_AUDIO_MODEL_CAPABILITIES: Readonly<
  Record<KnownAudioGenerationModel, GeminiAudioModelCapabilities>
> = KNOWN_AUDIO_MODEL_CAPABILITIES;

/**
 * Public music-generation capability catalog keyed by known music model IDs.
 */
export const GEMINI_MUSIC_MODEL_CAPABILITIES: Readonly<
  Record<KnownMusicGenerationModel, GeminiMusicModelCapabilities>
> = KNOWN_MUSIC_MODEL_CAPABILITIES;

/**
 * Public video-capability catalog keyed by known video model IDs.
 */
export const GEMINI_VIDEO_MODEL_CAPABILITIES: Readonly<
  Record<KnownVideoGenerationModel, GeminiVideoModelCapabilities>
> = KNOWN_VIDEO_MODEL_CAPABILITIES;

/**
 * Public live-capability catalog keyed by known live model IDs.
 */
export const GEMINI_LIVE_MODEL_CAPABILITIES: Readonly<Record<KnownLiveGenerationModel, GeminiLiveModelCapabilities>> =
  KNOWN_LIVE_MODEL_CAPABILITIES;

const IMAGE_FALLBACK_CAPABILITIES: GeminiImageModelCapabilities = {
  model: "unknown",
  isKnownModel: false,
  source: "fallback",
  attachmentLimits: {
    maxReferenceImages: null,
  },
  outputLimits: {
    minImages: 1,
    maxImages: 1,
    defaultImages: 1,
  },
  supportedOptions: ["aspectRatio", "imageSize", "responseModalities", "responseMimeType", "responseSchema"],
  unsupportedOptions: toUnsupportedOptions(
    ["aspectRatio", "imageSize", "responseModalities", "responseMimeType", "responseSchema"],
    IMAGE_OPTION_KEYS,
  ),
  allowedAspectRatios: FLASH_IMAGE_ASPECT_RATIOS,
  allowedImageSizes: IMAGE_SIZE_TIERS,
  allowedOutputMimeTypes: [],
  allowedPersonGenerationModes: ["ALLOW_ADULT", "ALLOW_ALL", "DONT_ALLOW"],
};

const TEXT_FALLBACK_CAPABILITIES: GeminiTextModelCapabilities = {
  model: "unknown",
  isKnownModel: false,
  source: "fallback",
  attachmentLimits: {
    supportsImages: true,
    supportsVideo: true,
    supportsAudio: true,
    supportsDocuments: true,
    maxFiles: null,
  },
  thinking: {
    support: null,
    mode: "none",
    supportedLevels: [],
  },
  supportedOptions: TEXT_OPTION_KEYS,
  unsupportedOptions: [],
};

const AUDIO_FALLBACK_CAPABILITIES: GeminiAudioModelCapabilities = {
  model: "unknown",
  isKnownModel: false,
  source: "fallback",
  inputLimits: {
    supportsTextInput: true,
    supportsAttachments: false,
    maxContextTokens: null,
  },
  speakerLimits: {
    supportsSingleSpeaker: true,
    supportsMultiSpeaker: false,
    maxSpeakers: null,
    multiSpeakerExactCount: null,
  },
  allowedResponseModalities: ["AUDIO"],
  supportedOptions: ["voiceName", "languageCode", "responseModalities"],
  unsupportedOptions: toUnsupportedOptions(["voiceName", "languageCode", "responseModalities"], AUDIO_OPTION_KEYS),
};

const MUSIC_FALLBACK_CAPABILITIES: GeminiMusicModelCapabilities = {
  model: "unknown",
  isKnownModel: false,
  source: "fallback",
  attachmentLimits: {
    supportsTextPrompt: true,
    supportsImageInput: true,
    supportsTimedLyricsMetadata: false,
  },
  outputLimits: {
    supportsAudioOutput: true,
    bestFor: "general music generation",
    maxDurationSeconds: null,
    allowedOutputMimeTypes: ["audio/mpeg"],
  },
  supportedOptions: MUSIC_OPTION_KEYS,
  unsupportedOptions: [],
  allowedResponseModalities: ["AUDIO", "TEXT"],
};

const VIDEO_FALLBACK_CAPABILITIES: GeminiVideoModelCapabilities = {
  model: "unknown",
  isKnownModel: false,
  source: "fallback",
  attachmentLimits: {
    supportsTextPrompt: true,
    supportsImageInput: true,
    supportsVideoInput: true,
    supportsReferenceImages: false,
    supportsLastFrame: false,
    maxReferenceImages: null,
  },
  outputLimits: {
    supportsAudioOutput: true,
    minVideos: 1,
    maxVideos: 1,
    defaultVideos: 1,
    defaultDuration: 8,
    defaultFps: 24,
  },
  supportedOptions: VIDEO_OPTION_KEYS,
  unsupportedOptions: [],
  allowedAspectRatios: VIDEO_ASPECT_RATIOS,
  allowedResolutions: FAST_VIDEO_RESOLUTIONS,
  allowedDurations: VIDEO_DURATIONS,
  allowedPersonGenerationModes: VIDEO_PERSON_GENERATION_MODES,
};

const LIVE_FALLBACK_CAPABILITIES: GeminiLiveModelCapabilities = {
  model: "unknown",
  isKnownModel: false,
  source: "fallback",
  featureFlags: {
    supportsAudioInput: true,
    supportsAudioOutput: true,
    supportsToolCalling: true,
    supportsGoogleSearch: false,
    supportsAffectiveDialog: false,
    supportsProactiveAudio: false,
    supportsVadConfig: true,
  },
  limits: {
    minThinkingBudget: 0,
    maxThinkingBudget: null,
  },
  supportedOptions: ["systemInstruction", "voiceName", "tools", "thinkingBudget", "includeThoughts", "vadConfig"],
  unsupportedOptions: toUnsupportedOptions(
    ["systemInstruction", "voiceName", "tools", "thinkingBudget", "includeThoughts", "vadConfig"],
    LIVE_OPTION_KEYS,
  ),
};

function normalizeModelId(modelId: string | null | undefined) {
  return typeof modelId === "string" ? modelId.trim().toLowerCase() : "";
}

function isKnownImageModel(modelId: string): modelId is KnownImageGenerationModel {
  return (GEMINI_IMAGE_MODELS as readonly string[]).includes(modelId);
}

function isKnownTextModel(modelId: string): modelId is KnownTextGenerationModel {
  return (GEMINI_TEXT_MODELS as readonly string[]).includes(modelId);
}

function isKnownAudioModel(modelId: string): modelId is KnownAudioGenerationModel {
  return (GEMINI_AUDIO_MODELS as readonly string[]).includes(modelId);
}

function isKnownMusicModel(modelId: string): modelId is KnownMusicGenerationModel {
  return (GEMINI_MUSIC_MODELS as readonly string[]).includes(modelId);
}

function isKnownVideoModel(modelId: string): modelId is KnownVideoGenerationModel {
  return (GEMINI_VIDEO_MODELS as readonly string[]).includes(modelId);
}

function isKnownLiveModel(modelId: string): modelId is KnownLiveGenerationModel {
  return (GEMINI_LIVE_MODELS as readonly string[]).includes(modelId);
}

/**
 * Resolve image-model capabilities for known and unknown model IDs.
 * Unknown models return a conservative fallback and never throw.
 */
export function getImageModelCapabilities(modelId: string): GeminiImageModelCapabilities {
  const normalizedModel = normalizeModelId(modelId);
  if (isKnownImageModel(normalizedModel)) {
    return GEMINI_IMAGE_MODEL_CAPABILITIES[normalizedModel];
  }

  return {
    ...IMAGE_FALLBACK_CAPABILITIES,
    model: normalizedModel || modelId || "unknown",
  };
}

/**
 * Resolve text-model capabilities for known and unknown model IDs.
 * Unknown models return a conservative fallback and never throw.
 */
export function getTextModelCapabilities(modelId: string): GeminiTextModelCapabilities {
  const normalizedModel = normalizeModelId(modelId);
  if (isKnownTextModel(normalizedModel)) {
    return GEMINI_TEXT_MODEL_CAPABILITIES[normalizedModel];
  }

  return {
    ...TEXT_FALLBACK_CAPABILITIES,
    model: normalizedModel || modelId || "unknown",
  };
}

/**
 * Resolve audio/TTS-model capabilities for known and unknown model IDs.
 * Unknown models return a conservative fallback and never throw.
 */
export function getAudioModelCapabilities(modelId: string): GeminiAudioModelCapabilities {
  const normalizedModel = normalizeModelId(modelId);
  if (isKnownAudioModel(normalizedModel)) {
    return GEMINI_AUDIO_MODEL_CAPABILITIES[normalizedModel];
  }

  return {
    ...AUDIO_FALLBACK_CAPABILITIES,
    model: normalizedModel || modelId || "unknown",
  };
}

/**
 * Resolve music-model capabilities for known and unknown model IDs.
 * Unknown models return a conservative fallback and never throw.
 */
export function getMusicModelCapabilities(modelId: string): GeminiMusicModelCapabilities {
  const normalizedModel = normalizeModelId(modelId);
  if (isKnownMusicModel(normalizedModel)) {
    return GEMINI_MUSIC_MODEL_CAPABILITIES[normalizedModel];
  }

  return {
    ...MUSIC_FALLBACK_CAPABILITIES,
    model: normalizedModel || modelId || "unknown",
  };
}

/**
 * Resolve video-model capabilities for known and unknown model IDs.
 * Unknown models return a conservative fallback and never throw.
 */
export function getVideoModelCapabilities(modelId: string): GeminiVideoModelCapabilities {
  const normalizedModel = normalizeModelId(modelId);
  if (isKnownVideoModel(normalizedModel)) {
    return GEMINI_VIDEO_MODEL_CAPABILITIES[normalizedModel];
  }

  return {
    ...VIDEO_FALLBACK_CAPABILITIES,
    model: normalizedModel || modelId || "unknown",
  };
}

/**
 * Resolve live-model capabilities for known and unknown model IDs.
 * Unknown models return a conservative fallback and never throw.
 */
export function getLiveModelCapabilities(modelId: string): GeminiLiveModelCapabilities {
  const normalizedModel = normalizeModelId(modelId);
  if (isKnownLiveModel(normalizedModel)) {
    return GEMINI_LIVE_MODEL_CAPABILITIES[normalizedModel];
  }

  return {
    ...LIVE_FALLBACK_CAPABILITIES,
    model: normalizedModel || modelId || "unknown",
  };
}

/**
 * Returns model-filtered image option descriptors with per-model constraints merged in.
 */
export function getImageModelConfigOptions(
  modelId: string,
): Array<GeminiConfigOptionDescriptor<GeminiImageConfigOptionKey>> {
  const capabilities = getImageModelCapabilities(modelId);

  return capabilities.supportedOptions.map((optionKey) => {
    const baseDescriptor = GEMINI_IMAGE_CONFIG_OPTIONS[optionKey];

    if (optionKey === "aspectRatio") {
      return {
        ...baseDescriptor,
        allowedValues: capabilities.allowedAspectRatios,
      };
    }

    if (optionKey === "imageSize") {
      return {
        ...baseDescriptor,
        allowedValues: capabilities.allowedImageSizes,
      };
    }

    if (optionKey === "outputMimeType" && capabilities.allowedOutputMimeTypes.length > 0) {
      return {
        ...baseDescriptor,
        allowedValues: capabilities.allowedOutputMimeTypes,
      };
    }

    if (optionKey === "personGeneration") {
      return {
        ...baseDescriptor,
        allowedValues: capabilities.allowedPersonGenerationModes,
      };
    }

    if (optionKey === "numberOfImages") {
      return {
        ...baseDescriptor,
        min: capabilities.outputLimits.minImages,
        max: capabilities.outputLimits.maxImages,
        defaultValue: capabilities.outputLimits.defaultImages,
      };
    }

    return baseDescriptor;
  });
}

/**
 * Returns model-filtered text option descriptors.
 */
export function getTextModelConfigOptions(
  modelId: string,
): Array<GeminiConfigOptionDescriptor<GeminiTextConfigOptionKey>> {
  const capabilities = getTextModelCapabilities(modelId);
  return capabilities.supportedOptions.map((optionKey) => GEMINI_TEXT_CONFIG_OPTIONS[optionKey]);
}

/**
 * Returns model-filtered audio/TTS option descriptors with per-model
 * constraints merged in.
 */
export function getAudioModelConfigOptions(
  modelId: string,
): Array<GeminiConfigOptionDescriptor<GeminiAudioConfigOptionKey>> {
  const capabilities = getAudioModelCapabilities(modelId);

  return capabilities.supportedOptions.map((optionKey) => {
    const baseDescriptor = GEMINI_AUDIO_CONFIG_OPTIONS[optionKey];

    if (optionKey === "responseModalities") {
      return {
        ...baseDescriptor,
        allowedValues: capabilities.allowedResponseModalities,
      };
    }

    return baseDescriptor;
  });
}

/**
 * Returns model-filtered music option descriptors with per-model constraints
 * merged in.
 */
export function getMusicModelConfigOptions(
  modelId: string,
): Array<GeminiConfigOptionDescriptor<GeminiMusicConfigOptionKey>> {
  const capabilities = getMusicModelCapabilities(modelId);

  return capabilities.supportedOptions.map((optionKey) => {
    const baseDescriptor = GEMINI_MUSIC_CONFIG_OPTIONS[optionKey];

    if (optionKey === "responseModalities") {
      return {
        ...baseDescriptor,
        allowedValues: capabilities.allowedResponseModalities,
      };
    }

    return baseDescriptor;
  });
}

/**
 * Returns model-filtered video option descriptors with per-model constraints
 * merged in.
 */
export function getVideoModelConfigOptions(
  modelId: string,
): Array<GeminiConfigOptionDescriptor<GeminiVideoConfigOptionKey>> {
  const capabilities = getVideoModelCapabilities(modelId);

  return capabilities.supportedOptions.map((optionKey) => {
    const baseDescriptor = GEMINI_VIDEO_CONFIG_OPTIONS[optionKey];

    if (optionKey === "aspectRatio") {
      return {
        ...baseDescriptor,
        allowedValues: capabilities.allowedAspectRatios,
      };
    }

    if (optionKey === "resolution") {
      return {
        ...baseDescriptor,
        allowedValues: capabilities.allowedResolutions,
      };
    }

    if (optionKey === "durationSeconds") {
      return {
        ...baseDescriptor,
        min: Math.min(...capabilities.allowedDurations),
        max: Math.max(...capabilities.allowedDurations),
        defaultValue: capabilities.outputLimits.defaultDuration ?? baseDescriptor.defaultValue,
      };
    }

    if (optionKey === "fps") {
      return {
        ...baseDescriptor,
        defaultValue: capabilities.outputLimits.defaultFps ?? baseDescriptor.defaultValue,
      };
    }

    if (optionKey === "numberOfVideos") {
      return {
        ...baseDescriptor,
        min: capabilities.outputLimits.minVideos,
        max: capabilities.outputLimits.maxVideos,
        defaultValue: capabilities.outputLimits.defaultVideos,
      };
    }

    if (optionKey === "personGeneration") {
      return {
        ...baseDescriptor,
        allowedValues: capabilities.allowedPersonGenerationModes,
      };
    }

    return baseDescriptor;
  });
}

/**
 * Returns model-filtered live option descriptors with per-model constraints merged in.
 */
export function getLiveModelConfigOptions(
  modelId: string,
): Array<GeminiConfigOptionDescriptor<GeminiLiveConfigOptionKey>> {
  const capabilities = getLiveModelCapabilities(modelId);

  return capabilities.supportedOptions.map((optionKey) => {
    const baseDescriptor = GEMINI_LIVE_CONFIG_OPTIONS[optionKey];

    if (optionKey === "thinkingBudget") {
      return {
        ...baseDescriptor,
        min: capabilities.limits.minThinkingBudget ?? baseDescriptor.min,
        max: capabilities.limits.maxThinkingBudget ?? baseDescriptor.max,
      };
    }

    return baseDescriptor;
  });
}

/**
 * Resolve image attachment limits by model.
 */
export function getImageModelAttachmentLimits(modelId: string): GeminiImageAttachmentLimits {
  return getImageModelCapabilities(modelId).attachmentLimits;
}

/**
 * Resolve text attachment limits by model.
 */
export function getTextModelAttachmentLimits(modelId: string): GeminiTextAttachmentLimits {
  return getTextModelCapabilities(modelId).attachmentLimits;
}

/**
 * Resolve audio/TTS speaker limits by model.
 */
export function getAudioModelSpeakerLimits(modelId: string): GeminiAudioSpeakerLimits {
  return getAudioModelCapabilities(modelId).speakerLimits;
}

/**
 * Resolve music attachment/input limits by model.
 */
export function getMusicModelAttachmentLimits(modelId: string): GeminiMusicAttachmentLimits {
  return getMusicModelCapabilities(modelId).attachmentLimits;
}

/**
 * Resolve video attachment/input limits by model.
 */
export function getVideoModelAttachmentLimits(modelId: string): GeminiVideoAttachmentLimits {
  return getVideoModelCapabilities(modelId).attachmentLimits;
}

/**
 * Resolve live feature-flag support by model.
 */
export function getLiveModelFeatureFlags(modelId: string): GeminiLiveModelCapabilities["featureFlags"] {
  return getLiveModelCapabilities(modelId).featureFlags;
}

/**
 * Internal type-level mappings that keep descriptor keys aligned with
 * service option contracts.
 */
type _ImageOptionContract = Pick<GenerateImageOptions, GeminiImageConfigOptionKey>;
type _TextOptionContract = Pick<GenerateTextOptions, GeminiTextConfigOptionKey>;
type _AudioOptionContract = Pick<GenerateAudioOptions, GeminiAudioConfigOptionKey>;
type _MusicOptionContract = Pick<GenerateMusicOptions, GeminiMusicConfigOptionKey>;
type _VideoOptionContract = Pick<GenerateVideoOptions, GeminiVideoConfigOptionKey>;
type _LiveOptionContract = Pick<LiveChatSessionOptions, GeminiLiveConfigOptionKey>;

void (0 as unknown as _ImageOptionContract);
void (0 as unknown as _TextOptionContract);
void (0 as unknown as _AudioOptionContract);
void (0 as unknown as _MusicOptionContract);
void (0 as unknown as _VideoOptionContract);
void (0 as unknown as _LiveOptionContract);
