import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import Home from "@/pages/home";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Purchase from "@/pages/purchase";
import Notebook from "@/pages/notebook";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Validate guest token with backend
  const { data: guestTokenValid, isLoading: tokenLoading } = useQuery({
    queryKey: ["/api/guest/verify"],
    queryFn: async () => {
      const guestToken = localStorage.getItem("guestToken");
      if (!guestToken) return { valid: false };
      
      try {
        const res = await apiRequest("POST", "/api/guest/verify", { token: guestToken });
        return await res.json();
      } catch {
        // Clear invalid token
        localStorage.removeItem("guestToken");
        return { valid: false };
      }
    },
    enabled: !authLoading && !isAuthenticated,
    retry: false,
  });
  
  const isValidGuest = guestTokenValid?.valid === true;
  const isLoading = authLoading || tokenLoading;

  return (
    <Switch>
      {isLoading ? (
        <Route path="/" component={() => (
          <div className="h-screen flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
          </div>
        )} />
      ) : isAuthenticated || isValidGuest ? (
        <>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/purchase" component={Purchase} />
          <Route path="/notebook" component={Notebook} />
          <Route path="/admin" component={Admin} />
          <Route path="/:rest*" component={NotFound} />
        </>
      ) : (
        <>
          <Route path="/" component={Landing} />
          <Route path="/:rest*" component={NotFound} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
