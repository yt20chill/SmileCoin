'use client';

import { useTranslations } from 'next-intl';
import Image from "next/image";
import { Link } from '@/i18n/routing';
import { MainLayout, Container, Section, LoadingPage } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { OnboardingCarousel } from '@/components/onboarding';
import { useOnboarding } from '@/lib/hooks/useOnboarding';
import { useRouter } from '@/i18n/routing';

export default function Home() {
  const t = useTranslations('common');
  const router = useRouter();
  const { hasCompletedOnboarding, isLoading, completeOnboarding, skipOnboarding } = useOnboarding();

  const handleOnboardingComplete = () => {
    completeOnboarding();
    router.push('/wallet');
  };

  const handleOnboardingSkip = () => {
    skipOnboarding();
  };

  // Show loading while checking onboarding status
  if (isLoading) {
    return <LoadingPage />;
  }

  // Show onboarding for new users
  if (!hasCompletedOnboarding) {
    return (
      <OnboardingCarousel
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    );
  }

  // Show regular home page for returning users
  return (
    <MainLayout>
      <Container className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <Section className="text-center space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Image
                src="/images/smile-coin/smile-coin-dynamic.png"
                alt="Smile Travel HK logo"
                width={160}
                height={1160}
                priority
                className=""
              />
            </div>
            <h1 className="text-4xl font-bold bg-hk-gradient !bg-clip-text text-transparent">
              Smile Travel
            </h1>
          </div>
          
          <div className="space-y-4 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-foreground">
              {t('welcome')}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t('description')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto bg-hk-gradient hover:opacity-90">
              <Link href="/wallet">
                Go to Wallet
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/merchants">
                {t('browseMerchants')}
              </Link>
            </Button>
          </div>
        </Section>
      </Container>
    </MainLayout>
  );
}