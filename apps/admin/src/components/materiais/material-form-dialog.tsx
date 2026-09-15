'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import {
  createMaterialSchema,
  MATERIAL_THUMBNAIL_MAX_BYTES,
  MATERIAL_THUMBNAIL_MIME_TYPES,
  type CreateMaterialInput,
  type Material,
} from '@arteiroscaragua/shared-types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateMaterial, useUpdateMaterialWithThumbnail } from '@/lib/materiais-api';
import { API_BASE_URL, getApiErrorMessage } from '@/lib/api';

interface MaterialFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: Material | null;
}

const emptyValues: CreateMaterialInput = {
  nome: '',
  slug: undefined,
  descricao: '',
  imagemUrl: undefined,
  ordem: 0,
  estado: 'ativo',
};

export function MaterialFormDialog({ open, onOpenChange, material }: MaterialFormDialogProps) {
  const isEditing = Boolean(material);
  const createMutation = useCreateMaterial();
  const updateMutation = useUpdateMaterialWithThumbnail();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [removeThumbnail, setRemoveThumbnail] = useState(false);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateMaterialInput>({
    resolver: zodResolver(createMaterialSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (open) {
      reset(
        material
          ? {
              nome: material.nome,
              slug: material.slug,
              descricao: material.descricao,
              imagemUrl: material.imagemUrl ?? undefined,
              ordem: material.ordem,
              estado: material.estado,
            }
          : emptyValues,
      );
      setThumbnailFile(null);
      setThumbnailPreview(material?.thumbnailUrl ? `${API_BASE_URL}${material.thumbnailUrl}` : null);
      setRemoveThumbnail(false);
      setThumbnailError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open, material, reset]);

  useEffect(() => {
    return () => {
      if (thumbnailFile && thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thumbnailFile]);

  const estado = watch('estado');

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!(MATERIAL_THUMBNAIL_MIME_TYPES as readonly string[]).includes(file.type)) {
      setThumbnailError('Formato de imagem não suportado (use JPG, PNG, WEBP ou GIF)');
      return;
    }
    if (file.size > MATERIAL_THUMBNAIL_MAX_BYTES) {
      setThumbnailError('Imagem muito grande (máximo 2MB)');
      return;
    }

    setThumbnailError(null);
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
    setRemoveThumbnail(false);
  }

  function handleRemoveThumbnail() {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setRemoveThumbnail(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const onSubmit = handleSubmit(async (values) => {
    const formData = new FormData();
    formData.append('nome', values.nome);
    formData.append('descricao', values.descricao);
    formData.append('ordem', String(values.ordem));
    formData.append('estado', values.estado);
    if (values.slug) formData.append('slug', values.slug);
    if (values.imagemUrl) formData.append('imagemUrl', values.imagemUrl);
    if (thumbnailFile) formData.append('thumbnail', thumbnailFile);
    if (isEditing && removeThumbnail) formData.append('removeThumbnail', 'true');

    try {
      if (isEditing && material) {
        await updateMutation.mutateAsync({ id: material.id, formData });
        toast.success('Material atualizado com sucesso');
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('Material criado com sucesso');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível salvar o material'));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar material' : 'Novo material'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os dados deste material.'
              : 'Cadastre um novo material para exibição no site.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" placeholder="Ex: Madeira" {...register('nome')} />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" placeholder="gerado automaticamente se vazio" {...register('slug')} />
            {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input id="descricao" placeholder="Breve descrição do material" {...register('descricao')} />
            {errors.descricao && <p className="text-sm text-destructive">{errors.descricao.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="imagemUrl">Imagem (URL)</Label>
            <Input id="imagemUrl" placeholder="https://..." {...register('imagemUrl')} />
            {errors.imagemUrl && <p className="text-sm text-destructive">{errors.imagemUrl.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail">Thumbnail</Label>
            <div className="flex items-center gap-3">
              {thumbnailPreview && (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbnailPreview}
                    alt="Pré-visualização da thumbnail"
                    className="h-16 w-16 rounded-md border border-border object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveThumbnail}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                    aria-label="Remover thumbnail"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <Input
                id="thumbnail"
                ref={fileInputRef}
                type="file"
                accept={(MATERIAL_THUMBNAIL_MIME_TYPES as readonly string[]).join(',')}
                onChange={handleFileChange}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">JPG, PNG, WEBP ou GIF · máximo 2MB</p>
            {thumbnailError && <p className="text-sm text-destructive">{thumbnailError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ordem">Ordem de exibição</Label>
              <Input id="ordem" type="number" min={0} {...register('ordem', { valueAsNumber: true })} />
              {errors.ordem && <p className="text-sm text-destructive">{errors.ordem.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select value={estado} onValueChange={(value) => setValue('estado', value as 'ativo' | 'desativado')}>
                <SelectTrigger id="estado">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="desativado">Desativado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
