'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { emailContaSchema } from '@arteiroscaragua/shared-types';
import { contaRequest, mensagemDeErro } from '@/lib/api';
import { buttonClassName } from '@/components/ui/button';
import { Alert, Field, Input } from '@/components/ui/form';
import { AuthShell } from './auth-shell';
import { ReenviarVerificacao } from './reenviar-verificacao';

export function VerificarEmailView({ token }: { token: string }) {
  const [estado, setEstado] = useState<'verificando' | 'ok' | 'erro'>(token ? 'verificando' : 'erro');
  const [mensagem, setMensagem] = useState('Link de confirmação inválido.');
  const [email, setEmail] = useState('');
  // O token é de uso único: o StrictMode não pode disparar a verificação duas vezes.
  const executou = useRef(false);

  useEffect(() => {
    if (!token || executou.current) return;
    executou.current = true;
    contaRequest('/verificar-email', { body: { token } })
      .then(() => setEstado('ok'))
      .catch((error) => {
        setMensagem(mensagemDeErro(error));
        setEstado('erro');
      });
  }, [token]);

  if (estado === 'verificando') {
    return (
      <AuthShell titulo="Confirmando seu e-mail...">
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Carregando" />
        </div>
      </AuthShell>
    );
  }

  if (estado === 'ok') {
    return (
      <AuthShell titulo="E-mail confirmado!" descricao="Sua conta está ativa. Entre para começar.">
        <Link href="/entrar?aviso=email-verificado" className={buttonClassName({ size: 'lg', className: 'w-full' })}>
          Entrar
        </Link>
      </AuthShell>
    );
  }

  const emailValido = emailContaSchema.safeParse({ email }).success;

  return (
    <AuthShell titulo="Não foi possível confirmar">
      <div className="space-y-5">
        <Alert tipo="erro">{mensagem}</Alert>
        <p className="text-sm text-muted-foreground">
          O link pode ter expirado ou já ter sido usado. Se sua conta ainda não foi confirmada, informe o e-mail para
          receber um novo link.
        </p>
        <Field id="email" label="E-mail">
          <Input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        {emailValido && <ReenviarVerificacao email={email.trim().toLowerCase()} className="text-sm" />}
        <p className="text-center text-sm">
          Já confirmou?{' '}
          <Link href="/entrar" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
