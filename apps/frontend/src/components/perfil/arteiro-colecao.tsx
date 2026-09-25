'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { ZodTypeAny } from 'zod';
import { ApiError, mensagemDeErro } from '@/lib/api';
import { useContaApi } from '@/lib/conta-api';
import { Button } from '@/components/ui/button';
import { Alert, Field, Input, Select, Textarea, errosPorCampo } from '@/components/ui/form';
import { Secao } from './secao';

export interface CampoColecao {
  nome: string;
  rotulo: string;
  tipo?: 'text' | 'number' | 'month' | 'textarea' | 'select';
  opcoes?: readonly { valor: string; rotulo: string }[];
  placeholder?: string;
  // Campos não obrigatórios em branco não são enviados (viram undefined no schema).
  obrigatorio?: boolean;
  larguraTotal?: boolean;
}

interface ArteiroColecaoProps<Item extends { id: number }> {
  arteiroId: number;
  // Trecho da URL: premios, videos, eventos, cursos ou projetos.
  recurso: string;
  titulo: string;
  descricao: string;
  rotuloNovo: string;
  vazio: string;
  itens: Item[];
  campos: CampoColecao[];
  schema: ZodTypeAny;
  paraFormulario: (item: Item) => Record<string, string>;
  resumo: (item: Item) => React.ReactNode;
  recarregar: () => void;
}

function valoresVazios(campos: CampoColecao[]): Record<string, string> {
  return Object.fromEntries(campos.map((campo) => [campo.nome, campo.opcoes?.[0]?.valor ?? '']));
}

// Coleções simples do perfil (prêmios, vídeos, eventos, cursos e projetos): todas têm a mesma
// forma — uma lista, um formulário de campos simples e as rotas REST /arteiros/:id/<recurso>.
export function ArteiroColecao<Item extends { id: number }>({
  arteiroId,
  recurso,
  titulo,
  descricao,
  rotuloNovo,
  vazio,
  itens,
  campos,
  schema,
  paraFormulario,
  resumo,
  recarregar,
}: ArteiroColecaoProps<Item>) {
  const contaApi = useContaApi();
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [valores, setValores] = useState<Record<string, string>>(() => valoresVazios(campos));
  const [erros, setErros] = useState<Record<string, string>>({});
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);

  const base = `/arteiros/${arteiroId}/${recurso}`;

  function abrirNovo() {
    setEditandoId(null);
    setValores(valoresVazios(campos));
    setErros({});
    setMensagem(null);
    setFormAberto(true);
  }

  function abrirEdicao(item: Item) {
    setEditandoId(item.id);
    setValores({ ...valoresVazios(campos), ...paraFormulario(item) });
    setErros({});
    setMensagem(null);
    setFormAberto(true);
  }

  async function salvar(event: React.FormEvent) {
    event.preventDefault();
    const entradas = campos
      .map((campo) => ({ campo, valor: valores[campo.nome]?.trim() ?? '' }))
      .filter(({ campo, valor }) => valor !== '' || campo.obrigatorio)
      .map(({ campo, valor }) => [campo.nome, valor]);
    const parsed = schema.safeParse(Object.fromEntries(entradas));
    if (!parsed.success) {
      setErros(errosPorCampo(parsed.error.issues));
      return;
    }

    setErros({});
    setMensagem(null);
    setSalvando(true);
    try {
      await contaApi(editandoId ? `${base}/${editandoId}` : base, {
        method: editandoId ? 'PATCH' : 'POST',
        body: parsed.data,
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

  async function remover(id: number) {
    setMensagem(null);
    try {
      await contaApi(`${base}/${id}`, { method: 'DELETE' });
      setConfirmandoId(null);
      recarregar();
    } catch (error) {
      setMensagem(mensagemDeErro(error));
    }
  }

  return (
    <Secao
      titulo={titulo}
      descricao={descricao}
      acao={
        <Button size="sm" onClick={abrirNovo}>
          <Plus className="h-4 w-4" aria-hidden />
          {rotuloNovo}
        </Button>
      }
    >
      <div className="space-y-4">
        {mensagem && <Alert tipo="erro">{mensagem}</Alert>}

        {formAberto && (
          <form onSubmit={salvar} noValidate className="border-2 border-foreground bg-card p-4 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {campos.map((campo) => (
                <Field
                  key={campo.nome}
                  id={`${recurso}-${campo.nome}`}
                  label={campo.rotulo}
                  error={erros[campo.nome]}
                  className={campo.larguraTotal ? 'sm:col-span-2' : undefined}
                >
                  {campo.tipo === 'textarea' ? (
                    <Textarea
                      value={valores[campo.nome] ?? ''}
                      placeholder={campo.placeholder}
                      onChange={(event) => setValores({ ...valores, [campo.nome]: event.target.value })}
                    />
                  ) : campo.tipo === 'select' ? (
                    <Select
                      value={valores[campo.nome] ?? ''}
                      onChange={(event) => setValores({ ...valores, [campo.nome]: event.target.value })}
                    >
                      {campo.opcoes?.map((opcao) => (
                        <option key={opcao.valor} value={opcao.valor}>
                          {opcao.rotulo}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      type={campo.tipo === 'number' ? 'number' : campo.tipo === 'month' ? 'month' : 'text'}
                      value={valores[campo.nome] ?? ''}
                      placeholder={campo.placeholder}
                      onChange={(event) => setValores({ ...valores, [campo.nome]: event.target.value })}
                    />
                  )}
                </Field>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button type="submit" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setFormAberto(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {itens.length === 0 ? (
          <p className="text-sm text-muted-foreground">{vazio}</p>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {itens.map((item) => (
              <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0 flex-1 text-sm">{resumo(item)}</div>
                {confirmandoId === item.id ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Remover?</span>
                    <Button size="sm" variant="outline" onClick={() => remover(item.id)}>
                      Sim
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmandoId(null)}>
                      Não
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => abrirEdicao(item)} aria-label="Editar">
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmandoId(item.id)} aria-label="Remover">
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Secao>
  );
}
