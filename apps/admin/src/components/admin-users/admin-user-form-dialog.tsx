'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  createAdminUserSchema,
  type AdminUser,
  type CreateAdminUserInput,
} from '@arteiroscaragua/shared-types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateAdminUser, useUpdateAdminUser } from '@/lib/admin-users-api';
import { getApiErrorMessage } from '@/lib/api';

interface AdminUserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminUser?: AdminUser | null;
}

export function AdminUserFormDialog({ open, onOpenChange, adminUser }: AdminUserFormDialogProps) {
  const isEditing = Boolean(adminUser);
  const createMutation = useCreateAdminUser();
  const updateMutation = useUpdateAdminUser();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateAdminUserInput>({
    resolver: zodResolver(createAdminUserSchema),
    defaultValues: { email: '', nome: '', telefone: '', estado: 'ativo' },
  });

  useEffect(() => {
    if (open) {
      reset(
        adminUser
          ? {
              email: adminUser.email,
              nome: adminUser.nome,
              telefone: adminUser.telefone ?? '',
              estado: adminUser.estado,
            }
          : { email: '', nome: '', telefone: '', estado: 'ativo' },
      );
    }
  }, [open, adminUser, reset]);

  const estado = watch('estado');

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEditing && adminUser) {
        await updateMutation.mutateAsync({ id: adminUser.id, input: values });
        toast.success('Administrador atualizado com sucesso');
      } else {
        await createMutation.mutateAsync(values);
        toast.success('Administrador criado com sucesso');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível salvar o administrador'));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar administrador' : 'Novo administrador'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os dados deste usuário administrador.'
              : 'Somente e-mails cadastrados aqui poderão entrar na Admin via Google.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" placeholder="Nome completo" {...register('nome')} />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail (Google)</Label>
            <Input id="email" type="email" placeholder="nome@gmail.com" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" placeholder="(00) 00000-0000" {...register('telefone')} />
            {errors.telefone && <p className="text-sm text-destructive">{errors.telefone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select value={estado} onValueChange={(value) => setValue('estado', value as 'ativo' | 'desativado')}>
              <SelectTrigger id="estado">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="desativado">Desativado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
