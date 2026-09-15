'use client';

import { useState } from 'react';
import Link from 'next/link';
import { History, MoreHorizontal, Pencil, Power, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Usuario } from '@arteiroscaragua/shared-types';
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
import { useDeleteUsuario, useUpdateUsuario } from '@/lib/usuarios-api';
import { getApiErrorMessage } from '@/lib/api';

interface UsuariosTableProps {
  items: Usuario[];
  isLoading: boolean;
  onEdit: (usuario: Usuario) => void;
}

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString('pt-BR') : '—';
}

export function UsuariosTable({ items, isLoading, onEdit }: UsuariosTableProps) {
  const [pendingDelete, setPendingDelete] = useState<Usuario | null>(null);
  const updateMutation = useUpdateUsuario();
  const deleteMutation = useDeleteUsuario();

  async function handleToggleEstado(usuario: Usuario) {
    const nextEstado = usuario.estado === 'ativo' ? 'bloqueado' : 'ativo';
    try {
      await updateMutation.mutateAsync({ id: usuario.id, input: { estado: nextEstado } });
      toast.success(nextEstado === 'ativo' ? 'Usuário ativado' : 'Usuário bloqueado');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível alterar o estado'));
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      toast.success('Usuário excluído');
      setPendingDelete(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível excluir o usuário'));
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Perfil de arteiro</TableHead>
            <TableHead>Marcações</TableHead>
            <TableHead>Acesso</TableHead>
            <TableHead>Último login</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                Carregando...
              </TableCell>
            </TableRow>
          )}

          {!isLoading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                Nenhum usuário encontrado.
              </TableCell>
            </TableRow>
          )}

          {items.map((usuario) => (
            <TableRow key={usuario.id}>
              <TableCell className="font-medium">{usuario.nome}</TableCell>
              <TableCell>{usuario.email}</TableCell>
              <TableCell>
                {usuario.arteiros.length
                  ? usuario.arteiros.map((arteiro) => (
                      <Link
                        key={arteiro.id}
                        href={`/dashboard/arteiros/${arteiro.id}`}
                        className="block text-primary hover:underline"
                      >
                        {arteiro.nome}
                      </Link>
                    ))
                  : '—'}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {usuario.moderador && <Badge variant="outline">Moderador</Badge>}
                  {usuario.arteiroVerificado && <Badge variant="success">Artesão verificado</Badge>}
                  {!usuario.moderador && !usuario.arteiroVerificado && '—'}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {usuario.googleVinculado && <Badge variant="outline">Google</Badge>}
                  {usuario.possuiSenha && <Badge variant="outline">Senha</Badge>}
                  <Badge variant={usuario.emailVerificadoEm ? 'success' : 'secondary'}>
                    {usuario.emailVerificadoEm ? 'E-mail verificado' : 'E-mail não verificado'}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDateTime(usuario.ultimoLoginEm)}</TableCell>
              <TableCell>
                <Badge variant={usuario.estado === 'ativo' ? 'success' : 'destructive'}>
                  {usuario.estado === 'ativo' ? 'Ativo' : 'Bloqueado'}
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
                    <DropdownMenuItem onSelect={() => onEdit(usuario)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleToggleEstado(usuario)}>
                      <Power className="mr-2 h-4 w-4" />
                      {usuario.estado === 'ativo' ? 'Bloquear' : 'Ativar'}
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/acessos?usuarioId=${usuario.id}`}>
                        <History className="mr-2 h-4 w-4" />
                        Ver acessos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => setPendingDelete(usuario)}
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
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{pendingDelete?.nome}</strong>? O acesso será revogado. O perfil
              de arteiro vinculado não é excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
