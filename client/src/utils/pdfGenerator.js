import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

// Cores do tema
const colors = {
  primary: '#3B82F6',
  secondary: '#6B7280',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  light: '#F3F4F6',
  dark: '#1F2937',
  white: '#FFFFFF'
};

// Configuração do PDF
const pdfConfig = {
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
  fontSize: 10,
  headerFontSize: 16,
  titleFontSize: 20
};

// Função para adicionar cabeçalho
const addHeader = (doc, title, subtitle = '') => {
  // Logo/Ícone
  doc.setFillColor(colors.primary);
  doc.rect(20, 20, 5, 5, 'F');
  
  // Título principal
  doc.setFontSize(pdfConfig.titleFontSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.dark);
  doc.text(title, 30, 25);
  
  // Subtítulo
  if (subtitle) {
    doc.setFontSize(pdfConfig.fontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.secondary);
    doc.text(subtitle, 30, 32);
  }
  
  // Data e hora
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR');
  
  doc.setFontSize(8);
  doc.setTextColor(colors.secondary);
  doc.text(`Gerado em: ${dateStr} às ${timeStr}`, 30, 40);
  
  // Linha separadora
  doc.setDrawColor(colors.primary);
  doc.setLineWidth(0.5);
  doc.line(20, 45, 190, 45);
};

// Função para adicionar resumo
const addSummary = (doc, summary, yPosition) => {
  let currentY = yPosition;
  
  // Título da seção
  doc.setFontSize(pdfConfig.headerFontSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.dark);
  doc.text('Resumo do Período', 20, currentY);
  currentY += 8;
  
  // Cards de resumo
  const cardWidth = 50;
  const cardHeight = 25;
  const startX = 20;
  const spacing = 5;
  
  // Card Entradas
  doc.setFillColor(colors.success);
  doc.rect(startX, currentY, cardWidth, cardHeight, 'F');
  doc.setTextColor(colors.white);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ENTRADAS', startX + 5, currentY + 8);
  doc.setFontSize(16);
  doc.text(summary.entrada.toString(), startX + 5, currentY + 16);
  doc.setFontSize(8);
  doc.text(`${summary.totalEntrada} unidades`, startX + 5, currentY + 22);
  
  // Card Saídas
  doc.setFillColor(colors.danger);
  doc.rect(startX + cardWidth + spacing, currentY, cardWidth, cardHeight, 'F');
  doc.setTextColor(colors.white);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SAÍDAS', startX + cardWidth + spacing + 5, currentY + 8);
  doc.setFontSize(16);
  doc.text(summary.saida.toString(), startX + cardWidth + spacing + 5, currentY + 16);
  doc.setFontSize(8);
  doc.text(`${summary.totalSaida} unidades`, startX + cardWidth + spacing + 5, currentY + 22);
  
  // Card Saldo
  const saldo = summary.totalEntrada - summary.totalSaida;
  const saldoColor = saldo >= 0 ? colors.success : colors.danger;
  doc.setFillColor(saldoColor);
  doc.rect(startX + (cardWidth + spacing) * 2, currentY, cardWidth, cardHeight, 'F');
  doc.setTextColor(colors.white);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SALDO', startX + (cardWidth + spacing) * 2 + 5, currentY + 8);
  doc.setFontSize(16);
  doc.text(saldo.toString(), startX + (cardWidth + spacing) * 2 + 5, currentY + 16);
  doc.setFontSize(8);
  doc.text('unidades', startX + (cardWidth + spacing) * 2 + 5, currentY + 22);
  
  return currentY + cardHeight + 10;
};

