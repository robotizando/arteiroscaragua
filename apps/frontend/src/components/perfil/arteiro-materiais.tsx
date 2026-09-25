'use client';

import { useEffect, useState } from 'react';
import type { Arteiro, ArteiroMaterialRef } from '@arteiroscaragua/shared-types';
import { apiGet, mensagemDeErro } from '@/lib/api';
import { useContaApi } from '@/lib/conta-api';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/form';
import { Secao } from './secao';

export function ArteiroMateriais({ arteiro, recarregar }: { arteiro: Arteiro; recarregar: () => void }) {
  const contaApi = useContaApi();
  const [disponiveis, setDisponiveis] = useState<ArteiroMaterialRef[] | null>(null);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set(arteiro.materiais.map((item) => item.id)));
  const [mensagem, setMensagem] = useState<{ tipo: 'erro' | 'sucesso'; texto: string } | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    apiGet<{ items: ArteiroMaterialRef[] }>('/api/publico/materiais')
      .then((data) => setDisponiveis(data.items))
      .catch(() => setDisponiveis([]));
  }, []);

  function alternar(id: string) {
    setSelecionados((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

  async function salvar() {
    setMensagem(null);
    setSalvando(true);
    try {
      await contaApi(`/arteiros/${arteiro.id}/materiais`, {
        method: 'PUT',
        body: { materialIds: Array.from(selecionados) },
      });
      setMensagem({ tipo: 'sucesso', texto: 'Materiais atualizados.' });
      recarregar();
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: mensagemDeErro(error) });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Secao titulo="Materiais" descricao="Com o que você trabalha. Ajuda as pessoas a encontrarem suas peças.">
      <div className="space-y-4">
        {mensagem && <Alert tipo={mensagem.tipo}>{mensagem.texto}</Alert>}
        {disponiveis === null && <p className="text-sm text-muted-foreground">Carregando materiais...</p>}
        {disponiveis?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum material cadastrado ainda.</p>}

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {disponiveis?.map((material) => (
            <label key={material.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selecionados.has(material.id)}
                onChange={() => alternar(material.id)}
                className="h-4 w-4 accent-primary"
              />
              {material.nome}
            </label>
          ))}
        </div>

        <Button onClick={salvar} disabled={salvando || disponiveis === null}>
          {salvando ? 'Salvando...' : 'Salvar materiais'}
        </Button>
      </div>
    </Secao>
  );
}
