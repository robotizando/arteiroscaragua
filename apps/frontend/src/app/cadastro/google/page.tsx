import type { Metadata } from 'next';
import { CadastroGoogleForm } from '@/components/conta/cadastro-google-form';

export const metadata: Metadata = { title: 'Cadastro com Google', robots: { index: false } };

export default function CadastroGooglePage() {
  return <CadastroGoogleForm />;
}
