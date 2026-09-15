'use client';

import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import type { AdminUser, AdminUserStatus } from '@arteiroscaragua/shared-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminUsersTable } from '@/components/admin-users/admin-users-table';
import { AdminUserFormDialog } from '@/components/admin-users/admin-user-form-dialog';
import { useAdminUsers } from '@/lib/admin-users-api';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState<AdminUserStatus | 'todos'>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);

  const query = useMemo(
    () => ({
      search: search || undefined,
      estado: estado === 'todos' ? undefined : estado,
    }),
    [search, estado],
  );

  const { data, isLoading } = useAdminUsers(query);

  function handleCreate() {
    setEditingAdmin(null);
    setDialogOpen(true);
  }

  function handleEdit(adminUser: AdminUser) {
    setEditingAdmin(adminUser);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuários admin</h1>
          <p className="text-muted-foreground">
            Somente e-mails cadastrados aqui podem entrar no painel via Google.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo usuário
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-3 space-y-0">
          <CardTitle className="mr-auto text-base">Administradores</CardTitle>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail"
              className="w-64 pl-8"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={estado} onValueChange={(value) => setEstado(value as AdminUserStatus | 'todos')}>
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
          <AdminUsersTable items={data?.items ?? []} isLoading={isLoading} onEdit={handleEdit} />
        </CardContent>
      </Card>

      <AdminUserFormDialog open={dialogOpen} onOpenChange={setDialogOpen} adminUser={editingAdmin} />
    </div>
  );
}
