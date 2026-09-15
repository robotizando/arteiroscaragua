import Link from 'next/link';
import type {
  ListPublicoPecasResult,
  PublicoArteiroResumo,
  PublicoFiltros,
} from '@arteiroscaragua/shared-types';
import { apiGet } from '@/lib/api';
import { primeiroParam } from '@/lib/utils';
import { PecasGrid } from '@/components/pecas/peca-card';
import { PecasFiltros } from '@/components/pecas/pecas-filtros';
import { Paginacao } from '@/components/pecas/paginacao';
import { ArteiroCard } from '@/components/arteiros/arteiro-card';
import { buttonClassName } from '@/components/ui/button';

const PECAS_POR_PAGINA = 24;
const ARTEIROS_RECENTES = 6;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const busca = primeiroParam(params.busca);
  const materialId = primeiroParam(params.material);
  const arteiroId = primeiroParam(params.arteiro);
  const pagina = Math.max(1, Number(primeiroParam(params.pagina)) || 1);

  const query = new URLSearchParams({ page: String(pagina), pageSize: String(PECAS_POR_PAGINA) });
  if (busca) query.set('search', busca);
  if (materialId) query.set('materialId', materialId);
  if (arteiroId) query.set('arteiroId', arteiroId);

  const [pecas, filtros, recentes] = await Promise.all([
    apiGet<ListPublicoPecasResult>(`/api/publico/pecas?${query}`),
    apiGet<PublicoFiltros>('/api/publico/filtros'),
    apiGet<{ items: PublicoArteiroResumo[] }>(`/api/publico/arteiros?limit=${ARTEIROS_RECENTES}`),
  ]);

  const filtrosAtuais = Object.fromEntries(
    Object.entries({ busca, material: materialId, arteiro: arteiroId }).filter(([, valor]) => valor),
  );
  const temFiltro = Object.keys(filtrosAtuais).length > 0;

  return (
    <>
      <section id="pecas" className="container pb-4 pt-6 sm:pt-10">
        <div className="mb-5 max-w-2xl sm:mb-6">
          <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
            Feito à mão em Caraguatatuba
          </h1>
          <p className="mt-2 text-muted-foreground">
            Peças de artesãs e artesãos do litoral norte. Escolha uma para conhecer a peça e quem a criou.
          </p>
        </div>

        <PecasFiltros
          materiais={filtros.materiais}
          arteiros={filtros.arteiros}
          busca={busca}
          materialId={materialId}
          arteiroId={arteiroId}
          total={pecas.total}
        />

        <div className="mt-6">
          {pecas.items.length ? (
            <PecasGrid pecas={pecas.items} />
          ) : (
            <div className="rounded-2xl border border-dashed px-6 py-16 text-center">
              <p className="font-display text-xl">
                {temFiltro ? 'Nenhuma peça encontrada' : 'Ainda não há peças na vitrine'}
              </p>
              {temFiltro && (
                <>
                  <p className="mt-2 text-sm text-muted-foreground">Tente outra palavra ou remova algum filtro.</p>
                  <Link href="/" scroll={false} className={buttonClassName({ variant: 'outline', className: 'mt-5' })}>
                    Limpar filtros
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        <Paginacao page={pecas.page} pageSize={pecas.pageSize} total={pecas.total} params={filtrosAtuais} />
      </section>

      {recentes.items.length > 0 && (
        <section id="arteiros" className="mt-12 border-t bg-muted/40">
          <div className="container py-12 sm:py-16">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-display text-2xl font-medium sm:text-3xl">Chegaram à vitrine</h2>
                <p className="mt-1 text-muted-foreground">Os arteiros cadastrados mais recentemente.</p>
              </div>
              <Link href="/cadastro" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                Você também é arteiro? Cadastre-se
              </Link>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentes.items.map((arteiro) => (
                <li key={arteiro.id}>
                  <ArteiroCard arteiro={arteiro} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
