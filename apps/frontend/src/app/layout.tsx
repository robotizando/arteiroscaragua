import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { assetUrl, getConfiguracaoSite } from '@/lib/api';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { TermosGate } from '@/components/conta/termos-gate';
import './globals.css';

const display = Fraunces({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

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
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <AuthProvider>
          <SiteHeader logotipoUrl={configuracao?.logotipoUrl ?? null} />
          <main className="flex-1">{children}</main>
          <SiteFooter logotipoUrl={configuracao?.logotipoUrl ?? null} />
          <TermosGate />
        </AuthProvider>
      </body>
    </html>
  );
}
