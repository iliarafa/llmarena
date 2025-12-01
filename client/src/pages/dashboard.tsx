import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Coins, TrendingUp, Activity } from "lucide-react";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/ThemeProvider";

interface UsageStats {
  totalComparisons: number;
  totalCreditsSpent: string;
  recentActivity: {
    timestamp: string;
    creditsCost: string;
  }[];
}

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const { creditBalance } = useCreditBalance();
  const isGuest = !isAuthenticated && !!localStorage.getItem("guestToken");

  const { data: stats, isLoading } = useQuery<UsageStats>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: isAuthenticated || isGuest,
  });

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold" data-testid="text-page-title">Dashboard</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Credit Balance</CardTitle>
                  <Coins className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-credit-balance">
                    {Math.floor(creditBalance)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Available credits
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Comparisons</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-comparisons">
                    {stats?.totalComparisons || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All-time comparisons
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Credits Spent</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-credits-spent">
                    {stats?.totalCreditsSpent ? Math.floor(parseFloat(stats.totalCreditsSpent)) : 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total credits used
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your last 10 comparisons (privacy-first: no prompts or responses stored)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!stats?.recentActivity || stats.recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-activity">
                    No activity yet. Start comparing models!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {stats.recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 rounded-md hover-elevate"
                        data-testid={`activity-${index}`}
                      >
                        <div className="flex items-center gap-3">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(activity.timestamp)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{parseFloat(activity.creditsCost).toFixed(0)} credits</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Link href="/">
                <Button data-testid="button-start-comparing">
                  Start Comparing
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
