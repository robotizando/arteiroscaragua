import type { ArteiroMaterialRef } from '@arteiroscaragua/shared-types';
import { assetUrl } from '@/lib/api';
import { cn, iniciais } from '@/lib/utils';

const SIZES = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-14 w-14 text-base',
  lg: 'h-20 w-20 text-xl',
  xl: 'h-24 w-24 text-2xl sm:h-28 sm:w-28 sm:text-3xl',
} as const;

export function ArteiroAvatar({
  nome,
  logotipoUrl,
  size = 'md',
  className,
}: {
  nome: string;
  logotipoUrl: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const src = assetUrl(logotipoUrl);
  return (
    <div className={cn('shrink-0 overflow-hidden rounded-full bg-primary/10 ring-1 ring-border', SIZES[size], className)}>
      {src ? (
        // Decorativa: o nome do arteiro sempre aparece ao lado.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-display font-semibold text-primary" aria-hidden>
          {iniciais(nome)}
        </span>
      )}
    </div>
  );
}

export function MateriaisTags({ materiais, className }: { materiais: ArteiroMaterialRef[]; className?: string }) {
  if (!materiais.length) return null;
  return (
    <ul className={cn('flex flex-wrap gap-1.5', className)} aria-label="Materiais">
      {materiais.map((material) => (
        <li key={material.id} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {material.nome}
        </li>
      ))}
    </ul>
  );
}
