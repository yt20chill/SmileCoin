import { LoadingSpinner } from './LoadingSpinner';
import { Container } from '@/components/layout/Container';

interface LoadingPageProps {
  text?: string;
}

export function LoadingPage({ text = "Loading..." }: LoadingPageProps) {
  return (
    <Container className="min-h-[50vh] flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </Container>
  );
}