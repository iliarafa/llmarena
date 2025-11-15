import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sparkles, Brain, Zap } from "lucide-react";
import grokLogo from "@assets/grok--v2_1763216108457.jpg";

export type ModelId = "gpt-4o" | "claude-sonnet" | "gemini-flash" | "grok";

export interface Model {
  id: ModelId;
  name: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconImage?: string;
  color: string;
}

export const AVAILABLE_MODELS: Model[] = [
  { id: "gpt-4o", name: "GPT-4o", icon: Sparkles, color: "text-green-600" },
  { id: "claude-sonnet", name: "Claude Sonnet", icon: Brain, color: "text-orange-600" },
  { id: "gemini-flash", name: "Gemini Flash", icon: Zap, color: "text-blue-600" },
  { id: "grok", name: "Grok", iconImage: grokLogo, color: "text-foreground" },
];

interface ModelSelectorProps {
  selectedModels: ModelId[];
  onSelectionChange: (models: ModelId[]) => void;
}

export default function ModelSelector({ selectedModels, onSelectionChange }: ModelSelectorProps) {
  const handleToggle = (modelId: ModelId) => {
    if (selectedModels.includes(modelId)) {
      onSelectionChange(selectedModels.filter(id => id !== modelId));
    } else {
      onSelectionChange([...selectedModels, modelId]);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">Select Models to Compare</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {AVAILABLE_MODELS.map((model) => {
          const Icon = model.icon;
          const isSelected = selectedModels.includes(model.id);
          
          return (
            <div
              key={model.id}
              onClick={() => handleToggle(model.id)}
              className={`
                flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                ${isSelected 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover-elevate'
                }
              `}
              data-testid={`checkbox-model-${model.id}`}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleToggle(model.id)}
                className="pointer-events-none"
                data-testid={`checkbox-input-${model.id}`}
              />
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {Icon ? (
                  <Icon className={`h-4 w-4 flex-shrink-0 ${model.color}`} />
                ) : model.iconImage ? (
                  <img src={model.iconImage} alt={model.name} className="h-4 w-4 flex-shrink-0 object-contain" />
                ) : null}
                <Label className="text-sm font-medium cursor-pointer truncate">
                  {model.name}
                </Label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
