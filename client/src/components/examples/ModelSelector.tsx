import { useState } from "react";
import ModelSelector, { type ModelId, type JudgeModelId, type MaximusModelId } from "../ModelSelector";

export default function ModelSelectorExample() {
  const [selectedModels, setSelectedModels] = useState<ModelId[]>(["gpt-4o", "claude-sonnet"]);
  const [caesarEnabled, setCaesarEnabled] = useState(false);
  const [caesarJudgeModel, setCaesarJudgeModel] = useState<JudgeModelId>("gemini-flash");
  const [blindModeEnabled, setBlindModeEnabled] = useState(false);
  const [maximusEnabled, setMaximusEnabled] = useState(false);
  const [maximusEngineModel, setMaximusEngineModel] = useState<MaximusModelId>("gemini-flash");

  return (
    <div className="p-6">
      <ModelSelector 
        selectedModels={selectedModels} 
        onSelectionChange={setSelectedModels}
        caesarEnabled={caesarEnabled}
        onCaesarToggle={setCaesarEnabled}
        caesarJudgeModel={caesarJudgeModel}
        onCaesarJudgeChange={setCaesarJudgeModel}
        blindModeEnabled={blindModeEnabled}
        onBlindModeToggle={setBlindModeEnabled}
        maximusEnabled={maximusEnabled}
        onMaximusToggle={setMaximusEnabled}
        maximusEngineModel={maximusEngineModel}
        onMaximusEngineChange={setMaximusEngineModel}
      />
      <div className="mt-4 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          Selected ({selectedModels.length}/4): {selectedModels.join(", ") || "None"}
        </p>
      </div>
    </div>
  );
}
