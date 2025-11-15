import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function PromptInput({ 
  value, 
  onChange, 
  onSubmit, 
  isLoading = false,
  disabled = false 
}: PromptInputProps) {
  const characterCount = value.length;
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!disabled && !isLoading) {
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
      
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground" data-testid="text-character-count">
          {characterCount} characters
        </span>
        
        <Button 
          onClick={onSubmit}
          disabled={disabled || isLoading || !value.trim()}
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
