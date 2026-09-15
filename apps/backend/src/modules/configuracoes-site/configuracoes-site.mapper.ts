import {
  DESTAQUE_ALTURA_PADRAO,
  DESTAQUE_COR_PADRAO,
  type ConfiguracaoSite,
} from '@arteiroscaragua/shared-types';
import type { ConfiguracaoSiteRow } from '../../database/client';

export function toConfiguracaoSiteDTO(row: ConfiguracaoSiteRow | undefined): ConfiguracaoSite {
  if (!row) {
    return {
      capaUrl: null,
      logotipoUrl: null,
      termosUso: '',
      politicaPrivacidade: '',
      quemSomos: '',
      destaqueTexto: '',
      destaqueAtivo: false,
      destaqueCor: DESTAQUE_COR_PADRAO,
      destaqueAltura: DESTAQUE_ALTURA_PADRAO,
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
    destaqueTexto: row.destaqueTexto,
    destaqueAtivo: row.destaqueAtivo,
    destaqueCor: row.destaqueCor,
    destaqueAltura: row.destaqueAltura,
    updatedAt: row.updatedAt.toISOString(),
  };
}
