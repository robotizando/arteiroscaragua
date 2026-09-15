import Link from 'next/link';
import { Suspense } from 'react';
import { BuscaPecas } from '@/components/pecas/busca-pecas';
import { Logo } from './logo';
import { HeaderActions } from './header-actions';
import { MenuMobile } from './menu-mobile';

export function SiteHeader({ logotipoUrl }: { logotipoUrl: string | null }) {
  return (
    <header className="sticky top-0 z-40 bg-mata-700 text-background">
      {/* A altura acompanha o logo (72px no mobile, 132px no desktop) com 2px de respiro. */}
      <div className="container flex h-[76px] items-center gap-6 lg:h-[136px]">
        <Logo logotipoUrl={logotipoUrl} />
        <div className="ml-6 hidden max-w-[520px] flex-1 lg:block">
          <Suspense fallback={<div className="h-9" />}>
            <BuscaPecas variante="header" />
          </Suspense>
        </div>
        <nav aria-label="Principal" className="ml-auto hidden items-center gap-5 text-[14px] lg:flex">
          <Link href="/quem-somos" className="text-mata-300 transition-colors duration-150 hover:text-background">
            Quem somos
          </Link>
          <Link href="/arteiros" className="text-mata-300 transition-colors duration-150 hover:text-background">
            Arteiros
          </Link>
          <HeaderActions />
        </nav>
        <div className="ml-auto lg:hidden">
          <MenuMobile />
        </div>
      </div>
    </header>
  );
}
