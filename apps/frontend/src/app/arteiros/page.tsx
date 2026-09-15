import type { Metadata } from 'next';
import type { ListPublicoArteirosResult } from '@arteiroscaragua/shared-types';
import { apiGet } from '@/lib/api';
import { pluralizar, primeiroParam } from '@/lib/utils';
import { ArteiroCatalogoCard } from '@/components/arteiros/arteiro-card';
import { Paginacao } from '@/components/pecas/paginacao';

const ARTEIROS_POR_PAGINA = 24;

export const metadata: Metadata = {
  title: 'Arteiros',
  description: 'Catálogo de artesãs e artesãos de Caraguatatuba e do litoral norte. Conheça cada arteiro e suas peças.',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ArteirosPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const pagina = Math.max(1, Number(primeiroParam(params.pagina)) || 1);

  const arteiros = await apiGet<ListPublicoArteirosResult>(
    `/api/publico/arteiros?ordem=nome&page=${pagina}&pageSize=${ARTEIROS_POR_PAGINA}`,
  );

  return (
    <div id="arteiros" className="container pt-6 lg:pt-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b-2 border-foreground pb-4 lg:mb-8">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-caps text-mata-700">Catálogo</p>
          <h1 className="mt-1 text-[32px] font-extrabold leading-[1.02] tracking-tight lg:text-[40px]">Arteiros</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Conheça quem faz as peças da vitrine. Escolha um arteiro para ver suas peças.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{pluralizar(arteiros.total, 'arteiro', 'arteiros')}</p>
      </div>

      {arteiros.items.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {arteiros.items.map((arteiro) => (
            <li key={arteiro.id}>
              <ArteiroCatalogoCard arteiro={arteiro} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="border-2 border-dashed border-foreground/30 px-6 py-14">
          <p className="text-lg font-semibold">Ainda não há arteiros na vitrine.</p>
        </div>
      )}

      <Paginacao
        page={arteiros.page}
        pageSize={arteiros.pageSize}
        total={arteiros.total}
        params={{}}
        basePath="/arteiros"
        ancora="arteiros"
      />
    </div>
  );
}
