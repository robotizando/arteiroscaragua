'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ArteiroDadosGeraisForm } from '@/components/arteiros/arteiro-dados-gerais-form';

export default function NovoArteiroPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/arteiros"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para arteiros
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Novo arteiro</h1>
        <p className="text-muted-foreground">
          Cadastre os dados gerais do artesão. Peças, prêmios, vídeos e demais informações podem ser adicionados após
          salvar.
        </p>
      </div>

      <ArteiroDadosGeraisForm />
    </div>
  );
}
