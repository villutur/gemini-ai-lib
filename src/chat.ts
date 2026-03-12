import { Chat, GenerateContentResponse } from "@google/genai";
import type { GenerateContentConfig, Part } from "@google/genai";
import { GeminiBaseService } from "./base.js";
import type { TextGenerationModel } from "./text.js";

/**
 * Options for configuring a persistent chat session.
 */
export interface ChatSessionOptions {
  /** The specific text generation model to use. Defaults to 'gemini-3-flash-preview'. */
  model?: TextGenerationModel;
  /** System instructions to set the initial behavior and persona of the chat model. */
  systemInstruction?: string;
  /** Controls the randomness of the model's responses. */
  temperature?: number;
  /** Tools available to the model during this chat session (e.g., Google Search). */
  tools?: GenerateContentConfig["tools"];
  /** Configuration for safety filters. */
  safetySettings?: GenerateContentConfig["safetySettings"];
  /** Identifier for cached content, useful for reusing large contexts across sessions. */
  cachedContent?: string;
}

/**
 * Service to manage a persistent chat session.
 * Wraps @google/genai `client.chats.create` to automatically manage chat history.
 */
export class GeminiChatService extends GeminiBaseService {
  /** The active @google/genai Chat instance. */
  private chatSession: Chat | null = null;
  /** Configuration options for this specific chat session. */
  private options: ChatSessionOptions;

  /**
   * Creates a new instance of a Gemini chat service.
   *
   * @param options Configuration options for the chat session.
   */
  constructor(options: ChatSessionOptions = {}) {
    super();
    this.options = options;
  }

  /**
   * Initializes the chat session. This is called automatically on the first message,
   * but can be called manually if you need to pre-initialize the connection.
   *
   * @returns The active or newly created Chat object from the @google/genai SDK.
   */
  public initSession(): Chat {
    if (this.chatSession) return this.chatSession;

    const model = this.options.model || "gemini-3-flash-preview";
    const configTools = this.options.tools || this.defaultTools;

    const config: GenerateContentConfig = {
      systemInstruction: this.options.systemInstruction,
      temperature: this.options.temperature,
      tools: configTools,
      safetySettings: this.options.safetySettings,
      cachedContent: this.options.cachedContent,
    };

    this.chatSession = this.ai.chats.create({
      model: model,
      config: config,
    });

    return this.chatSession;
  }

  /**
   * Sends a message to the chat session. History is automatically preserved by the underlying SDK.
   * You can send a standard string, or an array of Parts (e.g. string + image attachment).
   *
   * @param message The input message, either as a plain string or an array of `Part` objects.
   * @returns A Promise resolving to the model's response.
   */
  public async sendMessage(message: string | Part[]): Promise<GenerateContentResponse> {
    const chat = this.initSession();
    return await chat.sendMessage({ message });
  }

  /**
   * Retrieves the current history of the active chat session.
   *
   * @returns A Promise resolving to an array of content objects representing the conversation history.
   */
  public async getHistory() {
    if (!this.chatSession) return [];
    return await this.chatSession.getHistory();
  }
}
