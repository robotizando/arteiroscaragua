'use client';

import { useState } from 'react';
import Link from 'next/link';
import { emailContaSchema } from '@arteiroscaragua/shared-types';
import { contaRequest, mensagemDeErro } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Alert, Field, Input, errosPorCampo } from '@/components/ui/form';
import { AuthShell } from './auth-shell';

export function EsqueciSenhaForm() {
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState<string>();
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = emailContaSchema.safeParse({ email });
    if (!parsed.success) {
      setErro(errosPorCampo(parsed.error.issues).email);
      return;
    }
    setErro(undefined);
    setMensagem(null);
    setEnviando(true);
    try {
      await contaRequest('/esqueci-senha', { body: parsed.data });
      setEnviado(true);
    } catch (error) {
      setMensagem(mensagemDeErro(error));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthShell
      titulo="Esqueci minha senha"
      descricao="Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha."
      rodape={
        <Link href="/entrar" className="font-medium text-primary hover:underline">
          Voltar para o login
        </Link>
      }
    >
      {enviado ? (
        <Alert tipo="sucesso">
          Se houver uma conta com esse e-mail, você receberá um link para criar uma nova senha. O link vale por 10
          minutos.
        </Alert>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {mensagem && <Alert tipo="erro">{mensagem}</Alert>}
          <Field id="email" label="E-mail" error={erro}>
            <Input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar link'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
