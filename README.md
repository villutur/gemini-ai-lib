# gemini-ai-lib

Reusable TypeScript wrappers around the Gemini SDK for applications, tools,
and libraries that want a cleaner typed integration surface.

## Purpose

- Keep reusable Gemini SDK wiring out of individual projects
- Provide small, composable services for text, chat, image, music, audio,
  video, and live workflows
- Let consuming projects own app-specific validation, model allowlists, route
  contracts, and user-facing error handling

## Services

- `GeminiBaseService`: shared client setup, API key resolution, and tool
  configuration
- `GeminiTextService`: one-shot text generation helpers
- `GeminiChatService`: persistent multi-turn chat wrapper
- `GeminiAudioService`: text-to-speech generation helpers
- `GeminiMusicService`: non-realtime Lyria music generation helpers
- `GeminiImageService`: image generation and SVG generation helpers
- `GeminiVideoService`: Veo video generation and operation polling helpers
- `GeminiLiveChatSession`: real-time live-session wrapper, currently client-side only

## Helpers, Catalogs, and Metadata Exports

- `createGeminiThinkingConfig(...)`: reusable low-level thinking-config helper
- `createGeminiThinkingConfigForModel(...)`: model-aware helper that keeps
  `thinkingLevel` and `thinkingBudget` aligned with the selected Gemini model
- `normalizeGeminiResponseMetadata(...)`: reusable response-metadata normalizer
  for latency, finish reason, response ids, and usage payloads
- `GeminiAttachmentHelper`: browser and server helpers for turning files and
  buffers into Gemini `Part` objects
- structured logging contracts and logger adapters for injecting app-owned
  sinks into Gemini request flows
- `GEMINI_TEXT_MODELS`: shared text-model list for consumer model pickers
- `GEMINI_TEXT_MODEL_DISPLAY_NAMES`: user-facing labels for known text models
- `GEMINI_AUDIO_MODELS`: shared audio/TTS model list for consumer model
  pickers
- `GEMINI_AUDIO_MODEL_DISPLAY_NAMES`: user-facing labels for known audio/TTS
  models
- `GEMINI_MUSIC_MODELS`: shared music-generation model list for consumer model
  pickers
- `GEMINI_MUSIC_MODEL_DISPLAY_NAMES`: user-facing labels for known music
  models
- `GEMINI_VIDEO_MODELS`: shared video-generation model list for consumer model
  pickers
- `GEMINI_VIDEO_MODEL_DISPLAY_NAMES`: user-facing labels for known video
  models
- `GEMINI_IMAGE_MODELS`: shared allowlist covering Gemini image models plus
  `imagen-4.0-generate-001`
- `GEMINI_LIVE_MODELS`: shared live-model list for real-time voice/video flows
- `GEMINI_LIVE_MODEL_DISPLAY_NAMES`: user-facing labels for known live models
- `GEMINI_IMAGE_MODEL_CAPABILITIES`: model-aware image limits and supported
  config options for dynamic UIs
- `GEMINI_TEXT_MODEL_CAPABILITIES`: model-aware text limits and supported
  config options for dynamic UIs
- `GEMINI_AUDIO_MODEL_CAPABILITIES`: model-aware audio/TTS limits and
  supported config options for dynamic UIs
- `GEMINI_MUSIC_MODEL_CAPABILITIES`: model-aware music limits and supported
  config options for dynamic UIs
- `GEMINI_VIDEO_MODEL_CAPABILITIES`: model-aware video limits and supported
  config options for dynamic UIs
- `GEMINI_LIVE_MODEL_CAPABILITIES`: model-aware live-session limits and
  supported config options for dynamic UIs
- model-aware image handling that keeps Gemini image-model requests on their
  native output path while still allowing explicit output format control for
  Imagen where the API supports it

## Installation

```bash
pnpm add @villutur/gemini-ai-lib
```

## Supported Models

The package exports model catalogs for the currently supported and curated
model IDs below.

### Text

- `gemini-2.5-flash-lite`
- `gemini-2.5-flash`
- `gemini-2.5-pro`
- `gemini-3-flash-preview`
- `gemini-3.1-flash-lite-preview`
- `gemini-3.1-pro-preview`

### Image

- `gemini-2.5-flash-image`
- `gemini-3.1-flash-image-preview`
- `gemini-3-pro-image-preview`
- `imagen-4.0-generate-001`

