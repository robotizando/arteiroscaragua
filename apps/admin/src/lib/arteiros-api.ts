import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Arteiro,
  ArteiroCurso,
  ArteiroEvento,
  ArteiroPeca,
  ArteiroPremio,
  ArteiroProjeto,
  ArteiroSummary,
  ArteiroVideo,
  CreateArteiroCursoInput,
  CreateArteiroEventoInput,
  CreateArteiroPremioInput,
  CreateArteiroProjetoInput,
  CreateArteiroVideoInput,
  ListArteirosQuery,
  ListArteirosResult,
  SetArteiroMateriaisInput,
  UpdateArteiroCursoInput,
  UpdateArteiroEventoInput,
  UpdateArteiroInput,
  UpdateArteiroPremioInput,
  UpdateArteiroProjetoInput,
  UpdateArteiroVideoInput,
} from '@arteiroscaragua/shared-types';
import { api } from './api';

const LIST_KEY = ['arteiros'] as const;
const detailKey = (id: number) => ['arteiros', id] as const;

export function useArteiros(query: ListArteirosQuery) {
  return useQuery({
    queryKey: [...LIST_KEY, query],
    queryFn: async () => {
      const { data } = await api.get<ListArteirosResult>('/api/arteiros', { params: query });
      return data;
    },
    placeholderData: (previous) => previous,
  });
}

export function useArteiro(id: number | undefined) {
  return useQuery({
    queryKey: id ? detailKey(id) : ['arteiros', 'novo'],
    queryFn: async () => {
      const { data } = await api.get<{ arteiro: Arteiro }>(`/api/arteiros/${id}`);
      return data.arteiro;
    },
    enabled: Boolean(id),
  });
}

export function useCreateArteiro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post<{ arteiro: ArteiroSummary }>('/api/arteiros', formData);
      return data.arteiro;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

export function useUpdateArteiro(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateArteiroInput) => {
      const { data } = await api.patch<{ arteiro: ArteiroSummary }>(`/api/arteiros/${id}`, input);
      return data.arteiro;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: detailKey(id) });
    },
  });
}

export function useUpdateArteiroWithLogotipo(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.patch<{ arteiro: ArteiroSummary }>(`/api/arteiros/${id}`, formData);
      return data.arteiro;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: detailKey(id) });
    },
  });
}

export function useDeleteArteiro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/arteiros/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

export function useSetArteiroMateriais(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SetArteiroMateriaisInput) => {
      await api.put(`/api/arteiros/${id}/materiais`, input);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: detailKey(id) }),
  });
}

// Peças artesanais (multipart, aceitam envio de imagens junto ao formulário)
export function useCreatePeca(arteiroId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post<{ item: ArteiroPeca }>(`/api/arteiros/${arteiroId}/pecas`, formData);
      return data.item;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: detailKey(arteiroId) }),
  });
}

export function useUpdatePeca(arteiroId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pecaId, formData }: { pecaId: number; formData: FormData }) => {
      const { data } = await api.patch<{ item: ArteiroPeca }>(
        `/api/arteiros/${arteiroId}/pecas/${pecaId}`,
        formData,
      );
      return data.item;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: detailKey(arteiroId) }),
  });
}

export function useDeletePeca(arteiroId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pecaId: number) => {
      await api.delete(`/api/arteiros/${arteiroId}/pecas/${pecaId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: detailKey(arteiroId) }),
  });
}

export function useDeletePecaImagem(arteiroId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pecaId, imagemId }: { pecaId: number; imagemId: number }) => {
      await api.delete(`/api/arteiros/${arteiroId}/pecas/${pecaId}/imagens/${imagemId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: detailKey(arteiroId) }),
  });
}

// Fábrica genérica de hooks para as coleções filhas simples (prêmios, vídeos,
// eventos, cursos, projetos), que compartilham a mesma forma de API REST.
function createChildResourceHooks<Item, CreateInput, UpdateInput>(resource: string) {
  function useCreate(arteiroId: number) {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (input: CreateInput) => {
        const { data } = await api.post<{ item: Item }>(`/api/arteiros/${arteiroId}/${resource}`, input);
        return data.item;
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: detailKey(arteiroId) }),
    });
  }

  function useUpdate(arteiroId: number) {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, input }: { id: number; input: UpdateInput }) => {
        const { data } = await api.patch<{ item: Item }>(`/api/arteiros/${arteiroId}/${resource}/${id}`, input);
        return data.item;
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: detailKey(arteiroId) }),
    });
  }

  function useDelete(arteiroId: number) {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (id: number) => {
        await api.delete(`/api/arteiros/${arteiroId}/${resource}/${id}`);
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: detailKey(arteiroId) }),
    });
  }

  return { useCreate, useUpdate, useDelete };
}

export const premiosApi = createChildResourceHooks<ArteiroPremio, CreateArteiroPremioInput, UpdateArteiroPremioInput>(
  'premios',
);
export const videosApi = createChildResourceHooks<ArteiroVideo, CreateArteiroVideoInput, UpdateArteiroVideoInput>(
  'videos',
);
export const eventosApi = createChildResourceHooks<
  ArteiroEvento,
  CreateArteiroEventoInput,
  UpdateArteiroEventoInput
>('eventos');
export const cursosApi = createChildResourceHooks<ArteiroCurso, CreateArteiroCursoInput, UpdateArteiroCursoInput>(
  'cursos',
);
export const projetosApi = createChildResourceHooks<
  ArteiroProjeto,
  CreateArteiroProjetoInput,
  UpdateArteiroProjetoInput
>('projetos');
