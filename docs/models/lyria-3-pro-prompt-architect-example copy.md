To help users get the most out of **Lyria 3 Pro**, a "Prompt Architect" UI is essential. This model doesn't just respond to a single sentence; it follows a structural map. By wrapping specific musical sections in brackets, you can control the "arrangement" of the 180-second track.

### 1. The "Prompt Architect" Component (React/TypeScript)

This component allows users to build a song block-by-block, ensuring the final string is formatted exactly how the Lyria 3 engine expects.

```tsx
import React, { useState } from 'react';

type SongSection = {
  type: 'Intro' | 'Verse' | 'Chorus' | 'Bridge' | 'Outro' | 'Solo';
  description: string;
};

export const LyriaPromptArchitect = () => {
  const [sections, setSections] = useState<SongSection[]>([
    { type: 'Intro', description: 'Soft acoustic guitar with a lo-fi vinyl crackle' }
  ]);

  const addSection = () => {
    setSections([...sections, { type: 'Verse', description: '' }]);
  };

  const updateSection = (index: number, desc: string) => {
    const newSections = [...sections];
    newSections[index].description = desc;
    setSections(newSections);
  };

  // The final string sent to the API
  const finalPrompt = sections
    .map(s => `[${s.type}: ${s.description}]`)
    .join(' ');

  return (
    <div className="p-4 border rounded-lg bg-gray-900 text-white">
      <h3 className="text-xl font-bold mb-4">Lyria 3 Song Architect</h3>
      
      {sections.map((section, index) => (
        <div key={index} className="flex gap-2 mb-3">
          <span className="w-24 font-mono text-cyan-400">[{section.type}]</span>
          <input
            className="flex-1 bg-gray-800 border border-gray-700 p-2 rounded"
            placeholder="Describe the instruments and mood..."
            value={section.description}
            onChange={(e) => updateSection(index, e.target.value)}
          />
        </div>
      ))}

      <button 
        onClick={addSection}
        className="mt-2 text-sm text-cyan-400 hover:underline"
      >
        + Add Section
      </button>

      <div className="mt-6 p-3 bg-black rounded border border-dashed border-gray-600">
        <p className="text-xs text-gray-400 uppercase mb-2">Final API Payload String:</p>
        <code className="text-sm break-words">{finalPrompt}</code>
      </div>
    </div>
  );
};
```

---

### 2. Strategic Tagging Tips for Lyria 3

When using this structural mode, the model looks for specific keywords inside the brackets to adjust the **intensity** and **arrangement** automatically:

* **[Intro]:** Lyria usually starts with minimal instrumentation here. Use words like *atmospheric*, *solo*, or *buildup*.
* **[Chorus]:** The model will automatically increase the `intensity` parameter internally. Mention *full band*, *anthemic*, or *layered harmonies*.
* **[Solo]:** This tells the model to prioritize a lead instrument (e.g., *Searing electric guitar solo* or *Virtuoso saxophone*) and suppress vocal generation temporarily.
* **[Outro]:** Best used for *fades*, *reverb-heavy tails*, or *returning to the intro motif*.

---

### 3. Implementation Logic: Merging Lyrics

If the user also provides a lyrics script, you should interleave the structural tags with the lyrics for the best synchronization.

**Recommended Data Structure:**

```json
{
  "prompt": "[Intro: Heavy synth] [Verse 1: Gritty vocals] In the neon rain, we find our way... [Chorus: High energy] Lights are blinding, heart is finding...",
  "config": {
    "structural_mode": true,
    "generate_lyrics": false // Set to false if passing your own lyrics in the prompt
  }
}
```

> **Note on 2026 Quotas:** Remember that `lyria-3-pro-preview` consumes significantly more compute credits than the `clip` version due to the complexity of the structural awareness and 180-second window.

Would you like me to show you how to handle the **JSON response for lyrics timestamps** so you can highlight the words in the UI as the music plays?
