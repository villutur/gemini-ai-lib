# Future Work

This file tracks deferred library work for `gemini-ai-lib`.

Use it when:

- A reusable Gemini helper is clearly worth keeping, but not part of the
  current implementation
- A runtime or transport boundary should be revisited later
- A feature is explicitly called out as phase 2, later, or worth revisiting

Status labels:

- `Planned`: the most likely next library step once current work settles
- `Idea`: useful to remember, but not committed yet
- `Research`: needs technical exploration first

## Live

- [ ] Research server-side live-session support
      Status: `Research`
      Priority: `Medium`
      Complexity: `High`
      Why later: Server-side live support likely needs a transport layer such as WebSockets plus clearer session lifecycle helpers before it becomes a stable shared abstraction.
      Related: `src/live.ts`
      Revisit when: `vt-playground` is ready to prototype a real live route instead of a text-first route.

- [ ] Explore ephemeral-token support for live clients
      Status: `Research`
      Priority: `Medium`
      Complexity: `High`
      Why later: Ephemeral tokens are a likely prerequisite for safer browser-side live flows, but the library should only commit to them once the surrounding runtime contract is clearer.
      Related: `src/live.ts`
      Revisit when: The live-session architecture is far enough along that browser-direct auth becomes an active requirement rather than a hypothetical.

## Logging

- [ ] Add correlation-friendly Gemini event metadata for app-owned log sinks
      Status: `Research`
      Priority: `Medium`
      Complexity: `Medium`
      Why later: Central observability will be much more useful if Gemini events can carry request, session, model, and status metadata in a consistent way without pushing app-specific storage concerns into the library.
      Related: `src/logger.ts`, `src/base.ts`, `src/text.ts`, `src/chat.ts`, `src/live.ts`
      Revisit when: A consuming app starts requiring cross-request/session correlation in its structured log pipeline.

## Quality

- [ ] Add automated contract coverage for model catalogs and capability exports
      Status: `Planned`
      Priority: `Medium`
      Complexity: `Medium`
      Why later: The library now exports model and config metadata for text, image, audio, video, and live flows, but the repository still relies on build and typecheck rather than automated contract tests to catch metadata drift.
      Related: `src/model-catalogs.ts`, `src/model-capabilities.ts`, `src/audio.ts`, `src/video.ts`, `README.md`
      Revisit when: The next metadata update lands or a lightweight test harness is introduced.

## Packaging And Release

- [ ] Add GitHub Actions release automation with npm provenance/OIDC
      Status: `Planned`
      Priority: `Medium`
      Complexity: `High`
      Why later: The package now has a manual repo-safe release script. CI-based release automation with provenance should be introduced once release cadence justifies additional operational complexity.
      Related: `.github/workflows/*`, `docs/release.md`, `package.json`
      Revisit when: release frequency increases and manual release starts creating operational overhead.