### Audio

- `gemini-2.5-flash-preview-tts`
- `gemini-2.5-pro-preview-tts`

### Music

- `lyria-3-clip-preview`
- `lyria-3-pro-preview`

### Video

- `veo-3.1-generate-preview`
- `veo-3.1-fast-generate-preview`

### Live

- `gemini-2.5-flash-native-audio-preview-12-2025`
- `gemini-2.5-flash-native-audio-preview-09-2025`

## Usage

Server-side usage is the default and preferred integration path.

`GeminiLiveChatSession` is the main exception right now: it currently depends
on browser APIs such as `navigator.mediaDevices`, `AudioContext`, and
`AudioWorkletNode`, so it only works in client-side runtime contexts.

```ts
import { GeminiTextService } from "@villutur/gemini-ai-lib";

const textService = new GeminiTextService({
  apiKey: process.env.GEMINI_API_KEY,
});

const response = await textService.generateTextString("Summarize the current rollout status in three bullets.", {
  model: "gemini-3-flash-preview",
  systemInstruction: "Answer like a pragmatic product engineer. Be concise and explicit.",
  temperature: 0.4,
});
```

Persistent text chat can layer on top of `GeminiChatService` while still
letting the consuming project own validation and request shaping.

```ts
import { createGeminiTextChatHistory, GeminiChatService } from "@villutur/gemini-ai-lib";

const chatService = new GeminiChatService({
  apiKey: process.env.GEMINI_API_KEY,
  model: "gemini-3-flash-preview",
  history: createGeminiTextChatHistory([
    {
      role: "user",
      text: "Give me the safest rollout order for Prompt Workbench v1.",
    },
    {
      role: "model",
      text: "Start with internal dogfooding, then expand to a small feature-flagged cohort.",
    },
  ]),
});

const text = await chatService.sendMessageString("Now add the top two risks and a rollback trigger.");
```

Projects can also inject their own structured logger adapter when they want
Gemini request lifecycle events to land in an app-owned sink.

```ts
import { GeminiTextService, type LoggerAdapter } from "@villutur/gemini-ai-lib";

const logger: LoggerAdapter = {
  log(event) {
    console.log(event.source, event.level, event.message, event.metadata);
  },
};

const textService = new GeminiTextService({
  apiKey: process.env.GEMINI_API_KEY,
  logger,
});
```

Projects that own model policy in their own codebase can also reuse the
library's
thinking-config and response-metadata helpers without giving up control of
route contracts or storage.

```ts
import {
  createGeminiThinkingConfigForModel,
  normalizeGeminiResponseMetadata,
  GeminiTextService,
} from "@villutur/gemini-ai-lib";

const service = new GeminiTextService({
  apiKey: process.env.GEMINI_API_KEY,
});

const result = await service.generateText("Compare the rollout risks in three bullets.", {
  model: "gemini-3.1-pro-preview",
  thinkingConfig: createGeminiThinkingConfigForModel("gemini-3.1-pro-preview", {
    includeThoughts: false,
  }),
});

const telemetry = normalizeGeminiResponseMetadata(result);
```

Consumers can also render text-model selectors directly from shared exports:

```ts
import { GEMINI_TEXT_MODELS, GEMINI_TEXT_MODEL_DISPLAY_NAMES } from "@villutur/gemini-ai-lib";

const options = GEMINI_TEXT_MODELS.map((model) => ({
  value: model,
  label: GEMINI_TEXT_MODEL_DISPLAY_NAMES[model],
}));
```

Audio/TTS model pickers can use the same pattern:

```ts
import { GEMINI_AUDIO_MODELS, getAudioModelDisplayName } from "@villutur/gemini-ai-lib";

const audioOptions = GEMINI_AUDIO_MODELS.map((model) => ({
  value: model,
  label: getAudioModelDisplayName(model),
}));
```

Music model pickers can use the same pattern:

```ts
import { GEMINI_MUSIC_MODELS, getMusicModelDisplayName } from "@villutur/gemini-ai-lib";

const musicOptions = GEMINI_MUSIC_MODELS.map((model) => ({
  value: model,
  label: getMusicModelDisplayName(model),
}));
```

Video model pickers can use the same pattern:

