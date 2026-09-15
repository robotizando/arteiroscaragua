import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { PublicoArteiroResumo } from '@arteiroscaragua/shared-types';
import { buttonClassName } from '@/components/ui/button';
import { pluralizar } from '@/lib/utils';
import { ArteiroAvatar, MateriaisTags } from './arteiro-avatar';

export function ArteiroCard({ arteiro }: { arteiro: PublicoArteiroResumo }) {
  return (
    <Link
      href={`/arteiros/${arteiro.id}`}
      className="group flex h-full gap-4 rounded-2xl border bg-card p-4 transition hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ArteiroAvatar nome={arteiro.nome} logotipoUrl={arteiro.logotipoUrl} size="md" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-lg font-medium transition-colors group-hover:text-primary">
          {arteiro.nome}
        </h3>
        <p className="truncate text-sm text-muted-foreground">
          {[arteiro.grupo, pluralizar(arteiro.totalPecas, 'peça', 'peças')].filter(Boolean).join(' · ')}
        </p>
        {arteiro.biografia && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{arteiro.biografia}</p>
        )}
        <MateriaisTags materiais={arteiro.materiais.slice(0, 3)} className="mt-3" />
      </div>
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
