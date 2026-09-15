'use client';

import { useState } from 'react';
import type { ContaMeResponse } from '@arteiroscaragua/shared-types';
import { useAuth } from '@/lib/auth-context';
import { contaRequest, mensagemDeErro } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/form';
import { AceiteTermos } from './auth-shell';

// Usuários criados pela Admin ainda não aceitaram os termos: o aceite é pedido no primeiro acesso.
export function TermosGate() {
  const { usuario, token, atualizarUsuario, sair } = useAuth();
  const [aceite, setAceite] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (!usuario?.termosPendentes) return null;

  async function confirmar() {
    if (!aceite) {
      setErro('Marque a opção para continuar.');
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const { usuario: atualizado } = await contaRequest<ContaMeResponse>('/aceitar-termos', {
        body: { aceiteTermos: true },
        token,
      });
      atualizarUsuario(atualizado);
    } catch (error) {
      setErro(mensagemDeErro(error));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="termos-gate-titulo"
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 backdrop-blur-sm sm:items-center"
    >
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl sm:p-8">
        <h2 id="termos-gate-titulo" className="font-display text-2xl font-medium">
          Antes de continuar
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Para usar sua conta no Arteiros Caragua, leia e aceite os termos de uso e a política de privacidade.
        </p>
        <div className="mt-6 space-y-4">
          <AceiteTermos checked={aceite} onChange={setAceite} />
          {erro && <Alert tipo="erro">{erro}</Alert>}
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={sair} disabled={enviando}>
            Sair
          </Button>
          <Button onClick={confirmar} disabled={enviando}>
            {enviando ? 'Salvando...' : 'Aceitar e continuar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
