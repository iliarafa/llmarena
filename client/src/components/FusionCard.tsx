import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FlaskConical, Clock, Copy, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export interface FusionResponse {
  synthesis?: string;
  error?: string;
  generationTime?: number;
  fusionModel: string;
  tokenCount?: number;
}

interface FusionCardProps {
  fusionResponse?: FusionResponse;
  isLoading?: boolean;
}

export default function FusionCard({ fusionResponse, isLoading }: FusionCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    if (fusionResponse?.synthesis) {
      await navigator.clipboard.writeText(fusionResponse.synthesis);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "The synthesis has been copied to your clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[2px] animate-gradient-slow" data-testid="fusion-card-loading">
        <Card className="rounded-xl bg-white dark:bg-gray-950 border-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <FlaskConical className="h-5 w-5" />
              Fusion
              <Badge variant="outline" className="ml-2 border-indigo-500/50 text-indigo-600 dark:text-indigo-400 text-[10px]">
                The Synthesis
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
              <Sparkles className="absolute inset-0 m-auto h-4 w-4 text-indigo-400 animate-pulse" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Synthesizing the best insights...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!fusionResponse) {
    return null;
  }

  if (fusionResponse.error) {
    return (
      <div className="rounded-xl bg-gradient-to-r from-red-500 to-orange-500 p-[2px]" data-testid="fusion-card-error">
        <Card className="rounded-xl bg-white dark:bg-gray-950 border-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-600">
              <FlaskConical className="h-5 w-5" />
              Fusion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600">{fusionResponse.error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { synthesis, generationTime, fusionModel, tokenCount } = fusionResponse;

  if (!synthesis) {
    return null;
  }

  return (
    <div className="rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[2px] animate-gradient-slow" data-testid="fusion-card">
      <Card className="rounded-xl bg-white dark:bg-gray-950 border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <FlaskConical className="h-5 w-5" />
              Fusion
              <Badge variant="outline" className="ml-2 border-indigo-500/50 text-indigo-600 dark:text-indigo-400 text-[10px]">
                The Synthesis
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
                data-testid="button-copy-fusion"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground" data-testid="text-fusion-engine">Engine: {fusionModel}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50">
            <div className="prose prose-sm dark:prose-invert max-w-none" data-testid="fusion-synthesis">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{synthesis}</p>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground italic">
            This synthesis combines the best insights from all model responses into a unified answer.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
