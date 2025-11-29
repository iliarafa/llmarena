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
  isMobileFooter?: boolean;
  noModelsSelected?: boolean;
}

export default function PromptInput({ 
  value, 
  onChange, 
  onSubmit, 
  isLoading = false,
  disabled = false,
  creditCost = 0,
  creditBalance = 0,
  isMobileFooter = false,
  noModelsSelected = false,
}: PromptInputProps) {
  const characterCount = value.length;
  const hasInsufficientCredits = creditCost > creditBalance;
  const hasActiveCost = creditCost > 0;
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!disabled && !isLoading && !hasInsufficientCredits) {
        onSubmit();
      }
    }
  };

  if (isMobileFooter) {
    return (
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-3 safe-area-inset-bottom"
        data-testid="mobile-input-footer"
      >
        <div className="flex items-center gap-2 max-w-7xl mx-auto">
          <div className="flex-1 relative">
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? "Select models..." : "Enter prompt..."}
              className="min-h-[44px] max-h-24 py-2.5 px-3 text-base resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus-visible:ring-1 focus-visible:ring-gray-400"
              disabled={disabled || isLoading}
              rows={1}
              data-testid="input-prompt-mobile"
            />
          </div>
          <Button 
            onClick={onSubmit}
            disabled={disabled || isLoading || !value.trim() || hasInsufficientCredits}
            size="icon"
            className="h-11 w-11 rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 flex-shrink-0"
            data-testid="button-compare-mobile"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center justify-between px-1 mt-1.5">
          <span className="text-[10px] font-mono text-gray-400">
            {characterCount} chars
          </span>
          <div className="flex items-center gap-1">
            <span className={`text-[10px] font-mono ${hasActiveCost ? (hasInsufficientCredits ? 'text-red-500' : 'text-gray-900 dark:text-white font-medium') : 'text-gray-400'}`}>
              {creditCost} cr
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              • {creditBalance.toFixed(0)} avail
            </span>
          </div>
        </div>
      </div>
    );
  }

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
            {hasActiveCost ? (
              <span className={`text-xs font-mono ${hasInsufficientCredits ? 'text-red-500' : 'text-gray-900 dark:text-white font-medium'}`}>
                {creditCost} credits
              </span>
            ) : (
              <span className="text-xs font-mono text-gray-400">
                0 credits
              </span>
            )}
            <span className="text-xs font-mono text-gray-400">
              • {creditBalance.toFixed(0)} available
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 hidden sm:block">
            ⌘ + Enter
          </span>
          <Button 
            onClick={onSubmit}
            disabled={disabled || isLoading || !value.trim() || hasInsufficientCredits || noModelsSelected}
            size="sm"
            className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 gap-2 px-4 font-medium"
            data-testid="button-compare"
          >
            <Send className="h-4 w-4" />
            {isLoading ? (
              "Generating..."
            ) : noModelsSelected ? (
              "Select a Model"
            ) : (
              <>
                Compare Models
                <span className="opacity-70">• {creditCost} Credits</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
