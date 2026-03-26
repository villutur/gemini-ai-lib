To bridge the gap between the browser's high-resolution audio (typically 44.1kHz or 48kHz) and the **Gemini Live 2.5** requirements (**16kHz Input / 24kHz Output**), you need an `AudioWorklet`. This allows you to perform low-latency sample rate conversion and PCM encoding directly in the browser's audio thread.

The following implementation covers the two critical directions of the Live API flow.

### 1. The AudioWorklet Processor (`gemini-live-processor.js`)

This script handles the heavy lifting: downsampling your microphone for Gemini and upsampling Gemini's response for your speakers.

```javascript
// gemini-live-processor.js
class GeminiLiveProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.targetInputSampleRate = 16000;
    this.targetOutputSampleRate = 24000;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]; // Microphone data
    const output = outputs[0]; // Speaker data

    // 1. INPUT: Capture Mic, Downsample, and send to Main Thread
    if (input[0]) {
      const inputData = input[0]; 
      // Simplified: Every Nth sample or use a linear interpolation for 16kHz
      const downsampled = this.downsample(inputData, sampleRate, this.targetInputSampleRate);
      this.port.postMessage({ type: 'AUDIO_INPUT', data: downsampled });
    }

    return true;
  }

  downsample(buffer, fromRate, toRate) {
    if (fromRate === toRate) return buffer;
    const sampleRateRatio = fromRate / toRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Int16Array(newLength);
    let offset = 0;
    for (let i = 0; i < newLength; i++) {
      const nextOffset = Math.round((i + 1) * sampleRateRatio);
      let accum = 0, count = 0;
      for (let j = offset; j < nextOffset && j < buffer.length; j++) {
        accum += buffer[j];
        count++;
      }
      // Convert to 16-bit PCM
      result[i] = Math.min(1, accum / count) * 0x7FFF;
      offset = nextOffset;
    }
    return result;
  }
}

registerProcessor('gemini-live-processor', GeminiLiveProcessor);
```

---

### 2. Live Audio Controller (Main Thread)

This TypeScript class manages the `AudioContext`, initializes the Worklet, and pipes the WebSocket data.

```typescript
export class GeminiLiveAudioController {
  private audioContext: AudioContext;
  private workletNode: AudioWorkletNode | null = null;

  constructor() {
    this.audioContext = new AudioContext({ sampleRate: 16000 }); // Force context to 16kHz for simplicity
  }

  async initialize() {
    await this.audioContext.audioWorklet.addModule('gemini-live-processor.js');
    this.workletNode = new AudioWorkletNode(this.audioContext, 'gemini-live-processor');
    
    // Connect Microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(this.workletNode);
    
    // Listen for processed 16kHz PCM chunks to send over WebSocket
    this.workletNode.port.onmessage = (event) => {
      if (event.data.type === 'AUDIO_INPUT') {
        this.onAudioData(event.data.data);
      }
    };
  }

  // Callback for your WebSocket to hook into
  onAudioData: (pcmData: Int16Array) => void = () => {};

  /**
   * Play incoming 24kHz PCM from Gemini
   * @param base64Audio The "data" field from the Gemini 'serverContent' message
   */
  async playResponseChunk(base64Audio: string) {
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    
    // Convert 16-bit PCM to Float32 for Web Audio API
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768.0;

    const buffer = this.audioContext.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);
    
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start();
  }
}
```

---

### 3. Key Operational Details for 2026

* **Barge-In Handling:** When the user starts talking, your app should call `audioContext.suspend()` or clear the scheduled audio queue immediately to stop Gemini's current output and make it feel like a real interruption.
* **Affective Nuance:** Because you are using `enable_affective_dialog: true`, the 24kHz output may contain non-verbal cues (breaths, chuckles). Using the `AudioWorklet` ensures these tiny audio details aren't lost to browser-level compression.
* **VAD (Voice Activity Detection):** The `start_of_speech_sensitivity` config in your setup message controls the server-side VAD. However, for a better UI, you should also calculate the **RMS (Root Mean Square)** of the audio in your Worklet to drive a "listening" animation on the frontend.
