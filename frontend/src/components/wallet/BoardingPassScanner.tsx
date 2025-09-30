'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileImage, X, Check, Plane, Coins, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useBoardingPassScanner } from '@/lib/hooks/useBoardingPassScanner';
import { CoinAnimation } from './CoinAnimation';
import { isValidImageFile } from '@/lib/utils/validation';
import { hapticBoardingPassScan, hapticSelection } from '@/lib/utils/haptics';

interface BoardingPassScannerProps {
  onScanComplete?: (coinsEarned: number) => void;
  className?: string;
}

export function BoardingPassScanner({ onScanComplete, className }: BoardingPassScannerProps) {
  const t = useTranslations('wallet');
  const tErrors = useTranslations('errors');
  
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    isScanning,
    isProcessing,
    error,
    lastScanResult,
    scanBoardingPass,
    clearError
  } = useBoardingPassScanner();

  const handleFileSelect = useCallback((file: File) => {
    setValidationError(null);
    clearError();
    
    // Validate file
    if (!isValidImageFile(file)) {
      if (file.size > 5 * 1024 * 1024) {
        setValidationError(tErrors('fileTooLarge'));
      } else {
        setValidationError(tErrors('invalidFile'));
      }
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [tErrors, clearError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleScan = useCallback(async () => {
    if (!selectedFile) return;

    try {
      const result = await scanBoardingPass(selectedFile);
      
      if (result.success && result.coinsEarned) {
        // Trigger haptic feedback for successful scan
        hapticBoardingPassScan();
        
        // Show coin animation
        setShowCoinAnimation(true);
        
        // Call completion callback
        onScanComplete?.(result.coinsEarned);
        
        // Reset form after successful scan
        setTimeout(() => {
          setSelectedFile(null);
          setPreview(null);
          setShowCoinAnimation(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Boarding pass scan failed:', error);
    }
  }, [selectedFile, scanBoardingPass, onScanComplete]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
    setValidationError(null);
    clearError();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [clearError]);

  const handleBrowseFiles = useCallback(() => {
    hapticSelection();
    fileInputRef.current?.click();
  }, []);

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5" />
          {t('scanBoardingPass')}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!selectedFile ? (
          <motion.div
            className={cn(
              "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragOver 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-muted-foreground/50",
              "cursor-pointer"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleBrowseFiles}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className={cn(
                "mx-auto w-12 h-12 rounded-full flex items-center justify-center",
                isDragOver ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                <Upload className="h-6 w-6" />
              </div>
              
              <div>
                <p className="text-sm font-medium">
                  {isDragOver ? 'Drop your boarding pass here' : 'Upload boarding pass to earn 10 coins'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, WEBP up to 5MB
                </p>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* File Preview */}
            <div className="relative border rounded-lg p-4 bg-muted/30">
              <div className="flex items-start gap-3">
                {preview && (
                  <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted">
                    <img
                      src={preview}
                      alt="Boarding pass preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Check className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-600 dark:text-green-400">
                      Valid file
                    </span>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="h-8 w-8 p-0"
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Scan Button */}
            <Button
              onClick={handleScan}
              className="w-full"
              size="lg"
              disabled={isProcessing || isScanning}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <FileImage className="h-4 w-4 mr-2" />
                  Scan for 10 Coins
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Success Result */}
        <AnimatePresence>
          {lastScanResult?.success && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
            >
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    {lastScanResult.message}
                  </p>
                  {lastScanResult.coinsEarned && (
                    <div className="flex items-center gap-1 mt-1">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-green-700 dark:text-green-300">
                        +{lastScanResult.coinsEarned} Smile Coins earned!
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        {(validationError || error) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-md bg-destructive/10 border border-destructive/20"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">
                {validationError || error}
              </p>
            </div>
          </motion.div>
        )}
      </CardContent>

      {/* Coin Animation Overlay */}
      <AnimatePresence>
        {showCoinAnimation && lastScanResult?.coinsEarned && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <CoinAnimation
              type="earn"
              amount={lastScanResult.coinsEarned}
              onComplete={() => setShowCoinAnimation(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}