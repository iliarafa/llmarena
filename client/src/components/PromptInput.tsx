import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  creditCost?: number;
  creditBalance?: number;
}

export default function PromptInput({ 
  value, 
  onChange, 
  onSubmit, 
  isLoading = false,
  disabled = false,
  creditCost = 0,
  creditBalance = 0
}: PromptInputProps) {
  const characterCount = value.length;
  const hasInsufficientCredits = creditCost > creditBalance;
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!disabled && !isLoading && !hasInsufficientCredits) {
        onSubmit();
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-2xl shadow-md focus-within:ring-2 focus-within:ring-gray-200 dark:focus-within:ring-gray-700 focus-within:border-gray-900 dark:focus-within:border-gray-400 transition-all">
      <div className="p-4 pb-0">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "// Select models to begin..." : "// Enter your prompt here..."}
          className={`min-h-28 text-base resize-none border-0 shadow-none focus-visible:ring-0 p-0 bg-transparent ${disabled ? 'font-mono italic text-gray-300 dark:text-gray-600 placeholder:text-gray-300 dark:placeholder:text-gray-600' : 'placeholder:font-mono placeholder:italic placeholder:text-gray-300 dark:placeholder:text-gray-600'}`}
          disabled={disabled || isLoading}
          data-testid="input-prompt"
        />
      </div>
      
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-gray-400" data-testid="text-character-count">
            {characterCount} chars
          </span>
          
          <div className="flex items-center gap-2" data-testid="text-cost-preview">
            {creditCost > 0 ? (
              <span className={`text-xs font-mono ${hasInsufficientCredits ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                {creditCost} credits • {creditBalance.toFixed(0)} available
              </span>
            ) : (
              <span className="text-xs font-mono text-gray-400">
                {creditBalance.toFixed(0)} credits
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 hidden sm:block">
            ⌘ + Enter
          </span>
          <Button 
            onClick={onSubmit}
            disabled={disabled || isLoading || !value.trim() || hasInsufficientCredits}
            size="sm"
            className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 gap-2 px-4 font-medium"
            data-testid="button-compare"
          >
            <Send className="h-4 w-4" />
            {isLoading ? "Generating..." : "Compare"}
          </Button>
        </div>
      </div>
    </div>
  );
}
