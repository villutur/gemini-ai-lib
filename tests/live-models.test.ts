import assert from "node:assert/strict";
import test from "node:test";
import {
  GEMINI_LIVE_MODELS,
  GeminiLiveChatSession,
  getLiveModelCapabilities,
  getLiveModelConfigOptions,
  getLiveModelDisplayName,
} from "../dist/index.js";

test("removed shutdown live model is no longer exported in the live catalog", () => {
  assert.deepEqual(GEMINI_LIVE_MODELS, ["gemini-3.1-flash-live-preview", "gemini-2.5-flash-native-audio-preview-12-2025"]);
  assert.equal(
    GEMINI_LIVE_MODELS.includes("gemini-2.5-flash-native-audio-preview-09-2025" as never),
    false,
  );
});

test("Gemini 3.1 Flash Live is the default first live model and exposes level-based thinking", () => {
  const capabilities = getLiveModelCapabilities(GEMINI_LIVE_MODELS[0]);

  assert.equal(GEMINI_LIVE_MODELS[0], "gemini-3.1-flash-live-preview");
  assert.equal(capabilities.isKnownModel, true);
  assert.equal(capabilities.featureFlags.supportsAudioInput, true);
  assert.equal(capabilities.featureFlags.supportsAudioOutput, true);
  assert.equal(capabilities.featureFlags.supportsToolCalling, true);
  assert.equal(capabilities.featureFlags.supportsGoogleSearch, true);
  assert.equal(capabilities.featureFlags.supportsAffectiveDialog, false);
  assert.equal(capabilities.featureFlags.supportsProactiveAudio, false);
  assert.deepEqual(capabilities.limits.supportedThinkingLevels, ["minimal", "low", "medium", "high"]);
  assert.equal(capabilities.supportedOptions.includes("thinkingLevel"), true);
  assert.equal(capabilities.supportedOptions.includes("thinkingBudget"), false);

  const thinkingOption = getLiveModelConfigOptions("gemini-3.1-flash-live-preview").find((option) => option.key === "thinkingLevel");
  assert.deepEqual(thinkingOption?.allowedValues, ["minimal", "low", "medium", "high"]);
});

test("Gemini 2.5 native-audio live remains available with budget/native audio flags", () => {
  const capabilities = getLiveModelCapabilities("gemini-2.5-flash-native-audio-preview-12-2025");

  assert.equal(capabilities.isKnownModel, true);
  assert.equal(capabilities.featureFlags.supportsAffectiveDialog, true);
  assert.equal(capabilities.featureFlags.supportsProactiveAudio, true);
  assert.equal(capabilities.supportedOptions.includes("thinkingBudget"), true);
  assert.equal(capabilities.supportedOptions.includes("thinkingLevel"), false);
});

test("live session defaults text messages to 3.1 realtime input", () => {
  const calls: unknown[] = [];
  const session = Object.create(GeminiLiveChatSession.prototype) as GeminiLiveChatSession & {
    options: Record<string, unknown>;
    session: {
      sendRealtimeInput: (params: unknown) => void;
      sendClientContent: (params: unknown) => void;
    };
  };
  session.options = {};
  session.session = {
    sendRealtimeInput: (params: unknown) => calls.push({ method: "sendRealtimeInput", params }),
    sendClientContent: (params: unknown) => calls.push({ method: "sendClientContent", params }),
  };

  session.sendTextMessage("Hello live");

  assert.deepEqual(calls, [{ method: "sendRealtimeInput", params: { text: "Hello live" } }]);
});

test("live session keeps 2.5 text messages on client content", () => {
  const calls: unknown[] = [];
  const session = Object.create(GeminiLiveChatSession.prototype) as GeminiLiveChatSession & {
    options: Record<string, unknown>;
    session: {
      sendRealtimeInput: (params: unknown) => void;
      sendClientContent: (params: unknown) => void;
    };
  };
  session.options = { model: "gemini-2.5-flash-native-audio-preview-12-2025" };
  session.session = {
    sendRealtimeInput: (params: unknown) => calls.push({ method: "sendRealtimeInput", params }),
    sendClientContent: (params: unknown) => calls.push({ method: "sendClientContent", params }),
  };

  session.sendTextMessage("Hello native audio");

  assert.equal((calls[0] as { method: string }).method, "sendClientContent");
});

test("removed shutdown live model falls back instead of resolving as a known catalog capability", () => {
  const fallbackCapabilities = getLiveModelCapabilities("gemini-2.5-flash-native-audio-preview-09-2025");

  assert.equal(fallbackCapabilities.isKnownModel, false);
  assert.equal(fallbackCapabilities.source, "fallback");
  assert.equal(fallbackCapabilities.model, "gemini-2.5-flash-native-audio-preview-09-2025");
});

test("unknown removed live model display names fall back to the raw model id", () => {
  assert.equal(
    getLiveModelDisplayName("gemini-2.5-flash-native-audio-preview-09-2025"),
    "gemini-2.5-flash-native-audio-preview-09-2025",
  );
});
