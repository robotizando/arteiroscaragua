import { useQuery } from '@tanstack/react-query';
import type { ListAcessosQuery, ListAcessosResult } from '@arteiroscaragua/shared-types';
import { api } from './api';

export function useAcessos(query: ListAcessosQuery) {
  return useQuery({
    queryKey: ['acessos', query],
    queryFn: async () => {
      const { data } = await api.get<ListAcessosResult>('/api/acessos', { params: query });
      return data;
    },
    placeholderData: (previous) => previous,
  });
}
