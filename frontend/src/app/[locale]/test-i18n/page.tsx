import { useTranslations } from 'next-intl';
import { LanguageToggle } from '@/components/common/LanguageToggle';

export default function TestI18nPage() {
  const t = useTranslations('common');
  const tAuth = useTranslations('auth');
  const tWallet = useTranslations('wallet');

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Internationalization Test</h1>
        <LanguageToggle />
      </div>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">Common Translations</h2>
          <ul className="space-y-1">
            <li>Loading: {t('loading')}</li>
            <li>Error: {t('error')}</li>
            <li>Welcome: {t('welcome')}</li>
            <li>Description: {t('description')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Auth Translations</h2>
          <ul className="space-y-1">
            <li>Register: {tAuth('register')}</li>
            <li>Welcome: {tAuth('welcome')}</li>
            <li>Upload Boarding Pass: {tAuth('uploadBoardingPass')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Wallet Translations</h2>
          <ul className="space-y-1">
            <li>Balance: {tWallet('balance')}</li>
            <li>Smile Coins: {tWallet('smileCoins')}</li>
            <li>Transactions: {tWallet('transactions')}</li>
          </ul>
        </section>
      </div>
    </div>
  );
}