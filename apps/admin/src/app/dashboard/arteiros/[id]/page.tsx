'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  CURSO_PARTICIPACAO_TIPOS,
  createArteiroCursoSchema,
  createArteiroEventoSchema,
  createArteiroPremioSchema,
  createArteiroProjetoSchema,
  createArteiroVideoSchema,
  type ArteiroCurso,
  type ArteiroEvento,
  type ArteiroPremio,
  type ArteiroProjeto,
  type ArteiroVideo,
  type CreateArteiroCursoInput,
  type CreateArteiroEventoInput,
  type CreateArteiroPremioInput,
  type CreateArteiroProjetoInput,
  type CreateArteiroVideoInput,
  type UpdateArteiroCursoInput,
  type UpdateArteiroEventoInput,
  type UpdateArteiroPremioInput,
  type UpdateArteiroProjetoInput,
  type UpdateArteiroVideoInput,
} from '@arteiroscaragua/shared-types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArteiroDadosGeraisForm } from '@/components/arteiros/arteiro-dados-gerais-form';
import { MateriaisSelector } from '@/components/arteiros/materiais-selector';
import { PecasManager } from '@/components/arteiros/pecas-manager';
import { SimpleChildManager } from '@/components/arteiros/simple-child-manager';
import { cursosApi, eventosApi, premiosApi, projetosApi, useArteiro, videosApi } from '@/lib/arteiros-api';

const MESES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

function formatMesAno(mesAno: string) {
  const [ano, mes] = mesAno.split('-');
  const index = Number(mes) - 1;
  return `${MESES[index] ?? mes}/${ano}`;
}

