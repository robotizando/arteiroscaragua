import Link from 'next/link';
import { ImageOff } from 'lucide-react';
import type { PublicoPecaResumo } from '@arteiroscaragua/shared-types';
import { assetUrl } from '@/lib/api';
import { formatarNomePeca, formatarValor } from '@/lib/utils';

export function PecaCard({ peca, mostrarArteiro = true }: { peca: PublicoPecaResumo; mostrarArteiro?: boolean }) {
  const imagem = assetUrl(peca.imagemUrl);
  const nome = formatarNomePeca(peca.nome);

  return (
    <Link
      href={`/pecas/${peca.id}`}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
        {imagem ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagem}
            alt={nome}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-8 w-8" aria-hidden />
          </div>
        )}
        {peca.totalImagens > 1 && (
          <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            {peca.totalImagens} fotos
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <h3 className="line-clamp-2 font-display text-base font-medium leading-snug transition-colors group-hover:text-primary sm:text-lg">
          {nome}
        </h3>
        {mostrarArteiro && (
          <p className="truncate text-sm text-muted-foreground">
            por <span className="text-foreground">{peca.arteiro.nome}</span>
          </p>
        )}
        <div className="flex items-baseline justify-between gap-2 pt-0.5">
          <p className="min-w-0 truncate text-xs uppercase tracking-wide text-primary/90">
            {peca.materiais.map((material) => material.nome).join(' · ')}
          </p>
          <p className="shrink-0 text-sm font-semibold tabular-nums">{formatarValor(peca.valorSugerido)}</p>
        </div>
      </div>
    </Link>
  );
}

export function PecasGrid({ pecas, mostrarArteiro }: { pecas: PublicoPecaResumo[]; mostrarArteiro?: boolean }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
      {pecas.map((peca) => (
        <li key={peca.id}>
          <PecaCard peca={peca} mostrarArteiro={mostrarArteiro} />
        </li>
      ))}
    </ul>
  );
}
