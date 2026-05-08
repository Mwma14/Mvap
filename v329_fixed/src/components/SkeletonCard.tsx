import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "relative flex-shrink-0 w-[calc(33.333%-8px)] min-w-[105px] max-w-[140px] sm:w-[140px] sm:max-w-none md:w-[160px] aspect-[2/3] bg-muted rounded-lg overflow-hidden",
        className
      )}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {/* Title placeholder */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5 space-y-2">
        <div className="h-3 bg-muted-foreground/20 rounded w-4/5" />
        <div className="h-2 bg-muted-foreground/20 rounded w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-5 px-4 md:px-8">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
      </div>
      <div className="flex gap-3 overflow-hidden px-4 md:px-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </section>
  );
}
