import type { Metadata } from 'next';
import { CadastroForm } from '@/components/conta/cadastro-form';

export const metadata: Metadata = { title: 'Cadastre-se como Arteiro/Artesão' };

export default function CadastroPage() {
  return <CadastroForm />;
}
