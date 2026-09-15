'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginContaSchema, type ContaErroCodigo, type ContaSessaoResponse } from '@arteiroscaragua/shared-types';
import { useAuth } from '@/lib/auth-context';
import { ApiError, contaRequest, mensagemDeErro } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Alert, Field, Input, PasswordInput, errosPorCampo } from '@/components/ui/form';
import { AuthShell, Divisor, GoogleButton } from './auth-shell';
import { ReenviarVerificacao } from './reenviar-verificacao';

const ERROS_REDIRECT: Partial<Record<ContaErroCodigo, string>> = {
  google_falhou: 'Não foi possível entrar com o Google. Tente novamente.',
  google_indisponivel: 'O acesso com Google está indisponível no momento. Use e-mail e senha.',
  google_sem_email: 'Sua conta Google não informou um e-mail.',
  google_email_nao_verificado: 'O e-mail da sua conta Google ainda não foi verificado pelo Google.',
  google_conflito: 'Este e-mail já está vinculado a outra conta Google.',
  bloqueado: 'Sua conta está bloqueada. Fale com a equipe do Arteiros Caragua.',
};

const AVISOS: Record<string, string> = {
  'email-verificado': 'E-mail confirmado! Agora é só entrar.',
  'senha-redefinida': 'Senha alterada. Entre com a nova senha.',
};

export function EntrarForm({ erro, aviso }: { erro: string; aviso: string }) {
  const router = useRouter();
  const { usuario, iniciarSessao } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [mensagem, setMensagem] = useState<string | null>(ERROS_REDIRECT[erro as ContaErroCodigo] ?? null);
  const [naoVerificado, setNaoVerificado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (usuario) router.replace('/');
  }, [usuario, router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = loginContaSchema.safeParse({ email, senha });
    if (!parsed.success) {
      setErros(errosPorCampo(parsed.error.issues));
      return;
    }

    setErros({});
    setMensagem(null);
    setNaoVerificado(false);
    setEnviando(true);
    try {
      iniciarSessao(await contaRequest<ContaSessaoResponse>('/login', { body: parsed.data }));
    } catch (error) {
      setNaoVerificado(error instanceof ApiError && error.codigo === 'email_nao_verificado');
      setMensagem(mensagemDeErro(error));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthShell
      titulo="Entrar"
      descricao="Acesse sua conta de arteiro."
      rodape={
        <>
          Ainda não tem conta?{' '}
          <Link href="/cadastro" className="font-medium text-primary hover:underline">
            Cadastre-se
          </Link>
        </>
      }
    >
      {AVISOS[aviso] && !mensagem && (
        <Alert tipo="sucesso" className="mb-6">
          {AVISOS[aviso]}
        </Alert>
      )}

      <GoogleButton />
      <Divisor>ou com e-mail</Divisor>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {mensagem && (
          <Alert tipo="erro">
            <p>{mensagem}</p>
            {naoVerificado && <ReenviarVerificacao email={email.trim().toLowerCase()} />}
          </Alert>
        )}
        <Field id="email" label="E-mail" error={erros.email}>
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field id="senha" label="Senha" error={erros.senha}>
          <PasswordInput autoComplete="current-password" value={senha} onChange={(event) => setSenha(event.target.value)} />
        </Field>
        <div className="flex justify-end">
          <Link href="/esqueci-senha" className="text-sm text-primary hover:underline">
            Esqueci minha senha
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </AuthShell>
  );
}
