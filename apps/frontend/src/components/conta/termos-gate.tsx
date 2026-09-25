'use client';

import { useState } from 'react';
import type { ContaMeResponse } from '@arteiroscaragua/shared-types';
import { useAuth } from '@/lib/auth-context';
import { contaRequest, mensagemDeErro } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/form';
import { Modal } from '@/components/ui/modal';
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
    <Modal
      titulo="Antes de continuar"
      descricao="Para usar sua conta no Arteiros Caragua, leia e aceite os termos de uso e a política de privacidade."
      acoes={
        <>
          <Button variant="ghost" onClick={sair} disabled={enviando}>
            Sair
          </Button>
          <Button onClick={confirmar} disabled={enviando}>
            {enviando ? 'Salvando...' : 'Aceitar e continuar'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <AceiteTermos checked={aceite} onChange={setAceite} />
        {erro && <Alert tipo="erro">{erro}</Alert>}
      </div>
    </Modal>
  );
}