```ts
import { GEMINI_VIDEO_MODELS, getVideoModelDisplayName } from "@villutur/gemini-ai-lib";

const videoOptions = GEMINI_VIDEO_MODELS.map((model) => ({
  value: model,
  label: getVideoModelDisplayName(model),
}));
```

Live model pickers can use the same pattern:

```ts
import { GEMINI_LIVE_MODELS, getLiveModelDisplayName } from "@villutur/gemini-ai-lib";

const liveOptions = GEMINI_LIVE_MODELS.map((model) => ({
  value: model,
  label: getLiveModelDisplayName(model),
}));
```

Consumers that need model-aware config dialogs can build controls directly from
capability and option exports:

```ts
import { getImageModelCapabilities, getImageModelConfigOptions } from "@villutur/gemini-ai-lib";

const modelId = "imagen-4.0-generate-001";
const capabilities = getImageModelCapabilities(modelId);
const optionDescriptors = getImageModelConfigOptions(modelId);

// Example policy in consumer code:
// max attachment slots = model limit - attachments already reserved elsewhere
const reservedAttachmentSlots = 2;
const maxReferenceImages = capabilities.attachmentLimits.maxReferenceImages ?? 0;
const remainingAttachmentBudget = Math.max(0, maxReferenceImages - reservedAttachmentSlots);
```

Audio/TTS consumers can also drive their config controls from model-aware
capability exports:

```ts
import { getAudioModelCapabilities, getAudioModelConfigOptions } from "@villutur/gemini-ai-lib";

const audioModel = "gemini-2.5-flash-preview-tts";
const audioCapabilities = getAudioModelCapabilities(audioModel);
const audioOptionDescriptors = getAudioModelConfigOptions(audioModel);

const supportsDialogue = audioCapabilities.speakerLimits.supportsMultiSpeaker;
const maxSpeakers = audioCapabilities.speakerLimits.maxSpeakers ?? 1;
```

The current `@google/genai` SDK surface exposes `voiceName`,
`languageCode`, `responseModalities`, and `multiSpeakerVoiceConfig` for TTS
request shaping. The Gemini docs also mention controls such as speaking rate,
pitch, and volume gain, but those are not exported here until the SDK exposes
a stable typed contract for them.

Music consumers can drive Lyria config controls from model-aware capability
exports:

```ts
import { getMusicModelCapabilities, getMusicModelConfigOptions } from "@villutur/gemini-ai-lib";

const musicModel = "lyria-3-pro-preview";
const musicCapabilities = getMusicModelCapabilities(musicModel);
const musicOptionDescriptors = getMusicModelConfigOptions(musicModel);

const supportsImageGuidance = musicCapabilities.attachmentLimits.supportsImageInput;
const bestFor = musicCapabilities.outputLimits.bestFor;
```

Lyria music generation in v1 is intentionally based on the official stable
`generateContent(...)` flow. Richer controls such as BPM, intensity,
generate-lyrics, and vocal-type remain prompt-driven and are not part of the
typed runtime API yet.

Video consumers can also drive Veo controls from model-aware capability
exports:

```ts
import { getVideoModelCapabilities, getVideoModelConfigOptions } from "@villutur/gemini-ai-lib";

const videoModel = "veo-3.1-fast-generate-preview";
const videoCapabilities = getVideoModelCapabilities(videoModel);
const videoOptionDescriptors = getVideoModelConfigOptions(videoModel);

const maxReferenceImages = videoCapabilities.attachmentLimits.maxReferenceImages ?? 0;
const supportsVideoExtension = videoCapabilities.attachmentLimits.supportsVideoInput;
```

Video generation is long-running and operation-based. The video service
normalizes operation polling, while downloading generated files remains under
consumer control through the underlying SDK client.

The official Gemini video docs may describe more knobs over time, but this
library only exports video config metadata for the stable `@google/genai`
`1.46.0` contract plus explicitly typed `generateVideos(...)` config fields.

Live-session UIs can use the same capability pattern:

```ts
import { getLiveModelCapabilities, getLiveModelConfigOptions } from "@villutur/gemini-ai-lib";

const liveModel = "gemini-2.5-flash-native-audio-preview-12-2025";
const liveCapabilities = getLiveModelCapabilities(liveModel);
const liveOptions = getLiveModelConfigOptions(liveModel);
```

Live sessions are currently **client-side only** because they depend on
browser audio and media APIs:

