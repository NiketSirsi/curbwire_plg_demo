// lib/store/supabase.ts
import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EventStore } from './index';
import { IntentType, ShareChannel, Telemetry } from '@/types';

export class SupabaseStore implements EventStore {
  private client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }

  async recordShare(e: { cardSlug: string | null; channel: ShareChannel; referrerId?: string }): Promise<void> {
    await this.client.from('share_events').insert({
      card_slug: e.cardSlug,
      channel: e.channel,
      referrer_id: e.referrerId || null,
    });
  }

  async recordView(e: { cardSlug: string | null; referrerId?: string; sourceChannel?: string; userZip?: string }): Promise<void> {
    await this.client.from('view_events').insert({
      card_slug: e.cardSlug,
      referrer_id: e.referrerId || null,
      source_channel: e.sourceChannel || null,
      user_zip: e.userZip || null,
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
    const insertData = {
      email: normalizedEmail,
      zip_code: s.zipCode,
      source_card_slug: s.sourceCardSlug || null,
      intent_type: s.intentType,
      referrer_id: s.referrerId || null,
      user_ref_id: s.userRefId || null,
    };

    const { data, error } = await this.client
      .from('subscribers')
      .insert(insertData)
      .select('created_at')
      .single();

    if (error) {
      // Postgres 23505 = unique_violation (alreadySubscribed)
      if (error.code === '23505') {
        const { data: existing } = await this.client
          .from('subscribers')
          .select('created_at')
          .eq('email', normalizedEmail)
          .eq('zip_code', s.zipCode)
          .eq('intent_type', s.intentType)
          .single();
        return { created: false, createdAt: existing?.created_at ?? new Date().toISOString() };
      }
      throw error;
    }

    return { created: true, createdAt: data.created_at };
  }

  async countMarketUnlock(zip: string): Promise<number> {
    const { count, error } = await this.client
      .from('subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('zip_code', zip)
      .eq('intent_type', 'MARKET_UNLOCK');
    if (error) throw error;
    return count ?? 0;
  }

  async marketUnlockRank(zip: string, email: string): Promise<number> {
    const normalizedEmail = email.trim().toLowerCase();
    // Fetch this subscriber's created_at
    const { data: userSub } = await this.client
      .from('subscribers')
      .select('created_at')
      .eq('zip_code', zip)
      .eq('intent_type', 'MARKET_UNLOCK')
      .eq('email', normalizedEmail)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (!userSub) {
      // If not subscribed yet, rank will be current total + 1
      const total = await this.countMarketUnlock(zip);
      return total + 1;
    }

    // Count how many were created on or before this record
    const { count, error } = await this.client
      .from('subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('zip_code', zip)
      .eq('intent_type', 'MARKET_UNLOCK')
      .lte('created_at', userSub.created_at);

    if (error) throw error;
    return count ?? 1;
  }

  async countReferredSignups(zip: string, referrerId: string): Promise<number> {
    if (!referrerId) return 0;
    const { count, error } = await this.client
      .from('subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('zip_code', zip)
      .eq('intent_type', 'MARKET_UNLOCK')
      .eq('referrer_id', referrerId);
    if (error) throw error;
    return count ?? 0;
  }

  async findMarketUnlockEmail(zip: string, userRefId: string): Promise<string | null> {
    if (!userRefId) return null;
    const { data, error } = await this.client
      .from('subscribers')
      .select('email')
      .eq('zip_code', zip)
      .eq('intent_type', 'MARKET_UNLOCK')
      .eq('user_ref_id', userRefId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ? data.email : null;
  }

  async getTelemetry(): Promise<Telemetry> {
    const [sharesRes, viewsRes, subsRes, verdictRes, unlockRes] = await Promise.all([
      this.client.from('share_events').select('id', { count: 'exact', head: true }),
      this.client.from('view_events').select('id', { count: 'exact', head: true }),
      this.client.from('subscribers').select('id', { count: 'exact', head: true }),
      this.client.from('subscribers').select('id', { count: 'exact', head: true }).eq('intent_type', 'VERDICT_ALERT'),
      this.client.from('subscribers').select('id', { count: 'exact', head: true }).eq('intent_type', 'MARKET_UNLOCK'),
    ]);

    return {
      sharesSent: sharesRes.count ?? 0,
      linkViews: viewsRes.count ?? 0,
      leadsCaptured: subsRes.count ?? 0,
      verdictAlertLeads: verdictRes.count ?? 0,
      marketUnlockLeads: unlockRes.count ?? 0,
      persistence: 'supabase',
    };
  }

  async reset(): Promise<void> {
    // Gotcha safe: Supabase JS requires a filter on delete
    await Promise.all([
      this.client.from('share_events').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      this.client.from('view_events').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      this.client.from('subscribers').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    ]);
  }
}