// Função para adicionar tabela de movimentações
const addMovementsTable = (doc, movements, yPosition) => {
  let currentY = yPosition;
  
  // Título da seção
  doc.setFontSize(pdfConfig.headerFontSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.dark);
  doc.text('Detalhamento de Movimentações', 20, currentY);
  currentY += 8;
  
  // Preparar dados da tabela
  const tableData = movements.map(movement => [
    formatDate(movement.created_at),
    movement.item_name || 'N/A',
    movement.type === 'entrada' ? 'ENTRADA' : 'SAÍDA',
    `${movement.quantity} ${movement.unit || 'unidade'}`,
    movement.reason || 'N/A'
  ]);
  
  // Configuração da tabela
  const tableConfig = {
    startY: currentY,
    head: [['Data', 'Produto', 'Tipo', 'Quantidade', 'Motivo']],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: colors.light,
      lineWidth: 0.1,
      textColor: colors.dark,
      font: 'helvetica'
    },
    headStyles: {
      fillColor: colors.primary,
      textColor: colors.white,
      fontStyle: 'bold',
      fontSize: 9
    },
    alternateRowStyles: {
      fillColor: colors.light
    },
    columnStyles: {
      0: { cellWidth: 25 }, // Data
      1: { cellWidth: 50 }, // Produto
      2: { cellWidth: 20 }, // Tipo
      3: { cellWidth: 25 }, // Quantidade
      4: { cellWidth: 50 }  // Motivo
    },
    margin: { left: 20, right: 20 }
  };
  
  // Gerar tabela
  doc.autoTable(tableConfig);
  
  return doc.lastAutoTable.finalY + 10;
};

// Função para adicionar rodapé
const addFooter = (doc) => {
  const pageHeight = doc.internal.pageSize.height;
  const footerY = pageHeight - 20;
  
  // Linha separadora
  doc.setDrawColor(colors.primary);
  doc.setLineWidth(0.5);
  doc.line(20, footerY - 5, 190, footerY - 5);
  
  // Texto do rodapé
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.secondary);
  doc.text('Sistema de Estoque Lojify - Relatório Gerado Automaticamente', 20, footerY);
  
  // Número da página
  const pageNumber = doc.internal.getNumberOfPages();
  doc.text(`Página ${pageNumber}`, 190, footerY, { align: 'right' });
};

// Função para formatar data
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

// Função principal para gerar PDF
export const generateMovementsPDF = async (movements, summary, period) => {
  // Criar novo documento PDF
  const doc = new jsPDF(pdfConfig.orientation, pdfConfig.unit, pdfConfig.format);
  
  // Adicionar cabeçalho
  addHeader(doc, 'Relatório de Movimentações', `Período: ${period}`);
  
  // Adicionar resumo
  let currentY = addSummary(doc, summary, 55);
  
  // Verificar se há espaço suficiente para a tabela
  const availableSpace = doc.internal.pageSize.height - currentY - 30;
  const estimatedTableHeight = movements.length * 8 + 20;
  
  if (estimatedTableHeight > availableSpace) {
    // Adicionar nova página se necessário
    doc.addPage();
    currentY = 20;
  }
  
  // Adicionar tabela de movimentações
  addMovementsTable(doc, movements, currentY);
  
  // Adicionar rodapé
  addFooter(doc);
  
  // Salvar PDF
  const fileName = `relatorio-movimentacoes-${period.toLowerCase().replace(/\s+/g, '-')}.pdf`;
  doc.save(fileName);
};

// Função para gerar PDF com gráficos (versão avançada)
export const generateAdvancedPDF = async (movements, summary, period) => {
  // Criar novo documento PDF
  const doc = new jsPDF(pdfConfig.orientation, pdfConfig.unit, pdfConfig.format);
  
  // Adicionar cabeçalho
  addHeader(doc, 'Relatório Avançado de Estoque', `Período: ${period}`);
  
  // Adicionar resumo
  let currentY = addSummary(doc, summary, 55);
  
  // Adicionar gráfico de pizza simples (representação visual)
  currentY = addPieChart(doc, summary, currentY + 10);
  
  // Adicionar tabela de movimentações
  currentY = addMovementsTable(doc, movements, currentY + 10);
  
  // Adicionar análise de tendências
  // currentY = addTrendAnalysis(doc, movements, currentY + 10);
  
  // Adicionar rodapé
  addFooter(doc);
  
  // Salvar PDF
  const fileName = `relatorio-avancado-${period.toLowerCase().replace(/\s+/g, '-')}.pdf`;
  doc.save(fileName);
};

