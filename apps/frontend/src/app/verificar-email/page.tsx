import type { Metadata } from 'next';
import { VerificarEmailView } from '@/components/conta/verificar-email-view';
import { primeiroParam } from '@/lib/utils';

export const metadata: Metadata = { title: 'Confirmar e-mail', robots: { index: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function VerificarEmailPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <VerificarEmailView token={primeiroParam(params.token)} />;
}
