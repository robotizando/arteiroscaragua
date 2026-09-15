'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import type { ArteiroStatus } from '@arteiroscaragua/shared-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArteirosTable } from '@/components/arteiros/arteiros-table';
import { useArteiros } from '@/lib/arteiros-api';

export default function ArteirosPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState<ArteiroStatus | 'todos'>('todos');

  const query = useMemo(
    () => ({
      search: search || undefined,
      estado: estado === 'todos' ? undefined : estado,
      pageSize: 200,
    }),
    [search, estado],
  );

  const { data, isLoading } = useArteiros(query);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Arteiros</h1>
          <p className="text-muted-foreground">Cadastro dos artesãos, com peças, prêmios, cursos e demais informações.</p>
        </div>
        <Button onClick={() => router.push('/dashboard/arteiros/novo')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo arteiro
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-3 space-y-0">
          <CardTitle className="mr-auto text-base">Arteiros cadastrados</CardTitle>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, grupo ou SICAB"
              className="w-64 pl-8"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={estado} onValueChange={(value) => setEstado(value as ArteiroStatus | 'todos')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os estados</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <ArteirosTable items={data?.items ?? []} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
