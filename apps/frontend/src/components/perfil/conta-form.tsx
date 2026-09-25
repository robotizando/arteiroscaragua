'use client';

import { useState } from 'react';
import { atualizarContaSchema, type ContaMeResponse, type ContaUsuario } from '@arteiroscaragua/shared-types';
import { useAuth } from '@/lib/auth-context';
import { ApiError, mensagemDeErro } from '@/lib/api';
import { useContaApi } from '@/lib/conta-api';
import { Button } from '@/components/ui/button';
import { Alert, Field, Input, errosPorCampo } from '@/components/ui/form';
import { Secao } from './secao';

// Dados da conta (tabela de usuários). O e-mail não é editável aqui: trocá-lo exigiria uma
// nova verificação, e é ele que identifica quem entra com Google.
export function ContaForm({ usuario }: { usuario: ContaUsuario }) {
  const { atualizarUsuario } = useAuth();
  const contaApi = useContaApi();
  const [nome, setNome] = useState(usuario.nome);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [mensagem, setMensagem] = useState<{ tipo: 'erro' | 'sucesso'; texto: string } | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(event: React.FormEvent) {
    event.preventDefault();
    const parsed = atualizarContaSchema.safeParse({ nome });
    if (!parsed.success) {
      setErros(errosPorCampo(parsed.error.issues));
      return;
    }

    setErros({});
    setMensagem(null);
    setSalvando(true);
    try {
      const { usuario: atualizado } = await contaApi<ContaMeResponse>('/perfil', {
        method: 'PATCH',
        body: parsed.data,
      });
      atualizarUsuario(atualizado);
      setMensagem({ tipo: 'sucesso', texto: 'Dados da conta atualizados.' });
    } catch (error) {
      if (error instanceof ApiError && error.issues.length) setErros(errosPorCampo(error.issues));
      setMensagem({ tipo: 'erro', texto: mensagemDeErro(error) });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Secao titulo="Minha conta" descricao="Os dados de acesso ao site.">
      <form onSubmit={salvar} noValidate className="max-w-xl space-y-4">
        {mensagem && <Alert tipo={mensagem.tipo}>{mensagem.texto}</Alert>}
        <Field id="conta-nome" label="Nome" error={erros.nome}>
          <Input value={nome} onChange={(event) => setNome(event.target.value)} autoComplete="name" />
        </Field>
        <Field id="conta-email" label="E-mail" hint="Para trocar o e-mail, fale com a equipe do Arteiros Caragua.">
          <Input value={usuario.email} readOnly disabled />
        </Field>
        <Button type="submit" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </Secao>
  );
}
