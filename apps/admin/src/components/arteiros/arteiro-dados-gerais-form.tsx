'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import {
  ARTEIRO_LOGOTIPO_MAX_BYTES,
  ARTEIRO_LOGOTIPO_MIME_TYPES,
  createArteiroSchema,
  type ArteiroSummary,
  type CreateArteiroInput,
} from '@arteiroscaragua/shared-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { API_BASE_URL, getApiErrorMessage } from '@/lib/api';
import { useCreateArteiro, useUpdateArteiroWithLogotipo } from '@/lib/arteiros-api';

const emptyValues: CreateArteiroInput = {
  nome: '',
  telefone: undefined,
  sicab: undefined,
  grupo: undefined,
  arroba: undefined,
  redesSociais: undefined,
  biografia: undefined,
  estado: 'ativo',
};

export function ArteiroDadosGeraisForm({ arteiro }: { arteiro?: ArteiroSummary }) {
  const router = useRouter();
  const isEditing = Boolean(arteiro);
  const createMutation = useCreateArteiro();
  const updateMutation = useUpdateArteiroWithLogotipo(arteiro?.id ?? 0);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logotipoFile, setLogotipoFile] = useState<File | null>(null);
  const [logotipoPreview, setLogotipoPreview] = useState<string | null>(
    arteiro?.logotipoUrl ? `${API_BASE_URL}${arteiro.logotipoUrl}` : null,
  );
  const [removeLogotipo, setRemoveLogotipo] = useState(false);
  const [logotipoError, setLogotipoError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateArteiroInput>({
    resolver: zodResolver(createArteiroSchema),
    defaultValues: arteiro
      ? {
          nome: arteiro.nome,
          telefone: arteiro.telefone ?? undefined,
          sicab: arteiro.sicab ?? undefined,
          grupo: arteiro.grupo ?? undefined,
          arroba: arteiro.arroba ?? undefined,
          redesSociais: arteiro.redesSociais ?? undefined,
          biografia: arteiro.biografia ?? undefined,
          estado: arteiro.estado,
        }
      : emptyValues,
  });

  useEffect(() => {
    return () => {
      if (logotipoFile && logotipoPreview) {
        URL.revokeObjectURL(logotipoPreview);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logotipoFile]);

  const estado = watch('estado');

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!(ARTEIRO_LOGOTIPO_MIME_TYPES as readonly string[]).includes(file.type)) {
      setLogotipoError('Formato de imagem não suportado (use JPG, PNG, WEBP ou GIF)');
      return;
    }
    if (file.size > ARTEIRO_LOGOTIPO_MAX_BYTES) {
      setLogotipoError('Imagem muito grande (máximo 2MB)');
      return;
    }

    setLogotipoError(null);
    setLogotipoFile(file);
    setLogotipoPreview(URL.createObjectURL(file));
    setRemoveLogotipo(false);
  }

  function handleRemoveLogotipo() {
    setLogotipoFile(null);
    setLogotipoPreview(null);
    setRemoveLogotipo(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const onSubmit = handleSubmit(async (values) => {
    const formData = new FormData();
    formData.append('nome', values.nome);
    formData.append('estado', values.estado);
    if (values.telefone) formData.append('telefone', values.telefone);
    if (values.sicab) formData.append('sicab', values.sicab);
    if (values.grupo) formData.append('grupo', values.grupo);
    if (values.arroba) formData.append('arroba', values.arroba);
    if (values.redesSociais) formData.append('redesSociais', values.redesSociais);
    if (values.biografia) formData.append('biografia', values.biografia);
    if (logotipoFile) formData.append('logotipo', logotipoFile);
    if (isEditing && removeLogotipo) formData.append('removeLogotipo', 'true');

    try {
      if (isEditing && arteiro) {
        await updateMutation.mutateAsync(formData);
        toast.success('Dados atualizados com sucesso');
      } else {
        const created = await createMutation.mutateAsync(formData);
        toast.success('Arteiro cadastrado com sucesso');
        router.push(`/dashboard/arteiros/${created.id}`);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível salvar os dados'));
    }
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" placeholder="Nome do artesão" {...register('nome')} />
              {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone (WhatsApp)</Label>
              <Input id="telefone" placeholder="(12) 99999-9999" {...register('telefone')} />
              {errors.telefone && <p className="text-sm text-destructive">{errors.telefone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sicab">Cadastro SICAB</Label>
              <Input id="sicab" placeholder="Número do SICAB" {...register('sicab')} />
              {errors.sicab && <p className="text-sm text-destructive">{errors.sicab.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="grupo">Grupo</Label>
              <Input id="grupo" placeholder="Grupo/coletivo ao qual pertence" {...register('grupo')} />
              {errors.grupo && <p className="text-sm text-destructive">{errors.grupo.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="arroba">Arroba (redes sociais)</Label>
              <Input id="arroba" placeholder="@artesao" {...register('arroba')} />
              {errors.arroba && <p className="text-sm text-destructive">{errors.arroba.message}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="redesSociais">Links de redes sociais</Label>
              <Textarea
                id="redesSociais"
                placeholder="Um link por linha (Instagram, Facebook, site, etc.)"
                {...register('redesSociais')}
              />
              {errors.redesSociais && <p className="text-sm text-destructive">{errors.redesSociais.message}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="biografia">Biografia</Label>
              <Textarea id="biografia" rows={5} placeholder="Conte a história deste artesão" {...register('biografia')} />
              {errors.biografia && <p className="text-sm text-destructive">{errors.biografia.message}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="logotipo">Logotipo/logomarca</Label>
              <div className="flex items-center gap-3">
                {logotipoPreview && (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logotipoPreview}
                      alt="Pré-visualização do logotipo"
                      className="h-16 w-16 rounded-md border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogotipo}
                      className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                      aria-label="Remover logotipo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <Input
                  id="logotipo"
                  ref={fileInputRef}
                  type="file"
                  accept={(ARTEIRO_LOGOTIPO_MIME_TYPES as readonly string[]).join(',')}
                  onChange={handleFileChange}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">JPG, PNG, WEBP ou GIF · máximo 2MB</p>
              {logotipoError && <p className="text-sm text-destructive">{logotipoError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select value={estado} onValueChange={(value) => setValue('estado', value as 'ativo' | 'inativo')}>
                <SelectTrigger id="estado">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Cadastrar artesão'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
