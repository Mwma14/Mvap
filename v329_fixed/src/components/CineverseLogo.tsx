export function CineverseLogo({ className = 'text-foreground' }: { className?: string }) {
  return (
    <span className="relative flex items-center gap-2 h-10 overflow-visible">
      <img
        src="/kyi-mal-icon.png"
        alt="MovieKyiMal"
        className="h-9 w-9 rounded-full object-contain"
        style={{ maxHeight: '36px' }}
      />
      <span
        className="text-lg font-bold tracking-wide bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent"
        style={{ lineHeight: '1' }}
      >
        MovieKyiMal
      </span>
    </span>
  );
}
