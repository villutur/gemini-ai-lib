import { ActivityHandling, EndSensitivity, Modality, Session, StartSensitivity } from "@google/genai";
import type { FunctionCall, LiveConnectConfig, LiveServerMessage } from "@google/genai";
import { GeminiBaseService } from "./base.js";
import type { GeminiServiceOptions } from "./base.js";
import { geminiLog } from "./logger.js";
import {
  GEMINI_LIVE_MODELS,
  GEMINI_LIVE_MODEL_DISPLAY_NAMES,
  getLiveModelDisplayName,
  type KnownLiveGenerationModel,
} from "./model-catalogs.js";

/**
 * Re-exported live-model catalogs and labels for convenience.
 */
export { GEMINI_LIVE_MODELS, GEMINI_LIVE_MODEL_DISPLAY_NAMES, getLiveModelDisplayName };
export type { KnownLiveGenerationModel };

/**
 * Definition for a function calling tool available in a live session.
 */
export interface LiveToolDefinition {
  /** The unique name of the tool (must match regex `^[a-zA-Z0-9_]+$`). */
  name: string;
  /** Description explaining to the model when and how to use this tool. */
  description: string;
  /** JSON Schema representing the arguments the model must pass. */
  parametersJsonSchema: Record<string, unknown>;
  /** The local callback to execute when the model calls this tool. */
  handler?: (
    args: Record<string, unknown>,
  ) => Record<string, unknown> | Promise<Record<string, unknown>> | void | Promise<void>;
  /** Additional system instructions specific to this tool added dynamically to the prompt. */
  toolInstructions?: string;
}

/**
 * Configuration for Voice Activity Detection (VAD) during a live audio session.
 */
export interface VadConfig {
  /** How aggressively the model should detect the start of user speech. */
  startSensitivity?: "START_SENSITIVITY_LOW" | "START_SENSITIVITY_HIGH";
  /** How aggressively the model should detect the end of user speech. */
  endSensitivity?: "END_SENSITIVITY_LOW" | "END_SENSITIVITY_HIGH";
  /** Milliseconds of padded audio to keep before speech starts. */
  prefixPaddingMs?: number;
  /** Milliseconds of silence required before considering speech complete. */
  silenceDurationMs?: number;
}

/**
 * Configuration options for establishing a live streaming Gemini session.
 */
export interface LiveChatSessionOptions extends GeminiServiceOptions {
  /** High level instructions defining the agent's persona and tasks. */
  systemInstruction?: string;
  /** The name of the prebuilt voice to use (e.g., "Aoede", "Puck"). */
  voiceName?: string;
  /** The specific multimodal model version. */
  model?: KnownLiveGenerationModel | string;
  /** A list of custom tools the model can choose to execute. */
  tools?: LiveToolDefinition[];
  /** Callback fired when the WebSocket connection is successfully opened. */
  onOpen?: (config: LiveConnectConfig) => void;
  /** Callback fired for every message received from the server. */
  onMessage?: (message: LiveServerMessage) => void;
  /** Callback fired when a connection or logic error occurs. */
  onError?: (error: any) => void;
  /** Callback fired when the session completely closes or is stopped. */
  onEnd?: (reason?: any) => void;
  /** Callback fired when the model signals it is ready to receive input. */
  onSetupComplete?: () => void;
  /** Callback fired with streaming transcriptions of the model's spoken output. */
  onOutputTranscription?: (transcript: string, isFinal: boolean) => void;
  /** Callback fired with streaming transcriptions of the user's spoken input. */
  onInputTranscription?: (transcript: string, isFinal: boolean) => void;
  /** Callback fired when a tool is called by the model. */
  onToolCall?: (id: string, name: string, args: Record<string, unknown>) => void;
  /** Callback fired when a tool response is returned to the model. */
  onToolResponse?: (id: string, name: string, response: any) => void;

  // Session resilience
  /** Automatically attempt to reconnect if the session drops unexpectedly. Default is true. */
  autoReconnect?: boolean;
  /** Max number of consecutive connection attempts before giving up. Default is 3. */
  maxReconnectAttempts?: number;
  /** Callback fired when the server issues a `goAway` close warning. */
  onGoAway?: (timeLeft: string) => void;
  /** Callback fired indicating a reconnection attempt is starting. */
  onReconnecting?: (attempt: number) => void;
  /** Callback fired after a successful reconnection and resumption. */
  onReconnected?: () => void;

