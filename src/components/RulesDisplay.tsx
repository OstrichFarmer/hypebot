import { useState } from 'react';
import { GUIDELINES } from '../constants/guidelines';

interface RulesDisplayProps {
  satisfiedRules: number[];
}

// Collapsible quality stamp: a compact "x/8 rules passed" badge that expands
// into a full checklist on click. Collapsed by default so the compliment
// stays the focal point of the card.
export function RulesDisplay({ satisfiedRules }: RulesDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const passedCount = satisfiedRules.length;
  const allPassed = passedCount === GUIDELINES.length;

  return (
    // relative + absolute checklist: expanding this card's rules must not
    // grow this card's flex height, or the grid's items-stretch would force
    // every card in the row to stretch to match it.
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
        className={`inline-flex items-center gap-1.5 min-h-[28px] px-3 py-1 rounded-full text-xs font-semibold transition border cursor-pointer ${
          allPassed
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
        }`}
      >
        <span>
          {passedCount}/{GUIDELINES.length} rules passed {allPassed ? '✓' : '⚠️'}
        </span>
        <span className="text-[9px] opacity-70">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <ul className="absolute top-full left-0 mt-2 w-64 flex flex-col gap-1.5 rounded-xl bg-white border border-gray-200 shadow-lg p-3 z-20">
          {GUIDELINES.map((guideline) => {
            const passed = satisfiedRules.includes(guideline.id);
            return (
              <li key={guideline.id} className="flex items-start gap-2 text-xs text-gray-700 font-normal">
                <span className={`font-bold ${passed ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {passed ? '✓' : '✗'}
                </span>
                <span>{guideline.shortLabel}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
