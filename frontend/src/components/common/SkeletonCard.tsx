import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
  showImage?: boolean;
  lines?: number;
}

export function SkeletonCard({ 
  className, 
  showImage = true, 
  lines = 3 
}: SkeletonCardProps) {
  return (
    <div className={cn(
      "animate-pulse bg-card border rounded-lg p-4 space-y-3",
      className
    )}>
      {showImage && (
        <div className="h-32 bg-muted rounded-md" />
      )}
      
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-4 bg-muted rounded",
              i === 0 && "w-3/4",
              i === 1 && "w-full",
              i === 2 && "w-1/2",
              i > 2 && "w-2/3"
            )}
          />
        ))}
      </div>
    </div>
  );
}