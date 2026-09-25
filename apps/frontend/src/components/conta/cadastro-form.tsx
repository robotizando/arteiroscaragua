'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MailCheck } from 'lucide-react';
import { cadastroContaSchema } from '@arteiroscaragua/shared-types';
import { useAuth } from '@/lib/auth-context';
import { ApiError, contaRequest, mensagemDeErro } from '@/lib/api';
import { Button, buttonClassName } from '@/components/ui/button';
import { Alert, Field, Input, PasswordInput, errosPorCampo } from '@/components/ui/form';
import { AceiteTermos, AuthShell, Divisor, GoogleButton, SenhaRegras } from './auth-shell';
import { ReenviarVerificacao } from './reenviar-verificacao';

export function CadastroForm() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [aceite, setAceite] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null);

  useEffect(() => {
    if (usuario) router.replace('/');
  }, [usuario, router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = cadastroContaSchema.safeParse({ nome, email, senha, aceiteTermos: aceite });
    const novosErros = parsed.success ? {} : errosPorCampo(parsed.error.issues);
    if (confirmacao !== senha) novosErros.confirmacao = 'As senhas não conferem';
    setErros(novosErros);
    if (!parsed.success || novosErros.confirmacao) return;

    setMensagem(null);
    setEnviando(true);
    try {
      await contaRequest('/cadastro', { body: parsed.data });
      setEnviadoPara(parsed.data.email);
    } catch (error) {
      if (error instanceof ApiError && error.issues.length) setErros(errosPorCampo(error.issues));
      setMensagem(mensagemDeErro(error));
    } finally {
      setEnviando(false);
    }
  }

  if (enviadoPara) {
    return (
      <AuthShell titulo="Confira seu e-mail">
        <div className="space-y-4 text-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="h-6 w-6" aria-hidden />
          </div>
          <p>
            Enviamos um link de confirmação para <strong className="break-all">{enviadoPara}</strong>. Abra o e-mail e
            clique no link para ativar sua conta. Ele vale por 24 horas.
          </p>
          <p className="text-muted-foreground">Não chegou? Veja também a caixa de spam ou peça um novo envio.</p>
          <ReenviarVerificacao email={enviadoPara} />
          <Link href="/entrar" className={buttonClassName({ variant: 'outline', className: 'w-full' })}>
            Ir para o login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      titulo="Crie sua conta"
      descricao="Para guardar as peças que você gostou e, se você é artesã ou artesão, montar seu espaço na vitrine."
      rodape={
        <>
          Já tem conta?{' '}
          <Link href="/entrar" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <GoogleButton>Cadastrar com Google</GoogleButton>
      <Divisor>ou com e-mail e senha</Divisor>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {mensagem && <Alert tipo="erro">{mensagem}</Alert>}
        <Field id="nome" label="Nome" error={erros.nome} hint="Como você quer aparecer na vitrine.">
          <Input autoComplete="name" value={nome} onChange={(event) => setNome(event.target.value)} />
        </Field>
        <Field id="email" label="E-mail" error={erros.email}>
          <Input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Field id="senha" label="Senha" error={erros.senha} hint={<SenhaRegras senha={senha} />}>
          <PasswordInput autoComplete="new-password" value={senha} onChange={(event) => setSenha(event.target.value)} />
        </Field>
        <Field id="confirmacao" label="Confirme a senha" error={erros.confirmacao}>
          <PasswordInput
            autoComplete="new-password"
            value={confirmacao}
            onChange={(event) => setConfirmacao(event.target.value)}
          />
        </Field>
        <AceiteTermos checked={aceite} onChange={setAceite} error={erros.aceiteTermos} />
        <Button type="submit" size="lg" className="w-full" disabled={enviando}>
          {enviando ? 'Criando conta...' : 'Criar conta'}
        </Button>
      </form>
    </AuthShell>
  );
}
