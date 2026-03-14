# gemini-ai-lib

This repository contains the reusable Gemini integration layer for the `vt`
workspace.

## Purpose

- Keep Gemini SDK setup and portable service wrappers out of application repos
- Offer shared building blocks for text, chat, image, audio, and live
  integrations
- Preserve a clean boundary where consuming apps still own product behavior and
  request contracts

## Project Structure

- `src/base.ts`: shared Gemini client setup and API key resolution
- `src/text.ts`: one-shot text generation service
- `src/chat.ts`: persistent chat session wrapper plus reusable text-history helpers
- `src/response-metadata.ts`: reusable response-metadata normalization and thinking-config helpers
- `src/audio.ts`, `src/image.ts`, `src/live.ts`: richer media and live
  integrations
- `src/helpers.ts`: reusable attachment helpers
- `src/logger.ts`: shared logging helpers
- `src/index.ts`: public package entrypoint
- `package.json`: package exports and build scripts

## Working Rules

- Prefer server-side Gemini access by default. `GEMINI_API_KEY` is the standard
  path for app integrations.
- Treat `NEXT_PUBLIC_GEMINI_API_KEY` as an explicit browser-oriented fallback,
  not the default contract.
- Keep this package generic and portable. Do not move app-specific model
  allowlists, request validation, route contracts, or UI-facing error messages
  into the library.
- When model examples or editor-hint unions need updating, use Google's
  official model index as the source of truth:
  `https://ai.google.dev/gemini-api/docs/models.md.txt`.
- Keep thinking-profile mapping and raw Gemini response normalization generic
  here, but leave app-owned policy such as profile availability, allowlists,
  telemetry storage, and UI labels to the consuming app.
- Keep structured logger contracts and lifecycle emission generic here, but let
  consuming apps own the actual sink, storage, retention, and log-history UI.
- If multiple apps need the same Gemini-history shaping or chat-session helper,
  add the generic helper here instead of reimplementing it in each app.
- When a consuming app needs a better public API, fix the export or helper here
  instead of telling the app to reach into the repository with relative paths.
- Keep public imports package-based through `gemini-ai-lib`.

## Documentation Maintenance

- Update `README.md` when environment guidance, exports, or recommended usage
  changes.
- Update this file when repository-wide contributor rules change.
- Track deferred library work in `docs/future-work.md` when it is clearly worth
  keeping but out of scope for the current implementation.
- If a future app needs higher-level Gemini abstractions, document the boundary
  carefully before adding them here.

## Validation

Use `pnpm` in this repository.

- `pnpm build`: build the library and declarations
- `pnpm dev`: watch mode during local package work
