'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { FavoritosIdsResponse } from '@arteiroscaragua/shared-types';
import { contaRequest } from './api';
import { useAuth } from './auth-context';

interface FavoritosContextValue {
  // Falso para visitantes: o coração só aparece na área logada.
  disponivel: boolean;
  // Os ids já chegaram do backend (ou não há sessão): a tela de favoritos espera por isso
  // para não mostrar "nenhum favorito" enquanto a lista ainda está vazia.
  carregado: boolean;
  ids: Set<number>;
  ehFavorito: (pecaId: number) => boolean;
  alternar: (pecaId: number) => Promise<void>;
}

const FavoritosContext = createContext<FavoritosContextValue | null>(null);

export function FavoritosProvider({ children }: { children: React.ReactNode }) {
  const { usuario, token } = useAuth();
  const [ids, setIds] = useState<Set<number>>(new Set());
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    if (!usuario || !token) {
      setIds(new Set());
      setCarregado(true);
      return;
    }
    let ativo = true;
    setCarregado(false);
    contaRequest<FavoritosIdsResponse>('/favoritos/ids', { method: 'GET', token })
      .then((data) => {
        if (ativo) setIds(new Set(data.ids));
      })
      .catch(() => undefined)
      .finally(() => {
        if (ativo) setCarregado(true);
      });
    return () => {
      ativo = false;
    };
  }, [usuario, token]);

  const alternar = useCallback(
    async (pecaId: number) => {
      if (!token) return;
      const favoritoAgora = ids.has(pecaId);
      // Troca o coração na hora e desfaz se a chamada falhar.
      const aplicar = (favorito: boolean) =>
        setIds((atual) => {
          const proximo = new Set(atual);
          if (favorito) proximo.add(pecaId);
          else proximo.delete(pecaId);
          return proximo;
        });

      aplicar(!favoritoAgora);
      try {
        await contaRequest(`/favoritos/${pecaId}`, { method: favoritoAgora ? 'DELETE' : 'PUT', token });
      } catch {
        aplicar(favoritoAgora);
      }
    },
    [ids, token],
  );

  const value = useMemo<FavoritosContextValue>(
    () => ({
      disponivel: Boolean(usuario && token),
      carregado,
      ids,
      ehFavorito: (pecaId: number) => ids.has(pecaId),
      alternar,
    }),
    [usuario, token, carregado, ids, alternar],
  );

  return <FavoritosContext.Provider value={value}>{children}</FavoritosContext.Provider>;
}

export function useFavoritos(): FavoritosContextValue {
  const context = useContext(FavoritosContext);
  if (!context) throw new Error('useFavoritos deve ser usado dentro de FavoritosProvider');
  return context;
}
