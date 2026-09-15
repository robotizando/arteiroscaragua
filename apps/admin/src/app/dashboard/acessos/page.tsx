'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import type { AcessoAtor } from '@arteiroscaragua/shared-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAcessos } from '@/lib/acessos-api';

const PAGE_SIZE = 50;

export default function AcessosPage() {
  return (
    <Suspense>
      <AcessosContent />
    </Suspense>
  );
}

function AcessosContent() {
  const searchParams = useSearchParams();
  const usuarioId = searchParams.get('usuarioId') ?? undefined;

  const [email, setEmail] = useState('');
  const [ator, setAtor] = useState<AcessoAtor | 'todos'>('todos');
  const [resultado, setResultado] = useState<'todos' | 'sucesso' | 'falha'>('todos');
  const [page, setPage] = useState(1);

  const query = useMemo(
    () => ({
      usuarioId,
      email: email || undefined,
      ator: ator === 'todos' ? undefined : ator,
      sucesso: resultado === 'todos' ? undefined : resultado === 'sucesso',
      page,
      pageSize: PAGE_SIZE,
    }),
    [usuarioId, email, ator, resultado, page],
  );

  const { data, isLoading } = useAcessos(query);
  const items = data?.items ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Log de acesso</h1>
        <p className="text-muted-foreground">Todos os logins e tentativas de login, da Admin e do site.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-3 space-y-0">
          <CardTitle className="mr-auto text-base">Registros</CardTitle>
          {usuarioId && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/acessos">
                <X className="mr-1 h-4 w-4" />
                Filtrando por usuário
              </Link>
            </Button>
          )}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por e-mail"
              className="w-64 pl-8"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            value={ator}
            onValueChange={(value) => {
              setAtor(value as AcessoAtor | 'todos');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as origens</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="usuario">Usuários do site</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={resultado}
            onValueChange={(value) => {
              setResultado(value as 'todos' | 'sucesso' | 'falha');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Resultado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os resultados</SelectItem>
              <SelectItem value="sucesso">Sucesso</SelectItem>
              <SelectItem value="falha">Falha</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/hora</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>IP</TableHead>
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
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              )}

              {items.map((acesso) => (
                <TableRow key={acesso.id}>
                  <TableCell className="whitespace-nowrap">{new Date(acesso.createdAt).toLocaleString('pt-BR')}</TableCell>
                  <TableCell>{acesso.ator === 'admin' ? 'Admin' : 'Site'}</TableCell>
                  <TableCell>{acesso.metodo === 'google' ? 'Google' : 'E-mail e senha'}</TableCell>
                  <TableCell>{acesso.email ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={acesso.sucesso ? 'success' : 'destructive'}>
                      {acesso.sucesso ? 'Sucesso' : 'Falha'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{acesso.motivo ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground" title={acesso.userAgent ?? undefined}>
                    {acesso.ip ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{data ? `${data.total} registro(s)` : ''}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <span>
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
