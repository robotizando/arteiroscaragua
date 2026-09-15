import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buttonClassName } from '@/components/ui/button';

interface PaginacaoProps {
  page: number;
  pageSize: number;
  total: number;
  // Filtros atuais, mantidos nos links.
  params: Record<string, string>;
  // Página e âncora dos links (padrão: vitrine de peças da home).
  basePath?: string;
  ancora?: string;
}

export function Paginacao({ page, pageSize, total, params, basePath = '/', ancora = 'pecas' }: PaginacaoProps) {
  const totalPaginas = Math.ceil(total / pageSize);
  if (totalPaginas <= 1) return null;

  function href(pagina: number) {
    const search = new URLSearchParams(params);
    if (pagina > 1) search.set('pagina', String(pagina));
    const query = search.toString();
    return `${basePath}${query ? `?${query}` : ''}#${ancora}`;
  }

  const desabilitado = buttonClassName({ variant: 'outline', className: 'pointer-events-none opacity-40' });

  return (
    <nav aria-label="Paginação" className="mt-12 flex items-center gap-3">
      {page > 1 ? (
        <Link href={href(page - 1)} className={buttonClassName({ variant: 'outline' })} rel="prev">
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Link>
      ) : (
        <span className={desabilitado} aria-hidden>
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </span>
      )}
      <span className="px-2 text-sm tabular-nums text-muted-foreground">
        Página {page} de {totalPaginas}
      </span>
      {page < totalPaginas ? (
        <Link href={href(page + 1)} className={buttonClassName({ variant: 'outline' })} rel="next">
          Próxima
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={desabilitado} aria-hidden>
          Próxima
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
