import type { Interactions } from "@google/genai";
import { GeminiBaseService } from "./base.js";
import {
  GEMINI_INTERACTION_AGENTS,
  GEMINI_INTERACTION_AGENT_DISPLAY_NAMES,
  GEMINI_INTERACTION_MODELS,
  GEMINI_INTERACTION_MODEL_DISPLAY_NAMES,
  getInteractionAgentDisplayName,
  getInteractionModelDisplayName,
  type KnownInteractionAgent,
  type KnownInteractionModel,
} from "./model-catalogs.js";

/**
 * Re-exported Interactions catalogs and labels for convenience.
 */
export {
  GEMINI_INTERACTION_AGENTS,
  GEMINI_INTERACTION_AGENT_DISPLAY_NAMES,
  GEMINI_INTERACTION_MODELS,
  GEMINI_INTERACTION_MODEL_DISPLAY_NAMES,
  getInteractionAgentDisplayName,
  getInteractionModelDisplayName,
};
export type { KnownInteractionAgent, KnownInteractionModel };

export type GeminiInteraction = Interactions.Interaction;
export type GeminiInteractionCreateParams = Interactions.InteractionCreateParams;
export type GeminiInteractionCreateParamsStreaming =
  | Interactions.CreateModelInteractionParamsStreaming
  | Interactions.CreateAgentInteractionParamsStreaming;
export type GeminiInteractionGetParams = Interactions.InteractionGetParams;
export type GeminiInteractionGetParamsNonStreaming = Interactions.InteractionGetParamsNonStreaming;
export type GeminiInteractionGetParamsStreaming = Interactions.InteractionGetParamsStreaming;
export type GeminiInteractionDeleteParams = Interactions.InteractionDeleteParams;
export type GeminiInteractionCancelParams = Interactions.InteractionCancelParams;
export type GeminiInteractionSSEEvent = Interactions.InteractionSSEEvent;
export type GeminiInteractionStartEvent = Interactions.InteractionStartEvent;
export type GeminiInteractionCompleteEvent = Interactions.InteractionCompleteEvent;
export type GeminiInteractionStatusUpdate = Interactions.InteractionStatusUpdate;
export type GeminiInteractionTextContent = Interactions.TextContent;
export type GeminiInteractionImageContent = Interactions.ImageContent;
export type GeminiInteractionAudioContent = Interactions.AudioContent;
export type GeminiInteractionVideoContent = Interactions.VideoContent;
export type GeminiInteractionDocumentContent = Interactions.DocumentContent;
export type GeminiInteractionFunctionCallContent = Interactions.FunctionCallContent;
export type GeminiInteractionFunctionResultContent = Interactions.FunctionResultContent;
export type GeminiInteractionGoogleSearchCallContent = Interactions.GoogleSearchCallContent;
export type GeminiInteractionGoogleSearchResultContent = Interactions.GoogleSearchResultContent;
export type GeminiInteractionCodeExecutionCallContent = Interactions.CodeExecutionCallContent;
export type GeminiInteractionCodeExecutionResultContent = Interactions.CodeExecutionResultContent;
export type GeminiInteractionURLContextCallContent = Interactions.URLContextCallContent;
export type GeminiInteractionURLContextResultContent = Interactions.URLContextResultContent;
export type GeminiInteractionMCPServerToolCallContent = Interactions.MCPServerToolCallContent;
export type GeminiInteractionMCPServerToolResultContent = Interactions.MCPServerToolResultContent;
export type GeminiInteractionFileSearchCallContent = Interactions.FileSearchCallContent;
export type GeminiInteractionFileSearchResultContent = Interactions.FileSearchResultContent;
export type GeminiInteractionGenerationConfig = Interactions.GenerationConfig;
export type GeminiInteractionTool = Interactions.Tool;
export type GeminiInteractionToolChoiceConfig = Interactions.ToolChoiceConfig;
export type GeminiInteractionUsage = Interactions.Usage;
export type GeminiInteractionTurn = Interactions.Turn;

