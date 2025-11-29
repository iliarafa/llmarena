import { 
  type User, 
  type InsertUser,
  type UpsertUser,
  type GuestToken,
  type InsertGuestToken,
  type UsageHistory,
  type InsertUsageHistory,
  type ProcessedWebhookEvent,
  type InsertProcessedWebhookEvent,
  users,
  guestTokens,
  usageHistory,
  processedWebhookEvents,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, or, isNull, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserCredits(userId: string, newBalance: string): Promise<void>;
  
  // Guest token operations
  createGuestToken(token: InsertGuestToken): Promise<GuestToken>;
  getGuestTokenByToken(token: string): Promise<GuestToken | undefined>;
  updateGuestTokenCredits(tokenId: string, newBalance: string): Promise<void>;
  updateGuestTokenLastUsed(tokenId: string): Promise<void>;
  markGuestTokenAsLinked(tokenId: string, userId: string): Promise<void>;
  
  // Usage tracking
  logComparison(usage: InsertUsageHistory): Promise<UsageHistory>;
  getUserUsageHistory(userId: string, limit?: number): Promise<UsageHistory[]>;
  getGuestUsageHistory(guestTokenId: string, limit?: number): Promise<UsageHistory[]>;
  linkGuestHistoryToUser(guestTokenId: string, userId: string): Promise<void>;
  
  // Webhook event idempotency
  isWebhookEventProcessed(eventId: string): Promise<boolean>;
  markWebhookEventAsProcessed(event: InsertProcessedWebhookEvent): Promise<void>;
}

export class DbStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  }

  async updateUserCredits(userId: string, newBalance: string): Promise<void> {
    await db.update(users)
      .set({ creditBalance: newBalance })
      .where(eq(users.id, userId));
  }

  // Guest token operations
  async createGuestToken(insertToken: InsertGuestToken): Promise<GuestToken> {
    const result = await db.insert(guestTokens).values(insertToken).returning();
    return result[0];
  }

  async getGuestTokenByToken(token: string): Promise<GuestToken | undefined> {
    const result = await db.select().from(guestTokens).where(eq(guestTokens.token, token)).limit(1);
    return result[0];
  }

  async updateGuestTokenCredits(tokenId: string, newBalance: string): Promise<void> {
    await db.update(guestTokens)
      .set({ creditBalance: newBalance })
      .where(eq(guestTokens.id, tokenId));
  }

  async updateGuestTokenLastUsed(tokenId: string): Promise<void> {
    await db.update(guestTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(guestTokens.id, tokenId));
  }

  async markGuestTokenAsLinked(tokenId: string, userId: string): Promise<void> {
    await db.update(guestTokens)
      .set({ 
        linkedAt: new Date(),
        linkedToUserId: userId,
        creditBalance: "0",
      })
      .where(eq(guestTokens.id, tokenId));
  }

  // Usage tracking
  async logComparison(insertUsage: InsertUsageHistory): Promise<UsageHistory> {
    const result = await db.insert(usageHistory).values(insertUsage).returning();
    return result[0];
  }

  async getUserUsageHistory(userId: string, limit: number = 50): Promise<UsageHistory[]> {
    return await db.select()
      .from(usageHistory)
      .where(eq(usageHistory.userId, userId))
      .orderBy(desc(usageHistory.timestamp))
      .limit(limit);
  }

  async getGuestUsageHistory(guestTokenId: string, limit: number = 50): Promise<UsageHistory[]> {
    return await db.select()
      .from(usageHistory)
      .where(eq(usageHistory.guestTokenId, guestTokenId))
      .orderBy(desc(usageHistory.timestamp))
      .limit(limit);
  }

  async linkGuestHistoryToUser(guestTokenId: string, userId: string): Promise<void> {
    await db.update(usageHistory)
      .set({ 
        userId: userId,
        guestTokenId: null,
      })
      .where(eq(usageHistory.guestTokenId, guestTokenId));
  }

  // Webhook event idempotency
  async isWebhookEventProcessed(eventId: string): Promise<boolean> {
    const result = await db.select()
      .from(processedWebhookEvents)
      .where(eq(processedWebhookEvents.eventId, eventId))
      .limit(1);
    return result.length > 0;
  }

  async markWebhookEventAsProcessed(event: InsertProcessedWebhookEvent): Promise<void> {
    await db.insert(processedWebhookEvents).values(event);
  }
}

export const storage = new DbStorage();
