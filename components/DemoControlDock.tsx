'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Zap, ShieldCheck, RotateCcw, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { ResolvedLocation, Telemetry } from '@/types';
import { MOCK_STAGED_CARDS } from '@/lib/mock-data';
import VerdictModal from './VerdictModal';
import EditorialStagingModal from './EditorialStagingModal';

interface DemoControlDockProps {
  initialLocation: ResolvedLocation;
  initialDemo: boolean;
}

export default function DemoControlDock({ initialLocation, initialDemo }: DemoControlDockProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isVisible, setIsVisible] = useState<boolean>(initialDemo);
  const [location, setLocation] = useState<ResolvedLocation>(initialLocation);
  const [telemetry, setTelemetry] = useState<Telemetry>({
    sharesSent: 0,
    linkViews: 0,
    leadsCaptured: 0,
    verdictAlertLeads: 0,
    marketUnlockLeads: 0,
    persistence: 'memory',
  });
  const [isWarningHost, setIsWarningHost] = useState<boolean>(false);
  const [isVerdictOpen, setIsVerdictOpen] = useState<boolean>(false);
  const [isStagingOpen, setIsStagingOpen] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Sync prop updates
  useEffect(() => {
    setLocation(initialLocation);
  }, [initialLocation]);

  // Handle URL ?demo=1 activation
  useEffect(() => {
    const demoParam = searchParams.get('demo') === '1';
    if (demoParam && !isVisible) {
      setIsVisible(true);
      document.cookie = 'cw_demo=1; path=/; SameSite=Lax';
    }
  }, [searchParams, isVisible]);

  // Handle Ctrl+Shift+D keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setIsVisible((prev) => {
          const next = !prev;
          if (next) {
            document.cookie = 'cw_demo=1; path=/; SameSite=Lax';
            toast('Founder Demo Dock enabled');
          } else {
            document.cookie = 'cw_demo=0; path=/; max-age=0; SameSite=Lax';
            toast('Founder Demo Dock hidden');
          }
          return next;
        });
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Telemetry Poller
  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await fetch('/api/telemetry', { cache: 'no-store' });
      if (res.ok) {
        const data: Telemetry = await res.json();
        setTelemetry(data);

        // Check if warning chip is needed (memory store on remote host)
        if (typeof window !== 'undefined') {
          const host = window.location.hostname;
          const isLocal = host === 'localhost' || host === '127.0.0.1';
          setIsWarningHost(data.persistence === 'memory' && !isLocal);
        }
      }
    } catch {
      // ignore transient poll error
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, [isVisible, fetchTelemetry]);

  // Location Switcher Handler
  const handleSwitchLocation = (zip: '95014' | '80202') => {
    document.cookie = `cw_demo_zip=${zip}; path=/; SameSite=Lax`;
    toast(`Location switched to ${zip === '95014' ? 'Cupertino (95014)' : 'Denver (80202)'}`);
    router.refresh();
    setTimeout(fetchTelemetry, 500);
  };

  // Reset Handler
  const handleReset = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        toast.success('Telemetry counters and test leads reset to 0');
        await fetchTelemetry();
        router.refresh();
      } else if (res.status === 403) {
        toast.error('Reset is disabled on this deploy');
      } else {
        toast.error('Failed to reset store');
      }
    } catch {
      toast.error('Error connecting to reset API');
    } finally {
      setIsResetting(false);
    }
  };

  if (!isVisible) return null;

  const withheldCount = MOCK_STAGED_CARDS.length;
  const isLocalActive = location.zip === '95014' || location.cityName?.includes('Cupertino');

  return (
    <>
      <div 
        className="fixed bottom-3 right-3 z-40 max-w-[95vw] sm:max-w-xl bg-cw-charcoal text-cw-parchment rounded-xl shadow-2xl border border-cw-rust/40 p-3 sm:p-3.5 space-y-2.5 font-mono text-xs backdrop-blur-md bg-opacity-95 animate-in slide-in-from-bottom-4 duration-300"
        role="region"
        aria-label="Founder Demo Dock"
      >
        {/* Top bar: Title + Warnings + Close */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cw-rust animate-pulse"></span>
            <span className="font-bold text-white tracking-wide flex items-center gap-1.5">
              Curbwire Founder Dock
              <span className="text-[10px] text-cw-sand/70 font-normal hidden sm:inline">(Ctrl+Shift+D)</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isWarningHost && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <AlertTriangle className="w-3 h-3" />
                <span className="hidden sm:inline">Persistence not configured.</span> Counts are unreliable.
              </span>
            )}
            <button
              onClick={() => {
                setIsVisible(false);
                document.cookie = 'cw_demo=0; path=/; max-age=0; SameSite=Lax';
                toast('Dock hidden. Use ?demo=1 or Ctrl+Shift+D to restore.');
              }}
              className="text-cw-sand hover:text-white p-0.5 rounded transition"
              title="Hide dock"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Location Switcher */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/5">
          <span className="text-cw-sand/70 pl-1.5 text-[11px] flex items-center gap-1 flex-shrink-0">
            <MapPin className="w-3.5 h-3.5 text-cw-rust" /> Geo:
          </span>
          <button
            type="button"
            onClick={() => handleSwitchLocation('95014')}
            className={`flex-1 py-1 px-2 rounded font-medium transition text-center ${
              isLocalActive 
                ? 'bg-cw-rust text-white shadow-xs' 
                : 'text-cw-sand hover:text-white hover:bg-white/5'
            }`}
          >
            Local: Cupertino (95014)
          </button>
          <button
            type="button"
            onClick={() => handleSwitchLocation('80202')}
            className={`flex-1 py-1 px-2 rounded font-medium transition text-center ${
              !isLocalActive 
                ? 'bg-cw-rust text-white shadow-xs' 
                : 'text-cw-sand hover:text-white hover:bg-white/5'
            }`}
          >
            Remote: Denver (80202)
          </button>
        </div>

        {/* Live Telemetry Ticker */}
        <div className="grid grid-cols-3 gap-1.5 bg-black/30 p-2 rounded-lg border border-white/5 text-center">
          <div>
            <div className="text-[10px] text-cw-sand/70 uppercase">Shares Sent</div>
            <div className="text-sm font-bold text-white tracking-wider">{telemetry.sharesSent}</div>
          </div>
          <div>
            <div className="text-[10px] text-cw-sand/70 uppercase">Link Views</div>
            <div className="text-sm font-bold text-white tracking-wider">{telemetry.linkViews}</div>
          </div>
          <div>
            <div className="text-[10px] text-cw-sand/70 uppercase">Leads Captured</div>
            <div className="text-sm font-bold text-cw-badge-coordination tracking-wider">{telemetry.leadsCaptured}</div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {/* Simulate Verdict */}
          <button
            type="button"
            onClick={() => {
              if (telemetry.verdictAlertLeads === 0) {
                toast('Simulate Verdict is locked', {
                  description: 'Submit an email on the Vallco card with "Notify me" checked to trigger this loop payoff.',
                  action: {
                    label: 'Preview Modal',
                    onClick: () => setIsVerdictOpen(true),
                  },
                });
                return;
              }
              setIsVerdictOpen(true);
            }}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded text-xs font-semibold transition shadow-xs ${
              telemetry.verdictAlertLeads > 0
                ? 'bg-amber-500 hover:bg-amber-400 text-black animate-pulse cursor-pointer'
                : 'bg-white/10 hover:bg-white/15 text-white/60 cursor-pointer'
            }`}
            title={telemetry.verdictAlertLeads === 0 ? 'Click to see trigger steps or preview modal' : 'Simulate Planning Commission verdict payoff'}
          >
            <Zap className={`w-3.5 h-3.5 ${telemetry.verdictAlertLeads > 0 ? 'text-black fill-black' : 'text-amber-400/70'}`} />
            <span>Simulate Verdict</span>
            {telemetry.verdictAlertLeads > 0 ? (
              <span className="w-2 h-2 rounded-full bg-black"></span>
            ) : (
              <span className="text-[10px] text-white/40 font-normal">(Locked)</span>
            )}
          </button>

          {/* Editorial Staging Gate */}
          <button
            type="button"
            onClick={() => setIsStagingOpen(true)}
            className="flex-1 min-w-[160px] flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded text-xs font-semibold bg-cw-sand/20 hover:bg-cw-sand/30 text-cw-parchment border border-cw-sand/30 transition shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cw-rust" />
            <span>Editorial Staging · {withheldCount} withheld</span>
          </button>

          {/* Reset button */}
          <button
            type="button"
            disabled={isResetting}
            onClick={handleReset}
            className="p-1.5 rounded text-cw-sand hover:text-white hover:bg-white/10 transition"
            title="Reset telemetry counters & test subscribers"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Payoff Modals */}
      <VerdictModal isOpen={isVerdictOpen} onClose={() => setIsVerdictOpen(false)} />
      <EditorialStagingModal isOpen={isStagingOpen} onClose={() => setIsStagingOpen(false)} />
    </>
  );
}
