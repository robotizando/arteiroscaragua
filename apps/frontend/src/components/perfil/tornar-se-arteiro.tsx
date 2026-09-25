'use client';

import { useState } from 'react';
import { boasVindasSchema, type ContaMeResponse } from '@arteiroscaragua/shared-types';
import { useAuth } from '@/lib/auth-context';
import { mensagemDeErro } from '@/lib/api';
import { useContaApi } from '@/lib/conta-api';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { Secao } from './secao';

// Quem recusou a pergunta do primeiro acesso (ou conseguiu o SICAB depois) cria o perfil aqui.
export function TornarSeArteiro({ onCriado }: { onCriado: () => void }) {
  const { atualizarUsuario } = useAuth();
  const contaApi = useContaApi();
  const [sicab, setSicab] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function criar(event: React.FormEvent) {
    event.preventDefault();
    const parsed = boasVindasSchema.safeParse({ sicab });
    if (!parsed.success || !parsed.data.sicab) {
      setErro(parsed.success ? 'Informe o número do seu cadastro SICAB' : parsed.error.issues[0].message);
      return;
    }

    setErro(null);
    setEnviando(true);
    try {
      const { usuario } = await contaApi<ContaMeResponse>('/boas-vindas', { body: parsed.data });
      atualizarUsuario(usuario);
      onCriado();
    } catch (error) {
      setErro(mensagemDeErro(error));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Secao
      titulo="Você é artesã ou artesão?"
      descricao="Informe seu número do SICAB para criar seu perfil de arteiro e expor suas peças na vitrine."
    >
      <form onSubmit={criar} noValidate className="max-w-xl space-y-4">
        <Field id="perfil-sicab" label="Número de cadastro SICAB" error={erro ?? undefined}>
          <Input value={sicab} onChange={(event) => setSicab(event.target.value)} placeholder="Ex.: 1234567890" />
        </Field>
        <Button type="submit" disabled={enviando}>
          {enviando ? 'Criando...' : 'Criar meu perfil de arteiro'}
        </Button>
      </form>
    </Secao>
  );
}
