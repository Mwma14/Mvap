import { forwardRef, ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  className?: string;
}

export const FadeIn = forwardRef<HTMLDivElement, FadeInProps>(
  ({ children, className = '' }, ref) => {
    return (
      <div ref={ref} className={`animate-fade-in ${className}`}>
        {children}
      </div>
    );
  }
);

FadeIn.displayName = 'FadeIn';
