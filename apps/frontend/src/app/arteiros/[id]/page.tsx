import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, ExternalLink } from 'lucide-react';
import type { CursoParticipacaoTipo, PublicoArteiro } from '@arteiroscaragua/shared-types';
import { apiGetOrNull, assetUrl } from '@/lib/api';
import { formatarMesAno, pluralizar } from '@/lib/utils';
import { ArteiroAvatar, MateriaisTags } from '@/components/arteiros/arteiro-avatar';
import { PecasGrid } from '@/components/pecas/peca-card';
import { TextoComLinks } from '@/components/texto-com-links';

type Params = Promise<{ id: string }>;

const getArteiro = cache(async (id: string) => {
  const data = await apiGetOrNull<{ arteiro: PublicoArteiro }>(`/api/publico/arteiros/${encodeURIComponent(id)}`);
  return data?.arteiro ?? null;
});

const PARTICIPACAO: Record<CursoParticipacaoTipo, string> = {
  aluno: 'Aluno(a)',
  mediador: 'Mediador(a)',
  curador: 'Curador(a)',
  palestrante: 'Palestrante',
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const arteiro = await getArteiro((await params).id);
  if (!arteiro) return { title: 'Arteiro não encontrado' };
  const imagem = assetUrl(arteiro.logotipoUrl);
  return {
    title: arteiro.nome,
    description: arteiro.biografia?.slice(0, 160) ?? `Peças de ${arteiro.nome} no Arteiros Caragua.`,
    openGraph: imagem ? { images: [imagem] } : undefined,
  };
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-6">
      <h2 className="font-display text-xl font-medium">{titulo}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default async function ArteiroPage({ params }: { params: Params }) {
  const arteiro = await getArteiro((await params).id);
  if (!arteiro) notFound();

  const temTrajetoria =
    arteiro.premios.length + arteiro.eventos.length + arteiro.cursos.length + arteiro.projetos.length > 0;

  return (
    <div className="container py-6 sm:py-10">
      <nav aria-label="Você está em" className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/#arteiros" className="hover:text-foreground">
          Arteiros
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="truncate text-foreground">{arteiro.nome}</span>
      </nav>

      <header className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <ArteiroAvatar nome={arteiro.nome} logotipoUrl={arteiro.logotipoUrl} size="xl" />
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-medium leading-tight sm:text-4xl">{arteiro.nome}</h1>
          <p className="mt-1 text-muted-foreground">
            {[arteiro.grupo, arteiro.arroba, pluralizar(arteiro.totalPecas, 'peça', 'peças')].filter(Boolean).join(' · ')}
          </p>
          <MateriaisTags materiais={arteiro.materiais} className="mt-3" />
        </div>
      </header>

      {(arteiro.biografia || arteiro.redesSociais || arteiro.videos.length > 0) && (
        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {arteiro.biografia && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sobre</h2>
              <p className="mt-3 max-w-prose whitespace-pre-line text-lg leading-relaxed text-foreground/90">
                {arteiro.biografia}
              </p>
            </section>
          )}
          {(arteiro.redesSociais || arteiro.videos.length > 0) && (
            <aside className="space-y-6 lg:col-start-2">
              {arteiro.redesSociais && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Redes sociais</h2>
                  <TextoComLinks texto={arteiro.redesSociais} className="mt-3 whitespace-pre-line break-words text-sm" />
                </div>
              )}
              {arteiro.videos.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vídeos</h2>
                  <ul className="mt-3 space-y-2 text-sm">
                    {arteiro.videos.map((video) => (
                      <li key={video.id}>
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="inline-flex items-center gap-1.5 text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                          {hostname(video.url)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          )}
        </div>
      )}

      <section className="mt-14" aria-labelledby="pecas-arteiro">
        <h2 id="pecas-arteiro" className="mb-6 font-display text-2xl font-medium">
          Peças
        </h2>
        {arteiro.pecas.length ? (
          <PecasGrid pecas={arteiro.pecas} mostrarArteiro={false} />
        ) : (
          <p className="text-muted-foreground">Este arteiro ainda não publicou peças.</p>
        )}
      </section>

      {temTrajetoria && (
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {arteiro.premios.length > 0 && (
            <Secao titulo="Prêmios">
              <ul className="space-y-3">
                {arteiro.premios.map((premio) => (
                  <li key={premio.id}>
                    <p className="font-medium">
                      <span className="tabular-nums text-muted-foreground">{premio.ano}</span> · {premio.nome}
                    </p>
                    {(premio.categoria || premio.instituicao) && (
                      <p className="text-sm text-muted-foreground">
                        {[premio.categoria, premio.instituicao].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {premio.descricao && <p className="mt-1 text-sm">{premio.descricao}</p>}
                  </li>
                ))}
              </ul>
            </Secao>
          )}
          {arteiro.eventos.length > 0 && (
            <Secao titulo="Eventos">
              <ul className="space-y-3">
                {arteiro.eventos.map((evento) => (
                  <li key={evento.id}>
                    <p className="font-medium">
                      <span className="text-muted-foreground">{formatarMesAno(evento.mesAno)}</span> · {evento.nome}
                    </p>
                    {evento.descricaoParticipacao && <p className="mt-1 text-sm">{evento.descricaoParticipacao}</p>}
                  </li>
                ))}
              </ul>
            </Secao>
          )}
          {arteiro.cursos.length > 0 && (
            <Secao titulo="Cursos">
              <ul className="space-y-3">
                {arteiro.cursos.map((curso) => (
                  <li key={curso.id}>
                    <p className="font-medium">{curso.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {[PARTICIPACAO[curso.tipoParticipacao], curso.cargaHoraria ? `${curso.cargaHoraria}h` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {curso.descricao && <p className="mt-1 text-sm">{curso.descricao}</p>}
                  </li>
                ))}
              </ul>
            </Secao>
          )}
          {arteiro.projetos.length > 0 && (
            <Secao titulo="Projetos">
              <ul className="space-y-3">
                {arteiro.projetos.map((projeto) => (
                  <li key={projeto.id} className="whitespace-pre-line text-sm">
                    {projeto.descricao}
                  </li>
                ))}
              </ul>
            </Secao>
          )}
        </div>
      )}
    </div>
  );
}
