import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Coins } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

interface UsageHistoryEntry {
  id: string;
  timestamp: string;
  modelIds: string[];
  creditsCost: string;
  prompt: string;
}

const MODEL_NAMES: Record<string, string> = {
  "gpt-4o": "GPT-4o",
  "claude-sonnet": "Claude Sonnet",
  "gemini-flash": "Gemini Flash",
  "grok": "Grok",
};

export default function UsageHistory() {
  const { isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated && !!localStorage.getItem("guestToken");

  const { data: history = [], isLoading } = useQuery<UsageHistoryEntry[]>({
    queryKey: ["/api/usage-history"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: isAuthenticated || isGuest,
  });

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold" data-testid="text-page-title">Usage History</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
          </div>
        ) : history.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground" data-testid="text-no-history">
                No usage history yet. Start by comparing some models!
              </p>
              <Link href="/">
                <Button className="mt-4" data-testid="button-start-comparing">
                  Start Comparing
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Showing {history.length} recent comparison{history.length !== 1 ? "s" : ""}
            </p>
            
            {history.map((entry) => (
              <Card key={entry.id} data-testid={`history-entry-${entry.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-normal mb-2">
                        <span className="text-muted-foreground line-clamp-2">{entry.prompt}</span>
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <time dateTime={entry.timestamp}>{formatDate(entry.timestamp)}</time>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{parseFloat(entry.creditsCost).toFixed(0)} credits</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {entry.modelIds.map((modelId) => (
                      <Badge key={modelId} variant="secondary">
                        {MODEL_NAMES[modelId] || modelId}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
