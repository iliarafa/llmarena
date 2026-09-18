"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import Home from "@/components/pages/home";
import Landing from "@/components/pages/landing";

export default function RootPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: guestTokenValid, isLoading: tokenLoading } = useQuery({
    queryKey: ["/api/guest/verify"],
    queryFn: async () => {
      const guestToken = localStorage.getItem("guestToken");
      if (!guestToken) return { valid: false };

      try {
        const res = await apiRequest("POST", "/api/guest/verify", { token: guestToken });
        return await res.json();
      } catch {
        localStorage.removeItem("guestToken");
        return { valid: false };
      }
    },
    enabled: !authLoading && !isAuthenticated,
    retry: false,
  });

  const isValidGuest = guestTokenValid?.valid === true;
  const isLoading = authLoading || tokenLoading;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  if (isAuthenticated || isValidGuest) {
    return <Home />;
  }

  return <Landing />;
}
