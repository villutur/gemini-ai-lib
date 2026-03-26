import type {
  Content,
  ContentEmbedding,
  ContentListUnion,
  EmbedContentMetadata,
  EmbedContentResponse,
  Part,
} from "@google/genai";
import { GeminiBaseService } from "./base.js";
import {
  GEMINI_EMBEDDING_MODELS,
  GEMINI_EMBEDDING_MODEL_DISPLAY_NAMES,
  getEmbeddingModelDisplayName,
  type KnownEmbeddingModel,
} from "./model-catalogs.js";

/**
 * Re-exported embedding-model catalogs and labels for convenience.
 */
export { GEMINI_EMBEDDING_MODELS, GEMINI_EMBEDDING_MODEL_DISPLAY_NAMES, getEmbeddingModelDisplayName };
export type { KnownEmbeddingModel };

/**
 * Supported models for embedding tasks.
 * Highlights the current stable and preview Gemini embedding pair while still
 * allowing callers to pass an explicit model string when needed.
 */
export type GeminiEmbeddingModel = KnownEmbeddingModel | string;

/**
 * Official task types supported by Gemini embedding models.
 */
export type GeminiEmbeddingTaskType =
  | "RETRIEVAL_QUERY"
  | "RETRIEVAL_DOCUMENT"
  | "SEMANTIC_SIMILARITY"
  | "CLASSIFICATION"
  | "CLUSTERING"
  | "CODE_RETRIEVAL_QUERY"
  | "QUESTION_ANSWERING"
  | "FACT_VERIFICATION";

/**
 * Options for configuring embedding generation requests.
 *
 * v1 intentionally stays on the stable Gemini API config surface and does not
 * expose Vertex-only options such as `mimeType` or `autoTruncate`.
 */
export interface GenerateEmbeddingOptions {
  /** Specific Gemini embedding model to use. Defaults to `gemini-embedding-001`. */
  model?: GeminiEmbeddingModel;
  /** Task type used to optimize embeddings for retrieval, similarity, or classification use cases. */
  taskType?: GeminiEmbeddingTaskType;
  /** Optional title used primarily for `RETRIEVAL_DOCUMENT` embeddings. */
  title?: string;
  /** Reduced output dimensionality using Matryoshka truncation where supported. */
  outputDimensionality?: number;
}

/**
 * Unified result returned by embedding helpers.
 */
export interface GenerateEmbeddingResult {
  /** Raw Gemini response payload. */
  response: EmbedContentResponse;
  /** First embedding for convenience when a single item was embedded. */
  embedding?: number[];
  /** All embeddings returned by the model in the same order as the inputs. */
  embeddings: number[][];
  /** Request metadata reported by the Gemini SDK when available. */
  metadata?: EmbedContentMetadata;
  /** Model id used for the request. */
  model: string;
}

const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001";

/**
 * Service dedicated to Gemini embedding generation.
 */
