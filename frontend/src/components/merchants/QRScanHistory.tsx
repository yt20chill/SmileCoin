'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQRScanner } from '@/lib/hooks/useQRScanner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface QRScanHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QRScanHistory({ isOpen, onClose }: QRScanHistoryProps) {
  const t = useTranslations('qrScanner');
  const tMerchants = useTranslations('merchants');
  const [showDetails, setShowDetails] = useState(false);
  
  const { 
    getQRScanHistory, 
    getVisitedMerchants, 
    getScanStatistics 
  } = useQRScanner();

  const scanHistory = getQRScanHistory();
  const visitedMerchants = getVisitedMerchants();
  const statistics = getScanStatistics();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="w-6 h-6 text-blue-600" />
                <span>{t('scanHistory')}</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
                data-testid="close-history-button"
              >
                ×
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Statistics Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {statistics.totalScans}
                </div>
                <div className="text-sm text-gray-600">{t('totalScans')}</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {statistics.validScans}
                </div>
                <div className="text-sm text-gray-600">{t('validScans')}</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {statistics.uniqueMerchants}
                </div>
                <div className="text-sm text-gray-600">{tMerchants('visited')}</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {statistics.scanSuccessRate}%
                </div>
                <div className="text-sm text-gray-600">{t('successRate')}</div>
              </div>
            </div>

            {/* Toggle Details Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center space-x-2"
                data-testid="toggle-details-button"
              >
                {showDetails ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span>{t('hideDetails')}</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>{t('showDetails')}</span>
                  </>
                )}
              </Button>
            </div>

            {/* Detailed Scan History */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <h3 className="font-medium text-gray-900 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>{t('recentScans')}</span>
                  </h3>

                  {scanHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <QrCode className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>{t('noScansYet')}</p>
                      <p className="text-sm">{t('startScanningToSeeHistory')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {scanHistory.map((scan) => (
                        <motion.div
                          key={scan.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`
                            p-3 rounded-lg border-l-4 
                            ${scan.isValid 
                              ? 'border-green-500 bg-green-50' 
                              : 'border-red-500 bg-red-50'
                            }
                          `}
                          data-testid={`scan-history-item-${scan.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                {scan.isValid ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-600" />
                                )}
                                <span className="font-medium text-gray-900">
                                  {scan.merchantName || t('unknownMerchant')}
                                </span>
                                {scan.isValid && (
                                  <Badge variant="secondary" className="text-xs">
                                    {scan.category}
                                  </Badge>
                                )}
                              </div>
                              
                              {scan.location && (
                                <div className="flex items-center space-x-1 text-sm text-gray-600 mb-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{scan.location}</span>
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {format(new Date(scan.timestamp), 'MMM dd, yyyy HH:mm')}
                                </span>
                              </div>
                            </div>
                            
                            <Badge 
                              variant={scan.isValid ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {scan.isValid ? t('valid') : t('invalid')}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Visited Merchants Summary */}
            {visitedMerchants.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">{tMerchants('visitedMerchants')}</h3>
                <div className="flex flex-wrap gap-2">
                  {visitedMerchants.slice(0, 10).map((merchantId) => {
                    const merchantScan = scanHistory.find(
                      scan => scan.merchantId === merchantId && scan.isValid
                    );
                    return (
                      <Badge 
                        key={merchantId} 
                        variant="outline" 
                        className="text-xs"
                        data-testid={`visited-merchant-${merchantId}`}
                      >
                        {merchantScan?.merchantName || merchantId}
                      </Badge>
                    );
                  })}
                  {visitedMerchants.length > 10 && (
                    <Badge variant="secondary" className="text-xs">
                      +{visitedMerchants.length - 10} {t('more')}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Last Scan Info */}
            {statistics.lastScanDate && (
              <div className="text-center text-sm text-gray-500 pt-4 border-t">
                {t('lastScan')}: {format(statistics.lastScanDate, 'MMM dd, yyyy HH:mm')}
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={onClose}
                className="w-full max-w-xs"
                data-testid="close-history-footer-button"
              >
                {t('close')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}