export type GeminiInteractionRequestOptions = Parameters<Interactions["create"]>[1];
export type GeminiInteractionCreateResult = Awaited<ReturnType<Interactions["create"]>>;
export type GeminiInteractionCreateStreamResult = AsyncIterable<GeminiInteractionSSEEvent>;
export type GeminiInteractionGetResult = Awaited<ReturnType<Interactions["get"]>>;
export type GeminiInteractionDeleteResult = Awaited<ReturnType<Interactions["delete"]>>;
export type GeminiInteractionCancelResult = Awaited<ReturnType<Interactions["cancel"]>>;

export type GeminiInteractionModel = KnownInteractionModel | string;
export type GeminiInteractionAgent = KnownInteractionAgent | string;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toDefinedRecord(entries: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(entries).filter(([, value]) => value !== undefined));
}

function summarizeCreateParams(params: GeminiInteractionCreateParams) {
  const record = params as unknown as Record<string, unknown>;
  const tools = Array.isArray(record.tools) ? record.tools : undefined;

  return toDefinedRecord({
    model: typeof record.model === "string" ? record.model : undefined,
    agent: typeof record.agent === "string" ? record.agent : undefined,
    stream: typeof record.stream === "boolean" ? record.stream : undefined,
    background: typeof record.background === "boolean" ? record.background : undefined,
    store: typeof record.store === "boolean" ? record.store : undefined,
    hasPreviousInteractionId: typeof record.previous_interaction_id === "string" && record.previous_interaction_id.length > 0,
    toolCount: tools?.length,
    hasGenerationConfig: isRecord(record.generation_config),
    hasAgentConfig: isRecord(record.agent_config),
    responseModalities: Array.isArray(record.response_modalities) ? record.response_modalities : undefined,
  });
}

function summarizeGetParams(params: GeminiInteractionGetParams | undefined) {
  return toDefinedRecord({
    stream: typeof params?.stream === "boolean" ? params.stream : undefined,
    includeInput: typeof params?.include_input === "boolean" ? params.include_input : undefined,
    hasLastEventId: typeof params?.last_event_id === "string" && params.last_event_id.length > 0,
  });
}

function summarizeInteractionResult(result: unknown) {
  if (!isRecord(result)) {
    return {};
  }

  return toDefinedRecord({
    interactionId: typeof result.id === "string" ? result.id : undefined,
    status: typeof result.status === "string" ? result.status : undefined,
    model: typeof result.model === "string" ? result.model : undefined,
    agent: typeof result.agent === "string" ? result.agent : undefined,
  });
}

function summarizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    value: String(error),
  };
}

/**
 * Thin SDK-aligned wrapper around `client.interactions`.
 *
 * This service intentionally does not normalize Interactions input/output,
 * manage sessions, execute tools, or impose app-specific storage policy.
 */
export class GeminiInteractionsService extends GeminiBaseService {
  /**
   * Returns the underlying SDK Interactions client for consumers that need an
   * exact SDK method or overload not wrapped by this service.
   */
  public getInteractionsClient(): Interactions {
    return this.getClient().interactions;
  }

  /**
   * Creates a model or agent interaction.
   */
  public async create(params: GeminiInteractionCreateParams, options?: GeminiInteractionRequestOptions): Promise<GeminiInteractionCreateResult> {
    const metadata = summarizeCreateParams(params);

    await this.log({
      level: "info",
      source: "gemini.interactions",
      message: "Gemini interaction create started.",
      status: "running",
      metadata,
    });

    try {
      const result = await this.getInteractionsClient().create(params, options);

      await this.log({
        level: "info",
        source: "gemini.interactions",
        message: "Gemini interaction create completed.",
        status: "success",
        metadata: {
          ...metadata,
          ...summarizeInteractionResult(result),
        },
      });

      return result as GeminiInteractionCreateResult;
    } catch (error) {
      await this.log({
        level: "error",
        source: "gemini.interactions",
        message: "Gemini interaction create failed.",
        status: "error",
        metadata: {
          ...metadata,
          error: summarizeError(error),
        },
      });

      throw error;
    }
  }

