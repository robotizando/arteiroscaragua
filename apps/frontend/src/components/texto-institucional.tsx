import type { ConfiguracaoSite } from '@arteiroscaragua/shared-types';
import { getConfiguracaoSite } from '@/lib/api';

type CampoTexto = keyof Pick<ConfiguracaoSite, 'termosUso' | 'politicaPrivacidade' | 'quemSomos'>;

export async function TextoInstitucional({ titulo, campo }: { titulo: string; campo: CampoTexto }) {
  const configuracao = await getConfiguracaoSite();
  const html = configuracao?.[campo] ?? '';

  return (
    <div className="container max-w-3xl py-10 sm:py-14">
      <h1 className="font-display text-3xl font-medium sm:text-4xl">{titulo}</h1>
      {html ? (
        // HTML sanitizado pelo backend ao salvar (configuracoes-site.service).
        <article
          className="prose prose-stone mt-8 max-w-none prose-headings:font-display prose-headings:font-medium prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <p className="mt-8 text-muted-foreground">Este conteúdo ainda não foi publicado.</p>
      )}
    </div>
  );
}
