'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const ESPERA_DIGITACAO_MS = 400;

const VARIANTES = {
  // No cabeçalho verde (desktop).
  header: {
    input: 'h-9 border-b-mata-300 text-background placeholder:text-background/60',
    icone: 'text-mata-300',
    placeholder: 'Buscar por peça, arteiro ou descrição',
  },
  // Abaixo do cabeçalho, na vitrine (mobile).
  pagina: {
    input: 'h-11 border-b-foreground/40 text-foreground placeholder:text-muted-foreground',
    icone: 'text-muted-foreground',
    placeholder: 'Buscar peça, arteiro ou descrição',
  },
} as const;

// Busca da vitrine: a fonte da verdade é o ?busca= da URL. Na home, filtra enquanto digita;
// nas outras páginas, leva para a home ao enviar.
export function BuscaPecas({ variante }: { variante: keyof typeof VARIANTES }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const naVitrine = pathname === '/';
  const busca = naVitrine ? (searchParams.get('busca') ?? '') : '';
  const [texto, setTexto] = useState(busca);
  // Última busca enviada pela digitação: evita que a resposta sobrescreva o que ainda está sendo digitado.
  const buscaEnviada = useRef(busca);

  useEffect(() => {
    if (busca !== buscaEnviada.current) {
      buscaEnviada.current = busca;
      setTexto(busca);
    }
  }, [busca]);

  function buscar(valor: string) {
    buscaEnviada.current = valor;
    // Mantém material e arteiro; volta para a primeira página.
    const params = new URLSearchParams(naVitrine ? searchParams.toString() : '');
    params.delete('pagina');
    if (valor) params.set('busca', valor);
    else params.delete('busca');
    const query = params.toString();
    const destino = query ? `/?${query}` : '/';
    if (naVitrine) startTransition(() => router.replace(destino, { scroll: false }));
    else router.push(destino);
  }

  useEffect(() => {
    if (!naVitrine) return;
    const valor = texto.trim();
    if (valor === buscaEnviada.current) return;
    const timer = setTimeout(() => buscar(valor), ESPERA_DIGITACAO_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  const estilo = VARIANTES[variante];

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        buscar(texto.trim());
      }}
    >
      <label className="relative block">
        <span className="sr-only">Buscar peças</span>
        <Search
          className={cn('pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', estilo.icone)}
          strokeWidth={2.2}
          aria-hidden
        />
        <input
          type="search"
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          placeholder={estilo.placeholder}
          maxLength={100}
          className={cn(
            'w-full border-0 border-b-2 bg-transparent pl-9 pr-9 text-[14px] transition-colors duration-150',
            estilo.input,
          )}
        />
        {isPending && (
          <Loader2
            className={cn('absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin', estilo.icone)}
            aria-hidden
          />
        )}
      </label>
    </form>
  );
}
