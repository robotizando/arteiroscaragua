'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ArteiroMaterialRef } from '@arteiroscaragua/shared-types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useMateriais } from '@/lib/materiais-api';
import { useSetArteiroMateriais } from '@/lib/arteiros-api';
import { getApiErrorMessage } from '@/lib/api';

export function MateriaisSelector({ arteiroId, materiais }: { arteiroId: number; materiais: ArteiroMaterialRef[] }) {
  const { data } = useMateriais({ estado: 'ativo', pageSize: 200 });
  const setMateriaisMutation = useSetArteiroMateriais(arteiroId);
  const [selected, setSelected] = useState<Set<string>>(new Set(materiais.map((material) => material.id)));

  useEffect(() => {
    setSelected(new Set(materiais.map((material) => material.id)));
  }, [materiais]);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleSave() {
    try {
      await setMateriaisMutation.mutateAsync({ materialIds: Array.from(selected) });
      toast.success('Materiais atualizados com sucesso');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível salvar os materiais'));
    }
  }

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Materiais utilizados</h3>
        <p className="text-sm text-muted-foreground">Selecione os materiais que este artesão utiliza em suas peças.</p>
      </div>

      {items.length === 0 && <p className="text-sm text-muted-foreground">Nenhum material cadastrado ainda.</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((material) => (
          <div key={material.id} className="flex items-center gap-2">
            <Checkbox
              id={`material-${material.id}`}
              checked={selected.has(material.id)}
              onCheckedChange={() => toggle(material.id)}
            />
            <Label htmlFor={`material-${material.id}`} className="cursor-pointer font-normal">
              {material.nome}
            </Label>
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={setMateriaisMutation.isPending}>
        {setMateriaisMutation.isPending ? 'Salvando...' : 'Salvar materiais'}
      </Button>
    </div>
  );
}
