import { useTranslations } from 'next-intl';
import { MainLayout, Container, PageHeader, Section } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { User, Settings, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const t = useTranslations('navigation');

  return (
    <MainLayout>
      <Container>
        <PageHeader 
          title={t('profile')}
          subtitle="Manage your account and preferences"
        />
        <Section>
          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <User className="h-4 w-4 mr-2" />
              Account Settings
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </Button>
            <Button variant="outline" className="w-full justify-start text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </Section>
      </Container>
    </MainLayout>
  );
}