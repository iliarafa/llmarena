import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Crown, EyeOff, Trash2, ShieldCheck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import grokLogo from "@assets/grok_1764386738517.png";
import chatGptLogo from "@assets/ChatGPT-Logo_1764386066627.png";
import geminiLogo from "@assets/gemini-color_1764386333911.png";
import claudeLogo from "@assets/claude-color_1764386516580.png";

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
  { id: "gpt-4o", name: "GPT-4o", shortName: "GPT-4o", iconImage: chatGptLogo, color: "text-green-600" },
  { id: "claude-sonnet", name: "Claude Sonnet", shortName: "Claude", iconImage: claudeLogo, color: "text-orange-600" },
  { id: "gemini-flash", name: "Gemini Flash", shortName: "Gemini", iconImage: geminiLogo, color: "text-blue-600" },
  { id: "grok", name: "Grok", shortName: "Grok", iconImage: grokLogo, color: "text-foreground" },
];

export const JUDGE_MODELS: JudgeModel[] = [
  { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet" },
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "gemini-flash", name: "Gemini Flash" },
  { id: "grok", name: "Grok-2" },
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
  const [isWiping, setIsWiping] = useState(false);
  const modelGridRef = useRef<HTMLDivElement>(null);

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

  const handleWipe = () => {
    if (selectedModels.length === 0) return;
    
    setIsWiping(true);
    
    setTimeout(() => {
      onSelectionChange([]);
      setIsWiping(false);
    }, 300);
  };

  const allSelected = selectedModels.length === AVAILABLE_MODELS.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Select Models
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSelectAll}
            disabled={allSelected}
            className="text-xs text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            data-testid="button-select-all"
          >
            Select All
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button
            onClick={handleWipe}
            disabled={selectedModels.length === 0 || isWiping}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            data-testid="button-wipe-session"
          >
            <Trash2 className="w-3 h-3" />
            Wipe
          </button>
        </div>
      </div>
      
      <div 
        ref={modelGridRef}
        className={`grid grid-cols-2 md:grid-cols-4 gap-3 transition-all ${isWiping ? 'dissolve-out' : ''}`}
      >
        {AVAILABLE_MODELS.map((model) => {
          const Icon = model.icon;
          const isSelected = selectedModels.includes(model.id);
          
          return (
            <button
              key={model.id}
              onClick={() => handleToggle(model.id)}
              className={`
                flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all
                ${isSelected 
                  ? 'ring-2 ring-gray-900 dark:ring-white bg-gray-50 dark:bg-gray-800 border-transparent text-gray-900 dark:text-white' 
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                }
              `}
              data-testid={`checkbox-model-${model.id}`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isSelected ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'}`}>
                {Icon ? (
                  <Icon className={`h-5 w-5 ${isSelected ? model.color : 'text-gray-400 dark:text-gray-500'}`} />
                ) : model.iconImage ? (
                  <img 
                    src={model.iconImage} 
                    alt={model.name} 
                    className={`object-contain ${isSelected ? '' : 'opacity-50'} ${model.id === 'gpt-4o' ? 'h-8 w-8' : 'h-6 w-6'}`} 
                  />
                ) : null}
              </div>
              <Label className={`text-sm font-medium cursor-pointer ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                <span className="hidden sm:inline">{model.shortName}</span>
                <span className="sm:hidden">{model.shortName}</span>
              </Label>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Crown className={`h-4 w-4 ${caesarEnabled ? 'text-amber-600' : 'text-gray-400'}`} />
              <Label htmlFor="caesar-toggle" className={`text-sm font-medium cursor-pointer ${caesarEnabled ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                Caesar
              </Label>
              {caesarEnabled && (
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full font-mono">
                  +3
                </span>
              )}
            </div>
            <Switch
              id="caesar-toggle"
              checked={caesarEnabled}
              onCheckedChange={onCaesarToggle}
              data-testid="checkbox-input-caesar"
            />
          </div>
          {caesarEnabled && (
            <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500" data-testid="text-caesar-privacy">
              <ShieldCheck className="w-3 h-3 flex-shrink-0" />
              <span>One-time API evaluation. Immediately discarded. No training.</span>
            </div>
          )}
        </div>

        {caesarEnabled && (
          <div className="flex items-center gap-2 pl-4 border-l border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-400">Judge:</span>
            <Select
              value={caesarJudgeModel}
              onValueChange={(value) => onCaesarJudgeChange(value as JudgeModelId)}
            >
              <SelectTrigger className="h-8 w-[140px] text-xs border-gray-200 dark:border-gray-700" data-testid="select-caesar-judge">
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

        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-2">
            <EyeOff className={`h-4 w-4 ${blindModeEnabled ? 'text-purple-600' : 'text-gray-400'}`} />
            <Label htmlFor="blind-toggle" className={`text-sm font-medium cursor-pointer ${blindModeEnabled ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              Blind
            </Label>
          </div>
          <Switch
            id="blind-toggle"
            checked={blindModeEnabled}
            onCheckedChange={onBlindModeToggle}
            data-testid="checkbox-input-blind-mode"
          />
        </div>
      </div>
    </div>
  );
}
