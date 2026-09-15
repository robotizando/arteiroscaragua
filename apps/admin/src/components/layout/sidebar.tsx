'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Boxes, History, LayoutDashboard, Paintbrush, Settings, ShieldCheck, UserRound, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/dashboard/arteiros', label: 'Arteiros', icon: Users },
  { href: '/dashboard/materiais', label: 'Materiais', icon: Boxes },
  { href: '/dashboard/usuarios', label: 'Usuários', icon: UserRound },
  { href: '/dashboard/acessos', label: 'Log de acesso', icon: History },
  { href: '/dashboard/admin-users', label: 'Usuários admin', icon: ShieldCheck },
  { href: '/dashboard/configuracoes', label: 'Configurações do site', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Paintbrush className="h-4 w-4" />
        </div>
        <span className="font-semibold">Arteiros Caragua</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
