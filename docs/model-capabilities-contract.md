# Model Capabilities And Config Option Contract

This document defines the consumer-facing metadata contract exported by
`gemini-ai-lib` for model-aware UI and request shaping.

## Purpose

- Provide typed, reusable model capability metadata to package consumers.
- Keep app-specific policy decisions in consuming applications.
- Avoid hardcoding model limits repeatedly across app repos.

## Exported Catalogs

- `GEMINI_IMAGE_MODEL_CAPABILITIES`
- `GEMINI_TEXT_MODEL_CAPABILITIES`
- `GEMINI_LIVE_MODEL_CAPABILITIES`
- `GEMINI_IMAGE_CONFIG_OPTIONS`
- `GEMINI_TEXT_CONFIG_OPTIONS`
- `GEMINI_LIVE_CONFIG_OPTIONS`

## Exported Helpers

- `getImageModelCapabilities(modelId)`
- `getTextModelCapabilities(modelId)`
- `getLiveModelCapabilities(modelId)`
- `getImageModelConfigOptions(modelId)`
- `getTextModelConfigOptions(modelId)`
- `getLiveModelConfigOptions(modelId)`
- `getImageModelAttachmentLimits(modelId)`
- `getTextModelAttachmentLimits(modelId)`
- `getLiveModelFeatureFlags(modelId)`

## Fallback Behavior

Unknown model IDs return a safe non-throwing fallback object:

- `isKnownModel: false`
- `source: "fallback"`
- conservative output limits for risky dimensions
- attachment limits as `null` when not safely inferable

Consumers should treat fallback values as guidance and can still enforce stricter
app-level defaults.

## Ownership Boundary

`gemini-ai-lib` owns reusable model metadata and helper contracts.
Consuming apps own:

- final validation rules
- UX constraints and disabled states
- feature-level formulas (for example attachment budgeting from graph context)
- user-facing error copy and remediation
