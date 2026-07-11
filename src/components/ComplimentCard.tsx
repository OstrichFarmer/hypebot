import { useState, useEffect, useRef } from 'react';
import type { CardState } from '../types';
import { RulesDisplay } from './RulesDisplay';

interface ComplimentCardProps {
  card: CardState;
  onEscalate: (id: string) => void;
  onCopyStateChange: (id: string, state: 'idle' | 'copied') => void;
  onShareStateChange: (id: string, state: 'idle' | 'shared') => void;
}

export function ComplimentCard({ card, onEscalate, onCopyStateChange, onShareStateChange }: ComplimentCardProps) {
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const prevHypeLevelRef = useRef(card.hypeLevel);

  useEffect(() => {
    if (card.hypeLevel > prevHypeLevelRef.current) {
      setIsFlashActive(true);
      const timer = setTimeout(() => setIsFlashActive(false), 300);
      prevHypeLevelRef.current = card.hypeLevel;
      return () => clearTimeout(timer);
    }
  }, [card.hypeLevel]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(card.compliment);
      onCopyStateChange(card.id, 'copied');
      setTimeout(() => onCopyStateChange(card.id, 'idle'), 2000);
    } catch {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: card.compliment, title: 'HypeBot Compliment' });
      } catch {
        // User cancelled the share sheet — no error state needed.
      }
      return;
    }
    // Desktop fallback: copy to clipboard with distinct "share" messaging.
    try {
      await navigator.clipboard.writeText(card.compliment);
      onShareStateChange(card.id, 'shared');
      setShareFeedback('✅ Copied to share!');
      setTimeout(() => {
        onShareStateChange(card.id, 'idle');
        setShareFeedback(null);
      }, 2000);
    } catch {
      setShareFeedback('⚠️ Failed to copy');
      setTimeout(() => setShareFeedback(null), 2000);
    }
  };

  return (
    <div
      className={`w-full flex flex-col rounded-2xl bg-white border border-gray-200 border-l-4 border-l-[#7C3AED] shadow-sm p-6 gap-5 transition ${
        isFlashActive ? 'animate-border-flash' : ''
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#7C3AED] text-white">
          🔥 Hype Level {card.hypeLevel}
        </span>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${
            card.validation.rule5Passed ? 'text-emerald-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {card.validation.wordCount}/40 words{card.validation.rule5Passed ? '' : ' ⚠️'}
        </span>
      </div>

      {/* Grows to fill leftover space so the action row below lines up
          across all three cards regardless of how long each compliment is. */}
      <div className="flex-1 flex flex-col gap-4">
        <p className="text-lg sm:text-xl font-semibold text-gray-900 leading-relaxed py-2">
          {card.compliment}
        </p>
        <div>
          <RulesDisplay satisfiedRules={card.modelRulesApplied} />
        </div>
      </div>

      {card.escalationError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {card.escalationError}
        </p>
      )}

      <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 mt-auto">
        <div className="flex gap-3 w-full">
          <button
            onClick={handleCopy}
            className="flex-1 min-h-[40px] flex items-center justify-center gap-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 active:scale-95 transition"
          >
            {copyFailed ? '⚠️ Failed to copy' : card.copyState === 'copied' ? '✅ Copied!' : '📋 Copy'}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 min-h-[40px] flex items-center justify-center gap-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 active:scale-95 transition"
          >
            {shareFeedback ?? '📤 Share'}
          </button>
        </div>
        <button
          onClick={() => onEscalate(card.id)}
          disabled={card.isEscalating}
          className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] text-white font-bold text-base hover:scale-[1.02] active:scale-[0.98] transition duration-150 disabled:opacity-60"
        >
          {card.isEscalating ? 'Amplifying...' : '🔥 Make It More Dramatic'}
        </button>
      </div>
    </div>
  );
}
