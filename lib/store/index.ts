// lib/store/index.ts
import 'server-only';
import { IntentType, ShareChannel, Telemetry } from '@/types';
import { memoryStore } from './memory';
import { SupabaseStore } from './supabase';

export interface EventStore {
  recordShare(e: { cardSlug: string | null; channel: ShareChannel; referrerId?: string }): Promise<void>;
  recordView(e: { cardSlug: string | null; referrerId?: string; sourceChannel?: string; userZip?: string }): Promise<void>;
  addSubscriber(s: {
    email: string;
    zipCode: string;
    sourceCardSlug?: string | null;
    intentType: IntentType;
    referrerId?: string;
    userRefId?: string;
  }): Promise<{ created: boolean; createdAt: string }>; // idempotent on (lower(email), zip, intent)
  countMarketUnlock(zip: string): Promise<number>;
  marketUnlockRank(zip: string, email: string): Promise<number>;
  countReferredSignups(zip: string, referrerId: string): Promise<number>;
  findMarketUnlockEmail(zip: string, userRefId: string): Promise<string | null>;
  getTelemetry(): Promise<Telemetry>;
  reset(): Promise<void>;
}

let supabaseStoreInstance: SupabaseStore | null = null;

export function getStore(): EventStore {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && key) {
    if (!supabaseStoreInstance) {
      supabaseStoreInstance = new SupabaseStore(url, key);
    }
    return supabaseStoreInstance;
  }

  return memoryStore;
}
