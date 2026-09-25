'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, User, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { primeiroNome } from '@/lib/utils';
import { buttonClassName } from '@/components/ui/button';

const itemClassName =
  'flex h-11 w-full items-center border-t border-background/20 text-left text-[14px] font-semibold transition-colors duration-150 hover:text-mata-300';

export function MenuMobile() {
  const { usuario, sair } = useAuth();
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const fechar = () => setAberto(false);

  useEffect(fechar, [pathname]);

  return (
    <>
      <div className="flex">
        {!usuario && (
          <Link href="/entrar" aria-label="Entrar" className="flex h-11 w-11 items-center justify-center">
            <User className="h-5 w-5" aria-hidden />
          </Link>
        )}
        <button
          type="button"
          aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={aberto}
          aria-controls="menu-mobile"
          onClick={() => setAberto((valor) => !valor)}
          className="flex h-11 w-11 items-center justify-center"
        >
          {aberto ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
      </div>

      {aberto && (
        <nav
          id="menu-mobile"
          aria-label="Principal"
          className="absolute inset-x-0 top-full border-b-2 border-foreground bg-mata-700 px-4 pb-4"
        >
          <Link href="/quem-somos" onClick={fechar} className={itemClassName}>
            Quem somos
          </Link>
          <Link href="/arteiros" onClick={fechar} className={itemClassName}>
            Arteiros
          </Link>
          {usuario ? (
            <>
              <p className="flex h-11 items-center border-t border-background/20 text-[14px] text-mata-300">
                Olá, {primeiroNome(usuario.nome)}
              </p>
              <Link href="/favoritos" onClick={fechar} className={itemClassName}>
                Favoritos
              </Link>
              <Link href="/perfil" onClick={fechar} className={itemClassName}>
                Meu perfil
              </Link>
              <button
                type="button"
                onClick={() => {
                  fechar();
                  sair();
                }}
                className={itemClassName}
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link href="/entrar" onClick={fechar} className={itemClassName}>
                Entrar
              </Link>
              <Link
                href="/cadastro"
                onClick={fechar}
                className={buttonClassName({ variant: 'claro', className: 'mt-2 w-full' })}
              >
                Tornar-se arteiro
              </Link>
            </>
          )}
        </nav>
      )}
    </>
  );
}
