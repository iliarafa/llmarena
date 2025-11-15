import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Coins } from "lucide-react";

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
    <div className="space-y-4">
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a prompt to compare responses across models..."
          className="min-h-32 text-lg resize-none pr-4"
          disabled={disabled || isLoading}
          data-testid="input-prompt"
        />
      </div>
      
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground" data-testid="text-character-count">
            {characterCount} characters
          </span>
          
          {creditCost > 0 && (
            <div className="flex items-center gap-2" data-testid="text-cost-preview">
              <Coins className="w-4 h-4 text-muted-foreground" />
              <span className={`text-sm font-medium ${hasInsufficientCredits ? 'text-destructive' : 'text-foreground'}`}>
                {creditCost} credits
              </span>
              {hasInsufficientCredits && (
                <span className="text-xs text-destructive">(insufficient)</span>
              )}
            </div>
          )}
        </div>
        
        <Button 
          onClick={onSubmit}
          disabled={disabled || isLoading || !value.trim() || hasInsufficientCredits}
          size="default"
          className="gap-2"
          data-testid="button-compare"
        >
          <Send className="h-4 w-4" />
          {isLoading ? "Generating..." : "Compare Models"}
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Tip: Press Cmd/Ctrl + Enter to submit
      </p>
    </div>
  );
}
