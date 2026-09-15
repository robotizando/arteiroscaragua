'use client';

import { useEffect, useRef, useState } from 'react';
import { ImageIcon, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { API_BASE_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ImagemCampoOptions {
  maxBytes: number;
  mimeTypes: readonly string[];
  // Ex.: "JPG, PNG ou WEBP"
  formatos: string;
}

// Estado de um campo de imagem das configurações: arquivo novo, pré-visualização e remoção.
export function useImagemCampo({ maxBytes, mimeTypes, formatos }: ImagemCampoOptions) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urlAtual, setUrlAtual] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (file && preview) URL.revokeObjectURL(preview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  function reset(url: string | null) {
    setUrlAtual(url);
    setFile(null);
    setPreview(url ? `${API_BASE_URL}${url}` : null);
    setRemove(false);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;

    if (!mimeTypes.includes(selected.type)) {
      setError(`Formato de imagem não suportado (use ${formatos})`);
      return;
    }
    if (selected.size > maxBytes) {
      setError(`Imagem muito grande (máximo ${maxBytes / (1024 * 1024)}MB)`);
      return;
    }

    setError(null);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setRemove(false);
  }

  function handleRemove() {
    setFile(null);
    setPreview(null);
    setRemove(Boolean(urlAtual));
    if (inputRef.current) inputRef.current.value = '';
  }

  return {
    inputRef,
    file,
    preview,
    remove,
    error,
    isDirty: file !== null || remove,
    maxBytes,
    mimeTypes,
    formatos,
    reset,
    handleFileChange,
    handleRemove,
  };
}

type ImagemCampoState = ReturnType<typeof useImagemCampo>;

interface ImagemCampoCardProps {
  campo: ImagemCampoState;
  titulo: string;
  descricao: string;
  isLoading?: boolean;
  previewClassName?: string;
  imageClassName?: string;
}

export function ImagemCampoCard({
  campo,
  titulo,
  descricao,
  isLoading,
  previewClassName,
  imageClassName,
}: ImagemCampoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
        <CardDescription>{descricao}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          className={cn(
            'flex w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted',
            previewClassName,
          )}
        >
          {campo.preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={campo.preview} alt={`Pré-visualização: ${titulo}`} className={cn('h-full w-full', imageClassName)} />
          ) : (
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
              {isLoading ? 'Carregando...' : 'Nenhuma imagem definida'}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={campo.inputRef}
            type="file"
            accept={campo.mimeTypes.join(',')}
            onChange={campo.handleFileChange}
            className="hidden"
          />
          <Button type="button" variant="outline" onClick={() => campo.inputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            {campo.preview ? 'Trocar imagem' : 'Enviar imagem'}
          </Button>
          {campo.preview && (
            <Button type="button" variant="outline" onClick={campo.handleRemove}>
              <Trash2 className="mr-2 h-4 w-4" />
              Remover
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {campo.formatos} · máximo {campo.maxBytes / (1024 * 1024)}MB
          </span>
        </div>
        {campo.error && <p className="text-sm text-destructive">{campo.error}</p>}
      </CardContent>
    </Card>
  );
}
