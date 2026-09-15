'use client';

import {
  DESTAQUE_ALTURA_MAX,
  DESTAQUE_ALTURA_MIN,
  DESTAQUE_COR_REGEX,
  DESTAQUE_TEXTO_MAX_CHARS,
  corTextoDestaque,
  type ConfiguracaoSite,
} from '@arteiroscaragua/shared-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Altura como texto para permitir apagar e redigitar o número; validada ao salvar.
export interface DestaqueForm {
  texto: string;
  ativo: boolean;
  cor: string;
  altura: string;
}

export function destaqueDe(configuracao: ConfiguracaoSite): DestaqueForm {
  return {
    texto: configuracao.destaqueTexto,
    ativo: configuracao.destaqueAtivo,
    cor: configuracao.destaqueCor,
    altura: String(configuracao.destaqueAltura),
  };
}

// Campos alterados, já no formato do PATCH (FormData).
export function destaqueAlterado(form: DestaqueForm, configuracao: ConfiguracaoSite): Record<string, string> {
  const original = destaqueDe(configuracao);
  const alterados: Record<string, string> = {};
  if (form.texto !== original.texto) alterados.destaqueTexto = form.texto;
  if (form.ativo !== original.ativo) alterados.destaqueAtivo = String(form.ativo);
  if (form.cor.toUpperCase() !== original.cor.toUpperCase()) alterados.destaqueCor = form.cor;
  if (form.altura !== original.altura) alterados.destaqueAltura = form.altura;
  return alterados;
}

// Cores da paleta do site, como atalho.
const CORES_SUGERIDAS = [
  { cor: '#B5DCA1', nome: 'Mata clara' },
  { cor: '#155C33', nome: 'Mata escura' },
  { cor: '#1F7A8C', nome: 'Mar' },
  { cor: '#E0605F', nome: 'Coral' },
  { cor: '#F9DDBD', nome: 'Areia' },
  { cor: '#1B2A2F', nome: 'Tinta' },
];

export function DestaqueCampoCard({
  form,
  onChange,
  isLoading,
}: {
  form: DestaqueForm;
  onChange: (form: DestaqueForm) => void;
  isLoading?: boolean;
}) {
  const set = (alteracao: Partial<DestaqueForm>) => onChange({ ...form, ...alteracao });
  const corValida = DESTAQUE_COR_REGEX.test(form.cor);
  const altura = Number(form.altura);
  const alturaValida = Number.isInteger(altura) && altura >= DESTAQUE_ALTURA_MIN && altura <= DESTAQUE_ALTURA_MAX;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Barra de destaque</CardTitle>
        <CardDescription>
          Aviso em uma faixa acima do cabeçalho, em todas as páginas do site. As alterações podem levar até 1 minuto
          para aparecer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-2">
          <Checkbox
            id="destaque-ativo"
            checked={form.ativo}
            disabled={isLoading}
            onCheckedChange={(valor) => set({ ativo: valor === true })}
          />
          <Label htmlFor="destaque-ativo">Exibir a barra de destaque no site</Label>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="destaque-texto">Texto</Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {form.texto.length}/{DESTAQUE_TEXTO_MAX_CHARS}
            </span>
          </div>
          <Input
            id="destaque-texto"
            value={form.texto}
            maxLength={DESTAQUE_TEXTO_MAX_CHARS}
            disabled={isLoading}
            placeholder="Fique por dentro das novidades, cadastre-se e receba notificações"
            onChange={(event) => set({ texto: event.target.value })}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="destaque-cor">Cor da barra</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Escolher cor"
                value={corValida ? form.cor : '#000000'}
                disabled={isLoading}
                onChange={(event) => set({ cor: event.target.value.toUpperCase() })}
                className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-background p-1"
              />
              <Input
                id="destaque-cor"
                value={form.cor}
                maxLength={7}
                disabled={isLoading}
                aria-invalid={!corValida}
                onChange={(event) => set({ cor: event.target.value.trim() })}
                className={cn('font-mono uppercase', !corValida && 'border-destructive')}
              />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {CORES_SUGERIDAS.map(({ cor, nome }) => (
                <button
                  key={cor}
                  type="button"
                  title={nome}
                  aria-label={`Usar cor ${nome}`}
                  disabled={isLoading}
                  onClick={() => set({ cor })}
                  className={cn(
                    'h-6 w-6 rounded-sm border border-input',
                    form.cor.toUpperCase() === cor && 'ring-2 ring-ring ring-offset-1',
                  )}
                  style={{ backgroundColor: cor }}
                />
              ))}
            </div>
            {!corValida && <p className="text-xs text-destructive">Use o formato #RRGGBB.</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="destaque-altura">Altura da barra (px)</Label>
            <Input
              id="destaque-altura"
              type="number"
              inputMode="numeric"
              min={DESTAQUE_ALTURA_MIN}
              max={DESTAQUE_ALTURA_MAX}
              step={1}
              value={form.altura}
              disabled={isLoading}
              aria-invalid={!alturaValida}
              onChange={(event) => set({ altura: event.target.value })}
              className={cn('w-32', !alturaValida && 'border-destructive')}
            />
            <p className={cn('text-xs', alturaValida ? 'text-muted-foreground' : 'text-destructive')}>
              Entre {DESTAQUE_ALTURA_MIN} e {DESTAQUE_ALTURA_MAX}px. Textos longos quebram linha e a barra cresce no
              celular.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">Pré-visualização</p>
          <div className="overflow-hidden rounded-md border border-border">
            <div
              className={cn('flex items-center px-4 text-[13px] font-semibold', !form.ativo && 'opacity-40')}
              style={{
                backgroundColor: corValida ? form.cor : undefined,
                color: corTextoDestaque(form.cor),
                minHeight: alturaValida ? altura : DESTAQUE_ALTURA_MIN,
              }}
            >
              {form.texto.trim() || 'Digite o texto do destaque'}
            </div>
            <div className="h-10 bg-[#155C33]" aria-hidden />
          </div>
          {!form.ativo && <p className="text-xs text-muted-foreground">A barra está desativada e não aparece no site.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
