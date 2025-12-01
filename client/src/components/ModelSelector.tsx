import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Crown, EyeOff, Trash2, Sword } from "lucide-react";
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
export type MaximusModelId = "claude-3-5-sonnet" | "gpt-4o" | "gemini-flash" | "grok";

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

export interface MaximusModel {
  id: MaximusModelId;
  name: string;
}

export const MAXIMUS_MODELS: MaximusModel[] = [
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
  maximusEnabled: boolean;
  onMaximusToggle: (enabled: boolean) => void;
  maximusEngineModel: MaximusModelId;
  onMaximusEngineChange: (model: MaximusModelId) => void;
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
  maximusEnabled,
  onMaximusToggle,
  maximusEngineModel,
  onMaximusEngineChange,
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
                flex flex-col items-center justify-center gap-2 p-4 cursor-pointer transition-all
                ${isSelected 
                  ? 'ring-2 ring-gray-900 dark:ring-white bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white' 
                  : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
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

      <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full p-4 gap-0 md:gap-6 bg-white dark:bg-gray-900">
        <div className="w-full md:w-auto flex flex-row items-center justify-between py-3 md:py-0">
          <div className="flex items-center gap-2">
            <Crown className={`h-4 w-4 ${caesarEnabled ? 'text-amber-500' : 'text-gray-400'}`} />
            <Label htmlFor="caesar-toggle" className={`text-sm font-medium cursor-pointer -ml-1 ${caesarEnabled ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              Caesar
            </Label>
            {caesarEnabled && (
              <Select
                value={caesarJudgeModel}
                onValueChange={(value) => onCaesarJudgeChange(value as JudgeModelId)}
              >
                <SelectTrigger 
                  className="h-7 w-[130px] text-xs font-medium bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ml-2 mr-3 animate-in fade-in slide-in-from-left-1 duration-200" 
                  data-testid="select-caesar-judge"
                >
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
            )}
          </div>
          <Switch
            id="caesar-toggle"
            checked={caesarEnabled}
            onCheckedChange={onCaesarToggle}
            activeLabel="+3"
            activeColor="amber"
            className="ml-2"
            data-testid="checkbox-input-caesar"
          />
        </div>

        <div className="w-full md:w-auto flex flex-row items-center justify-between py-3 md:py-0">
          <div className="flex items-center gap-2">
            <Sword className={`h-4 w-4 ${maximusEnabled ? 'text-[#800020]' : 'text-gray-400'}`} />
            <Label htmlFor="maximus-toggle" className={`text-sm font-medium cursor-pointer -ml-1 ${maximusEnabled ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              Maximus
            </Label>
            {maximusEnabled && (
              <Select
                value={maximusEngineModel}
                onValueChange={(value) => onMaximusEngineChange(value as MaximusModelId)}
              >
                <SelectTrigger 
                  className="h-7 w-[130px] text-xs font-medium bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ml-2 mr-3 animate-in fade-in slide-in-from-left-1 duration-200" 
                  data-testid="select-maximus-engine"
                >
                  <SelectValue placeholder="Select engine" />
                </SelectTrigger>
                <SelectContent>
                  {MAXIMUS_MODELS.map((engine) => (
                    <SelectItem key={engine.id} value={engine.id} data-testid={`option-maximus-${engine.id}`}>
                      {engine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <Switch
            id="maximus-toggle"
            checked={maximusEnabled}
            onCheckedChange={onMaximusToggle}
            activeLabel="+5"
            activeColor="burgundy"
            className="ml-2"
            data-testid="checkbox-input-maximus"
          />
        </div>

        <div className="w-full md:w-auto flex flex-row items-center justify-between py-3 md:py-0">
          <div className="flex items-center gap-2">
            <EyeOff className={`h-4 w-4 ${blindModeEnabled ? 'text-purple-600' : 'text-gray-400'}`} />
            <Label htmlFor="blind-toggle" className={`text-sm font-medium cursor-pointer -ml-1 ${blindModeEnabled ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              Blind
            </Label>
          </div>
          <Switch
            id="blind-toggle"
            checked={blindModeEnabled}
            onCheckedChange={onBlindModeToggle}
            className="ml-2"
            data-testid="checkbox-input-blind-mode"
          />
        </div>
      </div>
    </div>
  );
}
