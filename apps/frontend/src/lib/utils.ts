import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatarValor(valor: number | null): string {
  return valor === null ? 'Sob consulta' : moeda.format(valor);
}

// Muitos nomes de peça foram cadastrados em CAIXA ALTA; exibimos só a inicial maiúscula.
export function formatarNomePeca(nome: string): string {
  if (nome !== nome.toUpperCase()) return nome;
  const minusculo = nome.toLocaleLowerCase('pt-BR');
  return minusculo.charAt(0).toLocaleUpperCase('pt-BR') + minusculo.slice(1);
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

// searchParams do Next podem vir repetidos (?a=1&a=2); usamos o primeiro.
export function primeiroParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? '';
}

export function pluralizar(total: number, singular: string, plural: string): string {
  return `${total} ${total === 1 ? singular : plural}`;
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// "2024-03" -> "mar/2024"
export function formatarMesAno(mesAno: string): string {
  const [ano, mes] = mesAno.split('-');
  return `${MESES[Number(mes) - 1] ?? mes}/${ano}`;
}
