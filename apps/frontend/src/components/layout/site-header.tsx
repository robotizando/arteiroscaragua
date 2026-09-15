import Link from 'next/link';
import { Logo } from './logo';
import { HeaderActions } from './header-actions';

export function SiteHeader({ logotipoUrl }: { logotipoUrl: string | null }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="container flex h-14 items-center gap-6">
        <Logo logotipoUrl={logotipoUrl} />
        <nav aria-label="Principal" className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
          <Link href="/#pecas" className="transition-colors hover:text-foreground">
            Peças
          </Link>
          <Link href="/#arteiros" className="transition-colors hover:text-foreground">
            Arteiros
          </Link>
        </nav>
        <div className="ml-auto">
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}
