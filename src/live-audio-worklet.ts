/**
 * Processor name used by the bundled Gemini Live microphone worklet.
 */
export const GEMINI_LIVE_AUDIO_WORKLET_PROCESSOR_NAME = "audio-processor";

/**
 * Source code for the bundled Gemini Live audio worklet.
 *
 * The processor downmixes incoming microphone channels to mono, converts the
 * samples to 16-bit PCM, and posts transferable `ArrayBuffer` chunks back to
 * the main thread for Live API ingestion.
 */
export const GEMINI_LIVE_AUDIO_WORKLET_SOURCE = `class GeminiLiveAudioProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) {
      return true;
    }

    const frameCount = input[0]?.length ?? 0;
    if (frameCount === 0) {
      return true;
    }

    const channelCount = input.length;
    const pcm16 = new Int16Array(frameCount);

    for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
      let sample = 0;

      for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
        sample += input[channelIndex]?.[frameIndex] ?? 0;
      }

      sample /= channelCount;
      sample = Math.max(-1, Math.min(1, sample));

      pcm16[frameIndex] = sample < 0
        ? Math.round(sample * 0x8000)
        : Math.round(sample * 0x7fff);
    }

    this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
    return true;
  }
}

registerProcessor("${GEMINI_LIVE_AUDIO_WORKLET_PROCESSOR_NAME}", GeminiLiveAudioProcessor);
`;

/**
 * Creates an object URL that can be passed to `audioWorklet.addModule(...)`.
 *
 * Consumers can use this helper directly, but `GeminiLiveChatSession` will
 * also use it automatically when no explicit `audioWorkletModulePath` is
 * provided.
 */
export function createGeminiLiveAudioWorkletModuleUrl(): string {
  if (typeof Blob === "undefined" || typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
    throw new Error(
      "Gemini Live audio worklet URLs require browser Blob and URL.createObjectURL support.",
    );
  }

  const blob = new Blob([GEMINI_LIVE_AUDIO_WORKLET_SOURCE], { type: "application/javascript" });
  return URL.createObjectURL(blob);
}

/**
 * Revokes a worklet object URL previously created with
 * `createGeminiLiveAudioWorkletModuleUrl(...)`.
 */
export function revokeGeminiLiveAudioWorkletModuleUrl(moduleUrl: string): void {
  if (typeof URL === "undefined" || typeof URL.revokeObjectURL !== "function") {
    return;
  }

  if (!moduleUrl.startsWith("blob:")) {
    return;
  }

  URL.revokeObjectURL(moduleUrl);
}
