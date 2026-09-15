'use client';

import Link from 'next/link';
import { Check, Circle } from 'lucide-react';
import { SENHA_REGRAS } from '@arteiroscaragua/shared-types';
import { PUBLIC_API_URL } from '@/lib/api';
import { cn } from '@/lib/utils';
import { buttonClassName } from '@/components/ui/button';

export function AuthShell({
  titulo,
  descricao,
  children,
  rodape,
}: {
  titulo: string;
  descricao?: React.ReactNode;
  children: React.ReactNode;
  rodape?: React.ReactNode;
}) {
  return (
    <div className="container flex justify-center py-10 sm:py-16">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="font-display text-2xl font-medium leading-tight sm:text-3xl">{titulo}</h1>
          {descricao && <p className="mt-2 text-sm text-muted-foreground">{descricao}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {rodape && <div className="mt-6 text-center text-sm text-muted-foreground">{rodape}</div>}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.11A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.29 14.28A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.38-2.28V6.61H1.28a12 12 0 0 0 0 10.78l4.01-3.11z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.61l4.01 3.11C6.23 6.88 8.88 4.77 12 4.77z" />
    </svg>
  );
}

// O login com Google é o caminho preferencial: fica em primeiro e com destaque.
export function GoogleButton({ children = 'Continuar com Google' }: { children?: React.ReactNode }) {
  return (
    <a
      href={`${PUBLIC_API_URL}/api/conta/google`}
      className={buttonClassName({ variant: 'outline', size: 'lg', className: 'w-full border-foreground/25 font-semibold' })}
    >
      <GoogleIcon />
      {children}
    </a>
  );
}

export function Divisor({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      {children}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function SenhaRegras({ senha }: { senha: string }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
      {SENHA_REGRAS.map((regra) => {
        const ok = regra.valida(senha);
        return (
          <li key={regra.descricao} className={cn('flex items-center gap-1.5', ok && 'text-success')}>
            {ok ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Circle className="h-3 w-3" aria-hidden />}
            <span>
              {regra.descricao}
              <span className="sr-only">{ok ? ' (atendido)' : ' (pendente)'}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function AceiteTermos({
  checked,
  onChange,
  error,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}) {
  return (
    <div>
      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={Boolean(error)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-input accent-primary"
        />
        <span>
          Li e aceito os{' '}
          <Link href="/termos-de-uso" target="_blank" className="font-medium text-primary underline underline-offset-2">
            termos de uso
          </Link>{' '}
          e a{' '}
          <Link href="/politica-de-privacidade" target="_blank" className="font-medium text-primary underline underline-offset-2">
            política de privacidade
          </Link>
          .
        </span>
      </label>
      {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
    </div>
  );
}
