'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Star, Coins, Loader2, CheckCircle, AlertCircle, QrCode } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CoinAnimation } from '@/components/wallet/CoinAnimation';
import { QRScanner } from './QRScanner';
import { motion, AnimatePresence } from 'framer-motion';

interface RatingInterfaceProps {
  merchantId: string;
  merchantName: string;
  userBalance: number;
  onRatingSubmit: (rating: number, coinsSpent: number, qrCodeData: string) => Promise<void>;
  onClose: () => void;
  isQRAlreadyScanned?: boolean; // New prop to indicate QR was already scanned
}

export function RatingInterface({ 
  merchantId, 
  merchantName, 
  userBalance, 
  onRatingSubmit, 
  onClose,
  isQRAlreadyScanned = false
}: RatingInterfaceProps) {
  const t = useTranslations('rating');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrCodeScanned, setQrCodeScanned] = useState<string | null>(
    isQRAlreadyScanned ? `SMILE_${merchantId.toUpperCase()}_RATING_ACCESS` : null
  );
  const [isQRValidated, setIsQRValidated] = useState(isQRAlreadyScanned);

  const ratingOptions = [
    { coins: 1, label: t('poor'), description: t('poorDescription'), color: 'bg-red-500' },
    { coins: 2, label: t('good'), description: t('goodDescription'), color: 'bg-yellow-500' },
    { coins: 3, label: t('excellent'), description: t('excellentDescription'), color: 'bg-green-500' },
  ];

  const handleQRScanSuccess = (scannedMerchantId: string, _scannedMerchantName: string) => {
    if (scannedMerchantId === merchantId) {
      setQrCodeScanned(`SMILE_${merchantId.toUpperCase()}_RATING_ACCESS`);
      setIsQRValidated(true);
      setShowQRScanner(false);
      setError(null);
    } else {
      setError(t('wrongMerchantQR'));
      setShowQRScanner(false);
    }
  };

  const handleRatingSelect = (rating: number) => {
    if (!isQRValidated) {
      setError(t('scanQRFirst'));
      return;
    }
    if (userBalance < rating) {
      setError(t('insufficientBalance'));
      return;
    }
    setSelectedRating(rating);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedRating || !qrCodeScanned) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Show coin animation
      setShowCoinAnimation(true);
      
      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Submit rating with QR code data
      await onRatingSubmit(selectedRating, selectedRating, qrCodeScanned);
      
      setIsSuccess(true);
      
      // Auto-close after success animation
      setTimeout(() => {
        onClose();
      }, 100); // Reduced for testing
      
    } catch (err) {
      setError(err instanceof Error ? err.message : t('submitError'));
      setShowCoinAnimation(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = selectedRating !== null && userBalance >= selectedRating && !isSubmitting && isQRValidated;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md"
      >
        <Card className="relative overflow-hidden">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Star className="w-6 h-6 text-amber-500" />
              <span>{t('rateMerchant')}</span>
            </CardTitle>
            <p className="text-gray-600 text-sm">
              {t('rateExperience', { merchantName })}
            </p>
            <div className="flex items-center justify-center space-x-2 mt-2">
              <Coins className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium">
                {t('yourBalance')}: {userBalance} {t('coins')}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* QR Code Scanning Section */}
            {!isQRValidated && (
              <div className="space-y-4">
                <div className="text-center p-6 bg-hk-red/5 border border-hk-red/20 rounded-lg">
                  <QrCode className="w-12 h-12 text-hk-red mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900 mb-2">{t('scanQRToRate')}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {t('scanQRInstructions')}
                  </p>
                  <Button
                    onClick={() => setShowQRScanner(true)}
                    className="bg-hk-red hover:bg-hk-red/90 text-white"
                    data-testid="scan-qr-button"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    {t('scanQRCode')}
                  </Button>
                </div>
              </div>
            )}

            {/* QR Validated Confirmation */}
            <AnimatePresence>
              {isQRValidated && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg"
                  data-testid="qr-validated-message"
                >
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-green-700 font-medium">{t('qrCodeValidated')}</p>
                    <p className="text-xs text-green-600">{t('canNowRate')}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Rating Options */}
            {isQRValidated && (
              <div className="space-y-3">
              <h3 className="font-medium text-gray-900">{t('selectRating')}</h3>
              {ratingOptions.map((option) => {
                const isSelected = selectedRating === option.coins;
                const isDisabled = userBalance < option.coins || isSubmitting;
                
                return (
                  <motion.button
                    key={option.coins}
                    onClick={() => !isDisabled && handleRatingSelect(option.coins)}
                    disabled={isDisabled}
                    className={`
                      w-full p-4 rounded-lg border-2 transition-all duration-200
                      ${isSelected 
                        ? 'border-hk-red bg-hk-red/5 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                      ${isDisabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'cursor-pointer hover:shadow-sm'
                      }
                    `}
                    whileHover={!isDisabled ? { scale: 1.02 } : {}}
                    whileTap={!isDisabled ? { scale: 0.98 } : {}}
                    data-testid={`rating-option-${option.coins}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full ${option.color} flex items-center justify-center`}>
                          <span className="text-white font-bold text-sm">{option.coins}</span>
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-600">{option.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Coins className="w-4 h-4 text-amber-600" />
                        <span className="font-medium">{option.coins}</span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
              </div>
            )}

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                  data-testid="error-message"
                >
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {isSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center justify-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg"
                  data-testid="success-message"
                >
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">{t('ratingSubmitted')}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
                data-testid="cancel-button"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex-1 bg-gradient-to-r from-hk-red to-hk-gold hover:from-hk-red/90 hover:to-hk-gold/90 text-white"
                data-testid="submit-rating-button"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('submitting')}
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 mr-2" />
                    {t('submitRating')}
                  </>
                )}
              </Button>
            </div>

            {/* Selected Rating Summary */}
            <AnimatePresence>
              {selectedRating && !isSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="p-3 bg-amber-50 border border-amber-200 rounded-lg"
                  data-testid="rating-summary"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-amber-700">
                      {t('willSpend')}: <strong>{selectedRating} {t('coins')}</strong>
                    </span>
                    <span className="text-amber-600">
                      {t('newBalance')}: {userBalance - selectedRating} {t('coins')}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          {/* Coin Animation Overlay */}
          <AnimatePresence>
            {showCoinAnimation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/90 flex items-center justify-center"
                data-testid="coin-animation-overlay"
              >
                <CoinAnimation
                  type="spend"
                  amount={selectedRating || 0}
                  onComplete={() => setShowCoinAnimation(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showQRScanner}
        onScanSuccess={handleQRScanSuccess}
        onClose={() => setShowQRScanner(false)}
      />
    </div>
  );
}