import {
  type User,
  type InsertUser,
  type UpsertUser,
  type GuestToken,
  type InsertGuestToken,
  type UsageHistory,
  type InsertUsageHistory,
  type InsertProcessedWebhookEvent,
  users,
  guestTokens,
  usageHistory,
  processedWebhookEvents,
} from "@shared/schema";
import { getDb } from "./db";
import { eq, desc, like, or } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserCredits(userId: string, newBalance: string): Promise<void>;
  updateUser(userId: string, data: { email?: string; firstName?: string | null; lastName?: string | null; isAdmin?: boolean }): Promise<User>;
  setUserCredits(userId: string, credits: number): Promise<User>;
  deleteUser(userId: string): Promise<void>;

  createGuestToken(token: InsertGuestToken): Promise<GuestToken>;
  getGuestTokenByToken(token: string): Promise<GuestToken | undefined>;
  updateGuestTokenCredits(tokenId: string, newBalance: string): Promise<void>;
  updateGuestTokenLastUsed(tokenId: string): Promise<void>;
  markGuestTokenAsLinked(tokenId: string, userId: string): Promise<void>;

  logComparison(usage: InsertUsageHistory): Promise<UsageHistory>;
  getUserUsageHistory(userId: string, limit?: number): Promise<UsageHistory[]>;
  getGuestUsageHistory(guestTokenId: string, limit?: number): Promise<UsageHistory[]>;
  linkGuestHistoryToUser(guestTokenId: string, userId: string): Promise<void>;

  isWebhookEventProcessed(eventId: string): Promise<boolean>;
  markWebhookEventAsProcessed(event: InsertProcessedWebhookEvent): Promise<void>;

  getAllUsers(search?: string): Promise<User[]>;
  getAllGuestTokens(search?: string): Promise<GuestToken[]>;
  addCreditsToUser(userId: string, amount: number): Promise<User>;
  addCreditsToGuestToken(tokenId: string, amount: number): Promise<GuestToken>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await getDb().select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await getDb().select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await getDb().insert(users).values(insertUser).returning();
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const result = await getDb()
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
    await getDb().update(users)
      .set({ creditBalance: newBalance })
      .where(eq(users.id, userId));
  }

  async updateUser(userId: string, data: { email?: string; firstName?: string | null; lastName?: string | null; isAdmin?: boolean }): Promise<User> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.email !== undefined) updateData.email = data.email;
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.isAdmin !== undefined) updateData.isAdmin = data.isAdmin;

    await getDb().update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    const updated = await this.getUser(userId);
    if (!updated) throw new Error("User not found");
    return updated;
  }

  async setUserCredits(userId: string, credits: number): Promise<User> {
    const newBalance = credits.toFixed(2);
    await getDb().update(users)
      .set({ creditBalance: newBalance })
      .where(eq(users.id, userId));

    const updated = await this.getUser(userId);
    if (!updated) throw new Error("User not found");
    return updated;
  }

  async deleteUser(userId: string): Promise<void> {
    await getDb().delete(users).where(eq(users.id, userId));
  }

  async createGuestToken(insertToken: InsertGuestToken): Promise<GuestToken> {
    const result = await getDb().insert(guestTokens).values(insertToken).returning();
    return result[0];
  }

  async getGuestTokenByToken(token: string): Promise<GuestToken | undefined> {
    const result = await getDb().select().from(guestTokens).where(eq(guestTokens.token, token)).limit(1);
    return result[0];
  }

  async updateGuestTokenCredits(tokenId: string, newBalance: string): Promise<void> {
    await getDb().update(guestTokens)
      .set({ creditBalance: newBalance })
      .where(eq(guestTokens.id, tokenId));
  }

  async updateGuestTokenLastUsed(tokenId: string): Promise<void> {
    await getDb().update(guestTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(guestTokens.id, tokenId));
  }

  async markGuestTokenAsLinked(tokenId: string, userId: string): Promise<void> {
    await getDb().update(guestTokens)
      .set({
        linkedAt: new Date(),
        linkedToUserId: userId,
        creditBalance: "0",
      })
      .where(eq(guestTokens.id, tokenId));
  }

  async logComparison(insertUsage: InsertUsageHistory): Promise<UsageHistory> {
    const result = await getDb().insert(usageHistory).values(insertUsage).returning();
    return result[0];
  }

  async getUserUsageHistory(userId: string, limit: number = 50): Promise<UsageHistory[]> {
    return await getDb().select()
      .from(usageHistory)
      .where(eq(usageHistory.userId, userId))
      .orderBy(desc(usageHistory.timestamp))
      .limit(limit);
  }

  async getGuestUsageHistory(guestTokenId: string, limit: number = 50): Promise<UsageHistory[]> {
    return await getDb().select()
      .from(usageHistory)
      .where(eq(usageHistory.guestTokenId, guestTokenId))
      .orderBy(desc(usageHistory.timestamp))
      .limit(limit);
  }

  async linkGuestHistoryToUser(guestTokenId: string, userId: string): Promise<void> {
    await getDb().update(usageHistory)
      .set({
        userId: userId,
        guestTokenId: null,
      })
      .where(eq(usageHistory.guestTokenId, guestTokenId));
  }

  async isWebhookEventProcessed(eventId: string): Promise<boolean> {
    const result = await getDb().select()
      .from(processedWebhookEvents)
      .where(eq(processedWebhookEvents.eventId, eventId))
      .limit(1);
    return result.length > 0;
  }

  async markWebhookEventAsProcessed(event: InsertProcessedWebhookEvent): Promise<void> {
    await getDb().insert(processedWebhookEvents).values(event);
  }

  async getAllUsers(search?: string): Promise<User[]> {
    if (search && search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      return await getDb().select()
        .from(users)
        .where(
          or(
            like(users.email, searchPattern),
            like(users.firstName, searchPattern),
            like(users.lastName, searchPattern)
          )
        )
        .orderBy(desc(users.createdAt))
        .limit(100);
    }
    return await getDb().select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(100);
  }

  async getAllGuestTokens(search?: string): Promise<GuestToken[]> {
    if (search && search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      return await getDb().select()
        .from(guestTokens)
        .where(like(guestTokens.token, searchPattern))
        .orderBy(desc(guestTokens.createdAt))
        .limit(100);
    }
    return await getDb().select()
      .from(guestTokens)
      .orderBy(desc(guestTokens.createdAt))
      .limit(100);
  }

  async addCreditsToUser(userId: string, amount: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const currentBalance = parseFloat(user.creditBalance);
    const newBalance = (currentBalance + amount).toFixed(2);
    await getDb().update(users)
      .set({ creditBalance: newBalance })
      .where(eq(users.id, userId));
    const updated = await this.getUser(userId);
    return updated!;
  }

  async addCreditsToGuestToken(tokenId: string, amount: number): Promise<GuestToken> {
    const result = await getDb().select().from(guestTokens).where(eq(guestTokens.id, tokenId)).limit(1);
    const token = result[0];
    if (!token) {
      throw new Error("Guest token not found");
    }
    const currentBalance = parseFloat(token.creditBalance);
    const newBalance = (currentBalance + amount).toFixed(2);
    await getDb().update(guestTokens)
      .set({ creditBalance: newBalance })
      .where(eq(guestTokens.id, tokenId));
    const updatedResult = await getDb().select().from(guestTokens).where(eq(guestTokens.id, tokenId)).limit(1);
    return updatedResult[0];
  }
}

export const storage = new DbStorage();
