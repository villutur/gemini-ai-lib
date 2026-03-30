# Model Capabilities And Config Option Contract

This document defines the consumer-facing metadata contract exported by
`gemini-ai-lib` for model-aware UI and request shaping across text, embedding,
image, audio, music, video, and live surfaces.

## Purpose

- Provide typed, reusable model capability metadata to package consumers.
- Keep app-specific policy decisions in consuming applications.
- Avoid hardcoding model limits repeatedly across app repos.

## Exported Catalogs

- `GEMINI_IMAGE_MODEL_CAPABILITIES`
- `GEMINI_TEXT_MODEL_CAPABILITIES`
- `GEMINI_EMBEDDING_MODEL_CAPABILITIES`
- `GEMINI_AUDIO_MODEL_CAPABILITIES`
- `GEMINI_AUDIO_VOICES`
- `GEMINI_AUDIO_VOICE_CATALOG`
- `GEMINI_MUSIC_MODEL_CAPABILITIES`
- `GEMINI_VIDEO_MODEL_CAPABILITIES`
- `GEMINI_LIVE_MODEL_CAPABILITIES`
- `GEMINI_IMAGE_CONFIG_OPTIONS`
- `GEMINI_TEXT_CONFIG_OPTIONS`
- `GEMINI_EMBEDDING_CONFIG_OPTIONS`
- `GEMINI_AUDIO_CONFIG_OPTIONS`
- `GEMINI_MUSIC_CONFIG_OPTIONS`
- `GEMINI_VIDEO_CONFIG_OPTIONS`
- `GEMINI_LIVE_CONFIG_OPTIONS`

## Exported Helpers

- `getImageModelCapabilities(modelId)`
- `getTextModelCapabilities(modelId)`
- `getEmbeddingModelCapabilities(modelId)`
- `getAudioModelCapabilities(modelId)`
- `getAudioVoiceNames()`
- `getAudioVoiceOptions()`
- `getMusicModelCapabilities(modelId)`
- `getVideoModelCapabilities(modelId)`
- `getLiveModelCapabilities(modelId)`
- `getImageModelConfigOptions(modelId)`
- `getTextModelConfigOptions(modelId)`
- `getEmbeddingModelConfigOptions(modelId)`
- `getAudioModelConfigOptions(modelId)`
- `getMusicModelConfigOptions(modelId)`
- `getVideoModelConfigOptions(modelId)`
- `getLiveModelConfigOptions(modelId)`
- `getImageModelAttachmentLimits(modelId)`
- `getTextModelAttachmentLimits(modelId)`
- `getEmbeddingModelInputLimits(modelId)`
- `getAudioModelSpeakerLimits(modelId)`
- `getMusicModelAttachmentLimits(modelId)`
- `getVideoModelAttachmentLimits(modelId)`
- `getLiveModelFeatureFlags(modelId)`

## Shared Descriptor Shape

All config catalogs use the shared `GeminiConfigOptionDescriptor<TKey>` shape.

Important fields:

- `key`: stable option key matching a service option contract
- `label`: short user-facing label
- `description`: human-readable explanation
- `kind`: primitive UI control category
- `defaultValue`: recommended default
- `allowedValues`: enum-like values when applicable
- `min`, `max`, `step`: numeric control hints
- `note`: SDK/runtime caveats and model-specific behavior

Consumers can use these descriptors to build generic model-aware config UIs
without hardcoding per-model control metadata.

For image models specifically, this metadata is consumer-facing guidance rather
than a verbatim transport mirror. The exported image capability layer is
docs-first and intentionally conservative when the local image docs describe
broader model behavior than the currently typed helper surface can safely
express.

## Capability Contract Families

Each model family exports a typed capability object plus a family-specific
limits structure.

- Image:
  - `GeminiImageModelCapabilities`
  - `GeminiImageAttachmentLimits`
  - `GeminiImageOutputLimits`
- Text:
  - `GeminiTextModelCapabilities`
  - `GeminiTextAttachmentLimits`
- Embeddings:
  - `GeminiEmbeddingModelCapabilities`
  - `GeminiEmbeddingInputLimits`
  - `GeminiEmbeddingOutputLimits`
- Audio/TTS:
  - `GeminiAudioModelCapabilities`
  - `GeminiAudioInputLimits`
  - `GeminiAudioSpeakerLimits`
  - `GeminiAudioVoice`
- Music:
  - `GeminiMusicModelCapabilities`
  - `GeminiMusicAttachmentLimits`
  - `GeminiMusicOutputLimits`
- Video:
  - `GeminiVideoModelCapabilities`
  - `GeminiVideoAttachmentLimits`
  - `GeminiVideoOutputLimits`
- Live:
  - `GeminiLiveModelCapabilities`
  - `GeminiLiveModelLimits`

Each capability object includes at least:

- `model`
- `isKnownModel`
- `source`
- `supportedOptions`
- `unsupportedOptions`

Family-specific fields then describe attachment/input support, output limits,
allowed enum values, and live feature flags as appropriate.

For audio/TTS specifically:

- `GEMINI_AUDIO_CONFIG_OPTIONS.voiceName.allowedValues` exposes the curated
  exported voice-name list
- `GEMINI_LIVE_CONFIG_OPTIONS.voiceName.allowedValues` reuses the same curated
  exported voice-name list
- `GEMINI_AUDIO_VOICE_CATALOG` provides richer metadata for voice pickers
- `GeminiAudioModelCapabilities` includes `supportedVoiceNames` and
  `defaultVoiceName`

The voice catalog is exported as consumer guidance metadata for UI building and
defaults. It is not a strict runtime restriction on `GenerateAudioOptions.voiceName`.

## Type-Level Safety

The contract is kept aligned with runtime service option types through internal
compile-time mappings in `src/model-capabilities.ts`.

Each exported option-key union is mapped back to its service options type:

- `GeminiImageConfigOptionKey` -> `GenerateImageOptions`
- `GeminiTextConfigOptionKey` -> `GenerateTextOptions`
- `GeminiEmbeddingConfigOptionKey` -> `GenerateEmbeddingOptions`
- `GeminiAudioConfigOptionKey` -> `GenerateAudioOptions`
- `GeminiMusicConfigOptionKey` -> `GenerateMusicOptions`
- `GeminiVideoConfigOptionKey` -> `GenerateVideoOptions`
- `GeminiLiveConfigOptionKey` -> `LiveChatSessionOptions`

This means metadata keys cannot drift from the service option contracts without
failing typecheck.

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
Consuming projects own:

- final validation rules
- UX constraints and disabled states
- feature-level formulas (for example attachment budgeting from graph context)
- user-facing error copy and remediation

For example:

- `gemini-ai-lib` can say a music model supports image-guided generation and
  returns audio/text.
- the consuming project decides whether to expose that as a simple toggle,
  advanced panel, or hidden capability in its product UI.

For image generation, there is an additional split to keep in mind:

- raw wrappers such as `GeminiImageService.generateContent(...)` stay aligned
  with the current SDK transport shape
- exported image capabilities and option descriptors remain the
  consumer-facing contract that apps should use for model-aware UI and helper
  defaults

That means the raw wrapper may accept a wider low-level request surface than
the higher-level capability helpers advertise, while the capability helpers
should still avoid claiming support for options the Gemini API marks as
unsupported in the current SDK contract.
