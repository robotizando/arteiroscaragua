import type { Metadata } from 'next';
import { RequerLogin } from '@/components/conta/requer-login';
import { FavoritosLista } from '@/components/favoritos/favoritos-lista';

export const metadata: Metadata = {
  title: 'Meus favoritos',
  robots: { index: false, follow: false },
};

export default function FavoritosPage() {
  return (
    <div className="container py-8 lg:py-12">
      <h1 className="text-[26px] font-extrabold leading-[1.05] tracking-tight lg:text-[40px]">Meus favoritos</h1>
      <p className="mt-1 text-sm text-muted-foreground">As peças que você guardou para ver depois.</p>
      <div className="mt-6 lg:mt-8">
        <RequerLogin>
          <FavoritosLista />
        </RequerLogin>
      </div>
    </div>
  );
}
