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
