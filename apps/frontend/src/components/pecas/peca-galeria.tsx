'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import type { ArteiroPecaImagem } from '@arteiroscaragua/shared-types';
import { assetUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

export function PecaGaleria({ imagens, nome }: { imagens: ArteiroPecaImagem[]; nome: string }) {
  const [atual, setAtual] = useState(0);
  const total = imagens.length;

  if (!total) {
    return (
      <div className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-2xl bg-muted text-sm text-muted-foreground">
        <ImageOff className="h-8 w-8" aria-hidden />
        Peça sem fotos
      </div>
    );
  }

  const ir = (delta: number) => setAtual((indice) => (indice + delta + total) % total);
  const botaoNavegacao =
    'absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-md transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted"
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') ir(-1);
          if (event.key === 'ArrowRight') ir(1);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={imagens[atual].id}
          src={assetUrl(imagens[atual].url)!}
          alt={total > 1 ? `${nome}, foto ${atual + 1} de ${total}` : nome}
          className="h-full w-full object-contain"
        />
        {total > 1 && (
          <>
            <button type="button" onClick={() => ir(-1)} className={cn(botaoNavegacao, 'left-3')} aria-label="Foto anterior">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => ir(1)} className={cn(botaoNavegacao, 'right-3')} aria-label="Próxima foto">
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium tabular-nums text-white">
              {atual + 1} / {total}
            </span>
          </>
        )}
      </div>

      {total > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {imagens.map((imagem, indice) => (
            <li key={imagem.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setAtual(indice)}
                aria-label={`Ver foto ${indice + 1}`}
                aria-current={indice === atual}
                className={cn(
                  'block h-20 w-20 overflow-hidden rounded-lg border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  indice === atual ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assetUrl(imagem.url)!} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
