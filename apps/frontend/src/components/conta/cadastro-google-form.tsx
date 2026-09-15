'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CadastroGooglePayload, ContaSessaoResponse } from '@arteiroscaragua/shared-types';
import { useAuth } from '@/lib/auth-context';
import { ApiError, contaRequest, mensagemDeErro } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/form';
import { AceiteTermos, AuthShell, GoogleButton } from './auth-shell';
import { lerPayloadJwt, lerTokenDoHash } from './hash-token';

export function CadastroGoogleForm() {
  const router = useRouter();
  const { iniciarSessao } = useAuth();
  const [pronto, setPronto] = useState(false);
  const [tokenCadastro, setTokenCadastro] = useState<string | null>(null);
  const [dados, setDados] = useState<CadastroGooglePayload | null>(null);
  const [aceite, setAceite] = useState(false);
  const [erroAceite, setErroAceite] = useState<string>();
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [expirado, setExpirado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    // No StrictMode o efeito roda duas vezes; a segunda não encontra mais o hash e mantém o estado.
    const token = lerTokenDoHash();
    if (token) {
      setTokenCadastro(token);
      setDados(lerPayloadJwt<CadastroGooglePayload>(token));
    }
    setPronto(true);
  }, []);

  async function concluir() {
    if (!aceite) {
      setErroAceite('É preciso aceitar os termos de uso e a política de privacidade');
      return;
    }
    setErroAceite(undefined);
    setMensagem(null);
    setEnviando(true);
    try {
      const sessao = await contaRequest<ContaSessaoResponse>('/google/concluir-cadastro', {
        body: { tokenCadastro, aceiteTermos: true },
      });
      iniciarSessao(sessao);
      router.replace('/');
    } catch (error) {
      setExpirado(error instanceof ApiError && (error.codigo === 'cadastro_expirado' || error.codigo === 'email_em_uso'));
      setMensagem(mensagemDeErro(error));
      setEnviando(false);
    }
  }

  if (!pronto) return <AuthShell titulo="Cadastro com Google">{null}</AuthShell>;

  if (!tokenCadastro || expirado) {
    return (
      <AuthShell titulo="Cadastro com Google">
        <div className="space-y-4">
          <Alert tipo="erro">{mensagem ?? 'Este link de cadastro é inválido ou já foi usado.'}</Alert>
          <GoogleButton>Tentar novamente com Google</GoogleButton>
          <p className="text-center text-sm text-muted-foreground">
            ou{' '}
            <Link href="/cadastro" className="font-medium text-primary hover:underline">
              cadastre-se com e-mail e senha
            </Link>
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      titulo={dados ? `Quase lá, ${dados.nome.split(' ')[0]}!` : 'Quase lá!'}
      descricao="Confirme os dados da sua conta Google para criar seu espaço na vitrine."
    >
      <div className="space-y-5">
        {dados && (
          <dl className="space-y-2 rounded-lg bg-muted/60 px-4 py-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Nome</dt>
              <dd className="truncate font-medium">{dados.nome}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">E-mail</dt>
              <dd className="truncate font-medium">{dados.email}</dd>
            </div>
          </dl>
        )}
        {mensagem && <Alert tipo="erro">{mensagem}</Alert>}
        <AceiteTermos checked={aceite} onChange={setAceite} error={erroAceite} />
        <Button size="lg" className="w-full" onClick={concluir} disabled={enviando}>
          {enviando ? 'Criando conta...' : 'Criar minha conta'}
        </Button>
      </div>
    </AuthShell>
  );
}
