'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Plane, Calendar, Coins, FileImage, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBoardingPassScanner } from '@/lib/hooks/useBoardingPassScanner';
import { formatDistanceToNow } from 'date-fns';
import type { BoardingPass } from '@/lib/types';

interface BoardingPassHistoryProps {
  className?: string;
}

export function BoardingPassHistory({ className }: BoardingPassHistoryProps) {
  const t = useTranslations('wallet');
  
  const {
    scanHistory,
    totalCoinsEarned,
    isProcessing,
    error,
    loadScanHistory
  } = useBoardingPassScanner();

  useEffect(() => {
    loadScanHistory();
  }, [loadScanHistory]);

  const handleRefresh = () => {
    loadScanHistory();
  };

  if (isProcessing && scanHistory.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Boarding Pass History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <FileImage className="h-5 w-5" />
          Boarding Pass History
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
          ) : (
            'Refresh'
          )}
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        {scanHistory.length > 0 && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{scanHistory.length}</p>
              <p className="text-sm text-muted-foreground">Passes Scanned</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Coins className="h-4 w-4 text-yellow-500" />
                <p className="text-2xl font-bold text-yellow-600">{totalCoinsEarned}</p>
              </div>
              <p className="text-sm text-muted-foreground">Total Coins Earned</p>
            </div>
          </div>
        )}

        {/* Boarding Pass List */}
        {scanHistory.length === 0 ? (
          <div className="text-center py-8">
            <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No boarding passes scanned yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload your boarding pass to start earning Smile Coins!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {scanHistory.map((boardingPass, index) => (
              <BoardingPassItem
                key={boardingPass.id}
                boardingPass={boardingPass}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface BoardingPassItemProps {
  boardingPass: BoardingPass;
  index: number;
}

function BoardingPassItem({ boardingPass, index }: BoardingPassItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
    >
      {/* Flight Icon */}
      <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
        <Plane className="h-5 w-5 text-primary" />
      </div>

      {/* Flight Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-sm">{boardingPass.flightNumber}</p>
          <Badge variant="secondary" className="text-xs">
            {boardingPass.passengerName}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{boardingPass.date.toLocaleDateString()}</span>
          </div>
          
          {boardingPass.scannedAt && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {formatDistanceToNow(boardingPass.scannedAt, { addSuffix: true })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Coins Earned */}
      <div className="flex-shrink-0 flex items-center gap-1">
        <Coins className="h-4 w-4 text-yellow-500" />
        <span className="font-medium text-sm text-yellow-600">
          +{boardingPass.coinsAwarded}
        </span>
      </div>
    </motion.div>
  );
}