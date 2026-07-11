interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="w-full max-w-[600px] mx-auto rounded-2xl bg-[#FEF2F2] border border-red-200 shadow-sm p-6 flex flex-col items-center gap-3 text-center">
      <span className="text-4xl">😬</span>
      <p className="font-semibold text-gray-900">Whoops, HypeBot tripped over its own enthusiasm.</p>
      <p className="text-sm text-gray-500">{message}</p>
      <button
        onClick={onRetry}
        className="min-h-[44px] px-6 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition duration-150"
      >
        Try again
      </button>
    </div>
  );
}
