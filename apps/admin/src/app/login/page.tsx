'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Paintbrush } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/lib/auth-context';

const ERROR_MESSAGES: Record<string, string> = {
  not_authorized: 'Este e-mail não está cadastrado como administrador.',
  no_email: 'Não foi possível obter seu e-mail da conta Google.',
  auth_failed: 'Não foi possível concluir o login. Tente novamente.',
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAdminAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const errorCode = searchParams.get('error');
  const errorMessage = errorCode ? ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.auth_failed : null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Paintbrush className="h-6 w-6" />
          </div>
          <CardTitle>Arteiros Caragua</CardTitle>
          <CardDescription>Entre com sua conta Google para acessar o painel administrativo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          )}
          <Button asChild className="w-full" size="lg">
            <a href={`${apiUrl}/api/auth/google`}>Entrar com Google</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
