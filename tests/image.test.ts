import assert from "node:assert/strict";
import test from "node:test";
import type { GenerateContentResponse, LoggerAdapter, StructuredLogEvent } from "../src/index.ts";
import { GeminiImageService } from "../src/index.ts";

class TestLogger implements LoggerAdapter {
  public events: StructuredLogEvent[] = [];

  public async log(event: StructuredLogEvent) {
    this.events.push(event);
  }
}

function createService(logger: TestLogger) {
  return new GeminiImageService({
    apiKey: "test-key",
    logger,
  });
}

test("GeminiImageService.generateContent returns the raw Gemini response and logs lifecycle events", async () => {
  const logger = new TestLogger();
  const service = createService(logger);
  const response: GenerateContentResponse = {
    candidates: [
      {
        finishReason: "STOP",
        content: {
          role: "model",
          parts: [{ text: "done" }],
        },
      },
    ],
    text: "done",
  } as GenerateContentResponse;

  let capturedRequest: unknown;
  (service as unknown as { ai: { models: { generateContent: (request: unknown) => Promise<GenerateContentResponse> } } }).ai =
    {
      models: {
        generateContent: async (request: unknown) => {
          capturedRequest = request;
          return response;
        },
      },
    };

  const result = await service.generateContent("Create a clean logo", {
    model: "gemini-3.1-flash-image-preview",
    config: {
      responseModalities: ["IMAGE"],
    },
  });

  assert.equal(result, response);
  assert.deepEqual(capturedRequest, {
    model: "gemini-3.1-flash-image-preview",
    contents: "Create a clean logo",
    config: {
      responseModalities: ["IMAGE"],
    },
  });
  assert.equal(logger.events.length, 2);
  assert.equal(logger.events[0]?.message, "Gemini image generateContent started.");
  assert.equal(logger.events[1]?.message, "Gemini image generateContent completed.");
  assert.equal(logger.events[1]?.metadata?.hasText, true);
});

test("GeminiImageService.generateContent rejects Imagen models on the raw Gemini path", async () => {
  const service = createService(new TestLogger());

  await assert.rejects(
    () =>
      service.generateContent("Create a logo", {
        model: "imagen-4.0-generate-001",
      }),
    /only supports Gemini image models/i,
  );
});

test("GeminiImageService.generateImage normalizes Gemini image-model responses and strips Imagen-only config", async () => {
  const logger = new TestLogger();
  const service = createService(logger);

  let capturedRequest: unknown;
  (service as unknown as { ai: { models: { generateContent: (request: unknown) => Promise<GenerateContentResponse> } } }).ai =
    {
      models: {
        generateContent: async (request: unknown) => {
          capturedRequest = request;
          return {
            candidates: [
              {
                finishReason: "STOP",
                content: {
                  role: "model",
                  parts: [
                    {
                      inlineData: {
                        mimeType: "image/png",
                        data: "abc123",
                      },
                    },
                    {
                      text: "short caption",
                    },
                  ],
                },
              },
            ],
            text: "short caption",
          } as GenerateContentResponse;
        },
      },
    };

  const result = await service.generateImage([{ text: "Create a clean logo" }], {
    model: "gemini-2.5-flash-image",
    aspectRatio: "1:1",
    imageSize: "1K",
    outputMimeType: "image/png",
    compressionQuality: 90,
    responseModalities: ["IMAGE", "TEXT"],
  });

  assert.equal(result.base64Image, "data:image/png;base64,abc123");
  assert.deepEqual(result.base64Images, ["data:image/png;base64,abc123"]);
  assert.equal(result.text, "short caption");
  assert.deepEqual(capturedRequest, {
    model: "gemini-2.5-flash-image",
    contents: [
      {
        role: "user",
        parts: [{ text: "Create a clean logo" }],
      },
    ],
    config: {
      responseModalities: ["IMAGE", "TEXT"],
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: "1K",
      },
    },
  });
  assert.equal(
    logger.events.some(
      (event) =>
        event.message === "Gemini image generation completed." &&
        event.metadata?.imageCount === 1,
    ),
    true,
  );
});

test("GeminiImageService.generateImage forwards Imagen-only output controls on the Imagen path", async () => {
  const logger = new TestLogger();
  const service = createService(logger);

  let capturedRequest: unknown;
  (
    service as unknown as {
      ai: { models: { generateImages: (request: unknown) => Promise<{ generatedImages: Array<{ image?: { imageBytes?: string; mimeType?: string } }> }> } };
    }
  ).ai = {
    models: {
      generateImages: async (request: unknown) => {
        capturedRequest = request;
        return {
          generatedImages: [
            {
              image: {
                imageBytes: "img-one",
                mimeType: "image/png",
              },
            },
          ],
        };
      },
    },
  };

  const result = await service.generateImage([{ text: "Create a studio portrait" }], {
    model: "imagen-4.0-generate-001",
    aspectRatio: "1:1",
    imageSize: "2K",
    numberOfImages: 2,
    outputMimeType: "image/png",
    compressionQuality: 80,
    personGeneration: "ALLOW_ADULT",
  });

  assert.equal(result.base64Image, "data:image/png;base64,img-one");
  assert.deepEqual(capturedRequest, {
    model: "imagen-4.0-generate-001",
    prompt: "Create a studio portrait",
    config: {
      numberOfImages: 2,
      aspectRatio: "1:1",
      imageSize: "2K",
      personGeneration: "ALLOW_ADULT",
      outputMimeType: "image/png",
      outputCompressionQuality: 80,
    },
  });
});

test("GeminiImageService.generateContent logs blocked responses without mutating the raw response", async () => {
  const logger = new TestLogger();
  const service = createService(logger);
  const blockedResponse = {
    candidates: [
      {
        finishReason: "IMAGE_OTHER",
      },
    ],
    promptFeedback: {
      blockReason: "IMAGE_OTHER",
    },
  } as GenerateContentResponse;

  (service as unknown as { ai: { models: { generateContent: () => Promise<GenerateContentResponse> } } }).ai = {
    models: {
      generateContent: async () => blockedResponse,
    },
  };

  const result = await service.generateContent("Create a portrait", {
    model: "gemini-2.5-flash-image",
  });

  assert.equal(result, blockedResponse);
  assert.equal(logger.events[1]?.level, "warn");
  assert.equal(logger.events[1]?.message, "Gemini image generateContent completed with blocked response.");
  assert.equal(logger.events[1]?.metadata?.blockReason, "IMAGE_OTHER");
});
