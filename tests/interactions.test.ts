import assert from "node:assert/strict";
import test from "node:test";
import type { GeminiInteraction, GeminiInteractionCreateParams, LoggerAdapter, StructuredLogEvent } from "../dist/index.js";
import { GeminiInteractionsService, getInteractionAgentDisplayName, getInteractionModelConfigOptions, getInteractionModelDisplayName } from "../dist/index.js";

class TestLogger implements LoggerAdapter {
  public events: StructuredLogEvent[] = [];

  public async log(event: StructuredLogEvent) {
    this.events.push(event);
  }
}

function createService(logger: TestLogger) {
  return new GeminiInteractionsService({
    apiKey: "test-key",
    logger,
  });
}

function createInteraction(overrides: Partial<GeminiInteraction> = {}): GeminiInteraction {
  return {
    id: "interaction-1",
    created: "2026-01-01T00:00:00Z",
    updated: "2026-01-01T00:00:01Z",
    status: "completed",
    model: "gemini-3-flash-preview",
    outputs: [{ type: "text", text: "done" }],
    ...overrides,
  } as GeminiInteraction;
}

function createAsyncStream<T>(items: T[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const item of items) {
        yield item;
      }
    },
  };
}

test("GeminiInteractionsService.create forwards params unchanged and returns the raw interaction", async () => {
  const logger = new TestLogger();
  const service = createService(logger);
  const response = createInteraction();
  let capturedParams: unknown;
  let capturedOptions: unknown;

  (service as unknown as { ai: { interactions: { create: (params: unknown, options?: unknown) => Promise<GeminiInteraction> } } }).ai = {
    interactions: {
      create: async (params: unknown, options?: unknown) => {
        capturedParams = params;
        capturedOptions = options;
        return response;
      },
    },
  };

  const params: GeminiInteractionCreateParams = {
    model: "gemini-3-flash-preview",
    input: "Tell me a short joke.",
    previous_interaction_id: "interaction-0",
    store: true,
  };
  const options = { timeout: 1234 };
  const result = await service.create(params, options);

  assert.equal(result, response);
  assert.equal(capturedParams, params);
  assert.equal(capturedOptions, options);
  assert.equal(logger.events.length, 2);
  assert.equal(logger.events[0]?.message, "Gemini interaction create started.");
  assert.equal(logger.events[0]?.metadata?.model, "gemini-3-flash-preview");
  assert.equal(logger.events[0]?.metadata?.hasPreviousInteractionId, true);
  assert.equal(logger.events[1]?.message, "Gemini interaction create completed.");
  assert.equal(logger.events[1]?.metadata?.interactionId, "interaction-1");
  assert.equal(logger.events[1]?.metadata?.status, "completed");
});

test("GeminiInteractionsService.create preserves streaming results", async () => {
  const service = createService(new TestLogger());
  const stream = createAsyncStream([{ event_type: "interaction.complete" }]);
  let capturedParams: unknown;

  (service as unknown as { ai: { interactions: { create: (params: unknown) => Promise<unknown> } } }).ai = {
    interactions: {
      create: async (params: unknown) => {
        capturedParams = params;
        return stream;
      },
    },
  };

  const params = {
    model: "gemini-3-flash-preview",
    input: "Stream this.",
    stream: true,
  } as GeminiInteractionCreateParams;
  const result = await service.create(params);

  assert.equal(result, stream);
  assert.equal(capturedParams, params);
});

test("GeminiInteractionsService.get forwards id and params", async () => {
  const service = createService(new TestLogger());
  const response = createInteraction({ id: "interaction-get" });
  let capturedId: unknown;
  let capturedParams: unknown;

  (service as unknown as { ai: { interactions: { get: (id: string, params?: unknown) => Promise<GeminiInteraction> } } }).ai = {
    interactions: {
      get: async (id: string, params?: unknown) => {
        capturedId = id;
        capturedParams = params;
        return response;
      },
    },
  };

  const params = { include_input: true };
  const result = await service.get("interaction-get", params);

  assert.equal(result, response);
  assert.equal(capturedId, "interaction-get");
  assert.equal(capturedParams, params);
});

