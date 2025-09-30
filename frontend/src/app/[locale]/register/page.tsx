'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { RegistrationForm } from '@/components/registration/RegistrationForm';
import { RegistrationSuccess } from '@/components/registration/RegistrationSuccess';
import { useRegistration } from '@/lib/hooks/useRegistration';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();
  
  const {
    isLoading,
    error,
    isRegistered,
    registeredUser,
    initialCoins,
    registerWithBoardingPass,
    registerManually,
    clearError,
  } = useRegistration();

  const handleContinueToWallet = () => {
    router.push('/wallet');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <AnimatePresence mode="wait">
            {!isRegistered ? (
              <motion.div
                key="registration-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="mb-4"
                  >
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-2xl">😊</span>
                    </div>
                  </motion.div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('welcome')}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    {tCommon('welcome')}
                  </p>
                </div>

                <RegistrationForm
                  onBoardingPassUpload={registerWithBoardingPass}
                  onManualRegistration={registerManually}
                  isLoading={isLoading}
                  error={error}
                  onClearError={clearError}
                />
              </motion.div>
            ) : (
              <motion.div
                key="registration-success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <RegistrationSuccess
                  user={registeredUser!}
                  initialCoins={initialCoins}
                  onContinue={handleContinueToWallet}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}