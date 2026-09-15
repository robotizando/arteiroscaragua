'use client';

import { ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAuth } from '@/lib/auth-context';

export default function DashboardHomePage() {
  const { admin } = useAdminAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Olá, {admin?.nome?.split(' ')[0]}</h1>
        <p className="text-muted-foreground">Bem-vindo ao painel administrativo do Arteiros Caragua.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sua sessão</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Ativa</div>
            <CardDescription>Expira automaticamente após 10 minutos por segurança.</CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
