'use client';

import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import type { Material, MaterialStatus } from '@arteiroscaragua/shared-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MateriaisTable } from '@/components/materiais/materiais-table';
import { MaterialFormDialog } from '@/components/materiais/material-form-dialog';
import { useMateriais } from '@/lib/materiais-api';

export default function MateriaisPage() {
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState<MaterialStatus | 'todos'>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const query = useMemo(
    () => ({
      search: search || undefined,
      estado: estado === 'todos' ? undefined : estado,
      pageSize: 200,
    }),
    [search, estado],
  );

  const { data, isLoading } = useMateriais(query);

  function handleCreate() {
    setEditingMaterial(null);
    setDialogOpen(true);
  }

  function handleEdit(material: Material) {
    setEditingMaterial(material);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Materiais</h1>
          <p className="text-muted-foreground">
            Materiais exibidos no site para busca e categorização das peças artesanais.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo material
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-3 space-y-0">
          <CardTitle className="mr-auto text-base">Materiais cadastrados</CardTitle>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou descrição"
              className="w-64 pl-8"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={estado} onValueChange={(value) => setEstado(value as MaterialStatus | 'todos')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os estados</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="desativado">Desativado</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <MateriaisTable items={data?.items ?? []} isLoading={isLoading} onEdit={handleEdit} />
        </CardContent>
      </Card>

      <MaterialFormDialog open={dialogOpen} onOpenChange={setDialogOpen} material={editingMaterial} />
    </div>
  );
}
