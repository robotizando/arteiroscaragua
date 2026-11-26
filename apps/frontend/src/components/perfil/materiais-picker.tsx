'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { ArteiroMaterialRef } from '@arteiroscaragua/shared-types';
import { Input } from '@/components/ui/form';
import { cn } from '@/lib/utils';

const MAX_SUGESTOES = 8;

function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

type Props = {
  disponiveis: ArteiroMaterialRef[];
  selecionados: string[];
  onChange: (ids: string[]) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
};

export function MateriaisPicker({
  disponiveis,
  selecionados,
  onChange,
  id,
  placeholder = 'Buscar material pelo nome...',
  disabled,
}: Props) {
  const gerado = useId();
  const inputId = id ?? `materiais-${gerado}`;
  const listboxId = `${inputId}-lista`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState(false);
  const [destaque, setDestaque] = useState(0);

  const porId = useMemo(() => new Map(disponiveis.map((material) => [material.id, material])), [disponiveis]);
  const escolhidos = selecionados
    .map((materialId) => porId.get(materialId))
    .filter((material): material is ArteiroMaterialRef => Boolean(material));

  const sugestoes = useMemo(() => {
    const termo = normalizar(busca);
    const marcados = new Set(selecionados);
    return disponiveis
      .filter((material) => !marcados.has(material.id))
      .filter((material) => !termo || normalizar(material.nome).includes(termo))
      .slice(0, MAX_SUGESTOES);
  }, [busca, disponiveis, selecionados]);

  const mostrarLista = aberto && !disabled;
  const indiceAtivo = Math.min(destaque, Math.max(sugestoes.length - 1, 0));

  function adicionar(material: ArteiroMaterialRef) {
    onChange([...selecionados, material.id]);
    setBusca('');
    setDestaque(0);
    inputRef.current?.focus();
  }

  function remover(materialId: string) {
    onChange(selecionados.filter((item) => item !== materialId));
  }

  function aoTeclar(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setAberto(true);
      setDestaque((atual) => Math.min(atual + 1, sugestoes.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setDestaque((atual) => Math.max(atual - 1, 0));
    } else if (event.key === 'Enter') {
      if (mostrarLista && sugestoes[indiceAtivo]) {
        event.preventDefault();
        adicionar(sugestoes[indiceAtivo]);
      }
    } else if (event.key === 'Escape') {
      setAberto(false);
    } else if (event.key === 'Backspace' && busca === '' && selecionados.length > 0) {
      remover(selecionados[selecionados.length - 1]);
    }
  }

  return (
    <div className="space-y-3">
      {escolhidos.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Materiais adicionados">
          {escolhidos.map((material) => (
            <li
              key={material.id}
              className="inline-flex items-center gap-1 border-2 border-foreground bg-card py-1 pl-3 pr-1 text-sm"
            >
              {material.nome}
              <button
                type="button"
                onClick={() => remover(material.id)}
                disabled={disabled}
                aria-label={`Remover ${material.nome}`}
                className="p-0.5 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-60"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum material adicionado.</p>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={mostrarLista}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={mostrarLista && sugestoes[indiceAtivo] ? `${listboxId}-${indiceAtivo}` : undefined}
          placeholder={placeholder}
          value={busca}
          disabled={disabled}
          className="pl-9"
          onChange={(event) => {
            setBusca(event.target.value);
            setDestaque(0);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          onBlur={() => setAberto(false)}
          onKeyDown={aoTeclar}
        />

        {mostrarLista && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto border-2 border-foreground bg-card shadow-md"
          >
            {sugestoes.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                {disponiveis.length === selecionados.length && disponiveis.length > 0
                  ? 'Todos os materiais já foram adicionados.'
                  : 'Nenhum material encontrado.'}
              </li>
            ) : (
              sugestoes.map((material, indice) => (
                <li
                  key={material.id}
                  id={`${listboxId}-${indice}`}
                  role="option"
                  aria-selected={indice === indiceAtivo}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    adicionar(material);
                  }}
                  onMouseEnter={() => setDestaque(indice)}
                  className={cn(
                    'cursor-pointer px-3 py-2 text-sm',
                    indice === indiceAtivo && 'bg-primary text-primary-foreground',
                  )}
                >
                  {material.nome}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
