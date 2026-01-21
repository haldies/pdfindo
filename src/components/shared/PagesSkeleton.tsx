import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PageSkeletonProps {
  count?: number;
  className?: string;
  variant?: 'grid' | 'list';
}

const PageSkeleton: React.FC<PageSkeletonProps> = ({
  count = 4,
  className,
  variant = 'grid',
}) => {
  if (variant === 'list') {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: count }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border"
          >
            <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-3 bg-muted rounded animate-pulse w-1/4" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="relative"
        >
          <div className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-border bg-muted">
            <div className="w-full h-full animate-pulse bg-gradient-to-br from-muted to-muted-foreground/10" />
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md bg-muted animate-pulse">
            <div className="w-4 h-3" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default PageSkeleton;
