import { ThinkingLevel } from "@google/genai";
import type { GenerateContentConfig, GenerateContentResponse } from "@google/genai";

export interface GeminiNormalizedResponseUsage {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
  thoughtsTokenCount?: number;
  toolUsePromptTokenCount?: number;
  cachedContentTokenCount?: number;
}

export interface GeminiNormalizedResponseMetadata {
  responseId?: string;
  modelVersion?: string;
  finishReason?: string;
  usage?: GeminiNormalizedResponseUsage;
}

export type GeminiThinkingProfileLevel = "minimal" | "low" | "medium" | "high";
export interface GeminiThinkingConfigInput {
  level?: GeminiThinkingProfileLevel;
  budget?: number;
  includeThoughts?: boolean;
}

export interface GeminiThinkingLevelModelSupport {
  parameter: "thinkingLevel";
  supportedLevels: readonly GeminiThinkingProfileLevel[];
  defaultBehavior: "dynamic";
}

export interface GeminiThinkingBudgetModelSupport {
  parameter: "thinkingBudget";
  minBudget: number;
  maxBudget: number;
  defaultBehavior: "dynamic" | "fixed";
  defaultBudget?: number;
}

export type GeminiThinkingModelSupport = GeminiThinkingLevelModelSupport | GeminiThinkingBudgetModelSupport;

const GEMINI_3_FLASH_THINKING_SUPPORT: GeminiThinkingLevelModelSupport = {
  parameter: "thinkingLevel",
  supportedLevels: ["minimal", "low", "medium", "high"],
  defaultBehavior: "dynamic",
};

const GEMINI_3_PRO_THINKING_SUPPORT: GeminiThinkingLevelModelSupport = {
  parameter: "thinkingLevel",
  supportedLevels: ["low", "high"],
  defaultBehavior: "dynamic",
};

const GEMINI_2_5_PRO_THINKING_SUPPORT: GeminiThinkingBudgetModelSupport = {
  parameter: "thinkingBudget",
  minBudget: 128,
  maxBudget: 32_768,
  defaultBehavior: "dynamic",
};

const GEMINI_2_5_FLASH_THINKING_SUPPORT: GeminiThinkingBudgetModelSupport = {
  parameter: "thinkingBudget",
  minBudget: 0,
  maxBudget: 24_576,
  defaultBehavior: "dynamic",
};

const GEMINI_2_5_FLASH_LITE_THINKING_SUPPORT: GeminiThinkingBudgetModelSupport = {
  parameter: "thinkingBudget",
  minBudget: 512,
  maxBudget: 24_576,
  defaultBehavior: "fixed",
  defaultBudget: 1_024,
};

const GEMINI_MODEL_THINKING_SUPPORT: Readonly<Record<string, GeminiThinkingModelSupport>> = {
  "gemini-3-flash-preview": GEMINI_3_FLASH_THINKING_SUPPORT,
  // The thinking guide recommends `thinkingLevel` for Gemini 3 models and onward.
  // Gemini 3.1 Flash-Lite also has an official model-page example using `thinking_level="high"`.
  "gemini-3.1-flash-lite-preview": GEMINI_3_FLASH_THINKING_SUPPORT,
  "gemini-3.1-pro-preview": GEMINI_3_PRO_THINKING_SUPPORT,
  "gemini-2.5-flash": GEMINI_2_5_FLASH_THINKING_SUPPORT,
  "gemini-2.5-pro": GEMINI_2_5_PRO_THINKING_SUPPORT,
  "gemini-2.5-flash-lite": GEMINI_2_5_FLASH_LITE_THINKING_SUPPORT,
  // The thinking guide explicitly lists the 09-2025 native-audio preview.
  "gemini-2.5-flash-native-audio-preview-09-2025": GEMINI_2_5_FLASH_THINKING_SUPPORT,
  // The workspace currently defaults to the 12-2025 native-audio preview in live flows.
  "gemini-2.5-flash-native-audio-preview-12-2025": GEMINI_2_5_FLASH_THINKING_SUPPORT,
};

function sanitizeNonNegativeNumber(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return undefined;
  }

  return Math.round(value);
}

