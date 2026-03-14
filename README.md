# gemini-ai-lib

Shared TypeScript wrappers around the Gemini SDK for use across the `vt`
workspace.

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
- `GeminiAttachmentHelper`: browser and server helpers for turning files and
  buffers into Gemini `Part` objects
- `GeminiLogger`: shared logging helper
- `GeminiAudioService`, `GeminiImageService`, and `GeminiLiveService` for the
  richer media and live surfaces already explored in the workspace

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

## Public Contract

- Import from the package name, not from `src/` or sibling repo paths.
- Keep generic Gemini SDK concerns here.
- Keep reusable history shaping and portable chat-session helpers here when
  they are app-agnostic.
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
