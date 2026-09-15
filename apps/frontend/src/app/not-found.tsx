import Link from 'next/link';
import { buttonClassName } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center py-24 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">404</p>
      <h1 className="mt-3 font-display text-3xl font-medium">Não encontramos esta página</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        A peça ou o perfil pode ter sido removido, ou o endereço está incorreto.
      </p>
      <Link href="/" className={buttonClassName({ className: 'mt-8' })}>
        Voltar para a vitrine
      </Link>
    </div>
  );
}
