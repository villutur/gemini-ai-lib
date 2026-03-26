/**
 * Generic metadata describing an available prebuilt Gemini TTS voice.
 *
 * This catalog is exported as consumer guidance for model-aware UIs and voice
 * pickers. It does not act as strict runtime validation for `voiceName`.
 */
export interface GeminiAudioVoice {
  /** Stable Gemini prebuilt voice name. */
  name: string;
  /** Optional public sample URL for previewing the voice. */
  sampleUrl?: string;
  /** Lightweight pitch descriptor suitable for UI labels. */
  pitchLabel?: string;
  /** Short trait tags useful for dropdowns and cards. */
  characteristics?: readonly string[];
  /** High-level gender label when available in the curated source data. */
  gender?: string;
  /** Optional human-readable description distilled from the curated source data. */
  description?: string;
}

/**
 * Curated voice catalog used by the audio metadata layer.
 *
 * This catalog is normalized from an internal reference source and intentionally
 * excludes app-specific UI fields such as avatar paths.
 */
export const GEMINI_AUDIO_VOICE_CATALOG = [
  {
    name: "Zephyr",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Zephyr.wav",
    pitchLabel: "Higher",
    characteristics: ["Bright"],
    gender: "Female",
    description: "Enthusiastic, young-adult voice with clear articulation.",
  },
  {
    name: "Puck",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Puck.wav",
    pitchLabel: "Middle",
    characteristics: ["Upbeat"],
    gender: "Male",
    description: "Casual, energetic voice with an approachable tone.",
  },
  {
    name: "Charon",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Charon.wav",
    pitchLabel: "Lower",
    characteristics: ["Informative"],
    gender: "Male",
    description: "Deep, calm, professional voice with a resonant delivery.",
  },
  {
    name: "Kore",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Kore.wav",
    pitchLabel: "Middle",
    characteristics: ["Firm"],
    gender: "Female",
    description: "Bright, optimistic voice with clear, confident delivery.",
  },
  {
    name: "Fenrir",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Fenrir.wav",
    pitchLabel: "Lower middle",
    characteristics: ["Excitable"],
    gender: "Male",
    description: "Warm, inquisitive voice with friendly mid-range energy.",
  },
  {
    name: "Leda",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Leda.wav",
    pitchLabel: "Higher",
    characteristics: ["Youthful"],
    gender: "Female",
    description: "Youthful, bright voice with articulate and energetic delivery.",
  },
  {
    name: "Orus",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Orus.wav",
    pitchLabel: "Lower middle",
    characteristics: ["Firm"],
    gender: "Male",
    description: "Casual, inquisitive voice with clear articulation.",
  },
  {
    name: "Aoede",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Aoede.wav",
    pitchLabel: "Middle",
    characteristics: ["Breezy"],
    gender: "Female",
    description: "Professional, engaging voice with clear articulation.",
  },
  {
    name: "Callirrhoe",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Callirrhoe.wav",
    pitchLabel: "Middle",
    characteristics: ["Easy-going"],
    gender: "Female",
    description: "Friendly, inquisitive voice with polished delivery.",
  },
  {
    name: "Autonoe",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Autonoe.wav",
    pitchLabel: "Middle",
    characteristics: ["Bright"],
    gender: "Female",
    description: "Warm, articulate voice with an encouraging tone.",
  },
  {
    name: "Enceladus",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Enceladus.wav",
    pitchLabel: "Lower",
    characteristics: ["Breathy"],
    gender: "Male",
    description: "Energetic, confident voice with warm resonance.",
  },
  {
    name: "Iapetus",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Iapetus.wav",
    pitchLabel: "Lower middle",
    characteristics: ["Clear"],
    gender: "Male",
    description: "Confident, inviting voice with professional clarity.",
  },
  {
    name: "Umbriel",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Umbriel.wav",
    pitchLabel: "Lower middle",
    characteristics: ["Easy-going"],
    gender: "Male",
    description: "Resonant, confident voice with clear articulation.",
  },
  {
    name: "Algieba",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Algieba.wav",
    pitchLabel: "Lower",
    characteristics: ["Smooth"],
    gender: "Male",
    description: "Warm, articulate voice with smooth, enthusiastic delivery.",
  },
  {
    name: "Despina",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Despina.wav",
    pitchLabel: "Middle",
    characteristics: ["Smooth"],
    gender: "Female",
    description: "Energetic, warm voice with youthful clarity.",
  },
  {
    name: "Erinome",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Erinome.wav",
    pitchLabel: "Middle",
    characteristics: ["Clear"],
    gender: "Female",
    description: "Confident, professional voice with articulate delivery.",
  },
  {
    name: "Algenib",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Algenib.wav",
    pitchLabel: "Lower",
    characteristics: ["Gravelly"],
    gender: "Male",
    description: "Calm, smooth voice with a slightly gravelly texture.",
  },
  {
    name: "Rasalgethi",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Rasalgethi.wav",
    pitchLabel: "Middle",
    characteristics: ["Informative"],
    gender: "Male",
    description: "Energetic, inquisitive voice with crisp articulation.",
  },
  {
    name: "Laomedeia",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Laomedeia.wav",
    pitchLabel: "Higher",
    characteristics: ["Upbeat"],
    gender: "Female",
    description: "Warm, approachable voice with upbeat energy.",
  },
  {
    name: "Achernar",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Achernar.wav",
    pitchLabel: "Higher",
    characteristics: ["Soft"],
    gender: "Female",
    description: "Warm, inviting voice with a soft professional tone.",
  },
  {
    name: "Alnilam",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Alnilam.wav",
    pitchLabel: "Lower middle",
    characteristics: ["Firm"],
    gender: "Male",
    description: "Energetic, optimistic voice with clear articulation.",
  },
  {
    name: "Schedar",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Schedar.wav",
    pitchLabel: "Lower middle",
    characteristics: ["Even"],
    gender: "Male",
    description: "Casual, approachable voice with steady energy.",
  },
  {
    name: "Gacrux",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Gacrux.wav",
    pitchLabel: "Middle",
    characteristics: ["Mature"],
    gender: "Female",
    description: "Warm, inquisitive voice with mature clarity.",
  },
  {
    name: "Pulcherrima",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Pulcherrima.wav",
    pitchLabel: "Middle",
    characteristics: ["Forward"],
    gender: "Male",
    description: "Youthful, optimistic voice with energetic projection.",
  },
  {
    name: "Achird",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Achird.wav",
    pitchLabel: "Lower middle",
    characteristics: ["Friendly"],
    gender: "Male",
    description: "Warm, inquisitive voice with a friendly professional tone.",
  },
  {
    name: "Zubenelgenubi",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Zubenelgenubi.wav",
    pitchLabel: "Lower middle",
    characteristics: ["Casual"],
    gender: "Male",
    description: "Deep, resonant voice with a casual sophisticated tone.",
  },
  {
    name: "Vindemiatrix",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Vindemiatrix.wav",
    pitchLabel: "Middle",
    characteristics: ["Gentle"],
    gender: "Female",
    description: "Warm, inquisitive voice with a gentle young-adult tone.",
  },
  {
    name: "Sadachbia",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Sadachbia.wav",
    pitchLabel: "Lower",
    characteristics: ["Lively"],
    gender: "Male",
    description: "Resonant, professional voice with lively inquisitiveness.",
  },
  {
    name: "Sadaltager",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Sadaltager.wav",
    pitchLabel: "Middle",
    characteristics: ["Knowledgeable"],
    gender: "Male",
    description: "Articulate, professional voice with knowledgeable delivery.",
  },
  {
    name: "Sulafat",
    sampleUrl: "https://gstatic.com/aistudio/voices/samples/Sulafat.wav",
    pitchLabel: "Middle",
    characteristics: ["Warm"],
    gender: "Female",
    description: "Warm, enthusiastic voice with clear articulation.",
  },
] as const satisfies readonly GeminiAudioVoice[];

/**
 * Convenience string list for consumer dropdowns and enum-like UI controls.
 */
export const GEMINI_AUDIO_VOICES = GEMINI_AUDIO_VOICE_CATALOG.map((voice) => voice.name) as readonly string[];

/**
 * Union of known curated Gemini TTS voice names.
 */
export type GeminiAudioVoiceName = (typeof GEMINI_AUDIO_VOICES)[number];

/**
 * Returns a cloned list of the curated Gemini voice metadata so consumers can
 * safely enrich it in UI state without mutating the canonical export.
 */
export function getAudioVoiceOptions(): GeminiAudioVoice[] {
  return GEMINI_AUDIO_VOICE_CATALOG.map((voice) => ({
    ...voice,
    characteristics: voice.characteristics ? [...voice.characteristics] : undefined,
  }));
}

/**
 * Returns a cloned list of curated Gemini voice names for simple pickers.
 */
export function getAudioVoiceNames(): string[] {
  return [...GEMINI_AUDIO_VOICES];
}