export default function EditarArteiroPage() {
  const params = useParams<{ id: string }>();
  const arteiroId = Number(params.id);
  const { data: arteiro, isLoading } = useArteiro(arteiroId);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/arteiros"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para arteiros
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{arteiro ? arteiro.nome : 'Editar arteiro'}</h1>
        <p className="text-muted-foreground">Gerencie os dados gerais e as informações complementares do artesão.</p>
      </div>

      {isLoading && <p className="text-muted-foreground">Carregando...</p>}

      {arteiro && (
        <Tabs defaultValue="dados-gerais">
          <TabsList>
            <TabsTrigger value="dados-gerais">Dados gerais</TabsTrigger>
            <TabsTrigger value="materiais">Materiais</TabsTrigger>
            <TabsTrigger value="pecas">Peças</TabsTrigger>
            <TabsTrigger value="premios">Prêmios</TabsTrigger>
            <TabsTrigger value="videos">Vídeos</TabsTrigger>
            <TabsTrigger value="eventos">Eventos</TabsTrigger>
            <TabsTrigger value="cursos">Cursos</TabsTrigger>
            <TabsTrigger value="projetos">Projetos</TabsTrigger>
          </TabsList>

          <TabsContent value="dados-gerais">
            <ArteiroDadosGeraisForm arteiro={arteiro} />
          </TabsContent>

          <TabsContent value="materiais">
            <MateriaisSelector arteiroId={arteiro.id} materiais={arteiro.materiais} />
          </TabsContent>

          <TabsContent value="pecas">
            <PecasManager arteiroId={arteiro.id} pecas={arteiro.pecas} />
          </TabsContent>

          <TabsContent value="premios">
            <SimpleChildManager<ArteiroPremio, CreateArteiroPremioInput, UpdateArteiroPremioInput>
              arteiroId={arteiro.id}
              title="Prêmios recebidos"
              description="Prêmios e reconhecimentos conquistados pelo artesão."
              addLabel="Novo prêmio"
              emptyMessage="Nenhum prêmio cadastrado."
              items={arteiro.premios}
              createSchema={createArteiroPremioSchema}
              defaultValues={{ nome: '', ano: new Date().getFullYear(), categoria: undefined, instituicao: undefined, descricao: undefined }}
              toFormValues={(item) => ({
                nome: item.nome,
                ano: item.ano,
                categoria: item.categoria ?? undefined,
                instituicao: item.instituicao ?? undefined,
                descricao: item.descricao ?? undefined,
              })}
              useCreate={premiosApi.useCreate}
              useUpdate={premiosApi.useUpdate}
              useDelete={premiosApi.useDelete}
              deleteConfirmLabel={(item) => `Remover o prêmio "${item.nome}"?`}
              fields={[
                { name: 'nome', label: 'Nome do prêmio', type: 'text', span: 2 },
                { name: 'ano', label: 'Ano', type: 'number', span: 1 },
                { name: 'categoria', label: 'Categoria', type: 'text', span: 1 },
                { name: 'instituicao', label: 'Instituição organizadora', type: 'text', span: 2 },
                { name: 'descricao', label: 'Descrição', type: 'textarea', span: 2 },
              ]}
              columns={[
                { key: 'nome', label: 'Nome', render: (item) => item.nome },
                { key: 'ano', label: 'Ano', render: (item) => item.ano },
                { key: 'categoria', label: 'Categoria', render: (item) => item.categoria ?? '—' },
                { key: 'instituicao', label: 'Instituição', render: (item) => item.instituicao ?? '—' },
              ]}
            />
          </TabsContent>

          <TabsContent value="videos">
            <SimpleChildManager<ArteiroVideo, CreateArteiroVideoInput, UpdateArteiroVideoInput>
              arteiroId={arteiro.id}
              title="Links para vídeos"
              description="Links de vídeos externos (YouTube, redes sociais, etc.)."
              addLabel="Novo link"
              emptyMessage="Nenhum vídeo cadastrado."
              items={arteiro.videos}
              createSchema={createArteiroVideoSchema}
              defaultValues={{ url: '' }}
              toFormValues={(item) => ({ url: item.url })}
              useCreate={videosApi.useCreate}
              useUpdate={videosApi.useUpdate}
              useDelete={videosApi.useDelete}
              deleteConfirmLabel={() => 'Remover este link de vídeo?'}
              fields={[{ name: 'url', label: 'URL do vídeo', type: 'text', span: 2, placeholder: 'https://...' }]}
              columns={[
                {
                  key: 'url',
                  label: 'URL',
                  render: (item) => (
                    <a href={item.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      {item.url}
                    </a>
                  ),
                },
              ]}
            />
          </TabsContent>

          <TabsContent value="eventos">
            <SimpleChildManager<ArteiroEvento, CreateArteiroEventoInput, UpdateArteiroEventoInput>
              arteiroId={arteiro.id}
              title="Eventos que participou"
              description="Feiras, mostras e eventos em que o artesão participou."
              addLabel="Novo evento"
              emptyMessage="Nenhum evento cadastrado."
              items={arteiro.eventos}
              createSchema={createArteiroEventoSchema}
              defaultValues={{ nome: '', mesAno: '', descricaoParticipacao: undefined }}
              toFormValues={(item) => ({
                nome: item.nome,
                mesAno: item.mesAno,
                descricaoParticipacao: item.descricaoParticipacao ?? undefined,
              })}
              useCreate={eventosApi.useCreate}
              useUpdate={eventosApi.useUpdate}
              useDelete={eventosApi.useDelete}
              deleteConfirmLabel={(item) => `Remover o evento "${item.nome}"?`}
              fields={[
                { name: 'nome', label: 'Nome do evento', type: 'text', span: 2 },
                { name: 'mesAno', label: 'Mês/Ano', type: 'month', span: 1 },
                { name: 'descricaoParticipacao', label: 'Descrição da participação', type: 'textarea', span: 2 },
              ]}
              columns={[
                { key: 'nome', label: 'Nome', render: (item) => item.nome },
                { key: 'mesAno', label: 'Mês/Ano', render: (item) => formatMesAno(item.mesAno) },
                {
                  key: 'descricaoParticipacao',
                  label: 'Descrição',
                  className: 'max-w-xs truncate',
                  render: (item) => item.descricaoParticipacao ?? '—',
                },
              ]}
            />
          </TabsContent>

          <TabsContent value="cursos">
            <SimpleChildManager<ArteiroCurso, CreateArteiroCursoInput, UpdateArteiroCursoInput>
              arteiroId={arteiro.id}
              title="Participação em cursos"
              description="Cursos em que o artesão participou, como aluno, mediador, curador ou palestrante."
              addLabel="Novo curso"
              emptyMessage="Nenhum curso cadastrado."
              items={arteiro.cursos}
              createSchema={createArteiroCursoSchema}
              defaultValues={{ nome: '', cargaHoraria: undefined, descricao: undefined, tipoParticipacao: 'aluno' }}
              toFormValues={(item) => ({
                nome: item.nome,
                cargaHoraria: item.cargaHoraria ?? undefined,
                descricao: item.descricao ?? undefined,
                tipoParticipacao: item.tipoParticipacao,
              })}
              useCreate={cursosApi.useCreate}
              useUpdate={cursosApi.useUpdate}
              useDelete={cursosApi.useDelete}
              deleteConfirmLabel={(item) => `Remover o curso "${item.nome}"?`}
              fields={[
                { name: 'nome', label: 'Nome do curso', type: 'text', span: 2 },
                { name: 'cargaHoraria', label: 'Carga horária (horas)', type: 'number', span: 1 },
                {
                  name: 'tipoParticipacao',
                  label: 'Como participou',
                  type: 'select',
                  span: 1,
                  options: CURSO_PARTICIPACAO_TIPOS.map((tipo) => ({ value: tipo, label: tipo })),
                },
                { name: 'descricao', label: 'Descrição', type: 'textarea', span: 2 },
              ]}
              columns={[
                { key: 'nome', label: 'Nome', render: (item) => item.nome },
                { key: 'cargaHoraria', label: 'Carga horária', render: (item) => item.cargaHoraria ?? '—' },
                { key: 'tipoParticipacao', label: 'Participação', render: (item) => item.tipoParticipacao },
              ]}
            />
          </TabsContent>

          <TabsContent value="projetos">
            <SimpleChildManager<ArteiroProjeto, CreateArteiroProjetoInput, UpdateArteiroProjetoInput>
              arteiroId={arteiro.id}
              title="Projetos"
              description="Projetos artísticos ou sociais dos quais o artesão participou."
              addLabel="Novo projeto"
              emptyMessage="Nenhum projeto cadastrado."
              items={arteiro.projetos}
              createSchema={createArteiroProjetoSchema}
              defaultValues={{ descricao: '' }}
              toFormValues={(item) => ({ descricao: item.descricao })}
              useCreate={projetosApi.useCreate}
              useUpdate={projetosApi.useUpdate}
              useDelete={projetosApi.useDelete}
              deleteConfirmLabel={() => 'Remover este projeto?'}
              fields={[{ name: 'descricao', label: 'Descrição', type: 'textarea', span: 2 }]}
              columns={[{ key: 'descricao', label: 'Descrição', className: 'max-w-lg truncate', render: (item) => item.descricao }]}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
