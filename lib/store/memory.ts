// lib/store/memory.ts
import 'server-only';
import { EventStore } from './index';
import { IntentType, ShareChannel, Telemetry } from '@/types';

interface ShareRecord {
  id: string;
  cardSlug: string | null;
  channel: ShareChannel;
  referrerId?: string;
  createdAt: Date;
}

interface ViewRecord {
  id: string;
  cardSlug: string | null;
  referrerId?: string;
  sourceChannel?: string;
  userZip?: string;
  createdAt: Date;
}

interface SubscriberRecord {
  id: string;
  email: string; // stored lowercase
  zipCode: string;
  sourceCardSlug?: string | null;
  intentType: IntentType;
  referrerId?: string;
  userRefId?: string;
  createdAt: Date;
}

class MemoryStore implements EventStore {
  private shares: ShareRecord[] = [];
  private views: ViewRecord[] = [];
  private subscribers: SubscriberRecord[] = [];

  async recordShare(e: { cardSlug: string | null; channel: ShareChannel; referrerId?: string }): Promise<void> {
    this.shares.push({
      id: Math.random().toString(36).substring(2),
      cardSlug: e.cardSlug,
      channel: e.channel,
      referrerId: e.referrerId,
      createdAt: new Date(),
    });
  }

  async recordView(e: { cardSlug: string | null; referrerId?: string; sourceChannel?: string; userZip?: string }): Promise<void> {
    this.views.push({
      id: Math.random().toString(36).substring(2),
      cardSlug: e.cardSlug,
      referrerId: e.referrerId,
      sourceChannel: e.sourceChannel,
      userZip: e.userZip,
      createdAt: new Date(),
    });
  }

  async addSubscriber(s: {
    email: string;
    zipCode: string;
    sourceCardSlug?: string | null;
    intentType: IntentType;
    referrerId?: string;
    userRefId?: string;
  }): Promise<{ created: boolean; createdAt: string }> {
    const normalizedEmail = s.email.trim().toLowerCase();
    const existing = this.subscribers.find(
      (sub) => sub.email === normalizedEmail && sub.zipCode === s.zipCode && sub.intentType === s.intentType
    );
    if (existing) {
      return { created: false, createdAt: existing.createdAt.toISOString() };
    }

    const now = new Date();
    this.subscribers.push({
      id: Math.random().toString(36).substring(2),
      email: normalizedEmail,
      zipCode: s.zipCode,
      sourceCardSlug: s.sourceCardSlug,
      intentType: s.intentType,
      referrerId: s.referrerId,
      userRefId: s.userRefId,
      createdAt: now,
    });
    return { created: true, createdAt: now.toISOString() };
  }

  async countMarketUnlock(zip: string): Promise<number> {
    return this.subscribers.filter((s) => s.zipCode === zip && s.intentType === 'MARKET_UNLOCK').length;
  }

  async marketUnlockRank(zip: string, email: string): Promise<number> {
    const normalizedEmail = email.trim().toLowerCase();
    const list = this.subscribers
      .filter((s) => s.zipCode === zip && s.intentType === 'MARKET_UNLOCK')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const index = list.findIndex((s) => s.email === normalizedEmail);
    return index >= 0 ? index + 1 : list.length + 1;
  }

  async countReferredSignups(zip: string, referrerId: string): Promise<number> {
    if (!referrerId) return 0;
    return this.subscribers.filter(
      (s) => s.zipCode === zip && s.intentType === 'MARKET_UNLOCK' && s.referrerId === referrerId
    ).length;
  }

  async findMarketUnlockEmail(zip: string, userRefId: string): Promise<string | null> {
    if (!userRefId) return null;
    const found = this.subscribers
      .filter((s) => s.zipCode === zip && s.intentType === 'MARKET_UNLOCK' && s.userRefId === userRefId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
    return found ? found.email : null;
  }

  async findSubscriberEmail(userRefId: string): Promise<string | null> {
    if (!userRefId) return null;
    const found = this.subscribers
      .filter((s) => s.userRefId === userRefId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
    return found ? found.email : null;
  }

  async hasVerdictAlert(userRefId: string): Promise<boolean> {
    if (!userRefId) return false;
    return this.subscribers.some((s) => s.userRefId === userRefId && s.intentType === 'VERDICT_ALERT');
  }

  async removeSubscribersForUser(userRefId: string): Promise<number> {
    if (!userRefId) return 0;
    const before = this.subscribers.length;
    this.subscribers = this.subscribers.filter((s) => s.userRefId !== userRefId);
    return before - this.subscribers.length;
  }

  async getTelemetry(): Promise<Telemetry> {
    const verdictAlertLeads = this.subscribers.filter((s) => s.intentType === 'VERDICT_ALERT').length;
    const marketUnlockLeads = this.subscribers.filter((s) => s.intentType === 'MARKET_UNLOCK').length;
    return {
      sharesSent: this.shares.length,
      linkViews: this.views.length,
      leadsCaptured: this.subscribers.length,
      verdictAlertLeads,
      marketUnlockLeads,
      persistence: 'memory',
    };
  }

  async reset(): Promise<void> {
    this.shares = [];
    this.views = [];
    this.subscribers = [];
  }
}

// Global singleton for next dev reloads
const globalForMemory = globalThis as unknown as { memoryStore?: MemoryStore };
export const memoryStore = globalForMemory.memoryStore ?? new MemoryStore();
if (process.env.NODE_ENV !== 'production') globalForMemory.memoryStore = memoryStore;
