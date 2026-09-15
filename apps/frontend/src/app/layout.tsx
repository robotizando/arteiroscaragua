import type { Metadata } from 'next';
import { Archivo } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { assetUrl, getConfiguracaoSite } from '@/lib/api';
import { BarraDestaque } from '@/components/layout/barra-destaque';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { TermosGate } from '@/components/conta/termos-gate';
import './globals.css';

// Uma família só; --font-display aponta para --font-sans em globals.css.
const sans = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const configuracao = await getConfiguracaoSite();
  const icon = assetUrl(configuracao?.logotipoUrl);
  return {
    title: {
      default: 'Arteiros Caragua · Artesanato de Caraguatatuba',
      template: '%s · Arteiros Caragua',
    },
    description: 'Vitrine de peças feitas à mão por artesãs e artesãos de Caraguatatuba, no litoral norte de São Paulo.',
    ...(icon ? { icons: { icon } } : {}),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const configuracao = await getConfiguracaoSite();

  return (
    <html lang="pt-BR" className={sans.variable}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <AuthProvider>
          <BarraDestaque configuracao={configuracao} />
          <SiteHeader logotipoUrl={configuracao?.logotipoUrl ?? null} />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <TermosGate />
        </AuthProvider>
      </body>
    </html>
  );
}