function mapThinkingLevel(level: GeminiThinkingProfileLevel): ThinkingLevel {
  switch (level) {
    case "minimal":
      return ThinkingLevel.MINIMAL;
    case "low":
      return ThinkingLevel.LOW;
    case "high":
      return ThinkingLevel.HIGH;
    default:
      return ThinkingLevel.MEDIUM;
  }
}

function sanitizeThinkingBudget(value: unknown, minBudget: number, maxBudget: number) {
  const budget = sanitizeNonNegativeNumber(value);

  if (budget === undefined) {
    return undefined;
  }

  return Math.min(maxBudget, Math.max(minBudget, budget));
}

export function getGeminiThinkingSupportForModel(
  model: string | null | undefined,
): GeminiThinkingModelSupport | undefined {
  if (typeof model !== "string") {
    return undefined;
  }

  const normalizedModel = model.trim().toLowerCase();

  if (!normalizedModel) {
    return undefined;
  }

  return GEMINI_MODEL_THINKING_SUPPORT[normalizedModel];
}

export function createGeminiThinkingConfig(
  input?: GeminiThinkingConfigInput,
): GenerateContentConfig["thinkingConfig"] | undefined {
  if (!input) {
    return undefined;
  }

  const config: NonNullable<GenerateContentConfig["thinkingConfig"]> = {};

  if (typeof input.includeThoughts === "boolean") {
    config.includeThoughts = input.includeThoughts;
  }

  if (typeof input.level === "string") {
    config.thinkingLevel = mapThinkingLevel(input.level);
  }

  if (typeof input.budget === "number" && Number.isFinite(input.budget)) {
    config.thinkingBudget = Math.round(input.budget);
  }

  return Object.keys(config).length > 0 ? config : undefined;
}

export function createGeminiThinkingConfigForModel(
  model: string | null | undefined,
  input?: GeminiThinkingConfigInput,
): GenerateContentConfig["thinkingConfig"] | undefined {
  if (!input) {
    return undefined;
  }

  const config: NonNullable<GenerateContentConfig["thinkingConfig"]> = {};
  const modelSupport = getGeminiThinkingSupportForModel(model);

  if (typeof input.includeThoughts === "boolean") {
    config.includeThoughts = input.includeThoughts;
  }

  if (!modelSupport) {
    return Object.keys(config).length > 0 ? config : undefined;
  }

  if (modelSupport.parameter === "thinkingLevel") {
    if (typeof input.level === "string" && modelSupport.supportedLevels.includes(input.level)) {
      config.thinkingLevel = mapThinkingLevel(input.level);
    }
  } else {
    const budget = sanitizeThinkingBudget(input.budget, modelSupport.minBudget, modelSupport.maxBudget);

    if (budget !== undefined) {
      config.thinkingBudget = budget;
    }
  }

  return Object.keys(config).length > 0 ? config : undefined;
}

export function normalizeGeminiResponseMetadata(
  response: GenerateContentResponse | undefined | null,
): GeminiNormalizedResponseMetadata {
  if (!response) {
    return {};
  }

  const firstCandidate = Array.isArray(response.candidates) ? response.candidates[0] : undefined;
  const usage = response.usageMetadata;
  const normalizedUsage: GeminiNormalizedResponseUsage = {
    promptTokenCount: sanitizeNonNegativeNumber(usage?.promptTokenCount),
    candidatesTokenCount: sanitizeNonNegativeNumber(usage?.candidatesTokenCount),
    totalTokenCount: sanitizeNonNegativeNumber(usage?.totalTokenCount),
    thoughtsTokenCount: sanitizeNonNegativeNumber(usage?.thoughtsTokenCount),
    toolUsePromptTokenCount: sanitizeNonNegativeNumber(usage?.toolUsePromptTokenCount),
    cachedContentTokenCount: sanitizeNonNegativeNumber(usage?.cachedContentTokenCount),
  };

  return {
    responseId: typeof response.responseId === "string" ? response.responseId : undefined,
    modelVersion: typeof response.modelVersion === "string" ? response.modelVersion : undefined,
    finishReason:
      typeof firstCandidate?.finishReason === "string"
        ? firstCandidate.finishReason
        : firstCandidate?.finishReason !== undefined
          ? String(firstCandidate.finishReason)
          : undefined,
    usage: Object.values(normalizedUsage).some((value) => value !== undefined) ? normalizedUsage : undefined,
  };
}
