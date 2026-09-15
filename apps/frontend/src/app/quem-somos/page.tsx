import type { Metadata } from 'next';
import { TextoInstitucional } from '@/components/texto-institucional';

export const metadata: Metadata = { title: 'Quem somos' };

export default function QuemSomosPage() {
  return <TextoInstitucional titulo="Quem somos" campo="quemSomos" />;
}
