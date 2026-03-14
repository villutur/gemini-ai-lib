import { Chat, GenerateContentResponse } from "@google/genai";
import type { Content, GenerateContentConfig, Part } from "@google/genai";
import {
  GeminiBaseService,
  type GeminiServiceOptions,
} from "./base.js";
import type { TextGenerationModel } from "./text.js";

export type GeminiTextChatMessageRole = "user" | "model";

export interface GeminiTextChatMessage {
  role: GeminiTextChatMessageRole;
  text: string;
}

export function createGeminiTextChatHistory(
  messages: GeminiTextChatMessage[],
): Content[] {
  return messages.map((message) => ({
    role: message.role,
    parts: [{ text: message.text }],
  }));
}

/**
 * Options for configuring a persistent chat session.
 */
export interface ChatSessionOptions extends GeminiServiceOptions {
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
  /** Optional initial conversation history for the chat session. */
  history?: Content[];
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
    super(options);
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
      history: this.options.history,
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
    const model = this.options.model || "gemini-3-flash-preview";

    await this.log({
      level: "info",
      source: "gemini.chat",
      message: "Gemini chat message started.",
      status: "running",
      metadata: {
        model,
        inputType: typeof message === "string" ? "string" : "parts-array",
        historyEntries: this.options.history?.length ?? 0,
        hasSystemInstruction: Boolean(this.options.systemInstruction),
      },
    });

    try {
      const response = await chat.sendMessage({ message });

      await this.log({
        level: "info",
        source: "gemini.chat",
        message: "Gemini chat message completed.",
        status: "success",
        metadata: {
          model,
          textLength: response.text?.length ?? 0,
          hasText: Boolean(response.text),
        },
      });

      return response;
    } catch (error) {
      await this.log({
        level: "error",
        source: "gemini.chat",
        message: "Gemini chat message failed.",
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
   * Helper to return only the plain text portion of a chat reply.
   *
   * @param message The input message for the next chat turn.
   * @returns A Promise resolving to the response text, or an empty string.
   */
  public async sendMessageString(message: string | Part[]): Promise<string> {
    const response = await this.sendMessage(message);
    return response.text || "";
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
