import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, Brain, Zap, Gavel, EyeOff } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import grokLogo from "@assets/grok--v2_1763216108457.jpg";

export type ModelId = "gpt-4o" | "claude-sonnet" | "gemini-flash" | "grok";
export type JudgeModelId = "claude-3-5-sonnet" | "gpt-4o" | "gemini-flash" | "grok";

export interface Model {
  id: ModelId;
  name: string;
  shortName: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconImage?: string;
  color: string;
}

export interface JudgeModel {
  id: JudgeModelId;
  name: string;
}

export const AVAILABLE_MODELS: Model[] = [
  { id: "gpt-4o", name: "GPT-4o", shortName: "GPT-4o", icon: Sparkles, color: "text-green-600" },
  { id: "claude-sonnet", name: "Claude Sonnet", shortName: "Claude", icon: Brain, color: "text-orange-600" },
  { id: "gemini-flash", name: "Gemini Flash", shortName: "Gemini", icon: Zap, color: "text-blue-600" },
  { id: "grok", name: "Grok", shortName: "Grok", iconImage: grokLogo, color: "text-foreground" },
];

export const JUDGE_MODELS: JudgeModel[] = [
  { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet (new)" },
  { id: "gpt-4o", name: "GPT-4o (Nov 2025)" },
  { id: "gemini-flash", name: "Gemini 1.5 Flash" },
  { id: "grok", name: "Grok-2-1212" },
];

interface ModelSelectorProps {
  selectedModels: ModelId[];
  onSelectionChange: (models: ModelId[]) => void;
  caesarEnabled: boolean;
  onCaesarToggle: (enabled: boolean) => void;
  caesarJudgeModel: JudgeModelId;
  onCaesarJudgeChange: (model: JudgeModelId) => void;
  blindModeEnabled: boolean;
  onBlindModeToggle: (enabled: boolean) => void;
}

export default function ModelSelector({ 
  selectedModels, 
  onSelectionChange,
  caesarEnabled,
  onCaesarToggle,
  caesarJudgeModel,
  onCaesarJudgeChange,
  blindModeEnabled,
  onBlindModeToggle,
}: ModelSelectorProps) {
  const handleToggle = (modelId: ModelId) => {
    if (selectedModels.includes(modelId)) {
      onSelectionChange(selectedModels.filter(id => id !== modelId));
    } else {
      onSelectionChange([...selectedModels, modelId]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(AVAILABLE_MODELS.map(m => m.id));
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const allSelected = selectedModels.length === AVAILABLE_MODELS.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium text-muted-foreground">Select Models to Compare</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={allSelected}
            data-testid="button-select-all"
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={selectedModels.length === 0}
            data-testid="button-clear-all"
          >
            Clear All
          </Button>
        </div>
      </div>
      
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
                  <span className="hidden sm:inline">{model.name}</span>
                  <span className="sm:hidden">{model.shortName}</span>
                </Label>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t">
        <div
          onClick={() => onCaesarToggle(!caesarEnabled)}
          className={`
            flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
            ${caesarEnabled 
              ? 'border-amber-500 bg-amber-500/10' 
              : 'border-border hover-elevate'
            }
          `}
          data-testid="checkbox-caesar"
        >
          <Checkbox
            checked={caesarEnabled}
            onCheckedChange={(checked) => onCaesarToggle(checked as boolean)}
            className="pointer-events-none"
            data-testid="checkbox-input-caesar"
          />
          <div className="flex items-center gap-2 flex-1">
            <Gavel className={`h-4 w-4 flex-shrink-0 ${caesarEnabled ? 'text-amber-600' : 'text-muted-foreground'}`} />
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1">
              <Label className="text-sm font-medium cursor-pointer">
                Caesar
                <span className="text-xs text-muted-foreground ml-1">(+3 credits)</span>
              </Label>
              {caesarEnabled && (
                <div onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={caesarJudgeModel}
                    onValueChange={(value) => onCaesarJudgeChange(value as JudgeModelId)}
                  >
                    <SelectTrigger className="h-8 w-[180px] text-xs" data-testid="select-caesar-judge">
                      <SelectValue placeholder="Select judge" />
                    </SelectTrigger>
                    <SelectContent>
                      {JUDGE_MODELS.map((judge) => (
                        <SelectItem key={judge.id} value={judge.id} data-testid={`option-judge-${judge.id}`}>
                          {judge.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 ml-1">
          Caesar is an AI model. Your battle data is sent to it for evaluation but is not stored by us.
        </p>
      </div>

      <div className="pt-4 border-t">
        <div
          onClick={() => onBlindModeToggle(!blindModeEnabled)}
          className={`
            flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
            ${blindModeEnabled 
              ? 'border-purple-500 bg-purple-500/10' 
              : 'border-border hover-elevate'
            }
          `}
          data-testid="checkbox-blind-mode"
        >
          <Checkbox
            checked={blindModeEnabled}
            onCheckedChange={(checked) => onBlindModeToggle(checked as boolean)}
            className="pointer-events-none"
            data-testid="checkbox-input-blind-mode"
          />
          <div className="flex items-center gap-2 flex-1">
            <EyeOff className={`h-4 w-4 flex-shrink-0 ${blindModeEnabled ? 'text-purple-600' : 'text-muted-foreground'}`} />
            <Label className="text-sm font-medium cursor-pointer">
              Blind Mode
            </Label>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 ml-1">
          Hide model names until you vote or Caesar decides. Models show as "Contender A", "Contender B", etc.
        </p>
      </div>
    </div>
  );
}
