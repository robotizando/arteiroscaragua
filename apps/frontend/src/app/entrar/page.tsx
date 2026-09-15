import type { Metadata } from 'next';
import { EntrarForm } from '@/components/conta/entrar-form';
import { primeiroParam } from '@/lib/utils';

export const metadata: Metadata = { title: 'Entrar', robots: { index: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function EntrarPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <EntrarForm erro={primeiroParam(params.erro)} aviso={primeiroParam(params.aviso)} />;
}
