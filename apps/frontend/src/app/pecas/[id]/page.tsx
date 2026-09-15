import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import type { PublicoPecaDetalhe } from '@arteiroscaragua/shared-types';
import { apiGetOrNull, assetUrl } from '@/lib/api';
import { formatarNomePeca, formatarValor } from '@/lib/utils';
import { PecaGaleria } from '@/components/pecas/peca-galeria';
import { ContatoWhatsapp } from '@/components/pecas/contato-whatsapp';
import { PecasGrid } from '@/components/pecas/peca-card';
import { ArteiroDestaque } from '@/components/arteiros/arteiro-card';

type Params = Promise<{ id: string }>;

const getPeca = cache((id: string) => apiGetOrNull<PublicoPecaDetalhe>(`/api/publico/pecas/${encodeURIComponent(id)}`));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await getPeca((await params).id);
  if (!data) return { title: 'Peça não encontrada' };
  const imagem = assetUrl(data.peca.imagemUrl);
  return {
    title: `${formatarNomePeca(data.peca.nome)}, por ${data.arteiro.nome}`,
    description: data.peca.descricao.slice(0, 160),
    openGraph: imagem ? { images: [imagem] } : undefined,
  };
}

export default async function PecaPage({ params }: { params: Params }) {
  const data = await getPeca((await params).id);
  if (!data) notFound();

  const { peca, arteiro, outrasPecas } = data;
  const nome = formatarNomePeca(peca.nome);

  return (
    <div className="container py-6 sm:py-10">
      <nav aria-label="Você está em" className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/#pecas" className="hover:text-foreground">
          Vitrine
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="truncate text-foreground">{nome}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
        <PecaGaleria imagens={peca.imagens} nome={nome} />

        <div className="lg:pt-4">
          {peca.materiais.length > 0 && (
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
              {peca.materiais.map((material) => material.nome).join(' · ')}
            </p>
          )}
          <h1 className="mt-2 font-display text-3xl font-medium leading-tight sm:text-4xl">{nome}</h1>
          <p className="mt-3 text-muted-foreground">
            por{' '}
            <Link href={`/arteiros/${arteiro.id}`} className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline">
              {arteiro.nome}
            </Link>
          </p>

          <div className="mt-8 border-y py-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Valor sugerido</p>
            <p className="mt-1 font-display text-3xl font-medium tabular-nums">{formatarValor(peca.valorSugerido)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Valor de referência informado pelo arteiro.</p>
            {arteiro.whatsapp && (
              <ContatoWhatsapp
                whatsapp={arteiro.whatsapp}
                peca={peca}
                arteiroNome={arteiro.nome}
                className="mt-5 w-full sm:w-auto"
              />
            )}
          </div>

          <div className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sobre a peça</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground/90">{peca.descricao}</p>
          </div>
        </div>
      </div>

      <section className="mt-16" aria-labelledby="quem-fez">
        <h2 id="quem-fez" className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Quem fez
        </h2>
        <ArteiroDestaque arteiro={arteiro} />
      </section>

      {outrasPecas.length > 0 && (
        <section className="mt-16" aria-labelledby="outras-pecas">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
            <h2 id="outras-pecas" className="font-display text-2xl font-medium">
              Mais peças de {arteiro.nome}
            </h2>
            {arteiro.totalPecas > outrasPecas.length + 1 && (
              <Link href={`/arteiros/${arteiro.id}`} className="text-sm font-medium text-primary hover:underline">
                Ver todas
              </Link>
            )}
          </div>
          <PecasGrid pecas={outrasPecas} mostrarArteiro={false} />
        </section>
      )}
    </div>
  );
}
