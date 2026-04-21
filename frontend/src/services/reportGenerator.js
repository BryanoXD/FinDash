/**
 * reportGenerator.js
 * 
 * Serviço modular para geração de relatórios financeiros.
 * Funções separadas: consolidar dados → gerar markdown → converter PDF → download.
 */

// ============================================================
// 1. FORMATADORES
// ============================================================

/** Formata valor para moeda brasileira */
const fmtBRL = (v) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(Number(v) || 0);

/** Formata data para pt-BR */
const fmtDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("pt-BR");
};

/** Nome do mês em português */
const MESES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// ============================================================
// 2. CONSOLIDAR DADOS
// ============================================================

/**
 * Reúne e organiza todos os dados do app para o relatório.
 * @param {Object} data - Dados do DataContext
 * @param {number} month - Mês (0-11)
 * @param {number} year - Ano
 * @returns {Object} Dados consolidados
 */
export function consolidateData(data, month, year) {
  const {
    user, transactions, categories, accounts, cards,
    installments, investments, financings, budgets, goals,
  } = data;

  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const periodo = `${MESES[month]} ${year}`;

  // Transações do mês
  const txMonth = (transactions || []).filter((t) => t.data?.startsWith(prefix));
  const receitas = txMonth.filter((t) => t.tipo === "receita");
  const despesas = txMonth.filter((t) => t.tipo === "despesa");
  const totalReceitas = receitas.reduce((s, t) => s + t.valor, 0);
  const totalDespesas = despesas.reduce((s, t) => s + t.valor, 0);
  const saldo = totalReceitas - totalDespesas;

  // Despesas por categoria
  const catMap = {};
  despesas.forEach((t) => {
    const cat = t.categoria || "Outros";
    catMap[cat] = (catMap[cat] || 0) + t.valor;
  });
  const despesasPorCategoria = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, val]) => ({
      categoria: cat,
      valor: val,
      percentual: totalDespesas > 0 ? ((val / totalDespesas) * 100).toFixed(1) : "0",
    }));

  // Recorrentes pendentes
  const recorrentes = (transactions || []).filter(
    (t) => t.recorrente && !t.pago && t.tipo === "despesa"
  );

  // Contas a pagar (despesas pendentes)
  const contasPagar = (transactions || []).filter(
    (t) => !t.pago && t.tipo === "despesa"
  );

  // Orçamentos
  const orcamentos = (budgets || []).map((b) => {
    const cat = (categories || []).find((c) => c.id === b.categoria_id);
    const pct = b.limite > 0 ? ((b.gasto / b.limite) * 100).toFixed(1) : "0";
    return {
      categoria: cat?.nome || "N/A",
      limite: b.limite,
      gasto: b.gasto,
      percentual: pct,
      status: Number(pct) > 100 ? "ESTOURADO" : Number(pct) > 80 ? "ATENCAO" : "OK",
    };
  });

  // Metas financeiras
  const metas = (goals || []).map((g) => ({
    nome: g.nome,
    valorAtual: g.valor_atual,
    valorMeta: g.valor_meta,
    percentual: g.valor_meta > 0 ? ((g.valor_atual / g.valor_meta) * 100).toFixed(1) : "0",
    prazo: g.prazo,
  }));

  // Contas bancárias
  const contasBancarias = (accounts || []).map((a) => ({
    nome: a.nome,
    tipo: a.tipo,
    saldo: a.saldo,
  }));
  const totalContas = contasBancarias.reduce((s, a) => s + a.saldo, 0);

  // Cartões
  const cartoes = (cards || []).map((c) => {
    const cardInst = (installments || []).filter((i) => i.card_id === c.id && !i.pago);
    const fatura = cardInst.reduce((s, i) => s + i.valor_parcela, 0);
    return {
      nome: c.nome,
      bandeira: c.bandeira,
      limite: c.limite,
      fatura,
      disponivel: c.limite - fatura,
    };
  });

  // Investimentos
  const totalInvestimentos = (investments || []).reduce((s, i) => s + i.valor, 0);
  const listaInvestimentos = (investments || []).map((i) => ({
    nome: i.nome,
    tipo: i.tipo,
    valor: i.valor,
    rendimento: i.rendimento,
  }));

  // Financiamentos ativos
  const financAtivos = (financings || []).filter((f) => f.status === "ativo").map((f) => ({
    nome: f.nome,
    valorTotal: f.valor_total,
    parcelas: f.parcelas,
    parcelaAtual: f.parcela_atual,
    valorParcela: f.valor_parcela,
  }));

  // Indicadores
  const taxaPoupanca = totalReceitas > 0 ? (((totalReceitas - totalDespesas) / totalReceitas) * 100).toFixed(1) : "0";
  const patrimonioTotal = totalContas + totalInvestimentos;

  return {
    user,
    periodo,
    month,
    year,
    // Resumo
    totalReceitas,
    totalDespesas,
    saldo,
    // Detalhes
    receitas,
    despesas,
    despesasPorCategoria,
    txMonth,
    // Orçamentos e metas
    orcamentos,
    metas,
    // Contas e cartões
    contasBancarias,
    totalContas,
    cartoes,
    // Investimentos e financiamentos
    totalInvestimentos,
    listaInvestimentos,
    financAtivos,
    // Recorrentes e pendentes
    recorrentes,
    contasPagar,
    // Indicadores
    taxaPoupanca,
    patrimonioTotal,
  };
}