test("GeminiInteractionsService.get preserves streaming results", async () => {
  const service = createService(new TestLogger());
  const stream = createAsyncStream([{ event_type: "content.delta", delta: { type: "text", text: "hi" } }]);
  let capturedParams: unknown;

  (service as unknown as { ai: { interactions: { get: (id: string, params?: unknown) => Promise<unknown> } } }).ai = {
    interactions: {
      get: async (_id: string, params?: unknown) => {
        capturedParams = params;
        return stream;
      },
    },
  };

  const params = { stream: true, last_event_id: "event-1" };
  const result = await service.get("interaction-stream", params);

  assert.equal(result, stream);
  assert.equal(capturedParams, params);
});

test("GeminiInteractionsService.cancel and delete forward params unchanged", async () => {
  const service = createService(new TestLogger());
  const cancelled = createInteraction({ id: "interaction-cancel", status: "cancelled" });
  const deleted = { deleted: true };
  const calls: Array<{ method: string; id: string; params: unknown }> = [];

  (
    service as unknown as {
      ai: {
        interactions: {
          cancel: (id: string, params?: unknown) => Promise<GeminiInteraction>;
          delete: (id: string, params?: unknown) => Promise<unknown>;
        };
      };
    }
  ).ai = {
    interactions: {
      cancel: async (id: string, params?: unknown) => {
        calls.push({ method: "cancel", id, params });
        return cancelled;
      },
      delete: async (id: string, params?: unknown) => {
        calls.push({ method: "delete", id, params });
        return deleted;
      },
    },
  };

  const cancelParams = { api_version: "v1beta" };
  const deleteParams = { api_version: "v1beta" };

  assert.equal(await service.cancel("interaction-cancel", cancelParams), cancelled);
  assert.equal(await service.delete("interaction-delete", deleteParams), deleted);
  assert.deepEqual(calls, [
    { method: "cancel", id: "interaction-cancel", params: cancelParams },
    { method: "delete", id: "interaction-delete", params: deleteParams },
  ]);
});

test("GeminiInteractionsService logs and rethrows SDK errors", async () => {
  const logger = new TestLogger();
  const service = createService(logger);
  const sdkError = new Error("SDK failed");

  (service as unknown as { ai: { interactions: { create: () => Promise<never> } } }).ai = {
    interactions: {
      create: async () => {
        throw sdkError;
      },
    },
  };

  await assert.rejects(
    () =>
      service.create({
        model: "gemini-3-flash-preview",
        input: "fail",
      }),
    sdkError,
  );
  assert.equal(logger.events.at(-1)?.message, "Gemini interaction create failed.");
  assert.equal((logger.events.at(-1)?.metadata?.error as { message?: string } | undefined)?.message, "SDK failed");
});

test("Interactions catalogs expose display labels and fallback to raw ids", () => {
  assert.equal(getInteractionModelDisplayName("gemini-3-flash-preview"), "Gemini 3 Flash Preview");
  assert.equal(getInteractionModelDisplayName("future-model"), "future-model");
  assert.equal(getInteractionAgentDisplayName("deep-research-pro-preview-12-2025"), "Deep Research Pro Preview (12-2025)");
  assert.equal(getInteractionAgentDisplayName("future-agent"), "future-agent");
});

test("getInteractionModelConfigOptions returns descriptors for known and unknown models", () => {
  const knownOptions = getInteractionModelConfigOptions("gemini-3-flash-preview");
  const unknownOptions = getInteractionModelConfigOptions("future-model");

  assert.equal(
    knownOptions.some((option) => option.key === "system_instruction"),
    true,
  );
  assert.equal(
    knownOptions.some((option) => option.key === "agent_config"),
    false,
  );
  assert.equal(
    unknownOptions.some((option) => option.key === "agent_config"),
    true,
  );
  assert.equal(
    unknownOptions.some((option) => option.key === "store"),
    true,
  );
});
