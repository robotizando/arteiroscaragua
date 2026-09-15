'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search, X } from 'lucide-react';
import type { PublicoFiltros } from '@arteiroscaragua/shared-types';
import { Button } from '@/components/ui/button';
import { inputClassName } from '@/components/ui/form';
import { cn, pluralizar } from '@/lib/utils';

interface PecasFiltrosProps extends PublicoFiltros {
  busca: string;
  materialId: string;
  arteiroId: string;
  total: number;
}

const ESPERA_DIGITACAO_MS = 400;

export function PecasFiltros({ materiais, arteiros, busca, materialId, arteiroId, total }: PecasFiltrosProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [texto, setTexto] = useState(busca);
  // Última busca enviada pela digitação: evita que a resposta sobrescreva o que ainda está sendo digitado.
  const buscaEnviada = useRef(busca);

  useEffect(() => {
    if (busca !== buscaEnviada.current) {
      buscaEnviada.current = busca;
      setTexto(busca);
    }
  }, [busca]);

  function navegar(alteracoes: { busca?: string; material?: string; arteiro?: string }) {
    const valores = { busca, material: materialId, arteiro: arteiroId, ...alteracoes };
    if (alteracoes.busca !== undefined) buscaEnviada.current = alteracoes.busca;

    const params = new URLSearchParams();
    for (const [chave, valor] of Object.entries(valores)) {
      if (valor) params.set(chave, valor);
    }
    const query = params.toString();
    startTransition(() => router.replace(query ? `/?${query}` : '/', { scroll: false }));
  }

  useEffect(() => {
    const valor = texto.trim();
    if (valor === buscaEnviada.current) return;
    const timer = setTimeout(() => navegar({ busca: valor }), ESPERA_DIGITACAO_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  const temFiltro = Boolean(busca || materialId || arteiroId || texto);

  return (
    <div>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          navegar({ busca: texto.trim() });
        }}
        className="grid grid-cols-2 gap-2 rounded-2xl border bg-card p-2 shadow-sm sm:gap-3 sm:p-3 md:grid-cols-[minmax(0,1fr)_190px_220px_auto]"
      >
        <label className="relative col-span-2 md:col-span-1">
          <span className="sr-only">Buscar peças</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            placeholder="Buscar por peça, arteiro ou descrição"
            className={cn(inputClassName, 'pl-9')}
            maxLength={100}
          />
        </label>

        <select
          aria-label="Filtrar por material"
          value={materialId}
          onChange={(event) => navegar({ material: event.target.value })}
          className={cn(inputClassName, 'min-w-0')}
        >
          <option value="">Todos os materiais</option>
          {materiais.map((material) => (
            <option key={material.id} value={material.id}>
              {material.nome}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrar por arteiro"
          value={arteiroId}
          onChange={(event) => navegar({ arteiro: event.target.value })}
          className={cn(inputClassName, 'min-w-0')}
        >
          <option value="">Todos os arteiros</option>
          {arteiros.map((arteiro) => (
            <option key={arteiro.id} value={String(arteiro.id)}>
              {arteiro.nome}
            </option>
          ))}
        </select>

        {temFiltro && (
          <Button
            variant="ghost"
            className="col-span-2 h-11 md:col-span-1"
            onClick={() => {
              setTexto('');
              navegar({ busca: '', material: '', arteiro: '' });
            }}
          >
            <X className="h-4 w-4" />
            Limpar
          </Button>
        )}
      </form>

      <p className="mt-4 flex h-5 items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
        {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {pluralizar(total, 'peça encontrada', 'peças encontradas')}
      </p>
    </div>
  );
}
