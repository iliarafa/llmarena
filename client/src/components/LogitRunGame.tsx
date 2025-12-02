import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  Cell,
  LabelList
} from "recharts";
import { 
  Flame, 
  Trophy, 
  RotateCcw, 
  ArrowRight, 
  Zap,
  CheckCircle2,
  XCircle,
  Target
} from "lucide-react";
import { GAME_LEVELS, CATEGORY_COLORS, type GameLevel } from "@/data/logitLevels";
import { cn } from "@/lib/utils";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

type GameState = "playing" | "revealed" | "finished";

export default function LogitRunGame() {
  const [levels, setLevels] = useState<GameLevel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [guess, setGuess] = useState("");
  const [gameState, setGameState] = useState<GameState>("playing");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentLevel = levels[currentIndex];
  const totalLevels = levels.length;
  const progressPercent = totalLevels > 0 ? ((currentIndex + 1) / totalLevels) * 100 : 0;

  const initGame = useCallback(() => {
    setLevels(shuffleArray(GAME_LEVELS));
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCorrectCount(0);
    setGuess("");
    setGameState("playing");
    setIsCorrect(null);
    setShowFlash(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (gameState === "playing" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState, currentIndex]);

  const handleSubmit = () => {
    if (!currentLevel || gameState !== "playing" || !guess.trim()) return;

    const normalizedGuess = guess.trim().toLowerCase();
    const normalizedAnswer = currentLevel.top_token.toLowerCase();
    const correct = normalizedGuess === normalizedAnswer;

    setIsCorrect(correct);
    setGameState("revealed");
    setShowFlash(true);

    if (correct) {
      const newStreak = streak + 1;
      setScore(prev => prev + 10 + (newStreak * 2));
      setStreak(newStreak);
      setMaxStreak(prev => Math.max(prev, newStreak));
      setCorrectCount(prev => prev + 1);
    } else {
      setStreak(0);
    }

    setTimeout(() => setShowFlash(false), 600);
  };

  const handleNext = () => {
    if (currentIndex >= totalLevels - 1) {
      setGameState("finished");
    } else {
      setCurrentIndex(prev => prev + 1);
      setGuess("");
      setGameState("playing");
      setIsCorrect(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (gameState === "playing") {
        handleSubmit();
      } else if (gameState === "revealed") {
        handleNext();
      }
    }
  };

  const getCategoryStyle = (category: string) => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS["Idiom"];
  };

  if (levels.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (gameState === "finished") {
    const accuracy = totalLevels > 0 ? Math.round((correctCount / totalLevels) * 100) : 0;
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Card className="p-8 bg-black border-gray-800">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/20 mb-4">
              <Trophy className="w-10 h-10 text-amber-400" />
            </div>
            <h2 className="text-3xl font-bold text-white">Game Complete!</h2>
            
            <div className="grid grid-cols-3 gap-4 py-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-white">{score}</div>
                <div className="text-sm text-muted-foreground">Final Score</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-amber-400">{maxStreak}</div>
                <div className="text-sm text-muted-foreground">Best Streak</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-400">{accuracy}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
            </div>

            <Button 
              onClick={initGame}
              size="lg"
              className="bg-white text-black hover:bg-gray-200"
              data-testid="button-play-again"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const chartData = currentLevel.logits.map((item, index) => ({
    token: item.token,
    probability: Math.round(item.probability * 100),
    isCorrect: item.token.toLowerCase() === currentLevel.top_token.toLowerCase(),
    isGuessed: item.token.toLowerCase() === guess.trim().toLowerCase(),
  }));

  const categoryStyle = getCategoryStyle(currentLevel.category);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Header Stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Level:</span>
            <span className="font-mono font-bold text-white" data-testid="text-level">
              {currentIndex + 1}/{totalLevels}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-muted-foreground">Score:</span>
            <span className="font-mono font-bold text-white" data-testid="text-score">{score}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Flame className={cn(
            "w-4 h-4 transition-colors",
            streak > 0 ? "text-orange-500" : "text-muted-foreground"
          )} />
          <span className="text-muted-foreground">Streak:</span>
          <span className={cn(
            "font-mono font-bold",
            streak > 0 ? "text-orange-500" : "text-white"
          )} data-testid="text-streak">
            {streak}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={progressPercent} className="h-1" />

      {/* Game Card */}
      <Card className={cn(
        "relative overflow-hidden bg-black border-gray-800 transition-all duration-300",
        showFlash && isCorrect && "ring-2 ring-emerald-500/50",
        showFlash && isCorrect === false && "ring-2 ring-red-500/50"
      )}>
        {/* Flash Overlay */}
        {showFlash && (
          <div className={cn(
            "absolute inset-0 pointer-events-none transition-opacity duration-500",
            isCorrect ? "bg-emerald-500/10" : "bg-red-500/10"
          )} />
        )}

        <div className="p-6 space-y-6">
          {/* Category Badge */}
          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className={cn(
                "uppercase text-xs font-mono tracking-wider border",
                categoryStyle.bg,
                categoryStyle.text,
                categoryStyle.border
              )}
              data-testid="badge-category"
            >
              {currentLevel.category}
            </Badge>
            {gameState === "revealed" && (
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  isCorrect ? "text-emerald-400" : "text-red-400"
                )}>
                  {isCorrect ? "Correct!" : "Incorrect"}
                </span>
              </div>
            )}
          </div>

          {/* Context Display */}
          <div className="py-4">
            <p className="text-xl md:text-2xl font-mono text-white leading-relaxed" data-testid="text-context">
              {currentLevel.context}
              <span className="inline-block ml-1 w-24 border-b-2 border-dashed border-gray-600" />
            </p>
          </div>

          {/* Input or Result */}
          {gameState === "playing" ? (
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your prediction..."
                className="flex-1 bg-gray-900 border-gray-700 text-white font-mono text-lg h-12"
                data-testid="input-guess"
              />
              <Button 
                onClick={handleSubmit}
                disabled={!guess.trim()}
                className="h-12 px-6 bg-white text-black hover:bg-gray-200"
                data-testid="button-submit"
              >
                Submit
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Show correct answer if wrong */}
              {!isCorrect && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-muted-foreground">Correct answer:</span>
                  <span className="font-mono font-bold text-emerald-400 text-lg" data-testid="text-correct-answer">
                    {currentLevel.top_token}
                  </span>
                </div>
              )}

              {/* Bar Chart */}
              <div className="h-48 w-full" data-testid="chart-logits">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 50, left: 5, bottom: 5 }}
                  >
                    <XAxis 
                      type="number" 
                      domain={[0, 100]} 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="token" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 13, fontFamily: 'monospace' }}
                      width={80}
                    />
                    <Bar 
                      dataKey="probability" 
                      radius={[0, 4, 4, 0]}
                      maxBarSize={24}
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={entry.isCorrect ? '#10b981' : '#374151'}
                        />
                      ))}
                      <LabelList 
                        dataKey="probability" 
                        position="right" 
                        fill="#9ca3af"
                        fontSize={12}
                        formatter={(value: number) => `${value}%`}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Next Button */}
              <Button 
                onClick={handleNext}
                className="w-full h-12 bg-white text-black hover:bg-gray-200"
                data-testid="button-next"
              >
                {currentIndex >= totalLevels - 1 ? "See Results" : "Next Level"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Instructions */}
      {gameState === "playing" && (
        <p className="text-center text-xs text-muted-foreground">
          Predict the most likely next token. Press <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 font-mono text-xs">Enter</kbd> to submit.
        </p>
      )}
    </div>
  );
}
