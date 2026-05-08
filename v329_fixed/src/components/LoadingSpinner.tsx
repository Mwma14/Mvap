interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-6">
      <div className="relative flex items-center justify-center h-16 overflow-visible">
        <img
          src="/kyi-mal-icon.png"
          alt="MovieKyiMal"
          className="h-16 w-auto object-contain"
          style={{
            animation: 'logo-pulse-spin 2s ease-in-out infinite',
          }}
        />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
}
