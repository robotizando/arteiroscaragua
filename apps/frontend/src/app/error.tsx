'use client';

import { Button } from '@/components/ui/button';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container flex flex-col items-center py-24 text-center">
      <h1 className="font-display text-3xl font-medium">Não foi possível carregar esta página</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Pode ser uma instabilidade momentânea. Tente de novo em instantes.
      </p>
      <Button className="mt-8" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  );
}