```ts
import { GeminiLiveChatSession } from "@villutur/gemini-ai-lib";

const liveSession = new GeminiLiveChatSession({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  model: "gemini-2.5-flash-native-audio-preview-12-2025",
  systemInstruction: "You are a concise voice assistant.",
  voiceName: "Aoede",
  onSetupComplete() {
    console.log("Live session ready.");
  },
  onOutputTranscription(text, isFinal) {
    console.log("Model said:", text, isFinal ? "(final)" : "(partial)");
  },
  onError(error) {
    console.error("Live session error:", error);
  },
});

await liveSession.connect("Say hello and ask how you can help.");
```

Music generation uses Lyria through the stable `generateContent(...)` path:

```ts
import { GeminiMusicService } from "@villutur/gemini-ai-lib";

const musicService = new GeminiMusicService({
  apiKey: process.env.GEMINI_API_KEY,
});

const result = await musicService.generateMusicFromPrompt(
  "Create a 30-second cheerful acoustic folk track with guitar and harmonica.",
  {
    model: "lyria-3-clip-preview",
  },
);

const firstClip = result.audioBuffer;
const description = result.text;
```

You can also guide Lyria with an image reference:

```ts
import { readFile } from "node:fs/promises";
import { GeminiAttachmentHelper, GeminiMusicService } from "@villutur/gemini-ai-lib";

const coverArt = await readFile("./reference-cover.jpg");
const imagePart = GeminiAttachmentHelper.CreateFromBuffer(coverArt, "image/jpeg");

const musicService = new GeminiMusicService({
  apiKey: process.env.GEMINI_API_KEY,
});

const result = await musicService.generateMusicFromImage(
  imagePart,
  "Create warm cinematic music that matches the color and mood of the image.",
  {
    model: "lyria-3-pro-preview",
  },
);
```

Lyria RealTime is out of scope for this package surface today and is tracked in
`docs/future-work.md`.

For lightweight UI/model-picker usage without importing runtime services, you
can also import model catalogs directly from the subpath entry:

```ts
import {
  GEMINI_TEXT_MODELS,
  GEMINI_AUDIO_MODELS,
  GEMINI_MUSIC_MODELS,
  GEMINI_VIDEO_MODELS,
  GEMINI_IMAGE_MODELS,
  GEMINI_LIVE_MODELS,
  getAudioModelDisplayName,
  getMusicModelDisplayName,
  getVideoModelDisplayName,
  getTextModelDisplayName,
  getLiveModelDisplayName,
} from "@villutur/gemini-ai-lib/model-catalogs";
```

Capability metadata is also available from a dedicated subpath entry:

```ts
import {
  GEMINI_AUDIO_MODEL_CAPABILITIES,
  GEMINI_AUDIO_CONFIG_OPTIONS,
  GEMINI_MUSIC_MODEL_CAPABILITIES,
  GEMINI_MUSIC_CONFIG_OPTIONS,
  GEMINI_VIDEO_MODEL_CAPABILITIES,
  GEMINI_VIDEO_CONFIG_OPTIONS,
  GEMINI_IMAGE_MODEL_CAPABILITIES,
  GEMINI_IMAGE_CONFIG_OPTIONS,
  GEMINI_LIVE_MODEL_CAPABILITIES,
  GEMINI_LIVE_CONFIG_OPTIONS,
  GEMINI_TEXT_MODEL_CAPABILITIES,
  GEMINI_TEXT_CONFIG_OPTIONS,
  getAudioModelCapabilities,
  getAudioModelConfigOptions,
  getAudioModelSpeakerLimits,
  getMusicModelAttachmentLimits,
  getMusicModelCapabilities,
  getMusicModelConfigOptions,
  getVideoModelAttachmentLimits,
  getVideoModelCapabilities,
  getVideoModelConfigOptions,
  getLiveModelCapabilities,
  getLiveModelFeatureFlags,
  getImageModelAttachmentLimits,
  getTextModelAttachmentLimits,
  getTextModelCapabilities,
} from "@villutur/gemini-ai-lib/model-capabilities";
```

Image-capable projects can also keep their own policy layer while reusing the
shared image service and model list.

For Gemini image models, the Gemini API returns the model's native image
format. Do not assume `outputMimeType` is supported there. The library keeps
that behavior model-aware and only forwards explicit output-format controls to
Imagen-style routes where they are actually supported.

