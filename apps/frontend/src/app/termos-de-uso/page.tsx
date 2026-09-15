import type { Metadata } from 'next';
import { TextoInstitucional } from '@/components/texto-institucional';

export const metadata: Metadata = { title: 'Termos de uso' };

export default function TermosDeUsoPage() {
  return <TextoInstitucional titulo="Termos de uso" campo="termosUso" />;
}
