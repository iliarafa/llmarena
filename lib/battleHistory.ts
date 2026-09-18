export interface BattleResponse {
  modelId: string;
  modelName: string;
  response: string;
  generationTime?: number;
  tokenCount?: number;
}

export interface CaesarResult {
  winner: string;
  winnerModelName: string;
  confidence: number;
  oneLineVerdict: string;
  detailedReasoning: string[];
  scores: { [modelLabel: string]: { accuracy: number; clarity: number; creativity: number; safety: number; overall: number } };
  judgeModel: string;
  modelMapping: { [label: string]: string };
}

export interface Battle {
  id: string;
  timestamp: number;
  prompt: string;
  responses: BattleResponse[];
  caesar?: CaesarResult;
  blindMode: boolean;
  userVote?: string;
}

const STORAGE_KEY = 'llm_arena_battle_history';
const MAX_BATTLES = 10;

export function getBattleHistory(): Battle[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as Battle[];
  } catch {
    return [];
  }
}

export function saveBattle(battle: Omit<Battle, 'id' | 'timestamp'>): Battle {
  const newBattle: Battle = {
    ...battle,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };

  const history = getBattleHistory();
  const updated = [newBattle, ...history].slice(0, MAX_BATTLES);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    console.error('Failed to save battle history');
  }

  return newBattle;
}

export function deleteBattle(id: string): void {
  const history = getBattleHistory();
  const updated = history.filter(b => b.id !== id);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    console.error('Failed to delete battle');
  }
}

export function clearBattleHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    console.error('Failed to clear battle history');
  }
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

export function truncatePrompt(prompt: string, maxLength: number = 50): string {
  if (prompt.length <= maxLength) return prompt;
  return prompt.substring(0, maxLength).trim() + '...';
}
