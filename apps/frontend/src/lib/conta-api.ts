'use client';

import { useCallback } from 'react';
import { contaRequest } from './api';
import { useAuth } from './auth-context';

type Opcoes = Omit<Parameters<typeof contaRequest>[1] & object, 'token'>;

// Chamadas à API de conta já com o token da sessão, para as telas da área logada.
export function useContaApi() {
  const { token } = useAuth();
  return useCallback(
    <T,>(path: string, options: Opcoes = {}) => contaRequest<T>(path, { ...options, token }),
    [token],
  );
}
