import assert from "node:assert/strict";
import test from "node:test";
import {
  GEMINI_LIVE_MODELS,
  getLiveModelCapabilities,
  getLiveModelDisplayName,
} from "../src/index.ts";

test("removed shutdown live model is no longer exported in the live catalog", () => {
  assert.deepEqual(GEMINI_LIVE_MODELS, ["gemini-2.5-flash-native-audio-preview-12-2025"]);
  assert.equal(
    GEMINI_LIVE_MODELS.includes("gemini-2.5-flash-native-audio-preview-09-2025" as never),
    false,
  );
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