export class GeminiEmbeddingService extends GeminiBaseService {
  /**
   * Generates embeddings for text or multimodal Gemini content.
   *
   * @param contents The content or content-list payload to embed.
   * @param options Configuration options for the selected embedding model.
   * @returns A Promise resolving to normalized embedding vectors.
   */
  public async embedContent(contents: ContentListUnion, options?: GenerateEmbeddingOptions): Promise<GenerateEmbeddingResult> {
    const model = options?.model || DEFAULT_EMBEDDING_MODEL;
    const normalizedContents = this.assertValidEmbeddingInput(contents, model);

    await this.log({
      level: "info",
      source: "gemini.embedding",
      message: "Gemini embedding generation started.",
      status: "running",
      metadata: {
        model,
        inputMode: this.getEmbeddingInputMode(normalizedContents),
        itemCount: countEmbeddingItems(normalizedContents),
        taskType: options?.taskType,
        outputDimensionality: options?.outputDimensionality,
        hasTitle: Boolean(options?.title),
      },
    });

    try {
      const response = await this.ai.models.embedContent({
        model,
        contents: normalizedContents,
        config: {
          taskType: options?.taskType,
          title: options?.title,
          outputDimensionality: options?.outputDimensionality,
        },
      });

      const result = normalizeEmbeddingResult(response, model);

      await this.log({
        level: "info",
        source: "gemini.embedding",
        message: "Gemini embedding generation completed.",
        status: "success",
        metadata: {
          model,
          embeddingCount: result.embeddings.length,
          firstEmbeddingDimensions: result.embedding?.length ?? result.embeddings[0]?.length ?? 0,
        },
      });

      return result;
    } catch (error) {
      await this.log({
        level: "error",
        source: "gemini.embedding",
        message: "Gemini embedding generation failed.",
        status: "error",
        metadata: {
          model,
          error:
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                }
              : { value: String(error) },
        },
      });

      throw error;
    }
  }

  /**
   * Generates an embedding for a single text string.
   *
   * @param text Text to embed.
   * @param options Configuration options for the selected embedding model.
   * @returns A Promise resolving to normalized embedding vectors.
   */
  public async embedText(text: string, options?: GenerateEmbeddingOptions): Promise<GenerateEmbeddingResult> {
    const trimmedText = text.trim();
    if (!trimmedText) {
      throw new Error("Embedding generation requires a non-empty text input");
    }

    return this.embedContent(trimmedText, options);
  }

  /**
   * Generates embeddings for multiple text strings in one request.
   *
   * @param texts Text entries to embed in order.
   * @param options Configuration options for the selected embedding model.
   * @returns A Promise resolving to normalized embedding vectors.
   */
  public async embedTexts(texts: string[], options?: GenerateEmbeddingOptions): Promise<GenerateEmbeddingResult> {
    if (!texts.length) {
      throw new Error("Embedding generation requires at least one text input");
    }

    const normalizedTexts = texts.map((text) => text.trim());
    if (normalizedTexts.some((text) => !text)) {
      throw new Error("Embedding generation does not accept empty text items");
    }

    return this.embedContent(normalizedTexts, options);
  }

  private assertValidEmbeddingInput(contents: ContentListUnion, model: string): ContentListUnion {
    if (!hasEmbeddingContent(contents)) {
      throw new Error("Embedding generation requires at least one text or media input");
    }

    if (normalizeEmbeddingModel(model) === "gemini-embedding-001" && containsNonTextEmbeddingInput(contents)) {
      throw new Error("gemini-embedding-001 only supports text input for embeddings");
    }

    return contents;
  }

  private getEmbeddingInputMode(contents: ContentListUnion) {
    if (typeof contents === "string") {
      return "text";
    }

    if (Array.isArray(contents)) {
      if (!contents.length) {
        return "empty-array";
      }

      if (contents.every((item) => typeof item === "string")) {
        return "text-array";
      }

      if (contents.every((item) => typeof item !== "string" && isPart(item))) {
        return containsNonTextEmbeddingInput(contents) ? "multimodal-parts" : "text-parts";
      }

      return containsNonTextEmbeddingInput(contents) ? "content-array-multimodal" : "content-array-text";
    }

    return containsNonTextEmbeddingInput(contents) ? "content-multimodal" : "content-text";
  }
}

function normalizeEmbeddingResult(response: EmbedContentResponse, model: string): GenerateEmbeddingResult {
  const rawEmbeddings = response.embeddings ?? [];
  if (!rawEmbeddings.length) {
    throw new Error("No embeddings returned from Gemini");
  }

  const embeddings = rawEmbeddings.map((embedding, index) => normalizeEmbeddingVector(embedding, index));

  return {
    response,
    embedding: embeddings[0],
    embeddings,
    metadata: response.metadata,
    model,
  };
}

function normalizeEmbeddingVector(embedding: ContentEmbedding, index: number): number[] {
  const values = embedding.values;
  if (!values?.length) {
    throw new Error(`Gemini returned an empty embedding at index ${index}`);
  }

  return values;
}

function hasEmbeddingContent(contents: ContentListUnion): boolean {
  if (typeof contents === "string") {
    return contents.trim().length > 0;
  }

  if (Array.isArray(contents)) {
    return contents.length > 0 && contents.some((item) => hasEmbeddingItemContent(item));
  }

  return hasEmbeddingItemContent(contents);
}

function hasEmbeddingItemContent(item: string | Content | Part): boolean {
  if (typeof item === "string") {
    return item.trim().length > 0;
  }

  if (isPart(item)) {
    return hasPartContent(item);
  }

  return (item.parts ?? []).some((part) => hasPartContent(part));
}

function hasPartContent(part: Part): boolean {
  return Boolean(part.text?.trim() || part.inlineData || part.fileData);
}

function containsNonTextEmbeddingInput(contents: ContentListUnion): boolean {
  if (typeof contents === "string") {
    return false;
  }

  if (Array.isArray(contents)) {
    return contents.some((item) => itemContainsNonTextContent(item));
  }

  return itemContainsNonTextContent(contents);
}

function itemContainsNonTextContent(item: string | Content | Part): boolean {
  if (typeof item === "string") {
    return false;
  }

  if (isPart(item)) {
    return partIsNonText(item);
  }

  return (item.parts ?? []).some((part) => partIsNonText(part));
}

function partIsNonText(part: Part): boolean {
  return Boolean(part.inlineData || part.fileData);
}

function isPart(value: string | Content | Part): value is Part {
  return typeof value !== "string" && !("parts" in value);
}

function countEmbeddingItems(contents: ContentListUnion): number {
  if (typeof contents === "string") {
    return 1;
  }

  if (Array.isArray(contents)) {
    return contents.length;
  }

  return 1;
}

function normalizeEmbeddingModel(model: string) {
  return model.trim().toLowerCase();
}
