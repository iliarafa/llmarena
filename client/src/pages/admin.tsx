import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Gift, User, Key, Coins, UserPlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import type { User as UserType, GuestToken } from "@shared/schema";

export default function Admin() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [userSearch, setUserSearch] = useState("");
  const [guestSearch, setGuestSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<GuestToken | null>(null);
  const [creditsAmount, setCreditsAmount] = useState("");
  
  // Registration form state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const [newUserCredits, setNewUserCredits] = useState("");
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);

  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery<UserType[]>({
    queryKey: ["/api/admin/users", userSearch],
    queryFn: async () => {
      const url = userSearch ? `/api/admin/users?search=${encodeURIComponent(userSearch)}` : "/api/admin/users";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: isAuthenticated && user?.isAdmin === true,
  });

  const { data: guestTokens, isLoading: guestsLoading, refetch: refetchGuests } = useQuery<GuestToken[]>({
    queryKey: ["/api/admin/guest-tokens", guestSearch],
    queryFn: async () => {
      const url = guestSearch ? `/api/admin/guest-tokens?search=${encodeURIComponent(guestSearch)}` : "/api/admin/guest-tokens";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch guest tokens");
      return res.json();
    },
    enabled: isAuthenticated && user?.isAdmin === true,
  });

  const giftCreditsMutation = useMutation({
    mutationFn: async ({ targetType, targetId, amount }: { targetType: string; targetId: string; amount: number }) => {
      const res = await apiRequest("POST", "/api/admin/gift-credits", { targetType, targetId, amount });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Credits Gifted",
        description: `${data.message}. New balance: ${Math.floor(parseFloat(data.newBalance))} credits`,
      });
      setCreditsAmount("");
      setSelectedUser(null);
      setSelectedGuest(null);
      refetchUsers();
      refetchGuests();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to gift credits",
        variant: "destructive",
      });
    },
  });

  const handleGiftCredits = () => {
    const amount = parseInt(creditsAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a positive number of credits",
        variant: "destructive",
      });
      return;
    }

    if (selectedUser) {
      giftCreditsMutation.mutate({ targetType: "user", targetId: selectedUser.id, amount });
    } else if (selectedGuest) {
      giftCreditsMutation.mutate({ targetType: "guest", targetId: selectedGuest.id, amount });
    } else {
      toast({
        title: "No Selection",
        description: "Please select a user or guest token first",
        variant: "destructive",
      });
    }
  };

  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userSearch] });
  };

  const handleGuestSearch = (e: React.FormEvent) => {
    e.preventDefault();
    queryClient.invalidateQueries({ queryKey: ["/api/admin/guest-tokens", guestSearch] });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You must be logged in to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button data-testid="button-go-home">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>You do not have permission to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button data-testid="button-go-home">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold" data-testid="text-page-title">Admin Panel</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Gift Credits
              </CardTitle>
              <CardDescription>
                Select a user or guest token, then enter the amount of credits to gift.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(selectedUser || selectedGuest) && (
                <div className="p-4 rounded-lg border bg-muted/50">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">Selected:</p>
                      {selectedUser && (
                        <p className="text-sm text-muted-foreground" data-testid="text-selected-user">
                          User: {selectedUser.email || selectedUser.id}
                        </p>
                      )}
                      {selectedGuest && (
                        <p className="text-sm text-muted-foreground font-mono" data-testid="text-selected-guest">
                          Guest: {selectedGuest.token.substring(0, 16)}...
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(null);
                        setSelectedGuest(null);
                      }}
                      data-testid="button-clear-selection"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="credits-amount">Credits to Gift</Label>
                <div className="flex gap-2">
                  <Input
                    id="credits-amount"
                    type="number"
                    min="1"
                    placeholder="Enter amount..."
                    value={creditsAmount}
                    onChange={(e) => setCreditsAmount(e.target.value)}
                    data-testid="input-credits-amount"
                  />
                  <Button
                    onClick={handleGiftCredits}
                    disabled={!selectedUser && !selectedGuest || !creditsAmount || giftCreditsMutation.isPending}
                    data-testid="button-gift-credits"
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    {giftCreditsMutation.isPending ? "Gifting..." : "Gift"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <User className="w-4 h-4" />
                    <span className="text-sm">Total Users</span>
                  </div>
                  <p className="text-2xl font-bold" data-testid="text-total-users">
                    {users?.length || 0}
                  </p>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Key className="w-4 h-4" />
                    <span className="text-sm">Guest Tokens</span>
                  </div>
                  <p className="text-2xl font-bold" data-testid="text-total-guests">
                    {guestTokens?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Tabs defaultValue="users">
            <TabsList className="mb-4">
              <TabsTrigger value="users" data-testid="tab-users">
                <User className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="guests" data-testid="tab-guests">
                <Key className="w-4 h-4 mr-2" />
                Guest Tokens
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>Registered Users</CardTitle>
                  <form onSubmit={handleUserSearch} className="flex gap-2 mt-2">
                    <Input
                      placeholder="Search by email or name..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      data-testid="input-search-users"
                    />
                    <Button type="submit" variant="outline" data-testid="button-search-users">
                      <Search className="w-4 h-4" />
                    </Button>
                  </form>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : !users || users.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8" data-testid="text-no-users">
                      No users found
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {users.map((u) => (
                        <div
                          key={u.id}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover-elevate ${
                            selectedUser?.id === u.id ? "ring-2 ring-primary" : ""
                          }`}
                          onClick={() => {
                            setSelectedUser(u);
                            setSelectedGuest(null);
                          }}
                          data-testid={`user-row-${u.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {u.firstName} {u.lastName}
                                {u.isAdmin && (
                                  <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                                    Admin
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">{u.email || "No email"}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{Math.floor(parseFloat(u.creditBalance))} credits</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="guests">
              <Card>
                <CardHeader>
                  <CardTitle>Guest Tokens</CardTitle>
                  <form onSubmit={handleGuestSearch} className="flex gap-2 mt-2">
                    <Input
                      placeholder="Search by token..."
                      value={guestSearch}
                      onChange={(e) => setGuestSearch(e.target.value)}
                      data-testid="input-search-guests"
                    />
                    <Button type="submit" variant="outline" data-testid="button-search-guests">
                      <Search className="w-4 h-4" />
                    </Button>
                  </form>
                </CardHeader>
                <CardContent>
                  {guestsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : !guestTokens || guestTokens.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8" data-testid="text-no-guests">
                      No guest tokens found
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {guestTokens.map((g) => (
                        <div
                          key={g.id}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover-elevate ${
                            selectedGuest?.id === g.id ? "ring-2 ring-primary" : ""
                          }`}
                          onClick={() => {
                            setSelectedGuest(g);
                            setSelectedUser(null);
                          }}
                          data-testid={`guest-row-${g.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <Key className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-mono text-sm">{g.token.substring(0, 24)}...</p>
                              <p className="text-xs text-muted-foreground">
                                {g.linkedAt ? "Linked" : "Active"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{Math.floor(parseFloat(g.creditBalance))} credits</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(g.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
