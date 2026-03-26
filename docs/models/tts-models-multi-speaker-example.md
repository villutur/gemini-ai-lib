To implement multi-speaker dialogues, the Gemini 2.5 TTS models use a specific mapping object within the `speech_config`. This allows the model to switch voices dynamically based on the "Speaker Name" identified in your text script.

### 1. The Multi-Speaker Script Format

For the model to distinguish between characters, your input text should follow a structured dialogue format:

> **Narrator:** The sun dipped below the horizon.
> **Kore:** Are we ready to leave yet?
> **Leda:** Just one more minute, I need to find my keys.

---

### 2. Multi-Speaker Configuration Object

In your API payload, you must map these labels (Narrator, Kore, Leda) to the model's prebuilt voices. This is handled via the `multi_speaker_voice_config`.

```typescript
// Example configuration for a 3-way dialogue
const multiSpeakerConfig = {
  speech_config: {
    multi_speaker_voice_config: {
      speaker_configs: [
        {
          speaker_label: "Narrator",
          voice_config: {
            prebuilt_voice_config: { voice_name: "Achernar" } // Deep, steady voice
          }
        },
        {
          speaker_label: "Kore",
          voice_config: {
            prebuilt_voice_config: { voice_name: "Kore" } // Energetic, bright voice
          }
        },
        {
          speaker_label: "Leda",
          voice_config: {
            prebuilt_voice_config: { voice_name: "Leda" } // Calm, melodic voice
          }
        }
      ]
    }
  }
};
```

---

### 3. Updated Payload Formatter

Here is how you would adjust your TypeScript utility to handle both single and multi-speaker modes dynamically:

```typescript
export const formatTTSApiPayload = (modelId: string, config: any) => {
  const isMulti = config.multiSpeaker && config.speakerMap;
  
  const speechConfig: any = {};

  if (isMulti) {
    // Map the UI's speaker settings to the API format
    speechConfig.multi_speaker_voice_config = {
      speaker_configs: Object.entries(config.speakerMap).map(([label, voice]) => ({
        speaker_label: label,
        voice_config: { prebuilt_voice_config: { voice_name: voice } }
      }))
    };
  } else {
    // Standard single-voice configuration
    speechConfig.voice_config = {
      prebuilt_voice_config: { voice_name: config.voiceName }
    };
  }

  return {
    model: modelId,
    contents: [{ parts: [{ text: config.userText }] }],
    config: {
      response_modalities: ["AUDIO"],
      speech_config: speechConfig
    }
  };
};
```

---

### 4. Implementation Tips for 2026

* **Contextual Prosody:** When using `gemini-2.5-pro-preview-tts`, the model analyzes the dialogue of "Speaker A" to determine the emotional tone of "Speaker B's" response. You don't always need SSML tags if the text context is strong.
* **Token Efficiency:** Multi-speaker setups do not increase the token count significantly, but ensure your `speaker_label` in the config exactly matches the name used in the text (case-sensitive).
* **Silence/Gaps:** To add natural pauses between speakers, use the SSML `<break time="1s"/>` tag within the text block of the speaker who just finished.

Would you like me to provide a **sample React component** that lets users assign different voices to a list of detected speaker names from their script?
