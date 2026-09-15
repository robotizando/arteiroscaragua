'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { redefinirSenhaSchema } from '@arteiroscaragua/shared-types';
import { useAuth } from '@/lib/auth-context';
import { ApiError, contaRequest, mensagemDeErro } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Alert, Field, PasswordInput, errosPorCampo } from '@/components/ui/form';
import { AuthShell, SenhaRegras } from './auth-shell';

export function RedefinirSenhaForm({ token }: { token: string }) {
  const router = useRouter();
  const { sair } = useAuth();
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [tokenInvalido, setTokenInvalido] = useState(!token);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = redefinirSenhaSchema.safeParse({ token, senha });
    const novosErros = parsed.success ? {} : errosPorCampo(parsed.error.issues);
    if (confirmacao !== senha) novosErros.confirmacao = 'As senhas não conferem';
    setErros(novosErros);
    if (novosErros.token) setTokenInvalido(true);
    if (!parsed.success || novosErros.confirmacao) return;

    setMensagem(null);
    setEnviando(true);
    try {
      await contaRequest('/redefinir-senha', { body: parsed.data });
      // A troca de senha encerra as sessões abertas, inclusive a deste navegador.
      sair();
      router.push('/entrar?aviso=senha-redefinida');
    } catch (error) {
      setTokenInvalido(error instanceof ApiError && error.codigo === 'token_invalido');
      setMensagem(mensagemDeErro(error));
      setEnviando(false);
    }
  }

  if (tokenInvalido) {
    return (
      <AuthShell titulo="Link inválido">
        <Alert tipo="erro">
          <p>{mensagem ?? 'Este link de redefinição é inválido ou expirou.'}</p>
          <Link href="/esqueci-senha">Pedir um novo link</Link>
        </Alert>
      </AuthShell>
    );
  }

  return (
    <AuthShell titulo="Criar nova senha" descricao="Escolha uma senha nova para sua conta.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {mensagem && <Alert tipo="erro">{mensagem}</Alert>}
        <Field id="senha" label="Nova senha" error={erros.senha} hint={<SenhaRegras senha={senha} />}>
          <PasswordInput autoComplete="new-password" value={senha} onChange={(event) => setSenha(event.target.value)} />
        </Field>
        <Field id="confirmacao" label="Confirme a nova senha" error={erros.confirmacao}>
          <PasswordInput
            autoComplete="new-password"
            value={confirmacao}
            onChange={(event) => setConfirmacao(event.target.value)}
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={enviando}>
          {enviando ? 'Salvando...' : 'Salvar nova senha'}
        </Button>
      </form>
    </AuthShell>
  );
}
