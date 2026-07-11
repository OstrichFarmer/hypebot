import { useRef, useState } from 'react';
import { GUIDELINES } from '../constants/guidelines';

interface RulesDisplayProps {
  satisfiedRules: number[];
}

// Rough height of the fully-expanded checklist (8 rows + padding), used to
// decide whether it fits below the badge or needs to flip upward.
const ESTIMATED_DROPDOWN_HEIGHT = 260;

// Collapsible quality stamp: a compact "x/8 rules passed" badge that expands
// into a full checklist on click. Collapsed by default so the compliment
// stays the focal point of the card.
export function RulesDisplay({ satisfiedRules }: RulesDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const passedCount = satisfiedRules.length;
  const allPassed = passedCount === GUIDELINES.length;

  const handleToggle = () => {
    setIsExpanded((current) => {
      const next = !current;
      if (next && buttonRef.current) {
        // If there isn't enough room below the badge (e.g. the last card on
        // a mobile screen), open the checklist upward instead so it never
        // gets clipped by the viewport edge.
        const spaceBelow = window.innerHeight - buttonRef.current.getBoundingClientRect().bottom;
        setOpenUpward(spaceBelow < ESTIMATED_DROPDOWN_HEIGHT);
      }
      return next;
    });
  };

  return (
    // relative + absolute checklist: expanding this card's rules must not
    // grow this card's flex height, or the grid's items-stretch would force
    // every card in the row to stretch to match it.
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
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
        <ul
          className={`absolute left-0 w-64 flex flex-col gap-1.5 rounded-xl bg-white border border-gray-200 shadow-lg p-3 z-20 ${
            openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
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
