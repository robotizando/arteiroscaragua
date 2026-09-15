import Link from 'next/link';
import { assetUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

export function Logo({ logotipoUrl, className }: { logotipoUrl: string | null; className?: string }) {
  const src = assetUrl(logotipoUrl);
  return (
    <Link href="/" className={cn('flex shrink-0 items-center', className)} aria-label="Arteiros Caragua, página inicial">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="Arteiros Caragua" className="h-9 w-auto max-w-[180px] object-contain" />
      ) : (
        <span className="font-display text-xl font-semibold tracking-tight">
          Arteiros <span className="text-primary">Caragua</span>
        </span>
      )}
    </Link>
  );
}
