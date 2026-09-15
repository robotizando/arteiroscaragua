'use client';

import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import type { Usuario, UsuarioPapel, UsuarioStatus } from '@arteiroscaragua/shared-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UsuariosTable } from '@/components/usuarios/usuarios-table';
import { UsuarioFormDialog } from '@/components/usuarios/usuario-form-dialog';
import { useUsuarios } from '@/lib/usuarios-api';

export default function UsuariosPage() {
  const [search, setSearch] = useState('');
  const [papel, setPapel] = useState<UsuarioPapel | 'todos'>('todos');
  const [estado, setEstado] = useState<UsuarioStatus | 'todos'>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);

  const query = useMemo(
    () => ({
      search: search || undefined,
      papel: papel === 'todos' ? undefined : papel,
      estado: estado === 'todos' ? undefined : estado,
      pageSize: 100,
    }),
    [search, papel, estado],
  );

  const { data, isLoading } = useUsuarios(query);

  function handleCreate() {
    setEditingUsuario(null);
    setDialogOpen(true);
  }

  function handleEdit(usuario: Usuario) {
    setEditingUsuario(usuario);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            Usuários do site (arteiros e moderadores). São independentes dos usuários da Admin.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo usuário
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-3 space-y-0">
          <CardTitle className="mr-auto text-base">Usuários cadastrados</CardTitle>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail"
              className="w-64 pl-8"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={papel} onValueChange={(value) => setPapel(value as UsuarioPapel | 'todos')}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Papel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os usuários</SelectItem>
              <SelectItem value="arteiro">Com perfil de arteiro</SelectItem>
              <SelectItem value="arteiro_verificado">Artesão verificado</SelectItem>
              <SelectItem value="moderador">Moderadores</SelectItem>
            </SelectContent>
          </Select>
          <Select value={estado} onValueChange={(value) => setEstado(value as UsuarioStatus | 'todos')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os estados</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="bloqueado">Bloqueado</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <UsuariosTable items={data?.items ?? []} isLoading={isLoading} onEdit={handleEdit} />
        </CardContent>
      </Card>

      <UsuarioFormDialog open={dialogOpen} onOpenChange={setDialogOpen} usuario={editingUsuario} />
    </div>
  );
}
