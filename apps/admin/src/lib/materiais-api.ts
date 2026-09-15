import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateMaterialInput,
  ListMateriaisQuery,
  ListMateriaisResult,
  Material,
  UpdateMaterialInput,
} from '@arteiroscaragua/shared-types';
import { api } from './api';

const QUERY_KEY = ['materiais'] as const;

export function useMateriais(query: ListMateriaisQuery) {
  return useQuery({
    queryKey: [...QUERY_KEY, query],
    queryFn: async () => {
      const { data } = await api.get<ListMateriaisResult>('/api/materiais', { params: query });
      return data;
    },
    placeholderData: (previous) => previous,
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post<{ material: Material }>('/api/materiais', formData);
      return data.material;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateMaterialInput }) => {
      const { data } = await api.patch<{ material: Material }>(`/api/materiais/${id}`, input);
      return data.material;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateMaterialWithThumbnail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const { data } = await api.patch<{ material: Material }>(`/api/materiais/${id}`, formData);
      return data.material;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/materiais/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
