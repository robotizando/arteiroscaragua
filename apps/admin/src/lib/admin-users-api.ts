import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AdminUser,
  CreateAdminUserInput,
  ListAdminUsersQuery,
  ListAdminUsersResult,
  UpdateAdminUserInput,
} from '@arteiroscaragua/shared-types';
import { api } from './api';

const QUERY_KEY = ['admin-users'] as const;

export function useAdminUsers(query: ListAdminUsersQuery) {
  return useQuery({
    queryKey: [...QUERY_KEY, query],
    queryFn: async () => {
      const { data } = await api.get<ListAdminUsersResult>('/api/admin-users', { params: query });
      return data;
    },
    placeholderData: (previous) => previous,
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAdminUserInput) => {
      const { data } = await api.post<{ admin: AdminUser }>('/api/admin-users', input);
      return data.admin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateAdminUserInput }) => {
      const { data } = await api.patch<{ admin: AdminUser }>(`/api/admin-users/${id}`, input);
      return data.admin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/admin-users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
