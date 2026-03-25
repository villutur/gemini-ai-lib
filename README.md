# gemini-ai-lib

Shared TypeScript wrappers around the Gemini SDK for use across the `vt`
workspace.

Within the workspace, the actively developed repositories are `vt-playground`,
`vt-design-system`, `vt-asset-studio`, and `gemini-ai-lib`.

## Purpose

- Keep reusable Gemini SDK wiring out of individual apps
- Provide small, composable services for text, chat, image, audio, and live
  workflows
- Let consuming apps own app-specific validation, model allowlists, route
  contracts, and user-facing error handling

## Current Services

- `GeminiBaseService`: shared client setup, API key resolution, and tool
  configuration
- `GeminiTextService`: one-shot text generation helpers
- `GeminiChatService`: persistent multi-turn chat wrapper
- `createGeminiThinkingConfig(...)`: reusable low-level thinking-config helper
- `createGeminiThinkingConfigForModel(...)`: model-aware helper that keeps
  `thinkingLevel` and `thinkingBudget` aligned with the selected Gemini model
- `normalizeGeminiResponseMetadata(...)`: reusable response-metadata normalizer
  for latency, finish reason, response ids, and usage payloads
- `GeminiAttachmentHelper`: browser and server helpers for turning files and
  buffers into Gemini `Part` objects
- structured logging contracts and logger adapters for injecting app-owned
  sinks into Gemini request flows
- `GeminiAudioService`, `GeminiImageService`, and `GeminiLiveService` for the
  richer media and live surfaces already explored in the workspace
- `GEMINI_TEXT_MODELS`: shared text-model list for consumer model pickers
- `GEMINI_TEXT_MODEL_DISPLAY_NAMES`: user-facing labels for known text models
- `GEMINI_IMAGE_MODELS`: shared allowlist covering Gemini image models plus
  `imagen-4.0-generate-001`
- model-aware image handling that keeps Gemini image-model requests on their
  native output path while still allowing explicit output format control for
  Imagen where the API supports it

## Installation

```bash
pnpm add gemini-ai-lib
```

## Usage

Server-side consumption is the default and preferred path for application
repos such as `vt-playground`.

```ts
import { GeminiTextService } from "gemini-ai-lib";

const textService = new GeminiTextService({
  apiKey: process.env.GEMINI_API_KEY,
});

const response = await textService.generateTextString(
  "Summarize the current rollout status in three bullets.",
  {
    model: "gemini-3-flash-preview",
    systemInstruction:
      "Answer like a pragmatic product engineer. Be concise and explicit.",
    temperature: 0.4,
  },
);
```

Persistent text chat can layer on top of `GeminiChatService` while still
letting the consuming app own validation and request shaping.

```ts
import {
  createGeminiTextChatHistory,
  GeminiChatService,
} from "gemini-ai-lib";

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

const text = await chatService.sendMessageString(
  "Now add the top two risks and a rollback trigger.",
);
```

Apps can also inject their own structured logger adapter when they want Gemini
request lifecycle events to land in an app-owned sink.

```ts
import {
  GeminiTextService,
  type LoggerAdapter,
} from "gemini-ai-lib";

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

Apps that own model policy in their own repo can also reuse the library's
thinking-config and response-metadata helpers without giving up control of
route contracts or storage.

```ts
import {
  createGeminiThinkingConfigForModel,
  normalizeGeminiResponseMetadata,
  GeminiTextService,
} from "gemini-ai-lib";

const service = new GeminiTextService({
  apiKey: process.env.GEMINI_API_KEY,
});

const result = await service.generateText(
  "Compare the rollout risks in three bullets.",
  {
    model: "gemini-3.1-pro-preview",
    thinkingConfig: createGeminiThinkingConfigForModel(
      "gemini-3.1-pro-preview",
      {
        includeThoughts: false,
      },
    ),
  },
);

const telemetry = normalizeGeminiResponseMetadata(result, {
  model: "gemini-3.1-pro-preview",
  modelLabel: "Gemini 3.1 Pro Preview",
  thinkingMode: "balanced",
  startedAt: new Date().toISOString(),
  startedMs: Date.now(),
});
```

Consumers can also render text-model selectors directly from shared exports:

```ts
import {
  GEMINI_TEXT_MODELS,
  GEMINI_TEXT_MODEL_DISPLAY_NAMES,
} from "gemini-ai-lib";

const options = GEMINI_TEXT_MODELS.map((model) => ({
  value: model,
  label: GEMINI_TEXT_MODEL_DISPLAY_NAMES[model],
}));
```

For lightweight UI/model-picker usage without importing runtime services, you
can also import model catalogs directly from the subpath entry:

```ts
import {
  GEMINI_TEXT_MODELS,
  GEMINI_IMAGE_MODELS,
  getTextModelDisplayName,
} from "gemini-ai-lib/model-catalogs";
```

Image-capable apps can also keep their own policy layer while reusing the
shared image service and model list.

For Gemini image models, the Gemini API returns the model's native image
format. Do not assume `outputMimeType` is supported there. The library keeps
that behavior model-aware and only forwards explicit output-format controls to
Imagen-style routes where they are actually supported.

```ts
import {
  GEMINI_IMAGE_MODELS,
  GeminiImageService,
} from "gemini-ai-lib";

const imageService = new GeminiImageService({
  apiKey: process.env.GEMINI_API_KEY,
});

const result = await imageService.generateImageFromPrompt(
  "Create a clean workspace logo with bold geometry.",
  {
    model: "gemini-3.1-flash-image-preview",
    aspectRatio: "1:1",
  },
);
```

If you need explicit output-format control, use an Imagen-capable model:

```ts
const result = await imageService.generateImageFromPrompt(
  "Create a clean workspace logo with bold geometry.",
  {
    model: "imagen-4.0-generate-001",
    aspectRatio: "1:1",
    outputMimeType: "image/png",
  },
);
```

## Environment Guidance

- Prefer `GEMINI_API_KEY` for server-side usage.
- `NEXT_PUBLIC_GEMINI_API_KEY` is treated as a deliberate browser-oriented
  fallback, not the default integration path.
- App repos should not depend on a public Gemini key unless the user explicitly
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
- Keep reusable history shaping and portable chat-session helpers here when
  they are app-agnostic.
- Keep logger contracts and lifecycle emission generic here, while letting the
  consuming app own storage, retention, and log-history UI.
- Keep app-specific model allowlists, request validation, transport contracts,
  and user-facing error mapping in the consuming app.

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

## Repository Notes

- Public exports are defined in `src/index.ts`.
- Package entrypoints and build outputs are defined in `package.json`.
- The library currently ships both ESM and CJS output from `dist/`.
- Deferred library ideas and transport follow-ups live in `docs/future-work.md`.
- Repository-specific contributor guidance lives in `AGENTS.md`.
