'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';
import type { AdminUser } from '@arteiroscaragua/shared-types';
import { api, clearStoredToken, getStoredToken, setStoredToken } from './api';

interface AuthContextValue {
  admin: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchMe(): Promise<AdminUser> {
  const { data } = await api.get<{ admin: AdminUser }>('/api/auth/me');
  return data.admin;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState(false);
  // Sessão só é lida do sessionStorage após montar no client — até lá não
  // sabemos se há token, então não podemos decidir "não autenticado".
  const [checkedToken, setCheckedToken] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(getStoredToken()));
    setCheckedToken(true);
  }, []);

  const { data: admin, isLoading: isFetchingMe } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
    enabled: hasToken,
    retry: false,
  });

  const logout = useCallback(() => {
    clearStoredToken();
    queryClient.removeQueries({ queryKey: ['auth', 'me'] });
    setHasToken(false);
    router.replace('/login');
  }, [queryClient, router]);

  const setToken = useCallback(
    (token: string) => {
      setStoredToken(token);
      setHasToken(true);
    },
    [],
  );

  // Agenda o logout automático quando o JWT (sessão de 10 min) expirar.
  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    try {
      const { exp } = jwtDecode<{ exp: number }>(token);
      const msUntilExpiry = exp * 1000 - Date.now();

      if (msUntilExpiry <= 0) {
        logout();
        return;
      }

      const timer = setTimeout(() => {
        toast.error('Sua sessão expirou. Faça login novamente.');
        logout();
      }, msUntilExpiry);

      return () => clearTimeout(timer);
    } catch {
      logout();
    }
  }, [hasToken, logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      admin: admin ?? null,
      isLoading: !checkedToken || (hasToken && isFetchingMe),
      isAuthenticated: checkedToken && hasToken && Boolean(admin),
      setToken,
      logout,
    }),
    [admin, checkedToken, hasToken, isFetchingMe, setToken, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth deve ser usado dentro de AuthProvider');
  }
  return ctx;
}
