import Link from 'next/link';
import { ImageOff } from 'lucide-react';
import type { PublicoPecaResumo } from '@arteiroscaragua/shared-types';
import { assetUrl } from '@/lib/api';
import { cn, formatarNomePeca, formatarValor } from '@/lib/utils';
import { FavoritoBotao } from './favorito-botao';

export function PecaCard({ peca, mostrarArteiro = true }: { peca: PublicoPecaResumo; mostrarArteiro?: boolean }) {
  const imagem = assetUrl(peca.imagemUrl);
  const nome = formatarNomePeca(peca.nome);
  const materiais = peca.materiais.map((material) => material.nome).join(', ');

  return (
    // O coração é um botão e não pode ficar dentro do link do card, por isso são irmãos.
    <div className="group relative flex flex-col">
      <Link href={`/pecas/${peca.id}`} className="flex flex-col text-foreground">
        <div className="relative aspect-peca overflow-hidden border border-foreground/[.18] bg-muted">
          {imagem ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagem} alt={nome} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageOff className="h-8 w-8" aria-hidden />
            </div>
          )}
          {peca.totalImagens > 1 && (
            <span className="absolute left-2 top-2 bg-foreground/80 px-1.5 py-0.5 text-xs font-semibold text-background">
              {peca.totalImagens} fotos
            </span>
          )}
        </div>

        <div className="mt-2 flex items-baseline justify-between gap-2 sm:mt-3 sm:gap-3">
          <h3 className="line-clamp-2 min-w-0 text-[14px] font-semibold leading-[1.3] tracking-[-0.01em] transition-colors duration-150 group-hover:text-primary sm:text-[17px]">
            {nome}
          </h3>
          <p className="shrink-0 text-[14px] font-extrabold tabular-nums sm:text-[15px]">
            {formatarValor(peca.valorSugerido)}
          </p>
        </div>
        {(mostrarArteiro || materiais) && (
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground sm:mt-1 sm:text-sm">
            {mostrarArteiro && peca.arteiro.nome}
            {mostrarArteiro && materiais && ' · '}
            <span className="sm:text-xs sm:font-semibold sm:uppercase sm:tracking-[0.06em] sm:text-mata-700">
              {materiais}
            </span>
          </p>
        )}
      </Link>
      <FavoritoBotao pecaId={peca.id} className="absolute right-2 top-2" />
    </div>
  );
}

export function PecasGrid({
  pecas,
  mostrarArteiro,
  colunas = 4,
}: {
  pecas: PublicoPecaResumo[];
  mostrarArteiro?: boolean;
  // Colunas no desktop; a home usa 3 por causa da lateral de filtros.
  colunas?: 3 | 4;
}) {
  return (
    <ul
      className={cn(
        'grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-8',
        colunas === 4 && 'lg:grid-cols-4',
      )}
    >
      {pecas.map((peca) => (
        <li key={peca.id}>
          <PecaCard peca={peca} mostrarArteiro={mostrarArteiro} />
        </li>
      ))}
    </ul>
  );
}
