'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pencil, Power, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ArteiroSummary } from '@arteiroscaragua/shared-types';
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
import { useDeleteArteiro, useUpdateArteiro } from '@/lib/arteiros-api';
import { API_BASE_URL, getApiErrorMessage } from '@/lib/api';

interface ArteirosTableProps {
  items: ArteiroSummary[];
  isLoading: boolean;
}

export function ArteirosTable({ items, isLoading }: ArteirosTableProps) {
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = useState<ArteiroSummary | null>(null);
  const deleteMutation = useDeleteArteiro();

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      toast.success('Arteiro excluído');
      setPendingDelete(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível excluir o arteiro'));
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14" />
            <TableHead>Nome</TableHead>
            <TableHead>Grupo</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>SICAB</TableHead>
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
                Nenhum arteiro encontrado.
              </TableCell>
            </TableRow>
          )}

          {items.map((arteiro) => (
            <ArteiroRow
              key={arteiro.id}
              arteiro={arteiro}
              onEdit={() => router.push(`/dashboard/arteiros/${arteiro.id}`)}
              onDelete={() => setPendingDelete(arteiro)}
            />
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir arteiro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{pendingDelete?.nome}</strong>? Esta ação não pode ser desfeita.
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

function ArteiroRow({
  arteiro,
  onEdit,
  onDelete,
}: {
  arteiro: ArteiroSummary;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const updateMutation = useUpdateArteiro(arteiro.id);

  async function handleToggleEstado() {
    const nextEstado = arteiro.estado === 'ativo' ? 'inativo' : 'ativo';
    try {
      await updateMutation.mutateAsync({ estado: nextEstado });
      toast.success(nextEstado === 'ativo' ? 'Arteiro ativado' : 'Arteiro desativado');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível alterar o estado'));
    }
  }

  return (
    <TableRow>
      <TableCell>
        {arteiro.logotipoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${API_BASE_URL}${arteiro.logotipoUrl}`}
            alt={arteiro.nome}
            className="h-10 w-10 rounded-md border border-border object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded-md border border-dashed border-border" />
        )}
      </TableCell>
      <TableCell className="font-medium">{arteiro.nome}</TableCell>
      <TableCell className="text-muted-foreground">{arteiro.grupo ?? '—'}</TableCell>
      <TableCell className="text-muted-foreground">{arteiro.telefone ?? '—'}</TableCell>
      <TableCell className="text-muted-foreground">{arteiro.sicab ?? '—'}</TableCell>
      <TableCell>
        <Badge variant={arteiro.estado === 'ativo' ? 'success' : 'secondary'}>
          {arteiro.estado === 'ativo' ? 'Ativo' : 'Inativo'}
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
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleToggleEstado}>
              <Power className="mr-2 h-4 w-4" />
              {arteiro.estado === 'ativo' ? 'Desativar' : 'Ativar'}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
