'use client';

import { useState } from 'react';
import { MoreHorizontal, Pencil, Power, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AdminUser } from '@arteiroscaragua/shared-types';
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
import { useDeleteAdminUser, useUpdateAdminUser } from '@/lib/admin-users-api';
import { getApiErrorMessage } from '@/lib/api';

interface AdminUsersTableProps {
  items: AdminUser[];
  isLoading: boolean;
  onEdit: (adminUser: AdminUser) => void;
}

export function AdminUsersTable({ items, isLoading, onEdit }: AdminUsersTableProps) {
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);
  const updateMutation = useUpdateAdminUser();
  const deleteMutation = useDeleteAdminUser();

  async function handleToggleEstado(adminUser: AdminUser) {
    const nextEstado = adminUser.estado === 'ativo' ? 'desativado' : 'ativo';
    try {
      await updateMutation.mutateAsync({ id: adminUser.id, input: { estado: nextEstado } });
      toast.success(nextEstado === 'ativo' ? 'Administrador ativado' : 'Administrador desativado');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível alterar o estado'));
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      toast.success('Administrador excluído');
      setPendingDelete(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível excluir o administrador'));
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Carregando...
              </TableCell>
            </TableRow>
          )}

          {!isLoading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Nenhum administrador encontrado.
              </TableCell>
            </TableRow>
          )}

          {items.map((adminUser) => (
            <TableRow key={adminUser.id}>
              <TableCell className="font-medium">{adminUser.nome}</TableCell>
              <TableCell>{adminUser.email}</TableCell>
              <TableCell>{adminUser.telefone || '—'}</TableCell>
              <TableCell>
                <Badge variant={adminUser.estado === 'ativo' ? 'success' : 'secondary'}>
                  {adminUser.estado === 'ativo' ? 'Ativo' : 'Desativado'}
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
                    <DropdownMenuItem onSelect={() => onEdit(adminUser)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleToggleEstado(adminUser)}>
                      <Power className="mr-2 h-4 w-4" />
                      {adminUser.estado === 'ativo' ? 'Desativar' : 'Ativar'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => setPendingDelete(adminUser)}
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
            <AlertDialogTitle>Excluir administrador</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{pendingDelete?.nome}</strong>? Esta ação não pode ser
              desfeita e o acesso à Admin será revogado imediatamente.
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
