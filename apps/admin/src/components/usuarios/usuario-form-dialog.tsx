'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  USUARIO_STATUSES,
  createUsuarioSchema,
  type Usuario,
  type UsuarioStatus,
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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useArteiros } from '@/lib/arteiros-api';
import { useCreateUsuario, useSetUsuarioArteiros, useUpdateUsuario } from '@/lib/usuarios-api';
import { getApiErrorMessage } from '@/lib/api';

// "novo" = criar um novo perfil de arteiro; "nenhum" = sem vínculo; demais valores = id do arteiro.
const PERFIL_NOVO = 'novo';
const PERFIL_NENHUM = 'nenhum';

const formSchema = createUsuarioSchema.omit({ arteiroId: true, criarPerfilArteiro: true }).extend({
  perfilArteiro: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface UsuarioFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario?: Usuario | null;
}

export function UsuarioFormDialog({ open, onOpenChange, usuario }: UsuarioFormDialogProps) {
  const isEditing = Boolean(usuario);
  const createMutation = useCreateUsuario();
  const updateMutation = useUpdateUsuario();
  const setArteirosMutation = useSetUsuarioArteiros();
  const isSubmitting = createMutation.isPending || updateMutation.isPending || setArteirosMutation.isPending;

  const { data: arteirosData } = useArteiros({ pageSize: 200 });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (open) {
      reset(
        usuario
          ? {
              nome: usuario.nome,
              email: usuario.email,
              moderador: usuario.moderador,
              arteiroVerificado: usuario.arteiroVerificado,
              estado: usuario.estado,
              senha: '',
              emailVerificado: Boolean(usuario.emailVerificadoEm),
              perfilArteiro: usuario.arteiros[0] ? String(usuario.arteiros[0].id) : PERFIL_NENHUM,
            }
          : {
              nome: '',
              email: '',
              moderador: false,
              arteiroVerificado: false,
              estado: 'ativo',
              senha: '',
              emailVerificado: false,
              perfilArteiro: PERFIL_NOVO,
            },
      );
    }
  }, [open, usuario, reset]);

  const estado = watch('estado');
  const emailVerificado = watch('emailVerificado');
  const moderador = watch('moderador');
  const arteiroVerificado = watch('arteiroVerificado');
  const perfilArteiro = watch('perfilArteiro');
  const temPerfilArteiro = perfilArteiro !== PERFIL_NENHUM;

  const onSubmit = handleSubmit(async ({ perfilArteiro: perfil, ...values }) => {
    // Sem perfil de arteiro não há o que verificar.
    const input = { ...values, arteiroVerificado: perfil !== PERFIL_NENHUM && values.arteiroVerificado };
    try {
      if (isEditing && usuario) {
        const vinculoAtual = usuario.arteiros[0] ? String(usuario.arteiros[0].id) : PERFIL_NENHUM;
        const arteiroIds = perfil === PERFIL_NENHUM ? [] : [Number(perfil)];

        // O vínculo é gravado antes: o backend só aceita "perfil verificado" com perfil vinculado.
        if (perfil !== vinculoAtual) {
          await setArteirosMutation.mutateAsync({ id: usuario.id, input: { arteiroIds } });
        }
        await updateMutation.mutateAsync({ id: usuario.id, input });
        toast.success('Usuário atualizado com sucesso');
      } else {
        await createMutation.mutateAsync({
          ...input,
          arteiroId: perfil !== PERFIL_NOVO && perfil !== PERFIL_NENHUM ? Number(perfil) : undefined,
          criarPerfilArteiro: perfil === PERFIL_NOVO,
        });
        toast.success('Usuário criado com sucesso');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível salvar o usuário'));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os dados de acesso deste usuário do site.'
              : 'O usuário pode ter um perfil de arteiro vinculado e, independentemente disso, ser moderador.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" placeholder="Nome completo" {...register('nome')} />
            {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" placeholder="nome@exemplo.com" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select value={estado} onValueChange={(value) => setValue('estado', value as UsuarioStatus)}>
              <SelectTrigger id="estado">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {USUARIO_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item === 'ativo' ? 'Ativo' : 'Bloqueado'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="perfilArteiro">Perfil de arteiro</Label>
            <Select value={perfilArteiro} onValueChange={(value) => setValue('perfilArteiro', value)}>
              <SelectTrigger id="perfilArteiro">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PERFIL_NENHUM}>Sem perfil de arteiro</SelectItem>
                {!isEditing && <SelectItem value={PERFIL_NOVO}>Criar novo perfil com o nome do usuário</SelectItem>}
                {(arteirosData?.items ?? []).map((arteiro) => (
                  <SelectItem key={arteiro.id} value={String(arteiro.id)}>
                    {arteiro.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {temPerfilArteiro && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="arteiroVerificado"
                checked={Boolean(arteiroVerificado)}
                onCheckedChange={(checked) => setValue('arteiroVerificado', checked === true)}
              />
              <Label htmlFor="arteiroVerificado">Perfil de artesão verificado</Label>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              id="moderador"
              checked={Boolean(moderador)}
              onCheckedChange={(checked) => setValue('moderador', checked === true)}
            />
            <Label htmlFor="moderador">Moderador</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha (opcional)</Label>
            <Input
              id="senha"
              type="password"
              autoComplete="new-password"
              placeholder={isEditing ? 'Deixe em branco para manter a atual' : 'Deixe em branco para definir depois'}
              {...register('senha')}
            />
            <p className="text-xs text-muted-foreground">
              Mínimo de 8 caracteres, com letra maiúscula, número e símbolo.
            </p>
            {errors.senha && <p className="text-sm text-destructive">{errors.senha.message}</p>}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="emailVerificado"
              checked={Boolean(emailVerificado)}
              onCheckedChange={(checked) => setValue('emailVerificado', checked === true)}
            />
            <Label htmlFor="emailVerificado">E-mail verificado</Label>
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
