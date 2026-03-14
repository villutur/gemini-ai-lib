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

- [ ] Add an explicit client-runtime guard for `GeminiLiveChatSession`
      Status: `Planned`
      Priority: `High`
      Complexity: `Low`
      Why later: The library should fail fast and clearly when a live-session helper is used in the wrong runtime instead of letting that surface as a vague downstream error.
      Related: `src/live.ts`
      Revisit when: The next app starts consuming live helpers directly.

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

- [ ] Replace the current singleton logger with an injectable structured logger adapter
      Status: `Planned`
      Priority: `High`
      Complexity: `Medium`
      Why later: The library already has `src/logger.ts`, but a central logging story across the workspace needs package events to flow through an injected adapter rather than only a local `consola` singleton.
      Related: `src/logger.ts`, `src/base.ts`, `src/text.ts`, `src/chat.ts`, `src/live.ts`
      Revisit when: `vt-playground` is ready to capture correlated request or session logs end-to-end.

- [ ] Add correlation-friendly Gemini event metadata for app-owned log sinks
      Status: `Research`
      Priority: `Medium`
      Complexity: `Medium`
      Why later: Central observability will be much more useful if Gemini events can carry request, session, model, and status metadata in a consistent way without pushing app-specific storage concerns into the library.
      Related: `src/logger.ts`, `src/base.ts`, `src/text.ts`, `src/chat.ts`, `src/live.ts`
      Revisit when: The first injected logger adapter exists and needs a stable event shape.

## Packaging And Release

- [ ] Add a repo-safe version-bump release script for `gemini-ai-lib`
      Status: `Planned`
      Priority: `Medium`
      Complexity: `Medium`
      Why later: As the library gets reused across more repos, release steps should be repeatable and guarded. A dedicated script should check that git is fully committed, bump `patch` by default while also supporting `minor`, `major`, or an explicit higher semver, then commit the version change and create the matching git tag.
      Related: `package.json`, `README.md`
      Revisit when: `gemini-ai-lib` starts cutting tagged versions often enough that manual release steps stop feeling dependable.
