'use client';

import React, { useState, useEffect } from 'react';
import { X, Mail, Copy } from 'lucide-react';
import { toast } from 'sonner';

export interface ShareTarget {
  type: 'card' | 'issue' | 'waitlist';
  path: string;
  title: string;
  cardSlug?: string | null;
  zip?: string;
  cityName?: string | null;
}

interface ShareEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  target: ShareTarget;
  shareUrl: string;
  onLogShare: (channel: 'email' | 'copy') => void;
}

export default function ShareEmailDialog({
  isOpen,
  onClose,
  target,
  shareUrl,
  onLogShare,
}: ShareEmailDialogProps) {
  const [senderName, setSenderName] = useState<string>('');
  const [friendEmail, setFriendEmail] = useState<string>('');

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

  const displayName = senderName.trim() || 'A neighbor';
  const cleanCity = target.cityName ? target.cityName.split(',')[0].trim() : 'our neighborhood';

  // Compute Subject and Body based on target type
  let subject = '';
  let body = '';

  if (target.type === 'card') {
    subject = target.title;
    body = `${displayName} thought you'd be interested in this article. Click ${shareUrl} to see!`;
  } else if (target.type === 'issue') {
    subject = `Curbwire for ${target.zip || 'Cupertino'}`;
    body = `${displayName} thought you'd be interested in this newsletter. Click ${shareUrl} to see!`;
  } else {
    // waitlist
    subject = `Help bring Curbwire to ${cleanCity}`;
    body = `${displayName} is trying to bring Curbwire to ${cleanCity}. Click ${shareUrl} to add your pledge!`;
  }

  // Handle mailto link launch
  const handleOpenEmail = () => {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    const recipient = friendEmail.trim();
    const mailtoUrl = `mailto:${recipient}?subject=${encodedSubject}&body=${encodedBody}`;

    onLogShare('email');
    window.location.href = mailtoUrl;
    onClose();
  };

  // Handle copy link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast('Link copied to clipboard');
      onLogShare('copy');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-md overflow-hidden border rounded-xl shadow-2xl bg-cw-parchment border-cw-sand text-cw-charcoal animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-cw-sand bg-cw-parchment">
          <h3 className="text-base font-bold cw-font-serif text-cw-charcoal flex items-center gap-2">
            <Mail className="w-4 h-4 text-cw-rust" />
            Send this to a friend
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-cw-stone hover:text-cw-charcoal hover:bg-cw-sand/40 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          <div className="space-y-3 text-xs">
            <div>
              <label htmlFor="sender-name-input" className="block font-mono font-medium text-cw-charcoal mb-1">
                Your name (optional)
              </label>
              <input
                id="sender-name-input"
                type="text"
                placeholder="e.g. Sam"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white border-cw-sand text-cw-charcoal focus:outline-hidden focus:border-cw-rust text-xs"
              />
            </div>

            <div>
              <label htmlFor="friend-email-input" className="block font-mono font-medium text-cw-charcoal mb-1">
                Friend's email (optional)
              </label>
              <input
                id="friend-email-input"
                type="email"
                placeholder="friend@example.com"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white border-cw-sand text-cw-charcoal focus:outline-hidden focus:border-cw-rust text-xs"
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="p-3.5 rounded-lg border border-cw-sand/80 bg-white/70 space-y-1.5 text-xs">
            <div className="text-[10px] font-mono font-bold text-cw-bronze uppercase">Email Preview</div>
            <div className="font-semibold text-cw-charcoal truncate">Subject: {subject}</div>
            <p className="text-cw-stone cw-font-body leading-relaxed line-clamp-3">
              {body}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleOpenEmail}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-cw-rust text-white text-xs font-mono font-medium hover:bg-cw-rust/90 transition shadow-xs"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Open Email</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-white border border-cw-sand text-cw-charcoal text-xs font-mono font-medium hover:bg-cw-sand/20 transition shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5 text-cw-stone" />
              <span>Copy Link</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
