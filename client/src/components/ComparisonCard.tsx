import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check, AlertCircle, Download, Star } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Model } from "./ModelSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ComparisonCardProps {
  model: Model;
  response?: string;
  isLoading?: boolean;
  error?: string;
  generationTime?: number;
  tokenCount?: number;
  prompt?: string;
}

export default function ComparisonCard({ 
  model, 
  response, 
  isLoading = false, 
  error,
  generationTime,
  tokenCount,
  prompt 
}: ComparisonCardProps) {
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const { toast } = useToast();
  const Icon = model.icon;

  const handleCopy = async () => {
    if (!response) return;
    
    await navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJSON = () => {
    if (!response) return;
    
    const exportData = {
      model: model.name,
      modelId: model.id,
      prompt: prompt || null,
      response,
      generationTime,
      tokenCount,
      timestamp: new Date().toISOString(),
      rating: rating || null
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${model.id}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported",
      description: "Response exported as JSON",
    });
  };

  const handleExportMarkdown = () => {
    if (!response) return;
    
    let markdown = `# ${model.name} Response\n\n`;
    if (prompt) {
      markdown += `## Prompt\n\n${prompt}\n\n`;
    }
    markdown += `## Response\n\n${response}\n\n`;
    markdown += `---\n\n`;
    if (generationTime) {
      markdown += `**Generation Time:** ${generationTime}ms\n\n`;
    }
    if (tokenCount) {
      markdown += `**Token Count:** ~${tokenCount}\n\n`;
    }
    if (rating) {
      markdown += `**Rating:** ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}\n\n`;
    }
    markdown += `**Exported:** ${new Date().toLocaleString()}\n`;
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${model.id}-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported",
      description: "Response exported as Markdown",
    });
  };

  return (
    <Card className="flex flex-col h-full" data-testid={`card-response-${model.id}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <div className="flex items-center gap-2 min-w-0">
          {Icon ? (
            <Icon className={`h-5 w-5 flex-shrink-0 ${model.color}`} />
          ) : model.iconImage ? (
            <img src={model.iconImage} alt={model.name} className="h-5 w-5 flex-shrink-0 object-contain" />
          ) : null}
          <h3 className="text-lg font-semibold truncate">
            <span className="hidden sm:inline">{model.name}</span>
            <span className="sm:hidden">{model.shortName}</span>
          </h3>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {generationTime && (
            <Badge variant="secondary" className="text-xs" data-testid={`badge-time-${model.id}`}>
              {generationTime}ms
            </Badge>
          )}
          {response && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="h-8 w-8"
                data-testid={`button-copy-${model.id}`}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    data-testid={`button-export-${model.id}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportJSON} data-testid={`button-export-json-${model.id}`}>
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportMarkdown} data-testid={`button-export-md-${model.id}`}>
                    Export as Markdown
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/6" />
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Error</p>
              <p className="text-sm text-destructive/90 mt-1">{error}</p>
            </div>
          </div>
        ) : response ? (
          <div 
            className="prose prose-sm max-w-none overflow-y-auto max-h-96 leading-relaxed"
            data-testid={`text-response-${model.id}`}
          >
            <p className="whitespace-pre-wrap text-foreground">{response}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Waiting for prompt...
          </p>
        )}
      </CardContent>

      {(tokenCount || response) && (
        <CardFooter className="pt-4 border-t">
          <div className="flex items-center justify-between w-full gap-4">
            {tokenCount && (
              <div className="text-xs text-muted-foreground">
                <span data-testid={`text-tokens-${model.id}`}>~{tokenCount} tokens</span>
              </div>
            )}
            {response && !error && (
              <div className="flex items-center gap-1" data-testid={`rating-${model.id}`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="p-0 hover:scale-110 transition-transform"
                    data-testid={`star-${model.id}-${star}`}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        star <= (hoveredStar || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
