import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'warning';
}

export function ErrorMessage({
  title,
  message,
  onRetry,
  retryText = "Try again",
  className,
  variant = 'destructive'
}: ErrorMessageProps) {
  const variantClasses = {
    default: 'bg-muted text-muted-foreground border-border',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-800'
  };

  return (
    <div className={cn(
      "rounded-lg border p-4 space-y-3",
      variantClasses[variant],
      className
    )}>
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          {title && (
            <h3 className="font-medium">
              {title}
            </h3>
          )}
          <p className="text-sm">
            {message}
          </p>
        </div>
      </div>
      
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {retryText}
        </Button>
      )}
    </div>
  );
}