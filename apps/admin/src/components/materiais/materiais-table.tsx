'use client';

import { useState } from 'react';
import { MoreHorizontal, Pencil, Power, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Material } from '@arteiroscaragua/shared-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteMaterial, useUpdateMaterial } from '@/lib/materiais-api';
import { API_BASE_URL, getApiErrorMessage } from '@/lib/api';

interface MateriaisTableProps {
  items: Material[];
  isLoading: boolean;
  onEdit: (material: Material) => void;
}

export function MateriaisTable({ items, isLoading, onEdit }: MateriaisTableProps) {
  const [pendingDelete, setPendingDelete] = useState<Material | null>(null);
  const updateMutation = useUpdateMaterial();
  const deleteMutation = useDeleteMaterial();

  async function handleToggleEstado(material: Material) {
    const nextEstado = material.estado === 'ativo' ? 'desativado' : 'ativo';
    try {
      await updateMutation.mutateAsync({ id: material.id, input: { estado: nextEstado } });
      toast.success(nextEstado === 'ativo' ? 'Material ativado' : 'Material desativado');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível alterar o estado'));
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      toast.success('Material excluído');
      setPendingDelete(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível excluir o material'));
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14" />
            <TableHead className="w-16">Ordem</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Carregando...
              </TableCell>
            </TableRow>
          )}

          {!isLoading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Nenhum material encontrado.
              </TableCell>
            </TableRow>
          )}

          {items.map((material) => (
            <TableRow key={material.id}>
              <TableCell>
                {material.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${API_BASE_URL}${material.thumbnailUrl}`}
                    alt={material.nome}
                    className="h-10 w-10 rounded-md border border-border object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-md border border-dashed border-border" />
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{material.ordem}</TableCell>
              <TableCell className="font-medium">{material.nome}</TableCell>
              <TableCell className="text-muted-foreground">{material.slug}</TableCell>
              <TableCell className="max-w-xs truncate" title={material.descricao}>
                {material.descricao}
              </TableCell>
              <TableCell>
                <Badge variant={material.estado === 'ativo' ? 'success' : 'secondary'}>
                  {material.estado === 'ativo' ? 'Ativo' : 'Desativado'}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onEdit(material)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleToggleEstado(material)}>
                      <Power className="mr-2 h-4 w-4" />
                      {material.estado === 'ativo' ? 'Desativar' : 'Ativar'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => setPendingDelete(material)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir material</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{pendingDelete?.nome}</strong>? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
