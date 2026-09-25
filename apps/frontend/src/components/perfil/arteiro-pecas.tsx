'use client';

import { useEffect, useState } from 'react';
import { ImageOff, Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  ARTEIRO_PECA_IMAGEM_MIME_TYPES,
  ARTEIRO_PECA_MAX_IMAGENS,
  createArteiroPecaSchema,
  type Arteiro,
  type ArteiroMaterialRef,
  type ArteiroPeca,
} from '@arteiroscaragua/shared-types';
import { ApiError, apiGet, assetUrl, mensagemDeErro } from '@/lib/api';
import { useContaApi } from '@/lib/conta-api';
import { formatarValor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Alert, Field, Input, Textarea, errosPorCampo } from '@/components/ui/form';
import { Secao } from './secao';

interface Formulario {
  nome: string;
  valorSugerido: string;
  descricao: string;
  materialIds: string[];
  novasImagens: File[];
}

const VAZIO: Formulario = { nome: '', valorSugerido: '', descricao: '', materialIds: [], novasImagens: [] };

export function ArteiroPecas({ arteiro, recarregar }: { arteiro: Arteiro; recarregar: () => void }) {
  const contaApi = useContaApi();
  const [materiais, setMateriais] = useState<ArteiroMaterialRef[]>([]);
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<Formulario>(VAZIO);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);

  // A peça em edição vem da lista recarregada, para as imagens removidas sumirem na hora.
  const editando = arteiro.pecas.find((peca) => peca.id === editandoId) ?? null;
  const imagensRestantes = ARTEIRO_PECA_MAX_IMAGENS - (editando?.imagens.length ?? 0);

  useEffect(() => {
    apiGet<{ items: ArteiroMaterialRef[] }>('/api/publico/materiais')
      .then((data) => setMateriais(data.items))
      .catch(() => undefined);
  }, []);

  function abrir(peca: ArteiroPeca | null) {
    setEditandoId(peca?.id ?? null);
    setForm(
      peca
        ? {
            nome: peca.nome,
            valorSugerido: peca.valorSugerido === null ? '' : String(peca.valorSugerido),
            descricao: peca.descricao,
            materialIds: peca.materiais.map((material) => material.id),
            novasImagens: [],
          }
        : VAZIO,
    );
    setErros({});
    setMensagem(null);
    setFormAberto(true);
  }

  function escolherImagens(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(event.target.files ?? []).filter((arquivo) =>
      (ARTEIRO_PECA_IMAGEM_MIME_TYPES as readonly string[]).includes(arquivo.type),
    );
    setForm((atual) => ({ ...atual, novasImagens: arquivos.slice(0, Math.max(imagensRestantes, 0)) }));
  }

  async function salvar(event: React.FormEvent) {
    event.preventDefault();
    const parsed = createArteiroPecaSchema.safeParse({
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      ...(form.valorSugerido.trim() ? { valorSugerido: form.valorSugerido.trim() } : {}),
      materialIds: form.materialIds,
    });
    if (!parsed.success) {
      setErros(errosPorCampo(parsed.error.issues));
      return;
    }

    const formData = new FormData();
    formData.append('nome', parsed.data.nome);
    formData.append('descricao', parsed.data.descricao);
    if (parsed.data.valorSugerido !== undefined) formData.append('valorSugerido', String(parsed.data.valorSugerido));
    // Vai como JSON para que a lista vazia também chegue (remove todos os materiais).
    formData.append('materialIds', JSON.stringify(form.materialIds));
    form.novasImagens.forEach((arquivo) => formData.append('imagens', arquivo));

    setErros({});
    setMensagem(null);
    setSalvando(true);
    try {
      const base = `/arteiros/${arteiro.id}/pecas`;
      await contaApi(editandoId ? `${base}/${editandoId}` : base, {
        method: editandoId ? 'PATCH' : 'POST',
        body: formData,
      });
      setFormAberto(false);
      recarregar();
    } catch (error) {
      if (error instanceof ApiError && error.issues.length) setErros(errosPorCampo(error.issues));
      setMensagem(mensagemDeErro(error));
    } finally {
      setSalvando(false);
    }
  }

  async function remover(pecaId: number) {
    try {
      await contaApi(`/arteiros/${arteiro.id}/pecas/${pecaId}`, { method: 'DELETE' });
      setConfirmandoId(null);
      if (editandoId === pecaId) setFormAberto(false);
      recarregar();
    } catch (error) {
      setMensagem(mensagemDeErro(error));
    }
  }

  async function removerImagem(pecaId: number, imagemId: number) {
    try {
      await contaApi(`/arteiros/${arteiro.id}/pecas/${pecaId}/imagens/${imagemId}`, { method: 'DELETE' });
      recarregar();
    } catch (error) {
      setMensagem(mensagemDeErro(error));
    }
  }

  function alternarMaterial(id: string) {
    setForm((atual) => ({
      ...atual,
      materialIds: atual.materialIds.includes(id)
        ? atual.materialIds.filter((item) => item !== id)
        : [...atual.materialIds, id],
    }));
  }

  return (
    <Secao
      titulo="Minhas peças"
      descricao="O que aparece na vitrine. Capriche nas fotos: a primeira é a capa da peça."
      acao={
        <Button size="sm" onClick={() => abrir(null)}>
          <Plus className="h-4 w-4" aria-hidden />
          Nova peça
        </Button>
      }
    >
      <div className="space-y-4">
        {mensagem && <Alert tipo="erro">{mensagem}</Alert>}

        {formAberto && (
          <form onSubmit={salvar} noValidate className="border-2 border-foreground bg-card p-4 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="peca-nome" label="Nome da peça" error={erros.nome} className="sm:col-span-2">
                <Input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} />
              </Field>
              <Field
                id="peca-valor"
                label="Valor sugerido (R$)"
                error={erros.valorSugerido}
                hint="Deixe em branco para &quot;sob consulta&quot;."
              >
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.valorSugerido}
                  onChange={(event) => setForm({ ...form, valorSugerido: event.target.value })}
                />
              </Field>
              <Field id="peca-descricao" label="Descrição" error={erros.descricao} className="sm:col-span-2">
                <Textarea
                  value={form.descricao}
                  rows={4}
                  onChange={(event) => setForm({ ...form, descricao: event.target.value })}
                />
              </Field>

              {materiais.length > 0 && (
                <div className="space-y-1.5 sm:col-span-2">
                  <span className="block text-sm font-medium">Materiais da peça</span>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {materiais.map((material) => (
                      <label key={material.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.materialIds.includes(material.id)}
                          onChange={() => alternarMaterial(material.id)}
                          className="h-4 w-4 accent-primary"
                        />
                        {material.nome}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 sm:col-span-2">
                <span className="block text-sm font-medium">Fotos</span>
                {editando && editando.imagens.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {editando.imagens.map((imagem) => (
                      <li key={imagem.id} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={assetUrl(imagem.url) ?? ''}
                          alt=""
                          className="h-20 w-20 border-2 border-foreground object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removerImagem(editando.id, imagem.id)}
                          aria-label="Remover foto"
                          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center bg-destructive text-destructive-foreground"
                        >
                          <X className="h-3 w-3" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <input
                  type="file"
                  multiple
                  accept={(ARTEIRO_PECA_IMAGEM_MIME_TYPES as readonly string[]).join(',')}
                  onChange={escolherImagens}
                  disabled={imagensRestantes <= 0}
                  className="w-full text-sm file:mr-3 file:border-2 file:border-foreground file:bg-card file:px-3 file:py-1.5 file:text-sm file:font-extrabold"
                />
                <p className="text-xs text-muted-foreground">
                  {imagensRestantes > 0
                    ? `Até ${imagensRestantes} foto(s) neste envio · JPG, PNG, WEBP ou GIF · 3MB cada`
                    : `Esta peça já tem o máximo de ${ARTEIRO_PECA_MAX_IMAGENS} fotos.`}
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button type="submit" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar peça'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setFormAberto(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {arteiro.pecas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Você ainda não cadastrou nenhuma peça.</p>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {arteiro.pecas.map((peca) => {
              const capa = assetUrl(peca.imagens[0]?.url);
              return (
                <li key={peca.id} className="flex flex-wrap items-center gap-3 py-3">
                  {capa ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={capa} alt="" className="h-14 w-14 shrink-0 border border-border object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-dashed border-border text-muted-foreground">
                      <ImageOff className="h-5 w-5" aria-hidden />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{peca.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatarValor(peca.valorSugerido)}
                      {peca.materiais.length > 0 && ` · ${peca.materiais.map((item) => item.nome).join(', ')}`}
                    </p>
                  </div>
                  {confirmandoId === peca.id ? (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Remover?</span>
                      <Button size="sm" variant="outline" onClick={() => remover(peca.id)}>
                        Sim
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmandoId(null)}>
                        Não
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => abrir(peca)} aria-label="Editar peça">
                        <Pencil className="h-4 w-4" aria-hidden />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmandoId(peca.id)} aria-label="Remover peça">
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Secao>
  );
}
