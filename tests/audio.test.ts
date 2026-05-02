import assert from "node:assert/strict";
import test from "node:test";
import { GEMINI_AUDIO_MODELS, GeminiAudioService, getAudioModelCapabilities, getAudioModelConfigOptions, getAudioModelDisplayName } from "../dist/index.js";

function createService() {
  return new GeminiAudioService({
    apiKey: "test-key",
  });
}

function mockAudioResponse() {
  return {
    candidates: [
      {
        content: {
          parts: [
            {
              inlineData: {
                data: Buffer.from("audio-bytes").toString("base64"),
              },
            },
          ],
        },
      },
    ],
  };
}

test("audio catalog includes Gemini 3.1 Flash TTS Preview", () => {
  assert.equal(GEMINI_AUDIO_MODELS.includes("gemini-3.1-flash-tts-preview"), true);
  assert.equal(getAudioModelDisplayName("gemini-3.1-flash-tts-preview"), "Gemini 3.1 Flash TTS Preview");
});

test("Gemini 3.1 Flash TTS Preview capability metadata reflects documented TTS constraints", () => {
  const capabilities = getAudioModelCapabilities("gemini-3.1-flash-tts-preview");

  assert.equal(capabilities.isKnownModel, true);
  assert.equal(capabilities.source, "catalog");
  assert.equal(capabilities.inputLimits.supportsTextInput, true);
  assert.equal(capabilities.inputLimits.supportsAttachments, false);
  assert.equal(capabilities.inputLimits.maxContextTokens, 8192);
  assert.equal(capabilities.speakerLimits.supportsSingleSpeaker, true);
  assert.equal(capabilities.speakerLimits.supportsMultiSpeaker, true);
  assert.equal(capabilities.speakerLimits.maxSpeakers, 2);
  assert.equal(capabilities.speakerLimits.multiSpeakerExactCount, 2);
  assert.deepEqual(capabilities.allowedResponseModalities, ["AUDIO"]);
  assert.equal(capabilities.defaultVoiceName, "Kore");
  assert.equal(capabilities.voiceCatalogAvailable, true);
});

test("Gemini 3.1 Flash TTS Preview exposes the expected config options", () => {
  const optionKeys = getAudioModelConfigOptions("gemini-3.1-flash-tts-preview").map((option) => option.key);

  assert.deepEqual(optionKeys, ["voiceName", "languageCode", "responseModalities", "multiSpeakerVoiceConfig"]);
});

test("GeminiAudioService.generateAudio defaults to Gemini 3.1 Flash TTS Preview", async () => {
  const service = createService();
  let capturedRequest: unknown;

  (service as unknown as { ai: { models: { generateContent: (request: unknown) => Promise<unknown> } } }).ai = {
    models: {
      generateContent: async (request: unknown) => {
        capturedRequest = request;
        return mockAudioResponse();
      },
    },
  };

  const result = await service.generateAudio("Hello from Gemini TTS.");

  assert.deepEqual(result, Buffer.from("audio-bytes"));
  assert.deepEqual(capturedRequest, {
    model: "gemini-3.1-flash-tts-preview",
    contents: "Hello from Gemini TTS.",
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        languageCode: undefined,
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Kore" },
        },
      },
    },
  });
});

test("GeminiAudioService.generateAudio preserves explicit legacy model selection", async () => {
  const service = createService();
  let capturedRequest: unknown;

  (service as unknown as { ai: { models: { generateContent: (request: unknown) => Promise<unknown> } } }).ai = {
    models: {
      generateContent: async (request: unknown) => {
        capturedRequest = request;
        return mockAudioResponse();
      },
    },
  };

  await service.generateAudio("Hello from Gemini TTS.", undefined, {
    model: "gemini-2.5-flash-preview-tts",
  });

  assert.equal((capturedRequest as { model?: string }).model, "gemini-2.5-flash-preview-tts");
});

test("unknown audio models still resolve fallback capabilities", () => {
  const capabilities = getAudioModelCapabilities("future-tts-model");

  assert.equal(capabilities.isKnownModel, false);
  assert.equal(capabilities.source, "fallback");
  assert.equal(capabilities.model, "future-tts-model");
});
