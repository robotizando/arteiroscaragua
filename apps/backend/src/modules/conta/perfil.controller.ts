import { Request, Response } from 'express';
import {
  atualizarContaSchema,
  boasVindasSchema,
  setArteiroMateriaisSchema,
  updateArteiroSchema,
  type ContaPerfilResponse,
} from '@arteiroscaragua/shared-types';
import type { UsuarioRow } from '../../database/client';
import { extractLogotipo } from '../arteiros/arteiros.controller';
import * as arteirosService from '../arteiros/arteiros.service';
import * as favoritosService from './favoritos.service';
import * as service from './conta.service';
import { arteiroIdDoUsuario } from './perfil.service';

export async function getPerfil(req: Request, res: Response) {
  const usuarioRow = req.usuario as UsuarioRow;
  const arteiroId = await arteiroIdDoUsuario(usuarioRow.id);
  const resposta: ContaPerfilResponse = {
    usuario: await service.toContaUsuario(usuarioRow),
    arteiro: arteiroId ? await arteirosService.getArteiroById(arteiroId) : null,
  };
  res.json(resposta);
}

export async function atualizarPerfil(req: Request, res: Response) {
  const usuario = await service.atualizarConta(req.usuario as UsuarioRow, atualizarContaSchema.parse(req.body));
  res.json({ usuario });
}

export async function responderBoasVindas(req: Request, res: Response) {
  const usuario = await service.responderBoasVindas(req.usuario as UsuarioRow, boasVindasSchema.parse(req.body));
  res.json({ usuario });
}

// O :arteiroId já foi conferido por requireArteiroProprio.
export async function atualizarArteiro(req: Request, res: Response) {
  const input = updateArteiroSchema.parse(req.body);
  const arteiro = await arteirosService.updateArteiro(Number(req.params.arteiroId), input, extractLogotipo(req));
  res.json({ arteiro });
}

export async function definirMateriais(req: Request, res: Response) {
  const input = setArteiroMateriaisSchema.parse(req.body);
  await arteirosService.setArteiroMateriais(Number(req.params.arteiroId), input);
  res.status(204).send();
}

export async function listarFavoritos(req: Request, res: Response) {
  res.json({ items: await favoritosService.listar((req.usuario as UsuarioRow).id) });
}

export async function listarFavoritosIds(req: Request, res: Response) {
  res.json({ ids: await favoritosService.listarIds((req.usuario as UsuarioRow).id) });
}

export async function favoritar(req: Request, res: Response) {
  await favoritosService.adicionar((req.usuario as UsuarioRow).id, Number(req.params.pecaId));
  res.status(204).send();
}

export async function desfavoritar(req: Request, res: Response) {
  await favoritosService.remover((req.usuario as UsuarioRow).id, Number(req.params.pecaId));
  res.status(204).send();
}
