import { GoogleGenAI } from "@google/genai";
import type { Tool } from "@google/genai";

/**
 * Options for configuring a Gemini service instance.
 */
export interface GeminiServiceOptions {
  /** The Google Gemini API key. If not provided, it will be resolved from environment variables. */
  apiKey?: string;
  /** A list of default tools (e.g., Google Search, Function Declarations) available to the model. */
  defaultTools?: Tool[];
  /** The specific API version to use (e.g., 'v1alpha', 'v1beta'). Required for some experimental features. */
  apiVersion?: string;
}

/**
 * Abstract base class for all Gemini service implementations.
 * Handles common initialization, API key resolution, and tool configuration.
 */
export abstract class GeminiBaseService {
  /** The initialized Google Gen AI client instance. */
  protected ai: GoogleGenAI;
  /** The default tools configured for this service instance. */
  protected defaultTools?: Tool[];

  /**
   * Creates a new instance of a Gemini service.
   *
   * @param options Configuration options including API key, default tools, and API version.
   */
  constructor(options?: GeminiServiceOptions) {
    const apiKey = options?.apiKey || this.resolveApiKey();
    const httpOptions = options?.apiVersion ? { apiVersion: options.apiVersion } : undefined;
    this.ai = new GoogleGenAI({ apiKey, httpOptions });
    this.defaultTools = options?.defaultTools;
  }

  /**
   * Resolves the Gemini API key from standard environment variables.
   * Prefers GEMINI_API_KEY for server-side use, with NEXT_PUBLIC_GEMINI_API_KEY
   * as an explicit browser-oriented fallback.
   *
   * @returns The resolved API key string, or an empty string if none is found.
   */
  private resolveApiKey(): string {
    return process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  }

  /**
   * Helper to get the underlying configured client.
   */
  public getClient(): GoogleGenAI {
    return this.ai;
  }

  /**
   * Lists common tools available, mapping friendly names to standard @google/genai Tool definitions.
   */
  public static getAvailableTools(): Record<string, Tool> {
    return {
      googleSearch: { googleSearch: {} },
      // Note: Code Execution is not exposed as a standard Tool in the same union shape by default in some TS SDKs,
      // but it is configured via tools array or directly on the config. We'll provide standard Google tools.
    };
  }
}