  // Built-in tools
  /** Enable the Gemini built-in Google Search grounding capability. */
  enableGoogleSearch?: boolean;

  // Native audio features (require v1alpha)
  /** Enables the model's emotional vocal adaptation (Affective Dialog). */
  enableAffectiveDialog?: boolean;
  /** Enables the model to proactively speak or stay silent based on context. */
  enableProactiveAudio?: boolean;

  // Thinking
  /** The token budget allocated for internal chain-of-thought. */
  thinkingBudget?: number;
  /** Whether to stream back the thought process before the final response. */
  includeThoughts?: boolean;

  // VAD
  /** Granular control over the Voice Activity Detection parameters. */
  vadConfig?: VadConfig;
  /** Path to the audio worklet module used for microphone capture processing. */
  audioWorkletModulePath?: string;
}

const DEFAULT_LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";
const DEFAULT_VOICE = "Aoede";
const DEFAULT_AUDIO_WORKLET_MODULE_PATH = "/audio-processor.js";

/**
 * Core service managing a bidirectional real-time audio and text session via Gemini Live API.
 * Orchestrates microphone capture, audio playback, tool call dispatching, and session resilience.
 */
export class GeminiLiveChatSession extends GeminiBaseService {
  private session: Session | null = null;
  private audioContext: AudioContext | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private nextChunkTime = 0;
  private scheduledAudioSources: AudioBufferSourceNode[] = [];
  private isAudioInputConnected = false;
  private isStopping = false;

  // Session resumption state
  private lastSessionHandle: string | null = null;
  private reconnectAttempts = 0;
  private lastGreetingPrompt?: string;
  private isReconnecting = false;

  private modelConfig: LiveConnectConfig = {};

  public options: LiveChatSessionOptions;

  /**
   * Initializes the live chat session configurations.
   * Modifies API version setting if experimental alpha features are enabled.
   */
  constructor(options: LiveChatSessionOptions = {}) {
    // If v1alpha features are needed, set apiVersion
    const needsAlpha = options.enableAffectiveDialog || options.enableProactiveAudio;
    const effectiveOptions = needsAlpha ? { ...options, apiVersion: "v1alpha" } : options;
    super(effectiveOptions);
    this.options = options;
    geminiLog.debug("GeminiLiveChatSession created with options:", options);
  }

  /**
   * Updates partial options mapping on the fly during a session.
   */
  setOptions(options: LiveChatSessionOptions) {
    geminiLog.debug("GeminiLiveChatSession options updated:", options);
    this.options = { ...this.options, ...options };
  }

  /**
   * Manually update the active tools available to the live session.
   */
  setTools(tools: LiveToolDefinition[] = []) {
    this.options.tools = tools;
  }

