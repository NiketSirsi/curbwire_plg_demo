'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ShieldCheck, ExternalLink } from 'lucide-react';
import { MOCK_STAGED_CARDS, getMockCards } from '@/lib/mock-data';
import { Card, VerificationResult } from '@/types';

interface EditorialStagingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditorialStagingModal({ isOpen, onClose }: EditorialStagingModalProps) {
  const [selectedStagedId, setSelectedStagedId] = useState<string>('crd_qa_01');

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

  const publishedCards = getMockCards();
  const publishedCount = publishedCards.length;
  const flaggedCount = MOCK_STAGED_CARDS.filter((c) => c.editorialStatus === 'FLAGGED_HALLUCINATION').length;
  const rejectedCount = MOCK_STAGED_CARDS.filter((c) => c.editorialStatus === 'REJECTED_NOT_SHAREWORTHY').length;
  const pendingCount = 0;

  const selectedStaged = MOCK_STAGED_CARDS.find((c) => c.id === selectedStagedId) ?? MOCK_STAGED_CARDS[0];
  const approvedWhimsyCard = publishedCards.find((c) => c.category === 'ABSURDITY') ?? publishedCards[1];

  // Helper to highlight excerpts in text
  function renderWithHighlights(text: string, excerpts: string[]) {
    if (!text || excerpts.length === 0) return text;

    // Build regex of escaped excerpts
    const pattern = new RegExp(`(${excerpts.map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(pattern);

    return parts.map((part, i) => {
      const isMatch = excerpts.some((e) => e.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        return (
          <mark key={i} className="bg-cw-tint-rust text-cw-charcoal font-medium px-1 rounded-xs border-b border-cw-rust/40">
            {part}
          </mark>
        );
      }
      return part;
    });
  }

  const excerpts = selectedStaged.verificationNotes?.map((n) => n.excerpt).filter(Boolean) as string[] ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border rounded-xl shadow-2xl bg-cw-parchment border-cw-sand text-cw-charcoal animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-cw-sand bg-cw-parchment flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cw-rust/15 text-cw-rust">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold cw-font-serif text-cw-charcoal flex items-center gap-2">
                Editorial Staging Gate
              </h2>
              <p className="text-xs text-cw-bronze cw-font-mono">
                Agents draft. A human editor decides what publishes.
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

        {/* Pipeline Summary Bar */}
        <div className="px-5 py-2 border-b border-cw-sand/70 bg-cw-sand/20 text-xs font-mono text-cw-bronze flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <span className="font-semibold text-cw-charcoal">Pipeline Status:</span>
            <span className="text-cw-badge-coordination font-medium">{publishedCount} published</span>
            <span>·</span>
            <span className="text-cw-badge-qa-flagged font-medium">{flaggedCount} flagged</span>
            <span>·</span>
            <span className="text-cw-stone font-medium">{rejectedCount} rejected</span>
            <span>·</span>
            <span className="text-cw-bronze">{pendingCount} pending</span>
          </div>
          <span className="hidden sm:inline text-[11px] text-cw-stone">Review Queue Mock</span>
        </div>

        {/* Split Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Panel: Withheld Agent Drafts */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cw-rust flex items-center gap-1.5">
                Withheld Agent Drafts
              </span>

              {/* Chip selector */}
              <div className="flex items-center bg-cw-sand/40 p-0.5 rounded-lg border border-cw-sand text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setSelectedStagedId('crd_qa_01')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    selectedStagedId === 'crd_qa_01'
                      ? 'bg-cw-badge-qa-flagged text-white shadow-xs font-semibold'
                      : 'text-cw-bronze hover:text-cw-charcoal'
                  }`}
                >
                  Hallucination
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStagedId('crd_qa_02')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    selectedStagedId === 'crd_qa_02'
                      ? 'bg-cw-charcoal text-white shadow-xs font-semibold'
                      : 'text-cw-bronze hover:text-cw-charcoal'
                  }`}
                >
                  Not forward-worthy
                </button>
              </div>
            </div>

            {/* Staged Card Frame */}
            <div className="p-4 sm:p-5 rounded-lg border-2 border-dashed border-cw-sand bg-white/60 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cw-bronze">Drafted by: Absurdity Agent</span>
                {selectedStaged.editorialStatus === 'FLAGGED_HALLUCINATION' ? (
                  <span className="px-2 py-0.5 rounded font-bold bg-cw-badge-qa-flagged text-white tracking-wide text-[11px]">
                    FLAGGED: HALLUCINATION
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded font-bold bg-cw-stone text-white tracking-wide text-[11px]">
                    REJECTED: NOT FORWARD-WORTHY
                  </span>
                )}
              </div>

              <div>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-cw-badge-whimsy text-white mb-2">
                  BUREAUCRATIC WHIMSY
                </span>
                <h3 className="text-base sm:text-lg font-bold cw-font-serif text-cw-charcoal leading-snug">
                  {renderWithHighlights(selectedStaged.headline, excerpts)}
                </h3>
              </div>

              <div className="text-xs text-cw-bronze font-mono">
                {selectedStaged.sourceName}
                {selectedStaged.actionMeta?.codeSection ? ` · ${selectedStaged.actionMeta.codeSection}` : ''}
              </div>

              <p className="text-xs sm:text-sm cw-font-body text-cw-charcoal leading-relaxed">
                {renderWithHighlights(selectedStaged.summary, excerpts)}
              </p>

              {selectedStaged.detailContext && (
                <div className="p-2.5 rounded bg-cw-parchment/70 border border-cw-sand/60 text-xs cw-font-body text-cw-charcoal leading-relaxed">
                  {renderWithHighlights(selectedStaged.detailContext, excerpts)}
                </div>
              )}

              {/* Editor's Decision Callout */}
              <div className="p-3 rounded-md bg-cw-tint-rust/80 border border-cw-rust/30 space-y-1">
                <div className="text-xs font-mono font-bold text-cw-rust flex items-center gap-1.5">
                  <span>⚖️ Editor's Decision:</span>
                </div>
                <p className="text-xs cw-font-body text-cw-charcoal leading-relaxed italic">
                  "{selectedStaged.flagReason}"
                </p>
              </div>

              {/* Verification Notes */}
              {selectedStaged.verificationNotes && (
                <div className="space-y-2 pt-2 border-t border-cw-sand/60">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cw-bronze block">
                    Verification Source Audit
                  </span>
                  <div className="space-y-1.5">
                    {selectedStaged.verificationNotes.map((note, idx) => (
                      <div key={idx} className="p-2 rounded bg-white border border-cw-sand/40 text-xs font-mono space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-cw-charcoal">{note.check}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            note.result === 'PASS' 
                              ? 'bg-cw-badge-coordination/20 text-cw-badge-coordination' 
                              : note.result === 'FAIL' 
                              ? 'bg-cw-badge-qa-flagged/20 text-cw-badge-qa-flagged' 
                              : 'bg-cw-bronze/20 text-cw-bronze'
                          }`}>
                            {note.result}
                          </span>
                        </div>
                        <p className="text-[11px] font-sans text-cw-stone leading-normal">{note.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Approved Public Card */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cw-badge-coordination flex items-center gap-1.5">
                Approved Public Card
              </span>
              <span className="text-xs font-mono text-cw-bronze">Active in Issue #6</span>
            </div>

            {/* Approved Card Frame */}
            <div className="p-4 sm:p-5 rounded-lg border border-cw-sand bg-white space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cw-bronze">Drafted by: Absurdity Agent</span>
                <span className="px-2 py-0.5 rounded font-bold bg-cw-badge-coordination text-white tracking-wide text-[11px]">
                  PUBLISHED
                </span>
              </div>

              <div>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-cw-badge-whimsy text-white mb-2">
                  BUREAUCRATIC WHIMSY
                </span>
                <h3 className="text-base sm:text-lg font-bold cw-font-serif text-cw-charcoal leading-snug">
                  {approvedWhimsyCard.headline}
                </h3>
              </div>

              <div className="text-xs text-cw-bronze font-mono">
                {approvedWhimsyCard.sourceName}
                {approvedWhimsyCard.actionMeta?.codeSection ? ` · ${approvedWhimsyCard.actionMeta.codeSection}` : ''}
              </div>

              <p className="text-xs sm:text-sm cw-font-body text-cw-charcoal leading-relaxed">
                {approvedWhimsyCard.summary}
              </p>

              {approvedWhimsyCard.detailContext && (
                <div className="p-2.5 rounded bg-cw-parchment/60 border border-cw-sand/50 text-xs cw-font-body text-cw-charcoal leading-relaxed">
                  <strong className="font-semibold text-cw-charcoal">The Silicon Valley Reality Check: </strong>
                  {approvedWhimsyCard.detailContext.replace(/^The Silicon Valley Reality Check:\s*/i, '')}
                </div>
              )}

              {/* Editor's Approval Callout */}
              <div className="p-3 rounded-md bg-cw-badge-coordination/10 border border-cw-badge-coordination/30 space-y-1">
                <div className="text-xs font-mono font-bold text-cw-badge-coordination flex items-center gap-1.5">
                  <span>✓ Editor's Call:</span>
                </div>
                <p className="text-xs cw-font-body text-cw-charcoal leading-relaxed">
                  Pithy and forward-worthy. High novelty, verified municipal codes. Cleared for newsletter and Loop 2 distribution.
                </p>
              </div>

              {/* Live Link */}
              <div className="pt-2">
                <Link
                  href={`/c/${approvedWhimsyCard.slug}`}
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-cw-rust hover:underline font-semibold"
                >
                  <span>View live page →</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-cw-sand/80 bg-cw-sand/15 text-xs text-cw-bronze cw-font-body space-y-1">
              <strong className="text-cw-charcoal font-semibold block cw-font-serif">The Founder Confidence Principle:</strong>
              Curbwire protects community trust by pairing autonomous ingestion agents with a strict human editorial decision gate. No unreviewed draft ever touches a reader.
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-5 py-3 border-t bg-cw-sand/20 border-cw-sand flex-shrink-0">
          <span className="text-xs font-mono text-cw-bronze">
            Read-only staging inspect modal
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-mono font-medium rounded border border-cw-sand bg-white text-cw-charcoal hover:bg-cw-sand/30 transition shadow-2xs"
          >
            Close Modal
          </button>
        </div>
      </div>
    </div>
  );
}
