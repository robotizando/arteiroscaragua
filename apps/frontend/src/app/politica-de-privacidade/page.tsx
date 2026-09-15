import type { Metadata } from 'next';
import { TextoInstitucional } from '@/components/texto-institucional';

export const metadata: Metadata = { title: 'Política de privacidade' };

export default function PoliticaDePrivacidadePage() {
  return <TextoInstitucional titulo="Política de privacidade" campo="politicaPrivacidade" />;
}