  /**
   * Connects microphone, provisions audio playback queues, and opens the live WebSocket.
   *
   * @param greetingPrompt An optional text message to send right after setup completes.
   * @returns The underlying Session object.
   */
  async connect(greetingPrompt?: string) {
    geminiLog.debug("Connecting GeminiLiveChatSession with options:", this.options);

    this.isAudioInputConnected = false;
    this.isStopping = false;
    this.reconnectAttempts = 0;
    this.lastSessionHandle = null;
    this.lastGreetingPrompt = greetingPrompt;

    geminiLog.debug(this.lastGreetingPrompt);

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      await this.audioContext.resume();

      // Initialize AudioWorklet immediately within the user gesture
      await this.audioContext.audioWorklet.addModule(
        this.options.audioWorkletModulePath || DEFAULT_AUDIO_WORKLET_MODULE_PATH,
      );

      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.audioWorkletNode = new AudioWorkletNode(this.audioContext, "audio-processor");

      return await this.connectLiveSession(greetingPrompt);
    } catch (err) {
      geminiLog.error("Failed to connect to Gemini Live:", err);
      this.options.onError?.(err);
      throw err;
    }
  }

  /**
   * Reconnect using session resumption handle.
   * Reuses existing audio infrastructure (stream, audioContext, worklet).
   */
  private async reconnect() {
    const maxAttempts = this.options.maxReconnectAttempts ?? 3;
    if (this.reconnectAttempts >= maxAttempts) {
      geminiLog.error(`Max reconnect attempts (${maxAttempts}) reached. Giving up.`);
      this.stopStreaming();
      return;
    }

    this.reconnectAttempts++;
    this.isReconnecting = true;
    this.isStopping = false;

    geminiLog.info(`Reconnecting (attempt ${this.reconnectAttempts}/${maxAttempts})...`);
    this.options.onReconnecting?.(this.reconnectAttempts);

    // Close old session without tearing down audio
    const oldSession = this.session;
    this.session = null;
    if (oldSession) {
      try {
        oldSession.close();
      } catch {
        /* no-op */
      }
    }

    // Clear scheduled audio
    this.scheduledAudioSources.forEach((s) => {
      s.onended = null;
      try {
        s.stop();
      } catch {
        /* no-op */
      }
      s.disconnect();
    });
    this.scheduledAudioSources = [];
    this.nextChunkTime = 0;

    // Disconnect audio input so it can be re-attached on open
    this.isAudioInputConnected = false;
    if (this.source && this.audioWorkletNode) {
      try {
        this.source.disconnect(this.audioWorkletNode);
      } catch {
        /* no-op */
      }
    }

    // Exponential backoff: 500ms, 1s, 2s...
    const delay = Math.min(500 * Math.pow(2, this.reconnectAttempts - 1), 5000);
    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      // Reconnect without greeting — context is resumed via handle
      await this.connectLiveSession();
      this.isReconnecting = false;
      this.reconnectAttempts = 0;
      geminiLog.info("Reconnected successfully.");
      this.options.onReconnected?.();
    } catch (err) {
      geminiLog.error("Reconnect failed:", err);
      this.isReconnecting = false;
      // Try again
      await this.reconnect();
    }
  }

  /**
   * Stops streaming, releases camera/microphone streams, and terminates the session.
   *
   * @param reason Optional termination reason payload log.
   */
  disconnect(reason?: any) {
    geminiLog.debug("Disconnecting session with reason:", reason);
    this.stopStreaming();
  }

  /**
   * Injects a text content turn into the live session timeline as a user action.
   *
   * @param text The text the model should read.
   */
  public sendTextMessage(text: string) {
    if (!this.session) {
      geminiLog.warn("Session not ready to send text message.");
      return;
    }

    this.session.sendClientContent({
      turns: [
        {
          role: "user",
          parts: [{ text }],
        },
      ],
      turnComplete: true,
    });
  }

  /**
   * Builds the tools array for the model configuration.
   * Includes Google Search, custom function declarations, and default service tools.
   *
   * @returns An array of Tool objects.
   */
  private buildModelTools() {
    const tools: any[] = [];

    // Built-in: Google Search grounding
    if (this.options.enableGoogleSearch) {
      tools.push({ googleSearch: {} });
    }

    // Custom function declarations
    if (this.options.tools?.length) {
      tools.push({
        functionDeclarations: this.options.tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          parametersJsonSchema: tool.parametersJsonSchema as any,
        })),
      });
    }

    // Default tools from base service
    if (this.defaultTools?.length) {
      tools.push(...this.defaultTools);
    }

    return tools;
  }

  /**
   * Constructs the full system instruction string.
   * Combines base instructions with dynamic tool-specific instructions.
   *
   * @returns The complete system instruction string.
   */
  private buildSystemInstruction() {
    const base = this.options.systemInstruction || "You are a helpful AI assistant.";

    if (!this.options.tools?.length) {
      return base.trim();
    }

    const toolInstructions = this.options.tools
      .map((tool) => tool.toolInstructions && `**${tool.name}**: ${tool.toolInstructions}`)
      .filter(Boolean)
      .join("\n");

    if (!toolInstructions) {
      return base.trim();
    }

    return `${base.trim()}\n\nTool Instructions:\n${toolInstructions}`.trim();
  }

  /**
   * Processes incoming tool calls from the Gemini server.
   * Dispatches calls to appropriate handlers and returns the results to the session.
   *
   * @param message The server message containing tool calls.
   */
  private async handleToolCalls(message: LiveServerMessage) {
    if (!this.session || !message.toolCall?.functionCalls?.length) return;

    const functionResponses = await Promise.all(
      message.toolCall.functionCalls.map(async (functionCall: FunctionCall) => {
        const id = functionCall.id || "";
        const name = functionCall.name || "";
        try {
          const toolDef = this.options.tools?.find((t) => t.name === name);
          const args = (functionCall.args as Record<string, unknown>) ?? {};

          this.options.onToolCall?.(id, name, args);

          if (!toolDef) {
            const response = {
              acknowledged: false,
              error: `Unsupported tool: ${name}`,
            };
            this.options.onToolResponse?.(id, name, response);
            return {
              id,
              name,
              response,
            };
          }

          if (!toolDef.handler) {
            const response = { acknowledged: true };
            this.options.onToolResponse?.(id, name, response);
            return {
              id,
              name,
              response,
            };
          }

          const result = await toolDef.handler(args);
          const response = { acknowledged: true, ...(result ?? {}) };
          this.options.onToolResponse?.(id, name, response);
          return {
            id,
            name,
            response,
          };
        } catch (error) {
          const response = { acknowledged: false, error: String(error) };
          this.options.onToolResponse?.(id, name, response);
          return {
            id,
            name,
            response,
          };
        }
      }),
    );

    this.session.sendToolResponse({ functionResponses });
  }

  private connectLiveSession(greetingPrompt?: string) {
    if (!this.ai) {
      throw new Error("Gemini client is not initialized");
    }

    const voiceName = this.options.voiceName || DEFAULT_VOICE;
    geminiLog.debug("Connecting live session with voice:", voiceName);

    const model = this.options.model || DEFAULT_LIVE_MODEL;

    this.modelConfig = {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName } },
      },
      tools: this.buildModelTools(),
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      systemInstruction: this.buildSystemInstruction(),
      contextWindowCompression: { slidingWindow: {} },
      // Session resumption
      sessionResumption: this.lastSessionHandle ? { handle: this.lastSessionHandle } : {},
      // Native audio features
      ...(this.options.enableAffectiveDialog && {
        enableAffectiveDialog: true,
      }),
      ...(this.options.enableProactiveAudio && {
        proactivity: { proactiveAudio: true },
      }),
      // Thinking config
      ...(this.options.thinkingBudget !== undefined && {
        thinkingConfig: {
          thinkingBudget: this.options.thinkingBudget,
          ...(this.options.includeThoughts && { includeThoughts: true }),
        },
      }),
      realtimeInputConfig: {
        activityHandling: ActivityHandling.START_OF_ACTIVITY_INTERRUPTS,
        // VAD config
        ...(this.options.vadConfig && {
          automaticActivityDetection: {
            ...(this.options.vadConfig.startSensitivity && {
              startOfSpeechSensitivity:
                this.options.vadConfig.startSensitivity === "START_SENSITIVITY_LOW"
                  ? StartSensitivity.START_SENSITIVITY_LOW
                  : StartSensitivity.START_SENSITIVITY_HIGH,
            }),
            ...(this.options.vadConfig.endSensitivity && {
              endOfSpeechSensitivity:
                this.options.vadConfig.endSensitivity === "END_SENSITIVITY_LOW"
                  ? EndSensitivity.END_SENSITIVITY_LOW
                  : EndSensitivity.END_SENSITIVITY_HIGH,
            }),
            ...(this.options.vadConfig.prefixPaddingMs !== undefined && {
              prefixPaddingMs: this.options.vadConfig.prefixPaddingMs,
            }),
            ...(this.options.vadConfig.silenceDurationMs !== undefined && {
              silenceDurationMs: this.options.vadConfig.silenceDurationMs,
            }),
          },
        }),
      },
    };

    const liveSessionPromise = this.ai.live
      .connect({
        model: model,
        callbacks: {
          onopen: () => {
            geminiLog.info("Live session opened with voice:", voiceName);

            if (this.audioWorkletNode) {
              this.audioWorkletNode.port.onmessage = (event) => {
                if (!this.session) return;
                const pcmData = event.data;
                const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData)));
                this.session.sendRealtimeInput({
                  media: { data: base64Data, mimeType: "audio/pcm;rate=24000" },
                });
              };
            }

            if (!this.isAudioInputConnected && this.source && this.audioWorkletNode && this.audioContext) {
              this.source.connect(this.audioWorkletNode);
              this.audioWorkletNode.connect(this.audioContext.destination);
              this.isAudioInputConnected = true;
            }
            this.options.onOpen?.(this.modelConfig);
          },
          onmessage: (message: LiveServerMessage) => {
            // ── GoAway handling ──
            if ((message as any).goAway) {
              const timeLeft = (message as any).goAway.timeLeft ?? "unknown";
              geminiLog.warn(`GoAway received. Time left: ${timeLeft}`);
              this.options.onGoAway?.(timeLeft);

              if (this.options.autoReconnect !== false) {
                void this.reconnect();
              }
              return;
            }

            // ── Session resumption handle tracking ──
            if ((message as any).sessionResumptionUpdate) {
              const update = (message as any).sessionResumptionUpdate;
              if (update.resumable && update.newHandle) {
                this.lastSessionHandle = update.newHandle;
                geminiLog.debug("Session resumption handle updated.");
              }
            }

            if (message.setupComplete) {
              geminiLog.info("Live session setup complete. Model is ready to respond.");
              this.options.onSetupComplete?.();

              if (greetingPrompt) {
                this.session?.sendClientContent({
                  turns: [{ role: "user", parts: [{ text: greetingPrompt }] }],
                  turnComplete: true,
                });
              }
            }

            if (message.toolCall?.functionCalls?.length) {
              void this.handleToolCalls(message);
            }

            const outputTranscription = message.serverContent?.outputTranscription;
            if (outputTranscription?.text || outputTranscription?.finished || message.serverContent?.turnComplete) {
              this.options.onOutputTranscription?.(
                outputTranscription?.text || "",
                Boolean(outputTranscription?.finished || message.serverContent?.turnComplete),
              );
            }

            const inputTranscription = message.serverContent?.inputTranscription;
            if (inputTranscription?.text || inputTranscription?.finished || message.serverContent?.turnComplete) {
              this.options.onInputTranscription?.(
                inputTranscription?.text || "",
                Boolean(inputTranscription?.finished || message.serverContent?.turnComplete),
              );
            }

            this.options.onMessage?.(message);
            this.handleAudioOutput(message);
          },
          onerror: (error) => {
            geminiLog.error("Live session error:", error);
            this.options.onError?.(error);
          },
          onclose: () => {
            geminiLog.info("Live session closed");
            if (this.isStopping) return;

            // Unexpected close — try to reconnect
            if (this.options.autoReconnect !== false && !this.isReconnecting) {
              geminiLog.warn("Unexpected session close. Attempting reconnection...");
              void this.reconnect();
              return;
            }

            this.stopStreaming();
          },
        },
        config: this.modelConfig,
      })
      .then((session) => {
        this.session = session;
        geminiLog.debug("Live session connected successfully with voice:", voiceName);
        return session;
      })
      .catch((error) => {
        geminiLog.error("Failed to connect live session with voice:", voiceName, "Error:", error);
        throw error;
      });

    return liveSessionPromise;
  }

  /**
   * Processes binary audio output from the model and schedules it for playback
   * using the Web Audio API (AudioContext). Handles Int16 to Float32 conversion
   * and precise scheduling to avoid jitter.
   *
   * @param message The server message containing audio data.
   */
  private handleAudioOutput(message: LiveServerMessage) {
    if (!this.audioContext || this.audioContext.state === "closed") return;

    const audioParts = message.serverContent?.modelTurn?.parts ?? [];
    for (const part of audioParts) {
      const base64Audio = part.inlineData?.data;
      if (!base64Audio) continue;

      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const int16Data = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(int16Data.length);
      for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 0x7fff;
      }

      const audioBuffer = this.audioContext.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      const currentTime = this.audioContext.currentTime;
      if (this.nextChunkTime < currentTime) {
        this.nextChunkTime = currentTime + 0.05;
      }

      source.start(this.nextChunkTime);
      this.nextChunkTime += audioBuffer.duration;

      this.scheduledAudioSources.push(source);

      source.onended = () => {
        this.scheduledAudioSources = this.scheduledAudioSources.filter((s) => s !== source);
      };
    }
  }

  /**
   * Internal helper to tear down all audio and network resources.
   *
   * @param options Teardown options (e.g., whether to suppress the onEnd callback).
   */
  private stopStreaming(options: { suppressOnEnd?: boolean } = {}) {
    if (this.isStopping) return;
    this.isStopping = true;

    this.scheduledAudioSources.forEach((source) => {
      source.onended = null;
      try {
        source.stop();
      } catch {
        // no-op
      }
      source.disconnect();
    });
    this.scheduledAudioSources = [];
    this.nextChunkTime = 0;

    this.isAudioInputConnected = false;

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      void this.audioContext.close();
    }
    this.audioContext = null;

    const sessionToClose = this.session;
    this.session = null;
    if (sessionToClose) sessionToClose.close();

    if (!options.suppressOnEnd && this.options.onEnd) {
      this.options.onEnd();
    }
  }
}
