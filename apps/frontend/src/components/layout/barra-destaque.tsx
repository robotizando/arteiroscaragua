import { corTextoDestaque, type ConfiguracaoSite } from '@arteiroscaragua/shared-types';

// Faixa de aviso acima do cabeçalho, configurada no admin (Configurações do site).
// Não é fixa: sai da tela ao rolar, sem somar à altura do cabeçalho.
export function BarraDestaque({ configuracao }: { configuracao: ConfiguracaoSite | null }) {
  const texto = configuracao?.destaqueTexto.trim();
  if (!configuracao?.destaqueAtivo || !texto) return null;

  return (
    <div
      role="region"
      aria-label="Destaque"
      className="flex items-center"
      style={{
        backgroundColor: configuracao.destaqueCor,
        color: corTextoDestaque(configuracao.destaqueCor),
        // Altura mínima: em telas estreitas o texto quebra linha e a barra cresce.
        minHeight: configuracao.destaqueAltura,
      }}
    >
      <p className="container py-1 text-[13px] font-semibold leading-snug">{texto}</p>
    </div>
  );
}