// Função para adicionar gráfico de pizza simples
const addPieChart = (doc, summary, yPosition) => {
  let currentY = yPosition;
  
  // Título da seção
  doc.setFontSize(pdfConfig.headerFontSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.dark);
  doc.text('Distribuição de Movimentações', 20, currentY);
  currentY += 8;
  
  // Círculo representando o gráfico
  const centerX = 50;
  const centerY = currentY + 15;
  const radius = 15;
  
  // Desenhar círculo
  doc.setDrawColor(colors.primary);
  doc.setLineWidth(1);
  doc.circle(centerX, centerY, radius, 'S');
  
  // Calcular proporções
  const total = summary.entrada + summary.saida;
  
  // Desenhar seções (simplificado)
  if (summary.entrada > 0) {
    doc.setFillColor(colors.success);
    doc.circle(centerX, centerY, radius, 'F');
  }
  
  if (summary.saida > 0) {
    doc.setFillColor(colors.danger);
    // Aqui você implementaria a lógica para desenhar a seção da saída
  }
  
  // Legenda
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  // Legenda Entradas
  doc.setFillColor(colors.success);
  doc.rect(80, currentY, 5, 5, 'F');
  doc.setTextColor(colors.dark);
  doc.text(`Entradas: ${summary.entrada} (${((summary.entrada / total) * 100).toFixed(1)}%)`, 90, currentY + 4);
  
  // Legenda Saídas
  doc.setFillColor(colors.danger);
  doc.rect(80, currentY + 10, 5, 5, 'F');
  doc.setTextColor(colors.dark);
  doc.text(`Saídas: ${summary.saida} (${((summary.saida / total) * 100).toFixed(1)}%)`, 90, currentY + 14);
  
  return currentY + 30;
};

// Função para adicionar análise de tendências
const addTrendAnalysis = (doc, movements, yPosition) => {
  let currentY = yPosition;
  
  // Verificar se há espaço suficiente
  if (currentY > doc.internal.pageSize.height - 50) {
    doc.addPage();
    currentY = 20;
  }
  
  // Título da seção
  doc.setFontSize(pdfConfig.headerFontSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.dark);
  doc.text('Análise de Tendências', 20, currentY);
  currentY += 8;
  
  // Calcular tendências
  const entradaMovements = movements.filter(m => m.type === 'entrada');
  const saidaMovements = movements.filter(m => m.type === 'saida');
  
  const avgEntrada = entradaMovements.length > 0 
    ? entradaMovements.reduce((sum, m) => sum + m.quantity, 0) / entradaMovements.length 
    : 0;
  
  const avgSaida = saidaMovements.length > 0 
    ? saidaMovements.reduce((sum, m) => sum + m.quantity, 0) / saidaMovements.length 
    : 0;
  
  // Informações de tendência
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.dark);
  
  doc.text(`• Média de entrada por movimentação: ${avgEntrada.toFixed(1)} unidades`, 20, currentY);
  currentY += 5;
  doc.text(`• Média de saída por movimentação: ${avgSaida.toFixed(1)} unidades`, 20, currentY);
  currentY += 5;
  
  const saldo = avgEntrada - avgSaida;
  const trend = saldo > 0 ? 'Positiva' : saldo < 0 ? 'Negativa' : 'Neutra';
  const trendColor = saldo > 0 ? colors.success : saldo < 0 ? colors.danger : colors.secondary;
  
  doc.setTextColor(trendColor);
  doc.text(`• Tendência do período: ${trend}`, 20, currentY);
  currentY += 5;
  
  // Produtos mais movimentados
  const productCount = {};
  movements.forEach(m => {
    const product = m.item_name || 'Desconhecido';
    productCount[product] = (productCount[product] || 0) + 1;
  });
  
  const topProducts = Object.entries(productCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);
  
  if (topProducts.length > 0) {
    currentY += 5;
    doc.setTextColor(colors.dark);
    doc.text('• Produtos mais movimentados:', 20, currentY);
    currentY += 5;
    
    topProducts.forEach(([product, count], index) => {
      doc.text(`  ${index + 1}. ${product} (${count} movimentações)`, 25, currentY);
      currentY += 4;
    });
  }
  
  return currentY + 10;
};

// Função para capturar elemento HTML como imagem
export const captureElementAsImage = async (elementId) => {
  const element = document.getElementById(elementId);
  if (!element) return null;
  
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Erro ao capturar elemento:', error);
    return null;
  }
};

// Função para adicionar imagem ao PDF
export const addImageToPDF = (doc, imageDataUrl, x, y, width, height) => {
  if (imageDataUrl) {
    doc.addImage(imageDataUrl, 'PNG', x, y, width, height);
  }
}; 