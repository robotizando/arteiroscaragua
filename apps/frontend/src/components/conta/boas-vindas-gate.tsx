'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { boasVindasSchema, type ContaMeResponse } from '@arteiroscaragua/shared-types';
import { useAuth } from '@/lib/auth-context';
import { contaRequest, mensagemDeErro } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Alert, Field, Input, errosPorCampo } from '@/components/ui/form';
import { Modal } from '@/components/ui/modal';

// Primeiro acesso: pergunta se a pessoa é artesã e, com o número do SICAB, cria o perfil
// de arteiro em branco para ela completar depois em "Meu perfil".
export function BoasVindasGate() {
  const router = useRouter();
  const { usuario, token, atualizarUsuario } = useAuth();
  const [sicab, setSicab] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [criouPerfil, setCriouPerfil] = useState(false);

  // O aceite dos termos vem antes; quem já tem perfil de arteiro não precisa da pergunta.
  if (!usuario || usuario.termosPendentes) return null;
  if (!criouPerfil && (!usuario.boasVindasPendentes || usuario.arteiros.length > 0)) return null;

  async function responder(comSicab: boolean) {
    const parsed = boasVindasSchema.safeParse({ sicab: comSicab ? sicab : '' });
    if (!parsed.success) {
      setErros(errosPorCampo(parsed.error.issues));
      return;
    }
    if (comSicab && !parsed.data.sicab) {
      setErros({ sicab: 'Informe o número do seu cadastro SICAB' });
      return;
    }

    setErros({});
    setMensagem(null);
    setEnviando(true);
    try {
      const { usuario: atualizado } = await contaRequest<ContaMeResponse>('/boas-vindas', {
        body: parsed.data,
        token,
      });
      atualizarUsuario(atualizado);
      if (comSicab) setCriouPerfil(true);
    } catch (error) {
      setMensagem(mensagemDeErro(error));
    } finally {
      setEnviando(false);
    }
  }

  if (criouPerfil) {
    return (
      <Modal
        titulo="Perfil de arteiro criado!"
        descricao="Agora falta contar quem você é: complete seu perfil com biografia, contato, materiais com que trabalha e as peças que quer mostrar na vitrine."
        acoes={
          <>
            <Button variant="ghost" onClick={() => setCriouPerfil(false)}>
              Depois
            </Button>
            <Button
              onClick={() => {
                setCriouPerfil(false);
                router.push('/perfil');
              }}
            >
              Completar meu perfil
            </Button>
          </>
        }
      />
    );
  }

  return (
    <Modal
      titulo="Você é artesã ou artesão?"
      descricao="Se você faz peças à mão e tem cadastro no SICAB, informe o número para criar seu perfil de arteiro e expor seu trabalho na vitrine."
      acoes={
        <>
          <Button variant="ghost" onClick={() => responder(false)} disabled={enviando}>
            Agora não
          </Button>
          <Button onClick={() => responder(true)} disabled={enviando}>
            {enviando ? 'Salvando...' : 'Criar meu perfil de arteiro'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {mensagem && <Alert tipo="erro">{mensagem}</Alert>}
        <Field
          id="sicab"
          label="Número de cadastro SICAB"
          error={erros.sicab}
          hint="Sistema de Informações Cadastrais do Artesanato Brasileiro."
        >
          <Input
            value={sicab}
            onChange={(event) => setSicab(event.target.value)}
            placeholder="Ex.: 1234567890"
            autoComplete="off"
          />
        </Field>
        <p className="text-xs text-muted-foreground">
          Ainda não tem SICAB? Escolha &quot;Agora não&quot; — você pode criar seu perfil de arteiro depois, na página
          Meu perfil.
        </p>
      </div>
    </Modal>
  );
}
