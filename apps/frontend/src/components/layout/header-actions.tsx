'use client';

import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { primeiroNome } from '@/lib/utils';
import { Button, buttonClassName } from '@/components/ui/button';

export function HeaderActions() {
  const { usuario, sair } = useAuth();

  // Enquanto a sessão é conferida, mostra as ações de visitante (o público mais comum),
  // que também são as que o HTML do servidor já traz.
  if (usuario) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-muted-foreground sm:inline">
          Olá, <span className="font-medium text-foreground">{primeiroNome(usuario.nome)}</span>
        </span>
        <Button variant="ghost" size="sm" onClick={sair}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Link href="/entrar" className={buttonClassName({ variant: 'ghost', size: 'sm' })}>
        Entrar
      </Link>
      <Link href="/cadastro" className={buttonClassName({ size: 'sm' })}>
        <span className="sm:hidden">Cadastre-se</span>
        <span className="hidden sm:inline">Cadastre-se Arteiro/Artesão</span>
      </Link>
    </div>
  );
}
