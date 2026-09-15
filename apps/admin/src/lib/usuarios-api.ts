import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateUsuarioInput,
  ListUsuariosQuery,
  ListUsuariosResult,
  SetUsuarioArteirosInput,
  UpdateUsuarioInput,
  Usuario,
} from '@arteiroscaragua/shared-types';
import { api } from './api';

const QUERY_KEY = ['usuarios'] as const;

export function useUsuarios(query: ListUsuariosQuery) {
  return useQuery({
    queryKey: [...QUERY_KEY, query],
    queryFn: async () => {
      const { data } = await api.get<ListUsuariosResult>('/api/usuarios', { params: query });
      return data;
    },
    placeholderData: (previous) => previous,
  });
}

export function useCreateUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateUsuarioInput) => {
      const { data } = await api.post<{ usuario: Usuario }>('/api/usuarios', input);
      return data.usuario;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['arteiros'] });
    },
  });
}

export function useUpdateUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateUsuarioInput }) => {
      const { data } = await api.patch<{ usuario: Usuario }>(`/api/usuarios/${id}`, input);
      return data.usuario;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useSetUsuarioArteiros() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: SetUsuarioArteirosInput }) => {
      const { data } = await api.put<{ usuario: Usuario }>(`/api/usuarios/${id}/arteiros`, input);
      return data.usuario;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/usuarios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