// ============================================================
// 3. GERAR MARKDOWN
// ============================================================

/**
 * Gera o conteúdo Markdown do relatório mensal.
 * @param {Object} dados - Dados consolidados
 * @returns {string} Conteúdo Markdown
 */
export function generateMarkdown(dados) {
  const {
    user, periodo, totalReceitas, totalDespesas, saldo,
    despesasPorCategoria, txMonth, orcamentos, metas,
    contasBancarias, totalContas, cartoes,
    totalInvestimentos, listaInvestimentos, financAtivos,
    recorrentes, contasPagar, taxaPoupanca, patrimonioTotal,
  } = dados;

  const now = new Date();
  const dataGeracao = `${now.toLocaleDateString("pt-BR")} as ${now.toLocaleTimeString("pt-BR")}`;

  let md = "";

  // --- CABEÇALHO ---
  md += `# Relatorio Financeiro - ${periodo}\n\n`;
  md += `**Gerado em:** ${dataGeracao}\n\n`;
  if (user?.name) md += `**Usuario:** ${user.name}\n\n`;
  md += `---\n\n`;

  // --- RESUMO GERAL ---
  md += `## Resumo Geral\n\n`;
  md += `| Indicador | Valor |\n`;
  md += `|-----------|-------|\n`;
  md += `| Receitas Totais | ${fmtBRL(totalReceitas)} |\n`;
  md += `| Despesas Totais | ${fmtBRL(totalDespesas)} |\n`;
  md += `| **Saldo do Mes** | **${fmtBRL(saldo)}** |\n`;
  md += `| Taxa de Poupanca | ${taxaPoupanca}% |\n`;
  md += `| Patrimonio Total | ${fmtBRL(patrimonioTotal)} |\n\n`;

  // --- RECEITAS ---
  md += `## Receitas\n\n`;
  const receitasTx = txMonth.filter((t) => t.tipo === "receita");
  if (receitasTx.length > 0) {
    md += `| Data | Descricao | Valor | Status |\n`;
    md += `|------|-----------|-------|--------|\n`;
    receitasTx.forEach((t) => {
      md += `| ${fmtDate(t.data)} | ${t.descricao} | ${fmtBRL(t.valor)} | ${t.pago ? "Recebido" : "Pendente"} |\n`;
    });
    md += `\n**Total Receitas:** ${fmtBRL(totalReceitas)}\n\n`;
  } else {
    md += `Nenhuma receita registrada neste periodo.\n\n`;
  }

  // --- DESPESAS ---
  md += `## Despesas\n\n`;
  if (despesasPorCategoria.length > 0) {
    md += `### Por Categoria\n\n`;
    md += `| Categoria | Valor | % do Total |\n`;
    md += `|-----------|-------|------------|\n`;
    despesasPorCategoria.forEach((c) => {
      md += `| ${c.categoria} | ${fmtBRL(c.valor)} | ${c.percentual}% |\n`;
    });
    md += `\n**Total Despesas:** ${fmtBRL(totalDespesas)}\n\n`;

    md += `### Detalhamento\n\n`;
    md += `| Data | Descricao | Categoria | Valor | Status |\n`;
    md += `|------|-----------|-----------|-------|--------|\n`;
    txMonth
      .filter((t) => t.tipo === "despesa")
      .sort((a, b) => a.data?.localeCompare(b.data))
      .forEach((t) => {
        md += `| ${fmtDate(t.data)} | ${t.descricao} | ${t.categoria || ""} | ${fmtBRL(t.valor)} | ${t.pago ? "Pago" : "Pendente"} |\n`;
      });
    md += `\n`;
  } else {
    md += `Nenhuma despesa registrada neste periodo.\n\n`;
  }

  // --- ORÇAMENTOS ---
  if (orcamentos.length > 0) {
    md += `## Orcamentos\n\n`;
    md += `| Categoria | Limite | Gasto | Uso | Status |\n`;
    md += `|-----------|--------|-------|-----|--------|\n`;
    orcamentos.forEach((o) => {
      md += `| ${o.categoria} | ${fmtBRL(o.limite)} | ${fmtBRL(o.gasto)} | ${o.percentual}% | ${o.status} |\n`;
    });
    md += `\n`;
  }

  // --- METAS ---
  if (metas.length > 0) {
    md += `## Metas Financeiras\n\n`;
    md += `| Meta | Atual | Objetivo | Progresso | Prazo |\n`;
    md += `|------|-------|----------|-----------|-------|\n`;
    metas.forEach((m) => {
      md += `| ${m.nome} | ${fmtBRL(m.valorAtual)} | ${fmtBRL(m.valorMeta)} | ${m.percentual}% | ${fmtDate(m.prazo)} |\n`;
    });
    md += `\n`;
  }

  // --- CONTAS A PAGAR ---
  if (contasPagar.length > 0) {
    md += `## Contas a Pagar\n\n`;
    const totalPagar = contasPagar.reduce((s, t) => s + t.valor, 0);
    md += `**Total pendente:** ${fmtBRL(totalPagar)}\n\n`;
    md += `| Vencimento | Descricao | Valor |\n`;
    md += `|------------|-----------|-------|\n`;
    contasPagar.slice(0, 20).forEach((t) => {
      md += `| ${fmtDate(t.data_vencimento || t.data)} | ${t.descricao} | ${fmtBRL(t.valor)} |\n`;
    });
    if (contasPagar.length > 20) md += `\n*...e mais ${contasPagar.length - 20} itens*\n`;
    md += `\n`;
  }

  // --- ASSINATURAS / RECORRENTES ---
  if (recorrentes.length > 0) {
    md += `## Assinaturas e Recorrentes\n\n`;
    const totalRec = recorrentes.reduce((s, t) => s + t.valor, 0);
    md += `**Total mensal recorrente:** ${fmtBRL(totalRec)}\n\n`;
    md += `| Descricao | Valor | Categoria |\n`;
    md += `|-----------|-------|-----------|\n`;
    recorrentes.forEach((t) => {
      md += `| ${t.descricao} | ${fmtBRL(t.valor)} | ${t.categoria || ""} |\n`;
    });
    md += `\n`;
  }

  // --- CONTAS BANCÁRIAS ---
  if (contasBancarias.length > 0) {
    md += `## Contas Bancarias\n\n`;
    md += `| Conta | Tipo | Saldo |\n`;
    md += `|-------|------|-------|\n`;
    contasBancarias.forEach((a) => {
      md += `| ${a.nome} | ${a.tipo} | ${fmtBRL(a.saldo)} |\n`;
    });
    md += `\n**Total em contas:** ${fmtBRL(totalContas)}\n\n`;
  }

  // --- CARTÕES ---
  if (cartoes.length > 0) {
    md += `## Cartoes de Credito\n\n`;
    md += `| Cartao | Bandeira | Limite | Fatura | Disponivel |\n`;
    md += `|--------|----------|--------|--------|------------|\n`;
    cartoes.forEach((c) => {
      md += `| ${c.nome} | ${c.bandeira} | ${fmtBRL(c.limite)} | ${fmtBRL(c.fatura)} | ${fmtBRL(c.disponivel)} |\n`;
    });
    md += `\n`;
  }

  // --- INVESTIMENTOS ---
  if (listaInvestimentos.length > 0) {
    md += `## Investimentos\n\n`;
    md += `| Investimento | Tipo | Valor | Rendimento |\n`;
    md += `|--------------|------|-------|------------|\n`;
    listaInvestimentos.forEach((i) => {
      md += `| ${i.nome} | ${i.tipo} | ${fmtBRL(i.valor)} | ${i.rendimento}% a.a. |\n`;
    });
    md += `\n**Total investido:** ${fmtBRL(totalInvestimentos)}\n\n`;
  }

  // --- FINANCIAMENTOS ---
  if (financAtivos.length > 0) {
    md += `## Financiamentos Ativos\n\n`;
    md += `| Financiamento | Saldo | Parcela | Progresso |\n`;
    md += `|---------------|-------|---------|-----------|\n`;
    financAtivos.forEach((f) => {
      md += `| ${f.nome} | ${fmtBRL(f.valorTotal)} | ${fmtBRL(f.valorParcela)} | ${f.parcelaAtual}/${f.parcelas} |\n`;
    });
    md += `\n`;
  }

  // --- INDICADORES ---
  md += `## Indicadores\n\n`;
  md += `- **Taxa de Poupanca:** ${taxaPoupanca}% da receita\n`;
  md += `- **Patrimonio Total:** ${fmtBRL(patrimonioTotal)} (contas + investimentos)\n`;
  md += `- **Saldo Mensal:** ${fmtBRL(saldo)}\n`;
  if (Number(taxaPoupanca) < 0) {
    md += `- **ALERTA:** Gastos superaram as receitas neste mes\n`;
  }
  if (orcamentos.some((o) => o.status === "ESTOURADO")) {
    md += `- **ALERTA:** Orcamentos estourados detectados\n`;
  }
  md += `\n`;

  // --- OBSERVAÇÕES ---
  md += `## Observacoes Finais\n\n`;
  if (saldo >= 0) {
    md += `Mes positivo com saldo de ${fmtBRL(saldo)}. `;
  } else {
    md += `**Atencao:** Mes negativo com deficit de ${fmtBRL(Math.abs(saldo))}. `;
  }
  if (Number(taxaPoupanca) >= 20) {
    md += `Excelente taxa de poupanca de ${taxaPoupanca}%. `;
  } else if (Number(taxaPoupanca) >= 10) {
    md += `Boa taxa de poupanca de ${taxaPoupanca}%. `;
  } else if (Number(taxaPoupanca) > 0) {
    md += `Taxa de poupanca de ${taxaPoupanca}% - considere reduzir gastos. `;
  }
  if (contasPagar.length > 0) {
    md += `Existem ${contasPagar.length} conta(s) pendente(s) de pagamento. `;
  }
  md += `\n\n---\n\n`;
  md += `*Relatorio gerado automaticamente pelo FinDash em ${dataGeracao}.*\n`;

  return md;
}

