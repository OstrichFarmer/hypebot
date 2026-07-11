import { useEffect, useState } from 'react';

const LOADING_MESSAGES = [
  'Consulting the hype council...',
  'Generating maximum hype...',
  'Warming up the compliment engine...',
  'Polishing the metaphors...',
  'Calculating absurd statistics...',
  'Summoning enthusiasm from another dimension...',
];

// Full-page loading state for the initial generation: three pulsing
// placeholder cards with rotating on-brand copy instead of a plain spinner.
export function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-stretch">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl bg-white border border-gray-200 border-l-4 border-l-gray-200 shadow-sm p-6 flex flex-col gap-5 min-h-[320px]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="h-6 bg-gray-200 rounded-full w-24" />
              <div className="h-4 bg-gray-200 rounded-full w-12" />
            </div>

            <div className="flex-1 flex flex-col gap-3 py-4">
              <div className="h-4 bg-gray-200 rounded-full w-full" />
              <div className="h-4 bg-gray-200 rounded-full w-11/12" />
              <div className="h-4 bg-gray-200 rounded-full w-3/4" />
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 mt-auto w-full">
              <div className="flex gap-3 w-full">
                <div className="h-10 bg-gray-200 rounded-xl flex-1" />
                <div className="h-10 bg-gray-200 rounded-xl flex-1" />
              </div>
              <div className="h-12 bg-gray-200 rounded-xl w-full" />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[#6B7280] text-base font-normal text-center mt-2 animate-pulse">
        {LOADING_MESSAGES[messageIndex]}
      </p>
    </div>
  );
}
