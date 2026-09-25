'use client';

import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import {
  ARTEIRO_LOGOTIPO_MAX_BYTES,
  ARTEIRO_LOGOTIPO_MIME_TYPES,
  updateArteiroSchema,
  type Arteiro,
} from '@arteiroscaragua/shared-types';
import { ApiError, assetUrl, mensagemDeErro } from '@/lib/api';
import { useContaApi } from '@/lib/conta-api';
import { Button } from '@/components/ui/button';
import { Alert, Field, Input, Select, Textarea, errosPorCampo } from '@/components/ui/form';
import { Secao } from './secao';

const CAMPOS_TEXTO = ['nome', 'telefone', 'sicab', 'grupo', 'arroba', 'redesSociais', 'biografia'] as const;
type CampoTexto = (typeof CAMPOS_TEXTO)[number];

export function ArteiroDadosForm({ arteiro, recarregar }: { arteiro: Arteiro; recarregar: () => void }) {
  const contaApi = useContaApi();
  const [valores, setValores] = useState<Record<CampoTexto, string>>(() => ({
    nome: arteiro.nome,
    telefone: arteiro.telefone ?? '',
    sicab: arteiro.sicab ?? '',
    grupo: arteiro.grupo ?? '',
    arroba: arteiro.arroba ?? '',
    redesSociais: arteiro.redesSociais ?? '',
    biografia: arteiro.biografia ?? '',
  }));
  const [estado, setEstado] = useState(arteiro.estado);
  const [logotipo, setLogotipo] = useState<File | null>(null);
  const [previa, setPrevia] = useState<string | null>(assetUrl(arteiro.logotipoUrl));
  const [removerLogotipo, setRemoverLogotipo] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [mensagem, setMensagem] = useState<{ tipo: 'erro' | 'sucesso'; texto: string } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const inputArquivo = useRef<HTMLInputElement>(null);

  const definir = (campo: CampoTexto) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValores((atual) => ({ ...atual, [campo]: event.target.value }));

  function escolherArquivo(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;
    if (!(ARTEIRO_LOGOTIPO_MIME_TYPES as readonly string[]).includes(arquivo.type)) {
      setErros((atual) => ({ ...atual, logotipo: 'Formato não suportado (use JPG, PNG, WEBP ou GIF)' }));
      return;
    }
    if (arquivo.size > ARTEIRO_LOGOTIPO_MAX_BYTES) {
      setErros((atual) => ({ ...atual, logotipo: 'Imagem muito grande (máximo 2MB)' }));
      return;
    }
    setErros((atual) => ({ ...atual, logotipo: '' }));
    setLogotipo(arquivo);
    setPrevia(URL.createObjectURL(arquivo));
    setRemoverLogotipo(false);
  }

  function tirarLogotipo() {
    setLogotipo(null);
    setPrevia(null);
    setRemoverLogotipo(true);
    if (inputArquivo.current) inputArquivo.current.value = '';
  }

  async function salvar(event: React.FormEvent) {
    event.preventDefault();
    const parsed = updateArteiroSchema.safeParse({ ...valores, estado });
    if (!parsed.success) {
      setErros(errosPorCampo(parsed.error.issues));
      return;
    }

    // Multipart por causa do logotipo; campos em branco viajam como '' e o backend grava null.
    const formData = new FormData();
    for (const campo of CAMPOS_TEXTO) formData.append(campo, valores[campo].trim());
    formData.append('estado', estado);
    if (logotipo) formData.append('logotipo', logotipo);
    if (removerLogotipo) formData.append('removeLogotipo', 'true');

    setErros({});
    setMensagem(null);
    setSalvando(true);
    try {
      await contaApi(`/arteiros/${arteiro.id}`, { method: 'PATCH', body: formData });
      setMensagem({ tipo: 'sucesso', texto: 'Perfil atualizado.' });
      recarregar();
    } catch (error) {
      if (error instanceof ApiError && error.issues.length) setErros(errosPorCampo(error.issues));
      setMensagem({ tipo: 'erro', texto: mensagemDeErro(error) });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Secao titulo="Dados do arteiro" descricao="É o que aparece na sua página da vitrine.">
      <form onSubmit={salvar} noValidate className="space-y-4">
        {mensagem && <Alert tipo={mensagem.tipo}>{mensagem.texto}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="arteiro-nome" label="Nome" error={erros.nome} className="sm:col-span-2">
            <Input value={valores.nome} onChange={definir('nome')} />
          </Field>
          <Field id="arteiro-telefone" label="Telefone (WhatsApp)" error={erros.telefone}>
            <Input value={valores.telefone} onChange={definir('telefone')} placeholder="(12) 99999-9999" />
          </Field>
          <Field id="arteiro-sicab" label="Cadastro SICAB" error={erros.sicab}>
            <Input value={valores.sicab} onChange={definir('sicab')} />
          </Field>
          <Field id="arteiro-grupo" label="Grupo" error={erros.grupo}>
            <Input value={valores.grupo} onChange={definir('grupo')} placeholder="Grupo ou coletivo" />
          </Field>
          <Field id="arteiro-arroba" label="Arroba nas redes" error={erros.arroba}>
            <Input value={valores.arroba} onChange={definir('arroba')} placeholder="@seuperfil" />
          </Field>
          <Field
            id="arteiro-redes"
            label="Links de redes sociais"
            error={erros.redesSociais}
            hint="Um link por linha."
            className="sm:col-span-2"
          >
            <Textarea value={valores.redesSociais} onChange={definir('redesSociais')} rows={3} />
          </Field>
          <Field
            id="arteiro-biografia"
            label="Biografia"
            error={erros.biografia}
            hint="Conte sua história e como você trabalha."
            className="sm:col-span-2"
          >
            <Textarea value={valores.biografia} onChange={definir('biografia')} rows={6} />
          </Field>

          <Field
            id="arteiro-logotipo"
            label="Logotipo"
            error={erros.logotipo || undefined}
            hint="JPG, PNG, WEBP ou GIF · máximo 2MB"
            className="sm:col-span-2"
          >
            <div className="flex items-center gap-3">
              {previa && (
                <div className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previa} alt="Pré-visualização do logotipo" className="h-16 w-16 border-2 border-foreground object-cover" />
                  <button
                    type="button"
                    onClick={tirarLogotipo}
                    aria-label="Remover logotipo"
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center bg-destructive text-destructive-foreground"
                  >
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </div>
              )}
              <input
                ref={inputArquivo}
                type="file"
                accept={(ARTEIRO_LOGOTIPO_MIME_TYPES as readonly string[]).join(',')}
                onChange={escolherArquivo}
                className="flex-1 text-sm file:mr-3 file:border-2 file:border-foreground file:bg-card file:px-3 file:py-1.5 file:text-sm file:font-extrabold"
              />
            </div>
          </Field>

          <Field
            id="arteiro-estado"
            label="Visibilidade na vitrine"
            hint="Inativo tira seu perfil e suas peças do site, sem apagar nada."
          >
            <Select value={estado} onChange={(event) => setEstado(event.target.value as Arteiro['estado'])}>
              <option value="ativo">Ativo (visível)</option>
              <option value="inativo">Inativo (oculto)</option>
            </Select>
          </Field>
        </div>

        <Button type="submit" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </form>
    </Secao>
  );
}
