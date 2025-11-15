import { useState } from "react";
import ModelSelector, { type ModelId } from "../ModelSelector";

export default function ModelSelectorExample() {
  const [selectedModels, setSelectedModels] = useState<ModelId[]>(["gpt-4o", "claude-sonnet"]);

  return (
    <div className="p-6">
      <ModelSelector 
        selectedModels={selectedModels} 
        onSelectionChange={setSelectedModels}
      />
      <div className="mt-4 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          Selected: {selectedModels.join(", ") || "None"}
        </p>
      </div>
    </div>
  );
}
