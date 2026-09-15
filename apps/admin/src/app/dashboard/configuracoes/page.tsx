'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  CONFIGURACAO_SITE_CAPA_MAX_BYTES,
  CONFIGURACAO_SITE_CAPA_MIME_TYPES,
  CONFIGURACAO_SITE_LOGOTIPO_MAX_BYTES,
  CONFIGURACAO_SITE_LOGOTIPO_MIME_TYPES,
  type ConfiguracaoSite,
} from '@arteiroscaragua/shared-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEditor } from '@/components/configuracoes-site/rich-text-editor';
import { ImagemCampoCard, useImagemCampo } from '@/components/configuracoes-site/imagem-campo';
import { useConfiguracaoSite, useUpdateConfiguracaoSite } from '@/lib/configuracoes-site-api';
import { getApiErrorMessage } from '@/lib/api';

type TextoCampo = 'quemSomos' | 'termosUso' | 'politicaPrivacidade';

const TEXTOS: { campo: TextoCampo; label: string; descricao: string }[] = [
  { campo: 'quemSomos', label: 'Quem somos', descricao: 'Apresentação exibida na página "Quem somos" do site.' },
  { campo: 'termosUso', label: 'Termos de uso', descricao: 'Termos que os usuários aceitam ao se cadastrar.' },
  {
    campo: 'politicaPrivacidade',
    label: 'Política de privacidade',
    descricao: 'Como o site coleta, usa e protege os dados pessoais.',
  },
];

const TEXTOS_VAZIOS: Record<TextoCampo, string> = { quemSomos: '', termosUso: '', politicaPrivacidade: '' };

function textosDe(configuracao: ConfiguracaoSite): Record<TextoCampo, string> {
  return {
    quemSomos: configuracao.quemSomos,
    termosUso: configuracao.termosUso,
    politicaPrivacidade: configuracao.politicaPrivacidade,
  };
}

export default function ConfiguracoesSitePage() {
  const { data, isLoading } = useConfiguracaoSite();
  const updateMutation = useUpdateConfiguracaoSite();

  const [textos, setTextos] = useState(TEXTOS_VAZIOS);
  const logotipo = useImagemCampo({
    maxBytes: CONFIGURACAO_SITE_LOGOTIPO_MAX_BYTES,
    mimeTypes: CONFIGURACAO_SITE_LOGOTIPO_MIME_TYPES,
    formatos: 'PNG, WEBP ou JPG',
  });
  const capa = useImagemCampo({
    maxBytes: CONFIGURACAO_SITE_CAPA_MAX_BYTES,
    mimeTypes: CONFIGURACAO_SITE_CAPA_MIME_TYPES,
    formatos: 'JPG, PNG ou WEBP',
  });

  function resetFrom(configuracao: ConfiguracaoSite) {
    setTextos(textosDe(configuracao));
    logotipo.reset(configuracao.logotipoUrl);
    capa.reset(configuracao.capaUrl);
  }

  useEffect(() => {
    if (data) resetFrom(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const textosAlterados = data
    ? TEXTOS.filter(({ campo }) => textos[campo] !== data[campo]).map(({ campo }) => campo)
    : [];
  const isDirty = textosAlterados.length > 0 || logotipo.isDirty || capa.isDirty;

  async function handleSave() {
    const formData = new FormData();
    for (const campo of textosAlterados) formData.append(campo, textos[campo]);
    if (logotipo.file) formData.append('logotipo', logotipo.file);
    if (logotipo.remove) formData.append('removeLogotipo', 'true');
    if (capa.file) formData.append('capa', capa.file);
    if (capa.remove) formData.append('removeCapa', 'true');

    try {
      await updateMutation.mutateAsync(formData);
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível salvar as configurações'));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Configurações do site</h1>
          <p className="text-muted-foreground">Logotipo, imagem de capa e textos institucionais exibidos no site.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={!isDirty || updateMutation.isPending}
            onClick={() => data && resetFrom(data)}
          >
            Descartar alterações
          </Button>
          <Button disabled={!isDirty || updateMutation.isPending || isLoading} onClick={handleSave}>
            {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <ImagemCampoCard
        campo={logotipo}
        titulo="Logotipo"
        descricao="Exibido no cabeçalho e no rodapé do site público. Prefira PNG com fundo transparente."
        isLoading={isLoading}
        previewClassName="h-28 max-w-sm bg-[repeating-conic-gradient(hsl(var(--muted))_0_25%,hsl(var(--background))_0_50%)] bg-[length:16px_16px]"
        imageClassName="object-contain p-3"
      />

      <ImagemCampoCard
        campo={capa}
        titulo="Foto da capa"
        descricao="Imagem de destaque exibida no topo da página inicial."
        isLoading={isLoading}
        previewClassName="aspect-[21/9] max-w-3xl"
        imageClassName="object-cover"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Textos do site</CardTitle>
          <CardDescription>
            Use a barra de ferramentas para formatar o texto, ou o botão HTML para editar o código diretamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={TEXTOS[0].campo}>
            <TabsList>
              {TEXTOS.map(({ campo, label }) => (
                <TabsTrigger key={campo} value={campo}>
                  {label}
                  {textosAlterados.includes(campo) && (
                    <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-primary" aria-label="alterado" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            {TEXTOS.map(({ campo, descricao }) => (
              <TabsContent key={campo} value={campo} className="space-y-2">
                <p className="text-sm text-muted-foreground">{descricao}</p>
                {isLoading ? (
                  <div className="flex h-[360px] items-center justify-center rounded-md border border-border text-sm text-muted-foreground">
                    Carregando...
                  </div>
                ) : (
                  <RichTextEditor
                    value={textos[campo]}
                    onChange={(html) => setTextos((prev) => ({ ...prev, [campo]: html }))}
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
