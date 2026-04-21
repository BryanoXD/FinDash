/**
 * Formatadores centralizados para todo o app.
 * Usar estes helpers em vez de recriar localmente.
 */

/** Formata valor para moeda brasileira: R$ 1.234,56 */
export const fmt = (v) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(v) || 0);

/** Formata número com 2 casas decimais: 1.234,56 */
export const fmtNum = (v) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(v) || 0);

/** Formata número compacto para gráficos: 1.2k */
export const fmtCompact = (v) =>
  v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString();

/** Formata data para pt-BR: 01/01/2026 */
export const fmtDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("pt-BR");
};

/** Nomes dos meses em português */
export const MESES = [
  "Janeiro","Fevereiro","Marco","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];
