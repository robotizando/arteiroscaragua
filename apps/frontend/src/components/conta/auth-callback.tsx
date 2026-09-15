'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { mensagemDeErro } from '@/lib/api';
import { Alert } from '@/components/ui/form';
import { AuthShell } from './auth-shell';
import { lerTokenDoHash } from './hash-token';

// Retorno do login com Google: grava a sessão e volta para a vitrine.
export function AuthCallback() {
  const router = useRouter();
  const { iniciarSessaoComToken } = useAuth();
  const [erro, setErro] = useState<string | null>(null);
  const executou = useRef(false);

  useEffect(() => {
    if (executou.current) return;
    executou.current = true;

    const token = lerTokenDoHash();
    if (!token) {
      setErro('Não recebemos os dados de acesso. Tente entrar novamente.');
      return;
    }
    iniciarSessaoComToken(token)
      .then(() => router.replace('/'))
      .catch((error) => setErro(mensagemDeErro(error, 'Não foi possível concluir o acesso.')));
  }, [iniciarSessaoComToken, router]);

  return (
    <AuthShell titulo={erro ? 'Não foi possível entrar' : 'Entrando...'}>
      {erro ? (
        <Alert tipo="erro">
          <p>{erro}</p>
          <Link href="/entrar">Voltar para o login</Link>
        </Alert>
      ) : (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Carregando" />
        </div>
      )}
    </AuthShell>
  );
}
