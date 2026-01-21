import React from 'react';
import { cn } from '@/lib/utils';

interface PageSkeletonProps {
  count?: number;
  variant?: 'grid' | 'list';
  className?: string;
}

const PageSkeleton: React.FC<PageSkeletonProps> = ({
  count = 4,
  variant = 'grid',
  className,
}) => {
  return (
    <div
      className={cn(
        variant === 'grid'
          ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'
          : 'flex flex-col gap-2',
        className
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'animate-pulse rounded-xl bg-muted',
            variant === 'grid' ? 'aspect-[3/4]' : 'h-20'
          )}
        />
      ))}
    </div>
  );
};

export default PageSkeleton;
