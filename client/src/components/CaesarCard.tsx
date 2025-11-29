import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gavel, Trophy, Clock } from "lucide-react";

export interface CaesarVerdict {
  winner: "A" | "B" | "C" | "D" | "Tie";
  confidence: number;
  one_line_verdict: string;
  detailed_reasoning: string[];
  scores: {
    [key: string]: {
      accuracy: number;
      clarity: number;
      creativity: number;
      safety: number;
      overall: number;
    };
  };
}

export interface CaesarResponse {
  verdict?: CaesarVerdict;
  error?: string;
  generationTime?: number;
  judgeModel: string;
  modelMapping: { [key: string]: string };
}

interface CaesarCardProps {
  caesarResponse?: CaesarResponse;
  isLoading?: boolean;
  modelNames: { [modelId: string]: string };
}

export default function CaesarCard({ caesarResponse, isLoading, modelNames }: CaesarCardProps) {
  if (isLoading) {
    return (
      <Card className="border-2 border-amber-500/50 bg-amber-50/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <Gavel className="h-5 w-5" />
            Caesar's Verdict
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
            <p className="text-sm text-muted-foreground">Caesar is deliberating...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!caesarResponse) {
    return null;
  }

  if (caesarResponse.error) {
    return (
      <Card className="border-2 border-red-500/50 bg-red-50/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Gavel className="h-5 w-5" />
            Caesar's Verdict
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{caesarResponse.error}</p>
        </CardContent>
      </Card>
    );
  }

  const { verdict, modelMapping, generationTime, judgeModel } = caesarResponse;
  
  if (!verdict) {
    return null;
  }

  const getWinnerName = () => {
    if (verdict.winner === "Tie") return "Tie";
    const modelId = modelMapping[verdict.winner];
    return modelNames[modelId] || modelId;
  };

  const getModelNameForLabel = (label: string) => {
    const modelId = modelMapping[label];
    if (modelId === "none") return "N/A";
    return modelNames[modelId] || modelId;
  };

  return (
    <Card className="border-2 border-amber-500/50 bg-gradient-to-br from-amber-50/10 to-orange-50/10 dark:from-amber-950/20 dark:to-orange-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Gavel className="h-5 w-5" />
            Caesar's Verdict
          </CardTitle>
          {generationTime && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {(generationTime / 1000).toFixed(1)}s
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Judge: {judgeModel}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <span className="font-semibold">Winner:</span>
          </div>
          <Badge 
            variant="default" 
            className="bg-amber-500 hover:bg-amber-600 text-white"
            data-testid="caesar-winner"
          >
            {getWinnerName()}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-medium">{(verdict.confidence * 100).toFixed(0)}%</span>
          </div>
          <Progress value={verdict.confidence * 100} className="h-2" />
        </div>

        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium" data-testid="caesar-verdict">
            {verdict.one_line_verdict}
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Reasoning:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {verdict.detailed_reasoning.map((reason, idx) => (
              <li key={idx} className="pl-2">{reason}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Scores:</h4>
          <div className="grid grid-cols-1 gap-2 text-xs">
            {Object.entries(verdict.scores).map(([label, scores]) => {
              const modelName = getModelNameForLabel(label);
              if (modelName === "N/A") return null;
              
              return (
                <div 
                  key={label} 
                  className={`p-2 rounded border ${
                    verdict.winner === label 
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30' 
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{modelName}</span>
                    <Badge variant="outline" className="text-xs">
                      Overall: {scores.overall}/10
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-muted-foreground">
                    <span>Acc: {scores.accuracy}</span>
                    <span>Clr: {scores.clarity}</span>
                    <span>Cre: {scores.creativity}</span>
                    <span>Saf: {scores.safety}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
