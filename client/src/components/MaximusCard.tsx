import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sword, Clock, Copy, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export interface MaximusResponse {
  synthesis?: string;
  error?: string;
  generationTime?: number;
  maximusModel: string;
  tokenCount?: number;
}

interface MaximusCardProps {
  maximusResponse?: MaximusResponse;
  isLoading?: boolean;
}

export default function MaximusCard({ maximusResponse, isLoading }: MaximusCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    if (maximusResponse?.synthesis) {
      await navigator.clipboard.writeText(maximusResponse.synthesis);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "The Maximus response has been copied to your clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border-2 border-amber-400 bg-amber-50/30 dark:bg-amber-950/20" data-testid="maximus-card-loading">
        <Card className="rounded-xl bg-transparent border-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Sword className="h-5 w-5" />
              MAXIMUS
              <Badge variant="outline" className="ml-2 border-amber-500/50 text-amber-600 dark:text-amber-400 text-[10px]">
                The Ultimate Truth
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
              <Sparkles className="absolute inset-0 m-auto h-4 w-4 text-amber-400 animate-pulse" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Maximus is forging the ultimate answer...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!maximusResponse) {
    return null;
  }

  if (maximusResponse.error) {
    return (
      <div className="rounded-xl border-2 border-red-400 bg-red-50/30 dark:bg-red-950/20" data-testid="maximus-card-error">
        <Card className="rounded-xl bg-transparent border-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Sword className="h-5 w-5" />
              MAXIMUS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 dark:text-red-400">{maximusResponse.error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { synthesis, generationTime, maximusModel, tokenCount } = maximusResponse;

  if (!synthesis) {
    return null;
  }

  return (
    <div className="rounded-xl border-2 border-amber-400 bg-amber-50/30 dark:bg-amber-950/20" data-testid="maximus-card">
      <Card className="rounded-xl bg-transparent border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Sword className="h-5 w-5" />
              MAXIMUS
              <Badge variant="outline" className="ml-2 border-amber-500/50 text-amber-600 dark:text-amber-400 text-[10px]">
                The Ultimate Truth
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-3">
              {generationTime && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {(generationTime / 1000).toFixed(1)}s
                </span>
              )}
              {tokenCount && (
                <span className="text-xs text-muted-foreground">
                  {tokenCount} tokens
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopy}
                data-testid="button-copy-maximus"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground" data-testid="text-maximus-engine">Maximus Engine: {maximusModel}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gradient-to-br from-amber-100/50 to-yellow-100/50 dark:from-amber-950/40 dark:to-yellow-950/40 rounded-lg border border-amber-300/50 dark:border-amber-700/50">
            <div className="prose prose-sm dark:prose-invert max-w-none" data-testid="maximus-synthesis">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{synthesis}</p>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground italic">
            The Gold Standard. Forged from the best insights of all contenders.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
