'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileImage, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { BoardingPassUpload } from './BoardingPassUpload';
import { ManualRegistrationForm } from './ManualRegistrationForm';
import { isValidImageFile } from '@/lib/utils/validation';
import { ApiClient } from '@/lib/api/client';
import type { User } from '@/lib/types';

interface RegistrationFormProps {
  onBoardingPassUpload: (file: File) => Promise<void>;
  onManualRegistration: (userData: Partial<User>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
}

type RegistrationStep = 'upload' | 'manual' | 'processing';

export function RegistrationForm({ 
  onBoardingPassUpload,
  onManualRegistration, 
  isLoading, 
  error, 
  onClearError 
}: RegistrationFormProps) {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  
  const [step, setStep] = useState<RegistrationStep>('upload');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleBoardingPassUpload = async (file: File) => {
    try {
      onClearError();
      setUploadError(null);
      setStep('processing');
      
      await onBoardingPassUpload(file);
    } catch (error) {
      console.error('Boarding pass upload failed:', error);
      setUploadError(t('uploadFailed'));
      setStep('manual');
    }
  };

  const handleManualRegistration = async (userData: Partial<User>) => {
    await onManualRegistration(userData);
  };

  const handleRetryUpload = () => {
    setStep('upload');
    setUploadError(null);
    onClearError();
  };

  if (isLoading || step === 'processing') {
    return (
      <Card>
        <CardContent className="pt-6">
          <LoadingSpinner 
            size="lg" 
            text={step === 'processing' ? 'Processing boarding pass...' : 'Creating your account...'}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <ErrorMessage
          message={error}
          onRetry={onClearError}
          retryText={tCommon('ok')}
        />
      )}

      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div
            key="upload-step"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileImage className="h-5 w-5" />
                  {t('uploadBoardingPass')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <BoardingPassUpload
                  onUpload={handleBoardingPassUpload}
                  error={uploadError}
                />
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      or
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setStep('manual')}
                  className="w-full"
                >
                  {t('manualRegistration')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'manual' && (
          <motion.div
            key="manual-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{t('manualRegistration')}</CardTitle>
                {uploadError && (
                  <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                    <AlertCircle className="h-4 w-4" />
                    {uploadError}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <ManualRegistrationForm
                  onSubmit={handleManualRegistration}
                  onBack={handleRetryUpload}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}