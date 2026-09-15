import type { Metadata } from 'next';
import { RedefinirSenhaForm } from '@/components/conta/redefinir-senha-form';
import { primeiroParam } from '@/lib/utils';

export const metadata: Metadata = { title: 'Criar nova senha', robots: { index: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function RedefinirSenhaPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <RedefinirSenhaForm token={primeiroParam(params.token)} />;
}
