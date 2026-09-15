'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  ARTEIRO_PECA_IMAGEM_MIME_TYPES,
  ARTEIRO_PECA_MAX_IMAGENS,
  createArteiroPecaSchema,
  type ArteiroPeca,
  type CreateArteiroPecaInput,
} from '@arteiroscaragua/shared-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { API_BASE_URL, getApiErrorMessage } from '@/lib/api';
import { useCreatePeca, useDeletePeca, useDeletePecaImagem, useUpdatePeca } from '@/lib/arteiros-api';
import { useMateriais } from '@/lib/materiais-api';

const emptyValues: CreateArteiroPecaInput = { nome: '', valorSugerido: undefined, descricao: '' };

function formatMoeda(value: number | null) {
  if (value === null) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function PecasManager({ arteiroId, pecas }: { arteiroId: number; pecas: ArteiroPeca[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  // Guarda só o id: a peça é derivada da lista atual, para que remoções de imagem
  // feitas com o diálogo aberto reflitam imediatamente os dados recarregados.
  const [editingPecaId, setEditingPecaId] = useState<number | null>(null);
  const editingPeca = pecas.find((peca) => peca.id === editingPecaId) ?? null;
  const [pendingDelete, setPendingDelete] = useState<ArteiroPeca | null>(null);
  const [novasImagens, setNovasImagens] = useState<File[]>([]);
  const [materialIds, setMaterialIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: materiaisData } = useMateriais({ estado: 'ativo', pageSize: 200 });
  // Nomes dos materiais: os ativos da listagem e os já vinculados à peça (que podem ter sido desativados).
  const nomesMateriais = new Map<string, string>([
    ...(editingPeca?.materiais ?? []).map((material) => [material.id, material.nome] as [string, string]),
    ...(materiaisData?.items ?? []).map((material) => [material.id, material.nome] as [string, string]),
  ]);
  const materiaisDisponiveis = (materiaisData?.items ?? []).filter((material) => !materialIds.includes(material.id));

  const createMutation = useCreatePeca(arteiroId);
  const updateMutation = useUpdatePeca(arteiroId);
  const deleteMutation = useDeletePeca(arteiroId);
  const deleteImagemMutation = useDeletePecaImagem(arteiroId);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateArteiroPecaInput>({
    resolver: zodResolver(createArteiroPecaSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (dialogOpen) {
      reset(
        editingPeca
          ? { nome: editingPeca.nome, valorSugerido: editingPeca.valorSugerido ?? undefined, descricao: editingPeca.descricao }
          : emptyValues,
      );
      setNovasImagens([]);
      setMaterialIds(editingPeca?.materiais.map((material) => material.id) ?? []);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    // Depende do id (e não do objeto) para não apagar o que foi digitado quando a lista é recarregada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen, editingPecaId, reset]);

  function openCreate() {
    setEditingPecaId(null);
    setDialogOpen(true);
  }

  function openEdit(peca: ArteiroPeca) {
    setEditingPecaId(peca.id);
    setDialogOpen(true);
  }

  function handleFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const limite = ARTEIRO_PECA_MAX_IMAGENS - (editingPeca?.imagens.length ?? 0);
    const validos = files.filter((file) => (ARTEIRO_PECA_IMAGEM_MIME_TYPES as readonly string[]).includes(file.type));
    if (validos.length < files.length) {
      toast.error('Alguns arquivos foram ignorados por formato inválido');
    }
    setNovasImagens(validos.slice(0, Math.max(limite, 0)));
  }

  const onSubmit = handleSubmit(async (values) => {
    const formData = new FormData();
    formData.append('nome', values.nome);
    formData.append('descricao', values.descricao);
    if (values.valorSugerido !== undefined) formData.append('valorSugerido', String(values.valorSugerido));
    // Vai como JSON para que a lista vazia também seja enviada (remove todos os materiais).
    formData.append('materialIds', JSON.stringify(materialIds));
    novasImagens.forEach((file) => formData.append('imagens', file));

    try {
      if (editingPeca) {
        await updateMutation.mutateAsync({ pecaId: editingPeca.id, formData });
        toast.success('Peça atualizada com sucesso');
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('Peça cadastrada com sucesso');
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível salvar a peça'));
    }
  });

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      toast.success('Peça removida');
      setPendingDelete(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível remover a peça'));
    }
  }

  async function handleRemoveImagemExistente(pecaId: number, imagemId: number) {
    try {
      await deleteImagemMutation.mutateAsync({ pecaId, imagemId });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível remover a imagem'));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Peças artesanais</h3>
          <p className="text-sm text-muted-foreground">Peças produzidas pelo artesão, com fotos e valor sugerido.</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova peça
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16" />
            <TableHead>Nome</TableHead>
            <TableHead>Valor sugerido</TableHead>
            <TableHead>Materiais</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {pecas.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Nenhuma peça cadastrada.
              </TableCell>
            </TableRow>
          )}
          {pecas.map((peca) => (
            <TableRow key={peca.id}>
              <TableCell>
                {peca.imagens[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${API_BASE_URL}${peca.imagens[0].url}`}
                    alt={peca.nome}
                    className="h-10 w-10 rounded-md border border-border object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-md border border-dashed border-border" />
                )}
              </TableCell>
              <TableCell className="font-medium">{peca.nome}</TableCell>
              <TableCell className="text-muted-foreground">{formatMoeda(peca.valorSugerido)}</TableCell>
              <TableCell className="max-w-[12rem] truncate text-muted-foreground" title={peca.materiais.map((m) => m.nome).join(', ')}>
                {peca.materiais.length ? peca.materiais.map((material) => material.nome).join(', ') : '—'}
              </TableCell>
              <TableCell className="max-w-xs truncate" title={peca.descricao}>
                {peca.descricao}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(peca)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setPendingDelete(peca)}>
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
            <DialogTitle>{editingPeca ? 'Editar peça' : 'Nova peça'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" {...register('nome')} />
              {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorSugerido">Valor de mercado sugerido (R$)</Label>
              <Input id="valorSugerido" type="number" step="0.01" min={0} {...register('valorSugerido')} />
              {errors.valorSugerido && <p className="text-sm text-destructive">{errors.valorSugerido.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" {...register('descricao')} />
              {errors.descricao && <p className="text-sm text-destructive">{errors.descricao.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Materiais</Label>
              {/* value fixo em "": o select só adiciona; a remoção é feita nos chips abaixo. */}
              <Select
                value=""
                onValueChange={(id) => setMaterialIds((atual) => (atual.includes(id) ? atual : [...atual, id]))}
                disabled={materiaisDisponiveis.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      materiaisDisponiveis.length ? 'Adicionar material...' : 'Nenhum outro material disponível'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {materiaisDisponiveis.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {materialIds.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {materialIds.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-full bg-secondary py-1 pl-2.5 pr-1 text-xs font-medium"
                    >
                      {nomesMateriais.get(id) ?? 'Material'}
                      <button
                        type="button"
                        onClick={() => setMaterialIds((atual) => atual.filter((item) => item !== id))}
                        className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-muted-foreground/20"
                        aria-label={`Remover ${nomesMateriais.get(id) ?? 'material'}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum material selecionado.</p>
              )}
            </div>

            {editingPeca && editingPeca.imagens.length > 0 && (
              <div className="space-y-2">
                <Label>Imagens cadastradas</Label>
                <div className="flex flex-wrap gap-2">
                  {editingPeca.imagens.map((imagem) => (
                    <div key={imagem.id} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${API_BASE_URL}${imagem.url}`}
                        alt=""
                        className="h-16 w-16 rounded-md border border-border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImagemExistente(editingPeca.id, imagem.id)}
                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                        aria-label="Remover imagem"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="imagens">Adicionar imagens</Label>
              <Input
                id="imagens"
                ref={fileInputRef}
                type="file"
                multiple
                accept={(ARTEIRO_PECA_IMAGEM_MIME_TYPES as readonly string[]).join(',')}
                onChange={handleFilesChange}
              />
              <p className="text-xs text-muted-foreground">
                Até {ARTEIRO_PECA_MAX_IMAGENS} imagens no total · JPG, PNG, WEBP ou GIF
              </p>
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
            <AlertDialogTitle>Remover peça</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{pendingDelete?.nome}</strong>? Esta ação não pode ser desfeita.
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
