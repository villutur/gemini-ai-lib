import assert from "node:assert/strict";
import test from "node:test";
import {
  GEMINI_EMBEDDING_MODELS,
  GEMINI_TEXT_MODELS,
  getEmbeddingModelCapabilities,
  getEmbeddingModelDisplayName,
  getTextModelCapabilities,
  getTextModelDisplayName,
} from "../dist/index.js";

test("text catalogs use the stable Gemini 3.1 Flash Lite id", () => {
  assert.equal(GEMINI_TEXT_MODELS.includes("gemini-3.1-flash-lite"), true);
  assert.equal(GEMINI_TEXT_MODELS.includes("gemini-3.1-flash-lite-preview" as never), false);
  assert.equal(getTextModelDisplayName("gemini-3.1-flash-lite"), "Gemini 3.1 Flash Lite");

  const capabilities = getTextModelCapabilities("gemini-3.1-flash-lite");
  assert.equal(capabilities.isKnownModel, true);
  assert.equal(capabilities.thinking.mode, "level");
  assert.deepEqual(capabilities.thinking.supportedLevels, ["minimal", "low", "medium", "high"]);
});

test("embedding catalogs use the stable Gemini Embedding 2 id", () => {
  assert.equal(GEMINI_EMBEDDING_MODELS.includes("gemini-embedding-2"), true);
  assert.equal(GEMINI_EMBEDDING_MODELS.includes("gemini-embedding-2-preview" as never), false);
  assert.equal(getEmbeddingModelDisplayName("gemini-embedding-2"), "Gemini Embedding 2");

  const capabilities = getEmbeddingModelCapabilities("gemini-embedding-2");
  assert.equal(capabilities.isKnownModel, true);
  assert.equal(capabilities.inputLimits.supportsMultimodalInput, true);
  assert.deepEqual(capabilities.outputLimits.recommendedOutputDimensions, [768, 1536, 3072]);
});
