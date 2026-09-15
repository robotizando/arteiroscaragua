import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { PublicoArteiroResumo } from '@arteiroscaragua/shared-types';
import { buttonClassName } from '@/components/ui/button';
import { assetUrl } from '@/lib/api';
import { iniciais, pluralizar } from '@/lib/utils';
import { ArteiroAvatar, MateriaisTags } from './arteiro-avatar';

// Card do catálogo (/arteiros): logo, nome e descrição. Abre o arteiro já na seção de peças.
export function ArteiroCatalogoCard({ arteiro }: { arteiro: PublicoArteiroResumo }) {
  const logo = assetUrl(arteiro.logotipoUrl);
  return (
    <Link
      href={`/arteiros/${arteiro.id}#pecas-arteiro`}
      className="group flex h-full flex-col border border-foreground/[.18] bg-card text-foreground transition-colors duration-150 hover:bg-mata-100"
    >
      <div className="aspect-[4/3] overflow-hidden border-b border-foreground/[.18] bg-card">
        {logo ? (
          // Decorativa: o nome do arteiro vem logo abaixo.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" loading="lazy" className="h-full w-full object-contain p-6" />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center bg-foreground text-5xl font-extrabold text-mata-300"
            aria-hidden
          >
            {iniciais(arteiro.nome)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4 sm:p-5">
        <h2 className="text-[17px] font-semibold leading-tight tracking-[-0.01em] transition-colors duration-150 group-hover:text-primary">
          {arteiro.nome}
        </h2>
        <p className="text-sm text-muted-foreground">
          {[arteiro.grupo, pluralizar(arteiro.totalPecas, 'peça', 'peças')].filter(Boolean).join(' · ')}
        </p>
        {arteiro.biografia && (
          <p className="mt-1 line-clamp-3 text-[14px] leading-normal text-neutro-800">{arteiro.biografia}</p>
        )}
        <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-extrabold text-primary">
          Ver peças
          <ArrowRight className="h-4 w-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

// Card da faixa verde "Novos arteiros". Mobile: avatar ao lado do texto; a partir de sm: empilhado, com tags.
export function ArteiroCard({ arteiro }: { arteiro: PublicoArteiroResumo }) {
  return (
    <Link
      href={`/arteiros/${arteiro.id}`}
      className="group grid h-full grid-cols-[48px_minmax(0,1fr)] content-start gap-x-3 bg-background p-3.5 text-foreground transition-colors duration-150 hover:bg-card sm:grid-cols-[56px_minmax(0,1fr)] sm:grid-rows-[auto_auto_1fr] sm:gap-x-3.5 sm:gap-y-3 sm:p-6"
    >
      <ArteiroAvatar
        nome={arteiro.nome}
        logotipoUrl={arteiro.logotipoUrl}
        className="row-span-2 h-12 w-12 text-base sm:row-span-1 sm:h-14 sm:w-14 sm:text-lg"
      />
      <div className="min-w-0 self-center">
        <h3 className="truncate text-base font-semibold tracking-[-0.01em] transition-colors duration-150 group-hover:text-primary sm:text-[19px]">
          {arteiro.nome}
        </h3>
        <p className="truncate text-[12px] text-muted-foreground sm:text-sm">
          {[arteiro.grupo, pluralizar(arteiro.totalPecas, 'peça', 'peças')].filter(Boolean).join(' · ')}
        </p>
      </div>
      {arteiro.biografia && (
        <p className="col-start-2 mt-1 line-clamp-2 text-sm leading-[1.45] text-neutro-800 sm:col-span-2 sm:col-start-1 sm:mt-0 sm:line-clamp-3 sm:text-[14px] sm:leading-normal">
          {arteiro.biografia}
        </p>
      )}
      <MateriaisTags
        materiais={arteiro.materiais.slice(0, 3)}
        className="hidden self-end sm:col-span-2 sm:flex"
      />
    </Link>
  );
}

// Bloco "quem fez" da página da peça.
export function ArteiroDestaque({ arteiro }: { arteiro: PublicoArteiroResumo }) {
  return (
    <div className="flex flex-col gap-6 rounded-2xl border bg-card p-6 sm:flex-row sm:p-8">
      <ArteiroAvatar nome={arteiro.nome} logotipoUrl={arteiro.logotipoUrl} size="xl" />
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-2xl font-medium sm:text-3xl">{arteiro.nome}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {[arteiro.grupo, arteiro.arroba, pluralizar(arteiro.totalPecas, 'peça na vitrine', 'peças na vitrine')]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <MateriaisTags materiais={arteiro.materiais} className="mt-3" />
        {arteiro.biografia && (
          <p className="mt-4 line-clamp-5 whitespace-pre-line leading-relaxed text-foreground/85">{arteiro.biografia}</p>
        )}
        <Link
          href={`/arteiros/${arteiro.id}`}
          className={buttonClassName({ variant: 'outline', className: 'mt-6' })}
        >
          Ver perfil completo
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
