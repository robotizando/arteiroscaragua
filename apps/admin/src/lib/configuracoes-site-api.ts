import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ConfiguracaoSite } from '@arteiroscaragua/shared-types';
import { api } from './api';

const QUERY_KEY = ['configuracoes-site'] as const;

export function useConfiguracaoSite() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get<{ configuracao: ConfiguracaoSite }>('/api/configuracoes-site');
      return data.configuracao;
    },
  });
}

export function useUpdateConfiguracaoSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.patch<{ configuracao: ConfiguracaoSite }>('/api/configuracoes-site', formData);
      return data.configuracao;
    },
    onSuccess: (configuracao) => {
      queryClient.setQueryData(QUERY_KEY, configuracao);
    },
  });
}
