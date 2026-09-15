import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type {
  ListPublicoPecasResult,
  PublicoArteiroResumo,
  PublicoFiltros,
} from '@arteiroscaragua/shared-types';
import { apiGet } from '@/lib/api';
import { cn, primeiroParam } from '@/lib/utils';
import { PecasGrid } from '@/components/pecas/peca-card';
import { PecasFiltros } from '@/components/pecas/pecas-filtros';
import { Paginacao } from '@/components/pecas/paginacao';
import { ArteiroCard } from '@/components/arteiros/arteiro-card';

const PECAS_POR_PAGINA = 24;
const ARTEIROS_RECENTES = 3;

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
      <section id="pecas" className="container">
        <PecasFiltros
          materiais={filtros.materiais}
          arteiros={filtros.arteiros}
          busca={busca}
          materialId={materialId}
          arteiroId={arteiroId}
          total={pecas.total}
        >
          {pecas.items.length ? (
            <PecasGrid pecas={pecas.items} colunas={3} />
          ) : (
            <div className="border-2 border-dashed border-foreground/30 px-6 py-14">
              <p className="text-lg font-semibold">
                {temFiltro
                  ? 'Nenhuma peça encontrada. Tente outra palavra ou remova um filtro.'
                  : 'Ainda não há peças na vitrine.'}
              </p>
            </div>
          )}
          <Paginacao page={pecas.page} pageSize={pecas.pageSize} total={pecas.total} params={filtrosAtuais} />
        </PecasFiltros>
      </section>

      {recentes.items.length > 0 && (
        // -mb-16 encosta a faixa no rodapé (que tem mt-16 nas demais páginas).
        <section id="arteiros" className="-mb-16 mt-8 bg-mata-700 text-background lg:mt-14">
          <div className="container pb-8 pt-7 lg:pb-14 lg:pt-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-caps text-mata-300">Novos arteiros</p>
                <h2 className="mt-1 text-[26px] font-extrabold leading-[1.05] tracking-tight lg:mt-1.5 lg:text-[40px]">
                  Chegaram à vitrine
                </h2>
              </div>
              <LinkCadastro className="hidden sm:inline-flex" />
            </div>
            <ul className="mt-4 grid gap-2 sm:mt-7 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {recentes.items.map((arteiro) => (
                <li key={arteiro.id}>
                  <ArteiroCard arteiro={arteiro} />
                </li>
              ))}
            </ul>
            <LinkCadastro className="mt-4 sm:hidden" />
          </div>
        </section>
      )}
    </>
  );
}

function LinkCadastro({ className }: { className?: string }) {
  return (
    <Link
      href="/cadastro"
      className={cn(
        'inline-flex items-center gap-1 border-b-2 border-mata-300 pb-0.5 text-[14px] font-extrabold transition-colors duration-150 hover:text-mata-300',
        className,
      )}
    >
      Você também é arteiro? Cadastre-se
      <ArrowRight className="h-4 w-4" aria-hidden />
    </Link>
  );
}
