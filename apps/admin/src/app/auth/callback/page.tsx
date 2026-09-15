'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminAuth } from '@/lib/auth-context';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setToken } = useAdminAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      router.replace('/login?error=auth_failed');
      return;
    }

    setToken(token);
    router.replace('/dashboard');
  }, [router, searchParams, setToken]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Autenticando...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackContent />
    </Suspense>
  );
}
