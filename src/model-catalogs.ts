/**
 * Shared list of image-capable Gemini models for consumer model pickers.
 */
export const GEMINI_IMAGE_MODELS = [
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image-preview",
  "gemini-3-pro-image-preview",
  "imagen-4.0-generate-001",
] as const;

export type KnownImageGenerationModel = (typeof GEMINI_IMAGE_MODELS)[number];

/**
 * Shared list of text-oriented Gemini models for consumer model pickers.
 */
export const GEMINI_TEXT_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview",
  "gemini-3.1-pro-preview",
] as const;

export type KnownTextGenerationModel = (typeof GEMINI_TEXT_MODELS)[number];

/**
 * Shared list of audio/TTS Gemini models for consumer model pickers.
 */
export const GEMINI_AUDIO_MODELS = ["gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts"] as const;

export type KnownAudioGenerationModel = (typeof GEMINI_AUDIO_MODELS)[number];

/**
 * Shared list of music-generation Gemini models for consumer model pickers.
 */
export const GEMINI_MUSIC_MODELS = ["lyria-3-clip-preview", "lyria-3-pro-preview"] as const;

export type KnownMusicGenerationModel = (typeof GEMINI_MUSIC_MODELS)[number];

/**
 * Shared list of video-generation Gemini models for consumer model pickers.
 */
export const GEMINI_VIDEO_MODELS = ["veo-3.1-generate-preview", "veo-3.1-fast-generate-preview"] as const;

export type KnownVideoGenerationModel = (typeof GEMINI_VIDEO_MODELS)[number];

/**
 * Shared list of live-session Gemini models for real-time voice/video flows.
 */
export const GEMINI_LIVE_MODELS = [
  "gemini-2.5-flash-native-audio-preview-12-2025",
  "gemini-2.5-flash-native-audio-preview-09-2025",
] as const;

export type KnownLiveGenerationModel = (typeof GEMINI_LIVE_MODELS)[number];

/**
 * User-facing labels for known image models.
 */
export const GEMINI_IMAGE_MODEL_DISPLAY_NAMES: Record<KnownImageGenerationModel, string> = {
  "gemini-2.5-flash-image": "Gemini 2.5 Flash Image",
  "gemini-3.1-flash-image-preview": "Gemini 3.1 Flash Image Preview",
  "gemini-3-pro-image-preview": "Gemini 3 Pro Image Preview",
  "imagen-4.0-generate-001": "Imagen 4.0 Generate",
};

/**
 * User-facing labels for known text models.
 */
export const GEMINI_TEXT_MODEL_DISPLAY_NAMES: Record<KnownTextGenerationModel, string> = {
  "gemini-2.5-flash-lite": "Gemini 2.5 Flash Lite",
  "gemini-2.5-flash": "Gemini 2.5 Flash",
  "gemini-2.5-pro": "Gemini 2.5 Pro",
  "gemini-3-flash-preview": "Gemini 3 Flash Preview",
  "gemini-3.1-flash-lite-preview": "Gemini 3.1 Flash Lite Preview",
  "gemini-3.1-pro-preview": "Gemini 3.1 Pro Preview",
};

/**
 * User-facing labels for known audio/TTS models.
 */
export const GEMINI_AUDIO_MODEL_DISPLAY_NAMES: Record<KnownAudioGenerationModel, string> = {
  "gemini-2.5-flash-preview-tts": "Gemini 2.5 Flash Preview TTS",
  "gemini-2.5-pro-preview-tts": "Gemini 2.5 Pro Preview TTS",
};

/**
 * User-facing labels for known music-generation models.
 */
export const GEMINI_MUSIC_MODEL_DISPLAY_NAMES: Record<KnownMusicGenerationModel, string> = {
  "lyria-3-clip-preview": "Lyria 3 Clip Preview",
  "lyria-3-pro-preview": "Lyria 3 Pro Preview",
};

/**
 * User-facing labels for known video-generation models.
 */
export const GEMINI_VIDEO_MODEL_DISPLAY_NAMES: Record<KnownVideoGenerationModel, string> = {
  "veo-3.1-generate-preview": "Veo 3.1 Generate Preview",
  "veo-3.1-fast-generate-preview": "Veo 3.1 Fast Generate Preview",
};

/**
 * User-facing labels for known live models.
 */
export const GEMINI_LIVE_MODEL_DISPLAY_NAMES: Record<KnownLiveGenerationModel, string> = {
  "gemini-2.5-flash-native-audio-preview-12-2025": "Gemini 2.5 Flash Native Audio (12-2025)",
  "gemini-2.5-flash-native-audio-preview-09-2025": "Gemini 2.5 Flash Native Audio (09-2025)",
};

/**
 * Convert a model id to a user-facing display label.
 * Unknown models fall back to the raw model id so consumer UIs remain robust
 * when custom or future model ids are used.
 */
export function getImageModelDisplayName(model: string): string {
  return GEMINI_IMAGE_MODEL_DISPLAY_NAMES[model as KnownImageGenerationModel] ?? model;
}

/**
 * Convert a model id to a user-facing display label.
 * Unknown models fall back to the raw model id so consumer UIs remain robust
 * when custom or future model ids are used.
 */
export function getTextModelDisplayName(model: string): string {
  return GEMINI_TEXT_MODEL_DISPLAY_NAMES[model as KnownTextGenerationModel] ?? model;
}

/**
 * Convert a model id to a user-facing display label.
 * Unknown models fall back to the raw model id so consumer UIs remain robust
 * when custom or future model ids are used.
 */
export function getAudioModelDisplayName(model: string): string {
  return GEMINI_AUDIO_MODEL_DISPLAY_NAMES[model as KnownAudioGenerationModel] ?? model;
}

/**
 * Convert a model id to a user-facing display label.
 * Unknown models fall back to the raw model id so consumer UIs remain robust
 * when custom or future model ids are used.
 */
export function getMusicModelDisplayName(model: string): string {
  return GEMINI_MUSIC_MODEL_DISPLAY_NAMES[model as KnownMusicGenerationModel] ?? model;
}

/**
 * Convert a model id to a user-facing display label.
 * Unknown models fall back to the raw model id so consumer UIs remain robust
 * when custom or future model ids are used.
 */
export function getVideoModelDisplayName(model: string): string {
  return GEMINI_VIDEO_MODEL_DISPLAY_NAMES[model as KnownVideoGenerationModel] ?? model;
}

/**
 * Convert a model id to a user-facing display label.
 * Unknown models fall back to the raw model id so consumer UIs remain robust
 * when custom or future model ids are used.
 */
export function getLiveModelDisplayName(model: string): string {
  return GEMINI_LIVE_MODEL_DISPLAY_NAMES[model as KnownLiveGenerationModel] ?? model;
}
