import Link from 'next/link';

const LINKS = [
  { href: '/quem-somos', label: 'Quem somos' },
  { href: '/politica-de-privacidade', label: 'Política de privacidade' },
  { href: '/termos-de-uso', label: 'Termos de uso' },
];

export function SiteFooter() {
  return (
    <footer className="mt-16">
      <div className="container flex flex-wrap justify-between gap-4 pb-7 pt-5 text-[12px] text-muted-foreground">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <p>© {new Date().getFullYear()} Arteiros Caraguá</p>
          <p>
            Central de atendimento:{' '}
            <a
              href="mailto:sac@criarte.com.br"
              className="font-semibold text-foreground transition-colors duration-150 hover:text-primary"
            >
              sac@criarte.com.br
            </a>
          </p>
        </div>
        <nav aria-label="Institucional">
          <ul className="flex flex-wrap gap-4">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors duration-150 hover:text-primary">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
