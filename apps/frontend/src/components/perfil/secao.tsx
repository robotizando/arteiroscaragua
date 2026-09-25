export function Secao({
  titulo,
  descricao,
  acao,
  children,
}: {
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight">{titulo}</h2>
          {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
        </div>
        {acao}
      </div>
      {children}
    </section>
  );
}
