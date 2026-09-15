'use client';

import { useEffect, useState } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import { useForm, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { ZodTypeAny } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { getApiErrorMessage } from '@/lib/api';

export interface ChildFieldConfig<Input> {
  name: keyof Input & string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'month' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
  span?: 1 | 2;
}

export interface ChildColumnConfig<Item> {
  key: string;
  label: string;
  render: (item: Item) => React.ReactNode;
  className?: string;
}

interface SimpleChildManagerProps<
  Item extends { id: number },
  CreateInput extends Record<string, unknown>,
  UpdateInput extends Record<string, unknown>,
> {
  arteiroId: number;
  title: string;
  description: string;
  addLabel: string;
  emptyMessage: string;
  items: Item[];
  columns: ChildColumnConfig<Item>[];
  fields: ChildFieldConfig<CreateInput>[];
  createSchema: ZodTypeAny;
  defaultValues: CreateInput;
  toFormValues: (item: Item) => CreateInput;
  useCreate: (arteiroId: number) => UseMutationResult<Item, unknown, CreateInput>;
  useUpdate: (arteiroId: number) => UseMutationResult<Item, unknown, { id: number; input: UpdateInput }>;
  useDelete: (arteiroId: number) => UseMutationResult<void, unknown, number>;
  deleteConfirmLabel: (item: Item) => string;
}

export function SimpleChildManager<
  Item extends { id: number },
  CreateInput extends Record<string, unknown>,
  UpdateInput extends Record<string, unknown>,
>({
  arteiroId,
  title,
  description,
  addLabel,
  emptyMessage,
  items,
  columns,
  fields,
  createSchema,
  defaultValues,
  toFormValues,
  useCreate,
  useUpdate,
  useDelete,
  deleteConfirmLabel,
}: SimpleChildManagerProps<Item, CreateInput, UpdateInput>) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Item | null>(null);

  const createMutation = useCreate(arteiroId);
  const updateMutation = useUpdate(arteiroId);
  const deleteMutation = useDelete(arteiroId);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateInput>({
    resolver: zodResolver(createSchema),
    defaultValues: defaultValues as never,
  });

  useEffect(() => {
    if (dialogOpen) {
      reset((editingItem ? toFormValues(editingItem) : defaultValues) as never);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen, editingItem]);

  function openCreate() {
    setEditingItem(null);
    setDialogOpen(true);
  }

  function openEdit(item: Item) {
    setEditingItem(item);
    setDialogOpen(true);
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, input: values as unknown as UpdateInput });
        toast.success('Registro atualizado com sucesso');
      } else {
        await createMutation.mutateAsync(values);
        toast.success('Registro adicionado com sucesso');
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível salvar'));
    }
  });

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      toast.success('Registro removido');
      setPendingDelete(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível remover'));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {addLabel}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.label}
              </TableHead>
            ))}
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
          {items.map((item) => (
            <TableRow key={item.id}>
              {columns.map((column) => (
                <TableCell key={column.key} className={column.className}>
                  {column.render(item)}
                </TableCell>
              ))}
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setPendingDelete(item)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar registro' : addLabel}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {fields.map((field) => {
                const name = field.name as Path<CreateInput>;
                return (
                  <div key={field.name} className={field.span === 1 ? '' : 'col-span-2 space-y-2'}>
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>{field.label}</Label>
                      {field.type === 'textarea' && (
                        <Textarea id={field.name} placeholder={field.placeholder} {...register(name)} />
                      )}
                      {field.type === 'select' && (
                        <Select
                          value={watch(name) as string}
                          onValueChange={(value) => setValue(name, value as never)}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {(field.type === 'text' || field.type === 'number' || field.type === 'month') && (
                        <Input
                          id={field.name}
                          type={field.type === 'number' ? 'number' : field.type === 'month' ? 'month' : 'text'}
                          placeholder={field.placeholder}
                          {...register(name)}
                        />
                      )}
                      {errors[field.name] && (
                        <p className="text-sm text-destructive">{String(errors[field.name]?.message)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover registro</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? deleteConfirmLabel(pendingDelete) : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