  /**
   * Creates a streamed model or agent interaction.
   *
   * The Interactions API returns final content as `content.*` stream events;
   * the final `interaction.complete` event intentionally has empty outputs.
   */
  public async createStream(
    params: GeminiInteractionCreateParamsStreaming,
    options?: GeminiInteractionRequestOptions,
  ): Promise<GeminiInteractionCreateStreamResult> {
    const streamParams = {
      ...params,
      stream: true as const,
    };
    const metadata = summarizeCreateParams(streamParams);

    await this.log({
      level: "info",
      source: "gemini.interactions",
      message: "Gemini interaction stream create started.",
      status: "running",
      metadata,
    });

    try {
      const result = await this.getInteractionsClient().create(streamParams, options);

      await this.log({
        level: "info",
        source: "gemini.interactions",
        message: "Gemini interaction stream create opened.",
        status: "success",
        metadata,
      });

      return result as GeminiInteractionCreateStreamResult;
    } catch (error) {
      await this.log({
        level: "error",
        source: "gemini.interactions",
        message: "Gemini interaction stream create failed.",
        status: "error",
        metadata: {
          ...metadata,
          error: summarizeError(error),
        },
      });

      throw error;
    }
  }

  /**
   * Retrieves an interaction by id.
   */
  public async get(id: string, params?: GeminiInteractionGetParams, options?: GeminiInteractionRequestOptions): Promise<GeminiInteractionGetResult> {
    const metadata = {
      interactionId: id,
      ...summarizeGetParams(params),
    };

    await this.log({
      level: "info",
      source: "gemini.interactions",
      message: "Gemini interaction get started.",
      status: "running",
      metadata,
    });

    try {
      const result = await this.getInteractionsClient().get(id, params, options);

      await this.log({
        level: "info",
        source: "gemini.interactions",
        message: "Gemini interaction get completed.",
        status: "success",
        metadata: {
          ...metadata,
          ...summarizeInteractionResult(result),
        },
      });

      return result as GeminiInteractionGetResult;
    } catch (error) {
      await this.log({
        level: "error",
        source: "gemini.interactions",
        message: "Gemini interaction get failed.",
        status: "error",
        metadata: {
          ...metadata,
          error: summarizeError(error),
        },
      });

      throw error;
    }
  }

  /**
   * Deletes a stored interaction by id.
   */
  public async delete(id: string, params?: GeminiInteractionDeleteParams | null, options?: GeminiInteractionRequestOptions): Promise<GeminiInteractionDeleteResult> {
    const metadata = { interactionId: id };

    await this.log({
      level: "info",
      source: "gemini.interactions",
      message: "Gemini interaction delete started.",
      status: "running",
      metadata,
    });

    try {
      const result = await this.getInteractionsClient().delete(id, params, options);

      await this.log({
        level: "info",
        source: "gemini.interactions",
        message: "Gemini interaction delete completed.",
        status: "success",
        metadata,
      });

      return result as GeminiInteractionDeleteResult;
    } catch (error) {
      await this.log({
        level: "error",
        source: "gemini.interactions",
        message: "Gemini interaction delete failed.",
        status: "error",
        metadata: {
          ...metadata,
          error: summarizeError(error),
        },
      });

      throw error;
    }
  }

  /**
   * Cancels a background interaction by id.
   */
  public async cancel(id: string, params?: GeminiInteractionCancelParams | null, options?: GeminiInteractionRequestOptions): Promise<GeminiInteractionCancelResult> {
    const metadata = { interactionId: id };

    await this.log({
      level: "info",
      source: "gemini.interactions",
      message: "Gemini interaction cancel started.",
      status: "running",
      metadata,
    });

    try {
      const result = await this.getInteractionsClient().cancel(id, params, options);

      await this.log({
        level: "info",
        source: "gemini.interactions",
        message: "Gemini interaction cancel completed.",
        status: "success",
        metadata: {
          ...metadata,
          ...summarizeInteractionResult(result),
        },
      });

      return result as GeminiInteractionCancelResult;
    } catch (error) {
      await this.log({
        level: "error",
        source: "gemini.interactions",
        message: "Gemini interaction cancel failed.",
        status: "error",
        metadata: {
          ...metadata,
          error: summarizeError(error),
        },
      });

      throw error;
    }
  }
}