```ts
import { GEMINI_IMAGE_MODELS, GeminiImageService } from "@villutur/gemini-ai-lib";

const imageService = new GeminiImageService({
  apiKey: process.env.GEMINI_API_KEY,
});

const result = await imageService.generateImageFromPrompt("Create a clean geometric product logo.", {
  model: "gemini-3.1-flash-image-preview",
  aspectRatio: "1:1",
});
```

If you need explicit output-format control, use an Imagen-capable model:

```ts
const result = await imageService.generateImageFromPrompt("Create a clean geometric product logo.", {
  model: "imagen-4.0-generate-001",
  aspectRatio: "1:1",
  outputMimeType: "image/png",
});
```

Video generation follows a long-running-operation flow:

```ts
import { GeminiVideoService } from "@villutur/gemini-ai-lib";

const videoService = new GeminiVideoService({
  apiKey: process.env.GEMINI_API_KEY,
});

const result = await videoService.generateVideoFromPrompt("A cinematic drone shot over a snowy forest at sunrise.", {
  model: "veo-3.1-fast-generate-preview",
  aspectRatio: "16:9",
  resolution: "1080p",
  durationSeconds: 8,
  generateAudio: true,
});

const firstVideo = result.generatedVideos[0]?.video;
if (firstVideo) {
  await videoService.getClient().files.download({
    file: firstVideo,
    downloadPath: "./veo-output.mp4",
  });
}
```

If you want to build multimodal request parts yourself, `GeminiAttachmentHelper`
can convert buffers or files into Gemini `Part` objects:

```ts
import { readFile } from "node:fs/promises";
import { GeminiAttachmentHelper, GeminiImageService } from "@villutur/gemini-ai-lib";

const imageBuffer = await readFile("./reference.png");
const referencePart = GeminiAttachmentHelper.CreateFromBuffer(imageBuffer, "image/png");

const imageService = new GeminiImageService({
  apiKey: process.env.GEMINI_API_KEY,
});

const result = await imageService.generateImage(
  [{ text: "Create a product-shot style render that matches the reference image lighting." }, referencePart],
  {
    model: "gemini-3.1-flash-image-preview",
    aspectRatio: "1:1",
  },
);
```

## Environment Guidance

- Prefer `GEMINI_API_KEY` for server-side usage.
- `NEXT_PUBLIC_GEMINI_API_KEY` is treated as a deliberate browser-oriented
  fallback, not the default integration path.
- Projects should not depend on a public Gemini key unless the user explicitly
  wants a browser-side integration and accepts that tradeoff.

The base service now resolves keys in this order:

1. explicit `apiKey` passed in code
2. `GEMINI_API_KEY`
3. `NEXT_PUBLIC_GEMINI_API_KEY`

When examples or app-level model catalogs need refreshing, use Google's
official Gemini model index as the source of truth:

- https://ai.google.dev/gemini-api/docs/models.md.txt

## Public Contract

- Import from the package name, not from `src/` or sibling repo paths.
- Keep generic Gemini SDK concerns here.
- This library exports model limits and config-option metadata; consuming
  projects
  still own final UI policy, validation, and product-specific constraints.
- Keep reusable history shaping and portable chat-session helpers here when
  they are app-agnostic.
- Keep logger contracts and lifecycle emission generic here, while letting the
  consuming project own storage, retention, and log-history UI.
- Keep app-specific model allowlists, request validation, transport contracts,
  and user-facing error mapping in the consuming project.

## Development

Install dependencies:

```bash
pnpm install
```

Build the package:

```bash
pnpm build
```

Run watch mode:

```bash
pnpm dev
```

Run typecheck only:

```bash
pnpm typecheck
```

## Release Workflow

This package uses a repo-safe manual release flow:

```bash
pnpm release:bump --patch
pnpm release:publish
```

Full release instructions, rollback guidance, and safety checks are documented
in [docs/release.md](docs/release.md).

## Repository Notes

- Public exports are defined in `src/index.ts`.
- Package entrypoints and build outputs are defined in `package.json`.
- The library currently ships both ESM and CJS output from `dist/`.
- Deferred library ideas and transport follow-ups live in `docs/future-work.md`.
- Repository-specific contributor guidance lives in `AGENTS.md`.
