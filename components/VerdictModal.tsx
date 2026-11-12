'use client';

import React, { useEffect } from 'react';
import { X, Zap, Bell } from 'lucide-react';

interface VerdictModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VerdictModal({ isOpen, onClose }: VerdictModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg overflow-hidden border rounded-xl shadow-2xl bg-cw-parchment border-cw-sand text-cw-charcoal animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cw-sand bg-cw-parchment">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cw-rust/15 text-cw-rust">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold cw-font-serif text-cw-charcoal">
                  Verdict Notification Simulation
                </h3>
                <span className="px-2 py-0.5 text-xs font-mono font-medium rounded-full bg-cw-sand text-cw-bronze uppercase tracking-wider">
                  Simulated
                </span>
              </div>
              <p className="text-xs text-cw-bronze cw-font-mono">
                Dispatched ~48h following the public hearing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-cw-stone hover:text-cw-charcoal hover:bg-cw-sand/40 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="p-4 border rounded-lg bg-white/70 border-cw-sand/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs text-cw-bronze font-mono pb-2 border-b border-cw-sand/50">
              <span className="flex items-center gap-1.5 font-semibold text-cw-charcoal">
                <Bell className="w-3.5 h-3.5 text-cw-rust" /> Curbwire Civic Alert · 95014
              </span>
              <span>Nov 21, 2026 · 9:14 AM</span>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold cw-font-serif text-cw-charcoal">
                Planning Commission Decision: 19900 Vallco Pkwy
              </h4>
              <p className="text-sm leading-relaxed cw-font-body text-cw-charcoal">
                The Cupertino Planning Commission has <strong className="text-cw-badge-coordination font-semibold">APPROVED</strong> the 50-seat outdoor dining variance for 19900 Vallco Pkwy with 4 noise mitigation stipulations.
              </p>
              <div className="p-2.5 bg-cw-tint-rust/60 rounded border border-cw-rust/20 text-xs text-cw-charcoal cw-font-body space-y-1">
                <div className="font-semibold text-cw-rust">Key Conditions Imposed:</div>
                <ul className="list-disc list-inside space-y-0.5 text-cw-charcoal/90">
                  <li>Outdoor audio systems prohibited after 8:30 PM on weekdays</li>
                  <li>8-foot acoustic glass vegetative screen along northern parcel boundary</li>
                  <li>Quarterly decibel compliance monitoring reports filed with City Hall</li>
                </ul>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={onClose}
                className="w-full py-2 px-3 rounded-md bg-cw-rust text-white text-xs font-medium hover:bg-cw-rust/90 transition shadow-xs text-center font-mono"
              >
                Tap here for the 60-second recap →
              </button>
            </div>
          </div>

          <p className="text-xs text-cw-bronze italic text-center cw-font-body">
            This payoff closes Loop 1 (Intra-Community Density) by rewarding residents who subscribed for follow-up civic tracking.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-3 border-t bg-cw-sand/20 border-cw-sand">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-mono font-medium rounded border border-cw-sand bg-white text-cw-charcoal hover:bg-cw-sand/30 transition"
          >
            Close Simulation
          </button>
        </div>
      </div>
    </div>
  );
}
