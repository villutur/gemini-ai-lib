This is a highly practical set of tools for building a developer-focused LLM interface. I have organized the code into a clear, modular React structure with a robust helper for the API payload and a smart "Reset" logic that understands the generational differences between Gemini 2.5 and 3.x.

### 1. The React Component Skeleton

This component uses a simplified state to manage the selected model and its specific configurations.

```tsx
import React, { useState, useEffect } from "react";
import { ALL_TEXT_MODELS, UnifiedModelMetadata } from "./modelData";
import { formatApiPayload, getModelDefaults } from "./utils";

const ModelConfigDialog = () => {
  const [selectedModelId, setSelectedModelId] = useState("gemini-3.1-pro-preview");
  const [config, setConfig] = useState(getModelDefaults("gemini-3.1-pro-preview"));

  const activeModel = ALL_TEXT_MODELS[selectedModelId];

  // Handle model change and reset to that model's specific defaults
  const handleModelChange = (id: string) => {
    setSelectedModelId(id);
    setConfig(getModelDefaults(id));
  };

  const handleReset = () => {
    setConfig(getModelDefaults(selectedModelId));
  };

  return (
    <div className="p-6 border rounded-lg shadow-sm bg-white max-w-2xl">
      <h2 className="text-xl font-bold mb-4">Model Configuration</h2>

      {/* Model Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Select Model</label>
        <select
          value={selectedModelId}
          onChange={(e) => handleModelChange(e.target.value)}
          className="w-full p-2 border rounded"
        >
          {Object.values(ALL_TEXT_MODELS).map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">{activeModel.description}</p>
      </div>

      {/* Generation Configs */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium">Temperature ({config.temperature})</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={config.temperature}
            onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>
        {/* Only show thinking config if applicable */}
        {activeModel.thinking.type === "level" ? (
          <div>
            <label className="block text-sm font-medium">Thinking Level</label>
            <select
              value={config.thinkingLevel}
              onChange={(e) => setConfig({ ...config, thinkingLevel: e.target.value })}
              className="w-full p-2 border rounded"
            >
              {activeModel.thinking.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium">Thinking Budget (Tokens)</label>
            <input
              type="number"
              value={config.thinkingBudget}
              onChange={(e) => setConfig({ ...config, thinkingBudget: parseInt(e.target.value) })}
              className="w-full p-2 border rounded"
            />
          </div>
        )}
      </div>

      {/* Toggle Options */}
      <div className="space-y-2 mb-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={config.includeThoughts}
            onChange={(e) => setConfig({ ...config, includeThoughts: e.target.checked })}
          />
          Include Raw Thoughts in Response
        </label>
      </div>

      <div className="flex gap-2">
        <button onClick={handleReset} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
          Reset to Defaults
        </button>
        <button
          onClick={() => console.log(formatApiPayload(selectedModelId, config))}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Generate Content
        </button>
      </div>
    </div>
  );
};
```

---

### 2. The Payload Helper & Reset Logic

This logic handles the crucial task of ensuring `thinkingBudget` and `thinkingLevel` are never sent in the same request (which causes a 400 error).

```typescript
// utils.ts

export const getModelDefaults = (modelId: string) => {
  const model = ALL_TEXT_MODELS[modelId];

  // Shared defaults
  const base = {
    temperature: 1.0,
    topP: 0.95,
    topK: 64,
    includeThoughts: false,
  };

  // Generation-specific defaults
  if (model.generation === "3.x") {
    return {
      ...base,
      thinkingLevel: model.thinking.default,
      thinkingBudget: undefined, // Clear legacy param
      mediaResolution: "medium",
    };
  } else {
    return {
      ...base,
      thinkingLevel: undefined, // Clear new param
      thinkingBudget: model.thinking.default,
    };
  }
};

export const formatApiPayload = (modelId: string, config: any) => {
  const model = ALL_TEXT_MODELS[modelId];

  const payload: any = {
    model: model.id,
    generationConfig: {
      temperature: config.temperature,
      topP: config.topP,
      maxOutputTokens: config.maxOutputTokens || 8192,
      responseMimeType: config.responseMimeType || "text/plain",
    },
  };

  // Logic: Ensure we don't mix generation params
  if (model.generation === "3.x") {
    payload.generationConfig.thinkingConfig = {
      includeThoughts: config.includeThoughts,
      thinkingLevel: config.thinkingLevel,
    };
    // Model-specific media control
    payload.generationConfig.mediaResolution = config.mediaResolution;
  } else {
    payload.generationConfig.thinkingConfig = {
      includeThoughts: config.includeThoughts,
      thinkingBudget: config.thinkingBudget,
    };
  }

  return payload;
};
```

---

### 3. Key Observations for 2026 Models

- **Gemini 3.1 Pro:** The `thinkingLevel: "high"` is your toggle for **Deep Think Mini**. For simpler tasks, the `medium` level (introduced in 3.1) is the sweet spot for cost and speed.
- **Thought Signatures:** If you are building a chat interface, remember that Gemini 3.x responses often include a `thoughtSignature`. You **must** include this signature in the next turn of the conversation (within the `Model` part) to maintain reasoning continuity, even if `thinkingLevel` is set to `minimal`.
- **Temperature Lock:** In your UI, you might consider disabling the temperature slider for Gemini 3.x models or adding a warning, as they are calibrated heavily toward `1.0`.

