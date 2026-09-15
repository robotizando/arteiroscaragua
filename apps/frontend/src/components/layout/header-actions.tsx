'use client';

import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { primeiroNome } from '@/lib/utils';
import { buttonClassName } from '@/components/ui/button';

// Ações do cabeçalho no desktop (sobre o verde). No mobile ficam em MenuMobile.
export function HeaderActions() {
  const { usuario, sair } = useAuth();

  // Enquanto a sessão é conferida, mostra as ações de visitante (o público mais comum),
  // que também são as que o HTML do servidor já traz.
  if (usuario) {
    return (
      <>
        <span className="text-mata-300">
          Olá, <span className="font-semibold text-background">{primeiroNome(usuario.nome)}</span>
        </span>
        <button
          type="button"
          onClick={sair}
          className="flex items-center gap-1.5 text-mata-300 transition-colors duration-150 hover:text-background"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sair
        </button>
      </>
    );
  }

  return (
    <>
      <Link href="/entrar" className="text-mata-300 transition-colors duration-150 hover:text-background">
        Entrar
      </Link>
      <Link href="/cadastro" className={buttonClassName({ variant: 'claro', size: 'sm' })}>
        Tornar-se arteiro
      </Link>
    </>
  );
}
