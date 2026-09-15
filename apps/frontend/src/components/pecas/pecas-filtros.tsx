'use client';

import { Suspense, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { PublicoFiltros } from '@arteiroscaragua/shared-types';
import { assetUrl } from '@/lib/api';
import { cn, pluralizar } from '@/lib/utils';
import { BuscaPecas } from './busca-pecas';

interface PecasFiltrosProps extends PublicoFiltros {
  busca: string;
  materialId: string;
  arteiroId: string;
  total: number;
  // Grade de resultados e paginação.
  children: React.ReactNode;
}

const TOP_ARTEIROS = 5;
const ULTIMOS_ARTEIROS = 5;

const selectClassName =
  'h-10 min-w-0 border-2 border-foreground bg-card px-2.5 text-sm font-semibold text-foreground';

export function PecasFiltros({
  materiais,
  arteiros,
  busca,
  materialId,
  arteiroId,
  total,
  children,
}: PecasFiltrosProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function navegar(alteracoes: { busca?: string; material?: string; arteiro?: string }) {
    const valores = { busca, material: materialId, arteiro: arteiroId, ...alteracoes };
    const params = new URLSearchParams();
    for (const [chave, valor] of Object.entries(valores)) {
      if (valor) params.set(chave, valor);
    }
    const query = params.toString();
    startTransition(() => router.replace(query ? `/?${query}` : '/', { scroll: false }));
  }

  // Clicar no item já selecionado desmarca.
  const alternarMaterial = (id: string) => navegar({ material: id === materialId ? '' : id });
  const alternarArteiro = (id: string) => navegar({ arteiro: id === arteiroId ? '' : id });
  const limpar = () => navegar({ busca: '', material: '', arteiro: '' });

  const topArteiros = [...arteiros]
    .sort((a, b) => b.totalPecas - a.totalPecas || a.nome.localeCompare(b.nome, 'pt-BR'))
    .slice(0, TOP_ARTEIROS);
  const arteiroNoTop = topArteiros.some((arteiro) => String(arteiro.id) === arteiroId);
  const ultimosArteiros = [...arteiros]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
    .slice(0, ULTIMOS_ARTEIROS);

  const contador = (
    <span className="flex items-center gap-1.5">
      {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
      {pluralizar(total, 'peça encontrada', 'peças encontradas')}
    </span>
  );

  const opcoesArteiros = arteiros.map((arteiro) => (
    <option key={arteiro.id} value={String(arteiro.id)}>
      {arteiro.nome}
    </option>
  ));

  return (
    <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12 lg:pt-10">
      {/* Desktop: filtros na lateral */}
      <aside aria-label="Filtros" className="hidden flex-col items-stretch gap-8 lg:flex">
        <GrupoFiltro titulo="Últimos arteiros">
          {ultimosArteiros.map((arteiro) => (
            <ItemFiltro
              key={arteiro.id}
              selecionado={String(arteiro.id) === arteiroId}
              contagem={arteiro.totalPecas}
              onClick={() => alternarArteiro(String(arteiro.id))}
            >
              {arteiro.nome}
            </ItemFiltro>
          ))}
        </GrupoFiltro>

        <GrupoFiltro titulo="Peças com materiais">
          <ItemFiltro selecionado={!materialId} onClick={() => navegar({ material: '' })}>
            Todos
          </ItemFiltro>
          {materiais.map((material) => (
            <ItemFiltro
              key={material.id}
              selecionado={material.id === materialId}
              contagem={material.totalPecas}
              icone={<IconeMaterial url={material.thumbnailUrl} />}
              onClick={() => alternarMaterial(material.id)}
            >
              {material.nome}
            </ItemFiltro>
          ))}
        </GrupoFiltro>

        <GrupoFiltro
          titulo="Arteiro"
          depois={
            <select
              aria-label="Outros arteiros"
              value={arteiroNoTop ? '' : arteiroId}
              onChange={(event) => navegar({ arteiro: event.target.value })}
              className={cn(selectClassName, 'mt-2 w-full')}
            >
              <option value="">Outros arteiros…</option>
              {opcoesArteiros}
            </select>
          }
        >
          <ItemFiltro selecionado={!arteiroId} onClick={() => navegar({ arteiro: '' })}>
            Todos
          </ItemFiltro>
          {topArteiros.map((arteiro) => (
            <ItemFiltro
              key={arteiro.id}
              selecionado={String(arteiro.id) === arteiroId}
              contagem={arteiro.totalPecas}
              onClick={() => alternarArteiro(String(arteiro.id))}
            >
              {arteiro.nome}
            </ItemFiltro>
          ))}
        </GrupoFiltro>

        <button
          type="button"
          onClick={limpar}
          className="self-start border-b-2 border-primary text-sm font-extrabold text-primary transition-colors duration-150 hover:border-mata-700 hover:text-mata-700"
        >
          Limpar filtros
        </button>
      </aside>

      {/* Mobile: busca, chips de material e select de arteiro */}
      <div className="lg:hidden">
        <div className="pt-3">
          <Suspense fallback={<div className="h-11" />}>
            <BuscaPecas variante="pagina" />
          </Suspense>
        </div>
        <div
          role="group"
          aria-label="Material"
          className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 pt-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ChipFiltro selecionado={!materialId} onClick={() => navegar({ material: '' })}>
            Todos
          </ChipFiltro>
          {materiais.map((material) => (
            <ChipFiltro
              key={material.id}
              selecionado={material.id === materialId}
              onClick={() => alternarMaterial(material.id)}
            >
              {material.nome}
            </ChipFiltro>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-2.5">
          <select
            aria-label="Filtrar por arteiro"
            value={arteiroId}
            onChange={(event) => navegar({ arteiro: event.target.value })}
            className={cn(selectClassName, 'h-11 flex-1')}
          >
            <option value="">Todos os arteiros</option>
            {opcoesArteiros}
          </select>
          <span className="shrink-0 text-[12px] text-muted-foreground" aria-live="polite">
            {contador}
          </span>
        </div>
        <div className="mt-4 h-0.5 bg-foreground" aria-hidden />
      </div>

      <div className="min-w-0 pt-4 lg:pt-0">
        <div className="lg:mb-6 lg:flex lg:items-end lg:justify-between lg:gap-6 lg:border-b-2 lg:border-foreground lg:pb-4">
          <h1 className="sr-only max-w-[620px] text-[40px] font-extrabold leading-[1.02] tracking-tight lg:not-sr-only">
            Feito à mão no litoral norte
          </h1>
          <span className="hidden shrink-0 text-sm text-muted-foreground lg:block" aria-live="polite">
            {contador}
          </span>
        </div>
        <div className={cn('transition-opacity duration-150', isPending && 'opacity-60')}>{children}</div>
      </div>
    </div>
  );
}

function GrupoFiltro({
  titulo,
  depois,
  children,
}: {
  titulo: string;
  depois?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <h2 className="mb-1.5 border-b-2 border-foreground pb-2 text-xs font-extrabold uppercase tracking-caps">
        {titulo}
      </h2>
      <ul className="flex flex-col">{children}</ul>
      {depois}
    </div>
  );
}

function IconeMaterial({ url }: { url: string | null }) {
  const src = assetUrl(url);
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden bg-muted" aria-hidden>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
      )}
    </span>
  );
}

function ItemFiltro({
  selecionado,
  contagem,
  icone,
  onClick,
  children,
}: {
  selecionado: boolean;
  contagem?: number;
  icone?: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={selecionado}
        onClick={onClick}
        className="flex w-full items-center justify-between gap-2 border-b border-foreground/[.18] py-2 text-left text-[14px] transition-colors duration-150 hover:text-primary"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {icone}
          <span className={cn('min-w-0 truncate', selecionado && 'font-extrabold')}>{children}</span>
        </span>
        {contagem !== undefined && <span className="shrink-0 tabular-nums text-muted-foreground">{contagem}</span>}
      </button>
    </li>
  );
}

function ChipFiltro({
  selecionado,
  onClick,
  children,
}: {
  selecionado: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selecionado}
      onClick={onClick}
      // O ::after estende a área de toque para 44px sem mudar o desenho de 34px.
      className={cn(
        'relative h-[34px] shrink-0 whitespace-nowrap border-2 border-foreground px-3 text-sm font-semibold transition-colors duration-150 after:absolute after:inset-x-0 after:-inset-y-[5px]',
        selecionado ? 'bg-foreground text-background' : 'bg-transparent text-foreground hover:bg-card',
      )}
    >
      {children}
    </button>
  );
}
