'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { ContaPerfilResponse } from '@arteiroscaragua/shared-types';
import { mensagemDeErro } from '@/lib/api';
import { useContaApi } from '@/lib/conta-api';
import { Alert } from '@/components/ui/form';
import { ArteiroPerfil } from './arteiro-perfil';
import { ContaForm } from './conta-form';
import { TornarSeArteiro } from './tornar-se-arteiro';

export function PerfilView() {
  const contaApi = useContaApi();
  const [perfil, setPerfil] = useState<ContaPerfilResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setPerfil(await contaApi<ContaPerfilResponse>('/perfil', { method: 'GET' }));
    } catch (error) {
      setErro(mensagemDeErro(error, 'Não foi possível carregar seu perfil.'));
    }
  }, [contaApi]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (erro) return <Alert tipo="erro">{erro}</Alert>;

  if (!perfil) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Carregando" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <ContaForm usuario={perfil.usuario} />
      {perfil.arteiro ? (
        <ArteiroPerfil arteiro={perfil.arteiro} recarregar={carregar} />
      ) : (
        <TornarSeArteiro onCriado={carregar} />
      )}
    </div>
  );
}
