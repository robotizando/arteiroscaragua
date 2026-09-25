'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import {
  CURSO_PARTICIPACAO_TIPOS,
  createArteiroCursoSchema,
  createArteiroEventoSchema,
  createArteiroPremioSchema,
  createArteiroProjetoSchema,
  createArteiroVideoSchema,
  type Arteiro,
} from '@arteiroscaragua/shared-types';
import { formatarMesAno } from '@/lib/utils';
import { ArteiroColecao } from './arteiro-colecao';
import { ArteiroDadosForm } from './arteiro-dados-form';
import { ArteiroMateriais } from './arteiro-materiais';
import { ArteiroPecas } from './arteiro-pecas';
import { Tabs } from './tabs';

// Mesmas abas da tela de arteiro da Admin, mas sempre limitadas ao perfil de quem está logado.
export function ArteiroPerfil({ arteiro, recarregar }: { arteiro: Arteiro; recarregar: () => void }) {
  const comum = { arteiroId: arteiro.id, recarregar };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-extrabold tracking-tight">Meu perfil de arteiro</h2>
        {arteiro.estado === 'ativo' && (
          <Link
            href={`/arteiros/${arteiro.id}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Ver minha página na vitrine
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
      </div>

      <Tabs
        abas={[
          { id: 'dados', rotulo: 'Dados', conteudo: <ArteiroDadosForm arteiro={arteiro} recarregar={recarregar} /> },
          {
            id: 'materiais',
            rotulo: 'Materiais',
            conteudo: <ArteiroMateriais arteiro={arteiro} recarregar={recarregar} />,
          },
          { id: 'pecas', rotulo: 'Peças', conteudo: <ArteiroPecas arteiro={arteiro} recarregar={recarregar} /> },
          {
            id: 'premios',
            rotulo: 'Prêmios',
            conteudo: (
              <ArteiroColecao
                {...comum}
                recurso="premios"
                titulo="Prêmios"
                descricao="Prêmios e reconhecimentos que você recebeu."
                rotuloNovo="Novo prêmio"
                vazio="Nenhum prêmio cadastrado."
                itens={arteiro.premios}
                schema={createArteiroPremioSchema}
                campos={[
                  { nome: 'nome', rotulo: 'Nome do prêmio', obrigatorio: true, larguraTotal: true },
                  { nome: 'ano', rotulo: 'Ano', tipo: 'number', obrigatorio: true },
                  { nome: 'categoria', rotulo: 'Categoria' },
                  { nome: 'instituicao', rotulo: 'Instituição', larguraTotal: true },
                  { nome: 'descricao', rotulo: 'Descrição', tipo: 'textarea', larguraTotal: true },
                ]}
                paraFormulario={(item) => ({
                  nome: item.nome,
                  ano: String(item.ano),
                  categoria: item.categoria ?? '',
                  instituicao: item.instituicao ?? '',
                  descricao: item.descricao ?? '',
                })}
                resumo={(item) => (
                  <>
                    <p className="font-semibold">
                      {item.nome} · {item.ano}
                    </p>
                    <p className="text-muted-foreground">
                      {[item.categoria, item.instituicao].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </>
                )}
              />
            ),
          },
          {
            id: 'videos',
            rotulo: 'Vídeos',
            conteudo: (
              <ArteiroColecao
                {...comum}
                recurso="videos"
                titulo="Vídeos"
                descricao="Links de vídeos sobre você ou seu trabalho."
                rotuloNovo="Novo link"
                vazio="Nenhum vídeo cadastrado."
                itens={arteiro.videos}
                schema={createArteiroVideoSchema}
                campos={[
                  { nome: 'url', rotulo: 'URL do vídeo', obrigatorio: true, larguraTotal: true, placeholder: 'https://...' },
                ]}
                paraFormulario={(item) => ({ url: item.url })}
                resumo={(item) => <span className="break-all">{item.url}</span>}
              />
            ),
          },
          {
            id: 'eventos',
            rotulo: 'Eventos',
            conteudo: (
              <ArteiroColecao
                {...comum}
                recurso="eventos"
                titulo="Eventos"
                descricao="Feiras, mostras e eventos de que você participou."
                rotuloNovo="Novo evento"
                vazio="Nenhum evento cadastrado."
                itens={arteiro.eventos}
                schema={createArteiroEventoSchema}
                campos={[
                  { nome: 'nome', rotulo: 'Nome do evento', obrigatorio: true, larguraTotal: true },
                  { nome: 'mesAno', rotulo: 'Mês e ano', tipo: 'month', obrigatorio: true },
                  { nome: 'descricaoParticipacao', rotulo: 'Como você participou', tipo: 'textarea', larguraTotal: true },
                ]}
                paraFormulario={(item) => ({
                  nome: item.nome,
                  mesAno: item.mesAno,
                  descricaoParticipacao: item.descricaoParticipacao ?? '',
                })}
                resumo={(item) => (
                  <>
                    <p className="font-semibold">
                      {item.nome} · {formatarMesAno(item.mesAno)}
                    </p>
                    {item.descricaoParticipacao && (
                      <p className="line-clamp-2 text-muted-foreground">{item.descricaoParticipacao}</p>
                    )}
                  </>
                )}
              />
            ),
          },
          {
            id: 'cursos',
            rotulo: 'Cursos',
            conteudo: (
              <ArteiroColecao
                {...comum}
                recurso="cursos"
                titulo="Cursos"
                descricao="Cursos de que você participou, como aluno ou conduzindo."
                rotuloNovo="Novo curso"
                vazio="Nenhum curso cadastrado."
                itens={arteiro.cursos}
                schema={createArteiroCursoSchema}
                campos={[
                  { nome: 'nome', rotulo: 'Nome do curso', obrigatorio: true, larguraTotal: true },
                  { nome: 'cargaHoraria', rotulo: 'Carga horária (horas)', tipo: 'number' },
                  {
                    nome: 'tipoParticipacao',
                    rotulo: 'Como participou',
                    tipo: 'select',
                    obrigatorio: true,
                    opcoes: CURSO_PARTICIPACAO_TIPOS.map((tipo) => ({ valor: tipo, rotulo: tipo })),
                  },
                  { nome: 'descricao', rotulo: 'Descrição', tipo: 'textarea', larguraTotal: true },
                ]}
                paraFormulario={(item) => ({
                  nome: item.nome,
                  cargaHoraria: item.cargaHoraria === null ? '' : String(item.cargaHoraria),
                  tipoParticipacao: item.tipoParticipacao,
                  descricao: item.descricao ?? '',
                })}
                resumo={(item) => (
                  <>
                    <p className="font-semibold">{item.nome}</p>
                    <p className="text-muted-foreground">
                      {item.tipoParticipacao}
                      {item.cargaHoraria !== null && ` · ${item.cargaHoraria}h`}
                    </p>
                  </>
                )}
              />
            ),
          },
          {
            id: 'projetos',
            rotulo: 'Projetos',
            conteudo: (
              <ArteiroColecao
                {...comum}
                recurso="projetos"
                titulo="Projetos"
                descricao="Projetos artísticos ou sociais de que você participou."
                rotuloNovo="Novo projeto"
                vazio="Nenhum projeto cadastrado."
                itens={arteiro.projetos}
                schema={createArteiroProjetoSchema}
                campos={[{ nome: 'descricao', rotulo: 'Descrição', tipo: 'textarea', obrigatorio: true, larguraTotal: true }]}
                paraFormulario={(item) => ({ descricao: item.descricao })}
                resumo={(item) => <p className="line-clamp-3">{item.descricao}</p>}
              />
            ),
          },
        ]}
      />
    </section>
  );
}
