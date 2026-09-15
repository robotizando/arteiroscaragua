'use client';

import { useState } from 'react';
import { contaRequest, mensagemDeErro } from '@/lib/api';
import { Button } from '@/components/ui/button';

// Botão "reenviar e-mail de confirmação". A resposta do backend é sempre genérica.
export function ReenviarVerificacao({ email, className }: { email: string; className?: string }) {
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'enviado'>('idle');
  const [erro, setErro] = useState<string | null>(null);

  async function reenviar() {
    setEstado('enviando');
    setErro(null);
    try {
      await contaRequest('/reenviar-verificacao', { body: { email } });
      setEstado('enviado');
    } catch (error) {
      setErro(mensagemDeErro(error));
      setEstado('idle');
    }
  }

  if (estado === 'enviado') {
    return <p className={className}>Pronto! Se a conta ainda não foi confirmada, um novo link chegará em instantes.</p>;
  }

  return (
    <div className={className}>
      <Button variant="link" onClick={reenviar} disabled={estado === 'enviando' || !email}>
        {estado === 'enviando' ? 'Reenviando...' : 'Reenviar e-mail de confirmação'}
      </Button>
      {erro && <p className="text-destructive">{erro}</p>}
    </div>
  );
}
