'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Loader2 } from 'lucide-react';
import type { FavoritosResponse, PublicoPecaResumo } from '@arteiroscaragua/shared-types';
import { useAuth } from '@/lib/auth-context';
import { useFavoritos } from '@/lib/favoritos-context';
import { contaRequest, mensagemDeErro } from '@/lib/api';
import { Alert } from '@/components/ui/form';
import { buttonClassName } from '@/components/ui/button';
import { PecasGrid } from '@/components/pecas/peca-card';

export function FavoritosLista() {
  const { token } = useAuth();
  // Os ids do contexto mudam quando a pessoa tira um coração aqui mesmo: a lista acompanha.
  const { ids, carregado } = useFavoritos();
  const [pecas, setPecas] = useState<PublicoPecaResumo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!token) return;
    try {
      const { items } = await contaRequest<FavoritosResponse>('/favoritos', { method: 'GET', token });
      setPecas(items);
    } catch (error) {
      setErro(mensagemDeErro(error, 'Não foi possível carregar seus favoritos.'));
    }
  }, [token]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (erro) return <Alert tipo="erro">{erro}</Alert>;

  if (!pecas || !carregado) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Carregando" />
      </div>
    );
  }

  // Some da lista o que foi desfavoritado agora, sem precisar recarregar a página.
  const visiveis = pecas.filter((peca) => ids.has(peca.id));

  if (!visiveis.length) {
    return (
      <div className="border-2 border-dashed border-foreground/30 px-6 py-14 text-center">
        <Heart className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="mt-3 text-lg font-semibold">Você ainda não salvou nenhuma peça.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Toque no coração sobre a foto de uma peça para guardá-la aqui.
        </p>
        <Link href="/" className={buttonClassName({ className: 'mt-6' })}>
          Ver a vitrine
        </Link>
      </div>
    );
  }

  return <PecasGrid pecas={visiveis} />;
}
