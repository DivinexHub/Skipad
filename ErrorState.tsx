interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="glass-card border-rose-400/20 p-6 sm:p-7">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-400/15 text-rose-300">
          !
        </span>
        <h2 className="font-display text-lg font-semibold text-slate-100">
          Unable to determine the final destination
        </h2>
      </div>
      <p className="text-sm leading-relaxed text-slate-400">{message}</p>
      <button onClick={onRetry} className="ghost-btn mt-5">
        Try another URL
      </button>
    </div>
  );
}
