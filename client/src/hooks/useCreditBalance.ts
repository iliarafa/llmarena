import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { apiRequest } from "@/lib/queryClient";

export function useCreditBalance() {
  const { user, isAuthenticated } = useAuth();
  const guestToken = localStorage.getItem("guestToken");
  
  // For authenticated users, get balance from user object
  const authenticatedBalance = isAuthenticated ? (user as any)?.creditBalance : null;
  
  // For guest users, fetch balance from verify endpoint
  const { data: guestData, error } = useQuery({
    queryKey: ["/api/guest/verify", guestToken],
    queryFn: async () => {
      if (!guestToken || isAuthenticated) return null;
      
      const res = await apiRequest("POST", "/api/guest/verify", { token: guestToken });
      
      // Check for HTTP errors
      if (!res.ok) {
        localStorage.removeItem("guestToken");
        throw new Error("Failed to verify guest token");
      }
      
      const data = await res.json();
      
      if (!data.valid) {
        localStorage.removeItem("guestToken");
        return null;
      }
      
      return data;
    },
    enabled: !!guestToken && !isAuthenticated,
    retry: false,
  });
  
  const creditBalance = isAuthenticated 
    ? authenticatedBalance 
    : guestData?.creditBalance;
  
  return {
    creditBalance: creditBalance ? parseFloat(creditBalance) : 0,
    isLoading: !isAuthenticated && !!guestToken && !guestData,
    error: error,
  };
}
