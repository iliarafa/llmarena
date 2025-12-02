import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gamepad2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeProvider";
import LogitRunGame from "@/components/LogitRunGame";

export default function LogitRunPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-black">
      <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-12 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-purple-500" />
              <h1 className="text-lg md:text-xl font-bold" data-testid="text-page-title">
                Logit Run
              </h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Game Description */}
          <div className="max-w-2xl mx-auto text-center mb-6 md:mb-8 space-y-2">
            <p className="text-muted-foreground text-sm md:text-base">
              Think like an LLM! Predict the most probable next token to build your streak.
            </p>
          </div>

          {/* Game Component */}
          <LogitRunGame />
        </div>
      </main>
    </div>
  );
}
