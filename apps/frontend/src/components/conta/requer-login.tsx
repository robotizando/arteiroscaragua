'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

// Páginas da área logada: enquanto a sessão é conferida mostra o carregando; sem sessão,
// manda para o login.
export function RequerLogin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { usuario, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !usuario) router.replace('/entrar');
  }, [isLoading, usuario, router]);

  if (!usuario) {
    return (
      <div className="container flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Carregando" />
      </div>
    );
  }

  return <>{children}</>;
}
