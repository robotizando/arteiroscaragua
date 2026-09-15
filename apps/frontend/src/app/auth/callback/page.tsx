import type { Metadata } from 'next';
import { AuthCallback } from '@/components/conta/auth-callback';

export const metadata: Metadata = { title: 'Entrando', robots: { index: false } };

export default function AuthCallbackPage() {
  return <AuthCallback />;
}