// ============================================================
// 4. CONVERTER MARKDOWN EM PDF
// ============================================================

/**
 * Converte o conteúdo Markdown em um Blob PDF.
 * Usa jsPDF com rendering manual para garantir compatibilidade.
 * @param {string} markdown - Conteúdo .md
 * @param {string} periodo - Título do período
 * @returns {Promise<Blob>} Blob do PDF
 */
export async function markdownToPDF(markdown, periodo) {
  const { default: jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginL = 14;
  const marginR = 14;
  const maxW = pageW - marginL - marginR;
  let y = 15;
  let pageNum = 1;

  // Helpers
  const checkPage = (needed = 12) => {
    if (y + needed > pageH - 20) {
      doc.addPage();
      pageNum++;
      y = 15;
    }
  };

  const drawLine = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(marginL, y, pageW - marginR, y);
    y += 4;
  };

  const lines = markdown.split("\n");
  let inTable = false;
  let tableRows = [];
  let tableHeaders = [];

  const flushTable = () => {
    if (tableHeaders.length === 0) return;

    // Calcular larguras proporcionais
    const colCount = tableHeaders.length;
    const colW = maxW / colCount;

    checkPage(8 + tableRows.length * 6);

    // Header
    doc.setFillColor(30, 30, 30);
    doc.rect(marginL, y, maxW, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    tableHeaders.forEach((h, i) => {
      doc.text(h.trim(), marginL + i * colW + 1.5, y + 5, { maxWidth: colW - 3 });
    });
    y += 7;

    // Rows
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    tableRows.forEach((row, ri) => {
      checkPage(7);
      if (ri % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(marginL, y, maxW, 6, "F");
      }
      row.forEach((cell, ci) => {
        doc.text(cell.trim(), marginL + ci * colW + 1.5, y + 4, { maxWidth: colW - 3 });
      });
      y += 6;
    });
    y += 3;

    tableHeaders = [];
    tableRows = [];
    inTable = false;
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];

    // Separador ---
    if (/^---+$/.test(line.trim())) {
      if (inTable) flushTable();
      drawLine();
      continue;
    }

    // Separator de tabela |---|
    if (/^\|[\s-:|]+\|$/.test(line.trim())) {
      continue; // skip table separator row
    }

    // Linha de tabela
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const cells = line.split("|").filter((c) => c.trim() !== "");
      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    }

    // Se estávamos em tabela, flush
    if (inTable) {
      flushTable();
    }

    // Linha vazia
    if (line.trim() === "") {
      y += 3;
      continue;
    }

    // H1
    if (line.startsWith("# ")) {
      checkPage(18);
      doc.setFillColor(10, 10, 10);
      doc.rect(0, y - 2, pageW, 14, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(line.replace("# ", ""), marginL, y + 7);
      y += 16;
      continue;
    }

    // H2
    if (line.startsWith("## ")) {
      checkPage(14);
      doc.setFillColor(240, 240, 240);
      doc.rect(marginL, y, maxW, 9, "F");
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(line.replace("## ", ""), marginL + 2, y + 6);
      y += 12;
      continue;
    }

    // H3
    if (line.startsWith("### ")) {
      checkPage(10);
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(line.replace("### ", ""), marginL, y + 5);
      y += 8;
      continue;
    }

    // Lista
    if (line.trim().startsWith("- ")) {
      checkPage(7);
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(8);
      const text = line.trim().replace(/^- /, "").replace(/\*\*/g, "");
      const isBold = line.includes("**");
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.circle(marginL + 1.5, y + 2, 0.8, "F");
      doc.text(text, marginL + 5, y + 3, { maxWidth: maxW - 5 });
      const textLines = doc.splitTextToSize(text, maxW - 5);
      y += textLines.length * 4 + 2;
      continue;
    }

    // Texto normal (bold markers removidos para display)
    checkPage(7);
    const cleanText = line.replace(/\*\*/g, "").replace(/\*/g, "").replace(/_/g, "");
    const hasBold = line.includes("**");
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(8);
    doc.setFont("helvetica", hasBold ? "bold" : "normal");
    const wrapped = doc.splitTextToSize(cleanText, maxW);
    doc.text(wrapped, marginL, y + 3);
    y += wrapped.length * 4 + 1;
  }

  // Flush última tabela
  if (inTable) flushTable();

  // Footer em todas as páginas
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `FinDash | ${periodo} | Pagina ${i}/${totalPages}`,
      pageW / 2,
      pageH - 8,
      { align: "center" }
    );
  }

  return doc.output("blob");
}

