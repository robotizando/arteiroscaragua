import Link from 'next/link';
import { assetUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

export function Logo({ logotipoUrl, className }: { logotipoUrl: string | null; className?: string }) {
  const src = assetUrl(logotipoUrl);
  return (
    <Link href="/" className={cn('flex shrink-0 items-center', className)} aria-label="Arteiros Caraguá, página inicial">
      {src ? (
        // Logotipo das configurações do site; o nome já está no aria-label do link.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-[72px] w-[72px] object-contain lg:h-[132px] lg:w-[132px]" />
      ) : (
        // Sem logotipo cadastrado: quadrado verde + nome, como no protótipo.
        <span className="flex items-center gap-2.5">
          <span className="h-[22px] w-[22px] bg-mata-300 lg:h-[26px] lg:w-[26px]" aria-hidden />
          <span className="text-[16px] font-extrabold tracking-tight lg:text-[17px]">Arteiros Caraguá</span>
        </span>
      )}
    </Link>
  );
}
