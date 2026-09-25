import type { Metadata } from 'next';
import { RequerLogin } from '@/components/conta/requer-login';
import { PerfilView } from '@/components/perfil/perfil-view';

export const metadata: Metadata = {
  title: 'Meu perfil',
  robots: { index: false, follow: false },
};

export default function PerfilPage() {
  return (
    <div className="container py-8 lg:py-12">
      <h1 className="text-[26px] font-extrabold leading-[1.05] tracking-tight lg:text-[40px]">Meu perfil</h1>
      <div className="mt-6 lg:mt-8">
        <RequerLogin>
          <PerfilView />
        </RequerLogin>
      </div>
    </div>
  );
}
