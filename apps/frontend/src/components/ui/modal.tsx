'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// Modal simples usado nos avisos da área logada (aceite de termos, boas-vindas).
// Não fecha por clique fora nem por Esc: quem abre decide como sair.
export function Modal({
  titulo,
  descricao,
  children,
  acoes,
  className,
}: {
  titulo: string;
  descricao?: React.ReactNode;
  children?: React.ReactNode;
  acoes: React.ReactNode;
  className?: string;
}) {
  const tituloId = React.useId();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={tituloId}
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 backdrop-blur-sm sm:items-center"
    >
      <div className={cn('w-full max-w-md border-2 border-foreground bg-card p-6 shadow-lg sm:p-8', className)}>
        <h2 id={tituloId} className="font-display text-2xl font-extrabold leading-tight tracking-tight">
          {titulo}
        </h2>
        {descricao && <div className="mt-2 text-sm text-muted-foreground">{descricao}</div>}
        {children && <div className="mt-6">{children}</div>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{acoes}</div>
      </div>
    </div>
  );
}
