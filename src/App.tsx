import { useRef, useState } from 'react';
import type { CardState } from './types';
import { generateInitialCompliments, escalateCompliment } from './utils/gemini';
import { validateCompliment, mergeRulesApplied } from './utils/validation';
import { ComplimentCard } from './components/ComplimentCard';
import { LoadingState } from './components/LoadingState';
import { ErrorMessage } from './components/ErrorMessage';

function App() {
  const [subject, setSubject] = useState('');
  const [cards, setCards] = useState<CardState[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  // API failures (shown as the retryable error card) are kept separate from
  // empty-input validation (shown as an inline message under the input) —
  // they have different causes and different recovery actions.
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runGeneration = async (subjectToUse: string) => {
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const { results, historyPerCard } = await generateInitialCompliments(subjectToUse);
      const newCards: CardState[] = results.map((result, index) => {
        const validation = validateCompliment(result.compliment);
        return {
          id: `card-${Date.now()}-${index}`,
          compliment: result.compliment,
          modelRulesApplied: mergeRulesApplied(result.rulesApplied, validation),
          validation,
          hypeLevel: 1,
          history: historyPerCard[index],
          isEscalating: false,
          escalationError: null,
          copyState: 'idle',
          shareState: 'idle',
        };
      });
      setCards(newCards);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = subject.trim();
    if (!trimmed) {
      setValidationError('Give HypeBot someone to hype up first! ✨');
      return;
    }
    setValidationError(null);
    runGeneration(trimmed);
  };

  const handleTryAnother = () => {
    setCards([]);
    setSubject('');
    setGenerationError(null);
    setValidationError(null);
  };

  // Clears the API error state and hands control back to the user instead of
  // resubmitting — they may need to correct their input first.
  const handleRetry = () => {
    setGenerationError(null);
    inputRef.current?.focus();
  };

  // Escalates a single card in place. Only this card's isEscalating flag
  // flips, so the other cards remain fully interactive while it loads.
  const handleEscalate = async (id: string) => {
    setCards((current) =>
      current.map((card) => (card.id === id ? { ...card, isEscalating: true, escalationError: null } : card)),
    );

    const target = cards.find((card) => card.id === id);
    if (!target) return;

    try {
      const { result, newHistory } = await escalateCompliment(target.history);
      const validation = validateCompliment(result.compliment);
      setCards((current) =>
        current.map((card) =>
          card.id === id
            ? {
                ...card,
                compliment: result.compliment,
                modelRulesApplied: mergeRulesApplied(result.rulesApplied, validation),
                validation,
                hypeLevel: card.hypeLevel + 1,
                history: newHistory,
                isEscalating: false,
              }
            : card,
        ),
      );
    } catch (error) {
      setCards((current) =>
        current.map((card) =>
          card.id === id
            ? {
                ...card,
                isEscalating: false,
                escalationError: error instanceof Error ? error.message : 'Escalation failed. Try again?',
              }
            : card,
        ),
      );
    }
  };

  const handleCopyStateChange = (id: string, state: 'idle' | 'copied') => {
    setCards((current) => current.map((card) => (card.id === id ? { ...card, copyState: state } : card)));
  };

  const handleShareStateChange = (id: string, state: 'idle' | 'shared') => {
    setCards((current) => current.map((card) => (card.id === id ? { ...card, shareState: state } : card)));
  };

  return (
    <div className="min-h-svh bg-[#F8F7FF] py-12">
      <div className="max-w-[1200px] mx-auto px-6 flex flex-col gap-10">
        {/* Header and input stay in a narrow, centered column on every breakpoint. */}
        <div className="w-full max-w-[600px] mx-auto flex flex-col gap-6 items-center">
          <header className="text-center flex flex-col items-center gap-2">
            <h1 className="text-4xl sm:text-5xl font-[800] text-[#7C3AED]">
              HypeBot 🎉
            </h1>
            <p className="text-[#6B7280] text-base font-normal">Absurdly over-the-top compliments, on demand.</p>
          </header>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
            <input
              ref={inputRef}
              type="text"
              value={subject}
              onChange={(event) => {
                setSubject(event.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="e.g. Customer Success Manager, or 'my coworker who always fixes the coffee machine'"
              className="w-full min-h-[56px] rounded-xl border border-gray-300 px-4 py-4 text-base text-[#1F2937] placeholder-gray-400 focus:outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/20 bg-white shadow-sm transition"
            />
            {validationError && <p className="text-sm font-normal text-[#EF4444] px-1">{validationError}</p>}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full min-h-[56px] rounded-xl bg-[#7C3AED] text-white font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition duration-150 disabled:opacity-60"
            >
              {isGenerating ? 'Hyping...' : 'Hype Me Up! 🚀'}
            </button>
          </form>

          {generationError && !isGenerating && <ErrorMessage message={generationError} onRetry={handleRetry} />}
        </div>

        {/* Results widen to a 3-column grid on desktop (>=768px) so all three
            compliments are visible at once instead of wasting side whitespace. */}
        <div className="w-full flex flex-col items-center gap-8">
          {isGenerating && <LoadingState />}

          {!isGenerating && cards.length > 0 && (
            <>
              <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-stretch">
                {cards.map((card) => (
                  <ComplimentCard
                    key={card.id}
                    card={card}
                    onEscalate={handleEscalate}
                    onCopyStateChange={handleCopyStateChange}
                    onShareStateChange={handleShareStateChange}
                  />
                ))}
              </div>
              <button
                onClick={handleTryAnother}
                className="min-h-[48px] px-6 rounded-xl border border-gray-300 font-normal text-sm text-gray-600 bg-white hover:bg-gray-50 active:scale-95 transition"
              >
                Try Another 🔄
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
