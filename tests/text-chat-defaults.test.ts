import assert from "node:assert/strict";
import test from "node:test";
import { GeminiChatService, GeminiTextService } from "../dist/index.js";

test("GeminiTextService defaults one-shot and fast text generation to Gemini 3.5 Flash", async () => {
  const service = new GeminiTextService({ apiKey: "test-key" });
  const capturedModels: unknown[] = [];

  (service as unknown as {
    ai: { models: { generateContent: (params: { model?: string }) => Promise<{ text: string }> } };
  }).ai = {
    models: {
      generateContent: async (params) => {
        capturedModels.push(params.model);
        return { text: "ok" };
      },
    },
  };

  await service.generateContent("Default model?");
  await service.generateFastText("Fast model?");

  assert.deepEqual(capturedModels, ["gemini-3.5-flash", "gemini-3.5-flash"]);
});

test("GeminiChatService defaults chat sessions to Gemini 3.5 Flash", async () => {
  const service = new GeminiChatService({ apiKey: "test-key" });
  let capturedModel: unknown;

  (service as unknown as {
    ai: {
      chats: {
        create: (params: { model?: string }) => {
          sendMessage: (params: { message: string }) => Promise<{ text: string }>;
          getHistory: () => Promise<unknown[]>;
        };
      };
    };
  }).ai = {
    chats: {
      create: (params) => {
        capturedModel = params.model;
        return {
          sendMessage: async () => ({ text: "ok" }),
          getHistory: async () => [],
        };
      },
    },
  };

  await service.sendMessage("Default chat model?");

  assert.equal(capturedModel, "gemini-3.5-flash");
});
