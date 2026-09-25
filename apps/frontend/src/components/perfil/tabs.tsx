'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface Aba {
  id: string;
  rotulo: string;
  conteudo: React.ReactNode;
}

export function Tabs({ abas }: { abas: Aba[] }) {
  const [ativa, setAtiva] = useState(abas[0]?.id);
  const aba = abas.find((item) => item.id === ativa) ?? abas[0];

  return (
    <div>
      <div role="tablist" className="flex flex-wrap items-end gap-x-1 border-b-2 border-foreground">
        {abas.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === aba?.id}
            onClick={() => setAtiva(item.id)}
            className={cn(
              'px-3 py-2 text-[14px] font-extrabold transition-colors duration-150',
              item.id === aba?.id ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.rotulo}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="pt-6">
        {aba?.conteudo}
      </div>
    </div>
  );
}
