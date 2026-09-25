'use client';

import { Heart } from 'lucide-react';
import { useFavoritos } from '@/lib/favoritos-context';
import { cn } from '@/lib/utils';

// Coração para salvar a peça. Só aparece para quem está logado.
// Sem rótulo, é o botão sobre a foto nos cards; com rótulo, o botão da página da peça.
export function FavoritoBotao({
  pecaId,
  className,
  comRotulo = false,
}: {
  pecaId: number;
  className?: string;
  comRotulo?: boolean;
}) {
  const { disponivel, ehFavorito, alternar } = useFavoritos();
  if (!disponivel) return null;

  const favorito = ehFavorito(pecaId);
  const rotulo = favorito ? 'Remover dos favoritos' : 'Salvar nos favoritos';

  return (
    <button
      type="button"
      aria-pressed={favorito}
      aria-label={comRotulo ? undefined : rotulo}
      onClick={() => alternar(pecaId)}
      className={cn(
        'transition-colors duration-150',
        comRotulo
          ? 'inline-flex h-11 items-center gap-2 border-2 border-foreground bg-card px-4 text-[14px] font-extrabold hover:bg-mata-100'
          : 'flex h-9 w-9 items-center justify-center bg-background/85 text-foreground hover:bg-background',
        className,
      )}
    >
      <Heart className={cn('h-[18px] w-[18px]', favorito && 'fill-coral-600 text-coral-600')} aria-hidden />
      {comRotulo && rotulo}
    </button>
  );
}
