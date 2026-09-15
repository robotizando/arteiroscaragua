'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ContaMeResponse, ContaSessaoResponse, ContaUsuario } from '@arteiroscaragua/shared-types';
import { ApiError, contaRequest } from './api';

const TOKEN_STORAGE_KEY = 'arteiros_site_token';

function lerToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function gravarToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Armazenamento indisponível (ex.: navegação privada restrita): a sessão dura só esta aba.
  }
}

interface AuthContextValue {
  usuario: ContaUsuario | null;
  token: string | null;
  isLoading: boolean;
  iniciarSessao: (sessao: ContaSessaoResponse) => void;
  // Usado no retorno do Google, quando só o token é conhecido.
  iniciarSessaoComToken: (token: string) => Promise<void>;
  atualizarUsuario: (usuario: ContaUsuario) => void;
  sair: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<ContaUsuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sair = useCallback(() => {
    gravarToken(null);
    setToken(null);
    setUsuario(null);
  }, []);

  const carregarUsuario = useCallback(
    async (novoToken: string) => {
      try {
        const { usuario: me } = await contaRequest<ContaMeResponse>('/me', { method: 'GET', token: novoToken });
        gravarToken(novoToken);
        setToken(novoToken);
        setUsuario(me);
      } catch (error) {
        // Só descarta a sessão se o backend recusou o token; falha de rede mantém para a próxima visita.
        if (error instanceof ApiError && error.status === 401) sair();
        throw error;
      }
    },
    [sair],
  );

  useEffect(() => {
    const salvo = lerToken();
    if (!salvo) {
      setIsLoading(false);
      return;
    }
    carregarUsuario(salvo)
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, [carregarUsuario]);

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      token,
      isLoading,
      iniciarSessao: (sessao) => {
        gravarToken(sessao.token);
        setToken(sessao.token);
        setUsuario(sessao.usuario);
      },
      iniciarSessaoComToken: carregarUsuario,
      atualizarUsuario: setUsuario,
      sair,
    }),
    [usuario, token, isLoading, carregarUsuario, sair],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}
