import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  History, 
  X, 
  Trash2, 
  ChevronRight, 
  Trophy,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  type Battle, 
  getBattleHistory, 
  deleteBattle, 
  clearBattleHistory,
  formatTimestamp,
  truncatePrompt,
} from "@/lib/battleHistory";

interface HistorySidebarProps {
  onLoadBattle: (battle: Battle) => void;
  refreshTrigger?: number;
}

export default function HistorySidebar({ onLoadBattle, refreshTrigger }: HistorySidebarProps) {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setBattles(getBattleHistory());
    }
  }, [open, refreshTrigger]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteBattle(id);
    setBattles(getBattleHistory());
  };

  const handleClearAll = () => {
    clearBattleHistory();
    setBattles([]);
  };

  const handleLoadBattle = (battle: Battle) => {
    onLoadBattle(battle);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-[#616161] dark:text-white"
          data-testid="button-history"
        >
          <History className="w-4 h-4 mr-2" />
          History
          {battles.length > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {battles.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[350px] sm:w-[400px]">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Battle History
            </SheetTitle>
            {battles.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive hover:text-destructive"
                    data-testid="button-clear-history"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Battle History?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all {battles.length} saved battles from your browser.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAll}>
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Last 10 battles saved locally in your browser
          </p>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4">
          {battles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No battles yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your comparison history will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-2 pr-4">
              {battles.map((battle) => (
                <div
                  key={battle.id}
                  onClick={() => handleLoadBattle(battle)}
                  className="group p-3 rounded-lg border cursor-pointer hover-elevate transition-all"
                  data-testid={`history-item-${battle.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" title={battle.prompt}>
                        {truncatePrompt(battle.prompt, 40)}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(battle.timestamp)}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {battle.responses.length} model{battle.responses.length !== 1 ? 's' : ''}
                        </span>
                        {battle.blindMode && (
                          <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Blind
                          </Badge>
                        )}
                      </div>
                      {battle.caesar && (
                        <div className="flex items-center gap-1 mt-2">
                          <Trophy className="w-3 h-3 text-amber-500" />
                          <span className="text-xs text-amber-600 font-medium">
                            {battle.caesar.winnerModelName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({(battle.caesar.confidence * 100).toFixed(0)}%)
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDelete(battle.id, e)}
                        data-testid={`button-delete-${battle.id}`}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
