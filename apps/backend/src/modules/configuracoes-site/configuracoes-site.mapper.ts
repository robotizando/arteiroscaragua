import type { ConfiguracaoSite } from '@arteiroscaragua/shared-types';
import type { ConfiguracaoSiteRow } from '../../database/client';

export function toConfiguracaoSiteDTO(row: ConfiguracaoSiteRow | undefined): ConfiguracaoSite {
  if (!row) {
    return {
      capaUrl: null,
      logotipoUrl: null,
      termosUso: '',
      politicaPrivacidade: '',
      quemSomos: '',
      updatedAt: null,
    };
  }
  const versao = row.updatedAt.getTime();
  return {
    capaUrl: row.capa ? `/api/configuracoes-site/capa?v=${versao}` : null,
    logotipoUrl: row.logotipo ? `/api/configuracoes-site/logotipo?v=${versao}` : null,
    termosUso: row.termosUso,
    politicaPrivacidade: row.politicaPrivacidade,
    quemSomos: row.quemSomos,
    updatedAt: row.updatedAt.toISOString(),
  };
}