// ============================================================
// 5. DISPARAR DOWNLOAD
// ============================================================

/**
 * Cria um link temporário e dispara o download do blob.
 * @param {Blob} blob - Blob do PDF
 * @param {string} filename - Nome do arquivo
 */
export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Libera memória após breve delay
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ============================================================
// 6. FUNÇÃO PRINCIPAL (ORQUESTRA TUDO)
// ============================================================

/**
 * Fluxo completo: consolida → gera markdown → converte PDF → download.
 * @param {Object} data - Dados do DataContext
 * @param {number} month - Mês (0-11)
 * @param {number} year - Ano
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function generateAndDownloadReport(data, month, year) {
  // Validar dados
  if (!data || !data.transactions) {
    return { success: false, message: "Dados nao disponiveis para gerar o relatorio." };
  }

  try {
    // 1. Consolidar
    const dados = consolidateData(data, month, year);

    // 2. Gerar Markdown
    const markdown = generateMarkdown(dados);

    // 3. Converter para PDF
    const pdfBlob = await markdownToPDF(markdown, dados.periodo);

    // 4. Download
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const filename = `relatorio-financeiro-${dateStr}.pdf`;
    triggerDownload(pdfBlob, filename);

    return { success: true, message: "Relatorio gerado com sucesso!" };
  } catch (error) {
    console.error("Erro ao gerar relatorio:", error);
    return { success: false, message: `Erro ao gerar relatorio: ${error.message}` };
  }
}
