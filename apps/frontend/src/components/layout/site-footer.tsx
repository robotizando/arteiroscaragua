import Link from 'next/link';
import { Logo } from './logo';

const LINKS = [
  { href: '/quem-somos', label: 'Quem somos' },
  { href: '/termos-de-uso', label: 'Termos de uso' },
  { href: '/politica-de-privacidade', label: 'Política de privacidade' },
];

export function SiteFooter({ logotipoUrl }: { logotipoUrl: string | null }) {
  return (
    <footer className="mt-16 border-t bg-card">
      <div className="container flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Logo logotipoUrl={logotipoUrl} />
          <p className="max-w-xs text-sm text-muted-foreground">
            Vitrine de artesãs e artesãos de Caraguatatuba, litoral norte de São Paulo.
          </p>
        </div>
        <nav aria-label="Institucional">
          <ul className="flex flex-col gap-2 text-sm sm:flex-row sm:gap-6">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t">
        <p className="container py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Arteiros Caragua
        </p>
      </div>
    </footer>
  );
}
