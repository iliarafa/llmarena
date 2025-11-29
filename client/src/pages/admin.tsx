import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Gift, User, Key, Coins, UserPlus, Pencil, Trash2 } from "lucide-react";
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
  
  // Edit user modal state
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editCredits, setEditCredits] = useState("");
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  
  // Delete confirmation state
  const [deletingUser, setDeletingUser] = useState<UserType | null>(null);

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

  const createUserMutation = useMutation({
    mutationFn: async (userData: { email: string; firstName?: string; lastName?: string; initialCredits?: number; isAdmin?: boolean }) => {
      const res = await apiRequest("POST", "/api/admin/create-user", userData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create user");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "User Created",
        description: data.message,
      });
      setNewUserEmail("");
      setNewUserFirstName("");
      setNewUserLastName("");
      setNewUserCredits("");
      setNewUserIsAdmin(false);
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: { email?: string; firstName?: string | null; lastName?: string | null; isAdmin?: boolean } }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update user");
      }
      return res.json();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const setCreditsUserMutation = useMutation({
    mutationFn: async ({ userId, credits }: { userId: string; credits: number }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/credits`, { credits });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to set credits");
      }
      return res.json();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set credits",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete user");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "User Deleted",
        description: data.message,
      });
      setDeletingUser(null);
      setSelectedUser(null);
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const openEditModal = (u: UserType) => {
    setEditingUser(u);
    setEditEmail(u.email || "");
    setEditFirstName(u.firstName || "");
    setEditLastName(u.lastName || "");
    setEditCredits(parseFloat(u.creditBalance).toFixed(2));
    setEditIsAdmin(u.isAdmin || false);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    const userId = editingUser.id;
    const currentEmail = editingUser.email || "";
    const currentFirstName = editingUser.firstName || "";
    const currentLastName = editingUser.lastName || "";
    const currentIsAdmin = editingUser.isAdmin || false;
    const currentCredits = parseFloat(editingUser.creditBalance);
    
    const newCreditsValue = parseFloat(editCredits);
    const creditsChanged = !isNaN(newCreditsValue) && Math.abs(newCreditsValue - currentCredits) > 0.001;
    
    const emailChanged = editEmail.trim() !== currentEmail;
    const firstNameChanged = editFirstName.trim() !== currentFirstName;
    const lastNameChanged = editLastName.trim() !== currentLastName;
    const adminChanged = editIsAdmin !== currentIsAdmin;
    const profileChanged = emailChanged || firstNameChanged || lastNameChanged || adminChanged;
    
    if (!profileChanged && !creditsChanged) {
      setEditingUser(null);
      return;
    }
    
    const closeModalAndRefresh = () => {
      setEditingUser(null);
      refetchUsers();
    };
    
    if (profileChanged && creditsChanged) {
      updateUserMutation.mutate({
        userId,
        data: {
          email: editEmail.trim() || undefined,
          firstName: editFirstName.trim() || null,
          lastName: editLastName.trim() || null,
          isAdmin: editIsAdmin,
        },
      }, {
        onSuccess: (profileData) => {
          toast({
            title: "User Updated",
            description: profileData.message,
          });
          setCreditsUserMutation.mutate({ userId, credits: newCreditsValue }, {
            onSuccess: (creditsData) => {
              toast({
                title: "Credits Updated", 
                description: creditsData.message,
              });
              closeModalAndRefresh();
            },
          });
        },
      });
    } else if (profileChanged) {
      updateUserMutation.mutate({
        userId,
        data: {
          email: editEmail.trim() || undefined,
          firstName: editFirstName.trim() || null,
          lastName: editLastName.trim() || null,
          isAdmin: editIsAdmin,
        },
      }, {
        onSuccess: (data) => {
          toast({
            title: "User Updated",
            description: data.message,
          });
          closeModalAndRefresh();
        },
      });
    } else if (creditsChanged) {
      setCreditsUserMutation.mutate({ userId, credits: newCreditsValue }, {
        onSuccess: (data) => {
          toast({
            title: "Credits Updated",
            description: data.message,
          });
          closeModalAndRefresh();
        },
      });
    }
  };

  const handleDeleteUser = () => {
    if (!deletingUser) return;
    deleteUserMutation.mutate(deletingUser.id);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    
    createUserMutation.mutate({
      email: newUserEmail.trim(),
      firstName: newUserFirstName.trim() || undefined,
      lastName: newUserLastName.trim() || undefined,
      initialCredits: newUserCredits ? parseInt(newUserCredits) : 0,
      isAdmin: newUserIsAdmin,
    });
  };

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
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Gift className="w-4 h-4" />
                Gift Credits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(selectedUser || selectedGuest) ? (
                <div className="p-3 rounded-md bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">Selected</p>
                      {selectedUser && (
                        <p className="text-sm font-mono" data-testid="text-selected-user">
                          {selectedUser.email || selectedUser.id}
                        </p>
                      )}
                      {selectedGuest && (
                        <p className="text-sm font-mono" data-testid="text-selected-guest">
                          {selectedGuest.token.substring(0, 20)}...
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(null);
                        setSelectedGuest(null);
                      }}
                      data-testid="button-clear-selection"
                      className="h-7 text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">Select a user or guest token below</p>
              )}
              <div className="flex gap-2 items-center">
                <Input
                  id="credits-amount"
                  type="number"
                  min="1"
                  placeholder="Amount"
                  value={creditsAmount}
                  onChange={(e) => setCreditsAmount(e.target.value)}
                  data-testid="input-credits-amount"
                  className="bg-muted/30 border-transparent focus:border-primary font-mono"
                />
                <Button
                  onClick={handleGiftCredits}
                  disabled={!selectedUser && !selectedGuest || !creditsAmount || giftCreditsMutation.isPending}
                  data-testid="button-gift-credits"
                  size="sm"
                >
                  <Coins className="w-4 h-4 mr-1.5" />
                  {giftCreditsMutation.isPending ? "..." : "Gift"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    Total Users
                  </p>
                  <p className="text-5xl font-bold font-mono tracking-tighter" data-testid="text-total-users">
                    {users?.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Key className="w-3 h-3" />
                    Guest Tokens
                  </p>
                  <p className="text-5xl font-bold font-mono tracking-tighter" data-testid="text-total-guests">
                    {guestTokens?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <UserPlus className="w-4 h-4" />
                Register New User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[180px]">
                  <Label htmlFor="new-user-email" className="text-xs uppercase tracking-widest text-muted-foreground">Email *</Label>
                  <Input
                    id="new-user-email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    required
                    data-testid="input-new-user-email"
                    className="mt-1 border-0 border-b border-border rounded-none px-0 focus:ring-0 focus:border-foreground bg-transparent"
                  />
                </div>
                <div className="w-28">
                  <Label htmlFor="new-user-firstname" className="text-xs uppercase tracking-widest text-muted-foreground">First</Label>
                  <Input
                    id="new-user-firstname"
                    placeholder="John"
                    value={newUserFirstName}
                    onChange={(e) => setNewUserFirstName(e.target.value)}
                    data-testid="input-new-user-firstname"
                    className="mt-1 border-0 border-b border-border rounded-none px-0 focus:ring-0 focus:border-foreground bg-transparent"
                  />
                </div>
                <div className="w-28">
                  <Label htmlFor="new-user-lastname" className="text-xs uppercase tracking-widest text-muted-foreground">Last</Label>
                  <Input
                    id="new-user-lastname"
                    placeholder="Doe"
                    value={newUserLastName}
                    onChange={(e) => setNewUserLastName(e.target.value)}
                    data-testid="input-new-user-lastname"
                    className="mt-1 border-0 border-b border-border rounded-none px-0 focus:ring-0 focus:border-foreground bg-transparent"
                  />
                </div>
                <div className="w-24">
                  <Label htmlFor="new-user-credits" className="text-xs uppercase tracking-widest text-muted-foreground">Credits</Label>
                  <Input
                    id="new-user-credits"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newUserCredits}
                    onChange={(e) => setNewUserCredits(e.target.value)}
                    data-testid="input-new-user-credits"
                    className="mt-1 border-0 border-b border-border rounded-none px-0 focus:ring-0 focus:border-foreground bg-transparent font-mono"
                  />
                </div>
                <div className="flex items-center gap-2 h-9">
                  <Checkbox
                    id="new-user-admin"
                    checked={newUserIsAdmin}
                    onCheckedChange={(checked) => setNewUserIsAdmin(checked === true)}
                    data-testid="checkbox-new-user-admin"
                  />
                  <Label htmlFor="new-user-admin" className="text-xs font-normal">Admin</Label>
                </div>
                <Button type="submit" disabled={createUserMutation.isPending} data-testid="button-create-user" size="sm">
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  {createUserMutation.isPending ? "..." : "Create"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Tabs defaultValue="users">
            <TabsList className="mb-4 inline-flex bg-muted p-1 rounded-lg">
              <TabsTrigger 
                value="users" 
                data-testid="tab-users"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-1.5 text-sm transition-all"
              >
                <User className="w-3.5 h-3.5 mr-1.5" />
                Users
              </TabsTrigger>
              <TabsTrigger 
                value="guests" 
                data-testid="tab-guests"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-1.5 text-sm transition-all"
              >
                <Key className="w-3.5 h-3.5 mr-1.5" />
                Tokens
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-base">Registered Users</CardTitle>
                    <form onSubmit={handleUserSearch} className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        data-testid="input-search-users"
                        className="pl-9 pr-4 h-8 w-48 rounded-full border-border/50 shadow-sm text-sm"
                      />
                    </form>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {usersLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : !users || users.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm" data-testid="text-no-users">
                      No users found
                    </p>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {users.map((u) => (
                        <div
                          key={u.id}
                          className={`flex items-center justify-between py-2.5 px-1 cursor-pointer hover:bg-muted/30 transition-colors ${
                            selectedUser?.id === u.id ? "bg-muted/50" : ""
                          }`}
                          onClick={() => {
                            setSelectedUser(u);
                            setSelectedGuest(null);
                          }}
                          data-testid={`user-row-${u.id}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">
                                  {u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : 'Unnamed'}
                                </span>
                                {u.isAdmin && (
                                  <span className="bg-foreground text-background text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <p className="font-mono text-xs text-muted-foreground truncate">{u.email || "No email"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <p className="font-mono font-bold text-sm">{Math.floor(parseFloat(u.creditBalance))}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">credits</p>
                            </div>
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(u);
                                }}
                                data-testid={`button-edit-user-${u.id}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingUser(u);
                                }}
                                disabled={u.id === user?.id}
                                data-testid={`button-delete-user-${u.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            </div>
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
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-base">Guest Tokens</CardTitle>
                    <form onSubmit={handleGuestSearch} className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        value={guestSearch}
                        onChange={(e) => setGuestSearch(e.target.value)}
                        data-testid="input-search-guests"
                        className="pl-9 pr-4 h-8 w-48 rounded-full border-border/50 shadow-sm text-sm"
                      />
                    </form>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {guestsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : !guestTokens || guestTokens.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm" data-testid="text-no-guests">
                      No guest tokens found
                    </p>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {guestTokens.map((g) => (
                        <div
                          key={g.id}
                          className={`flex items-center justify-between py-2.5 px-1 cursor-pointer hover:bg-muted/30 transition-colors ${
                            selectedGuest?.id === g.id ? "bg-muted/50" : ""
                          }`}
                          onClick={() => {
                            setSelectedGuest(g);
                            setSelectedUser(null);
                          }}
                          data-testid={`guest-row-${g.id}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="min-w-0">
                              <p className="font-mono text-xs text-muted-foreground truncate">{g.token.substring(0, 32)}...</p>
                              <span className={`text-[10px] uppercase tracking-wide ${g.linkedAt ? 'text-muted-foreground' : 'text-green-600 dark:text-green-400'}`}>
                                {g.linkedAt ? "Linked" : "Active"}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-mono font-bold text-sm">{Math.floor(parseFloat(g.creditBalance))}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">credits</p>
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

      {/* Edit User Modal */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and credit balance.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                data-testid="input-edit-email"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstname">First Name</Label>
                <Input
                  id="edit-firstname"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  data-testid="input-edit-firstname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastname">Last Name</Label>
                <Input
                  id="edit-lastname"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  data-testid="input-edit-lastname"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-credits">Credits</Label>
              <Input
                id="edit-credits"
                type="number"
                min="0"
                value={editCredits}
                onChange={(e) => setEditCredits(e.target.value)}
                data-testid="input-edit-credits"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-admin"
                checked={editIsAdmin}
                onCheckedChange={(checked) => setEditIsAdmin(checked === true)}
                data-testid="checkbox-edit-admin"
              />
              <Label htmlFor="edit-admin" className="text-sm font-normal">Admin privileges</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateUser} 
              disabled={updateUserMutation.isPending || setCreditsUserMutation.isPending}
              data-testid="button-save-user"
            >
              {updateUserMutation.isPending || setCreditsUserMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingUser?.email || "this user"}? This action cannot be undone. 
              All their data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
