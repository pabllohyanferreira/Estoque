import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  Download,
  Filter,
  Package,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatDate } from '../utils/formatters';
import { stockMovementsAPI } from '../services/api';
import { generateMovementsPDF, generateAdvancedPDF } from '../utils/pdfGenerator';
import AutoScrollWrapper from '../components/AutoScrollWrapper';

const Reports = () => {
  const [movements, setMovements] = useState([]);
  const [filteredMovements, setFilteredMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterType, setFilterType] = useState('all'); // all, entrada, saida
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const loadMovements = useCallback(async () => {
    try {
      setLoading(true);
      const response = await stockMovementsAPI.getAll();
      setMovements(response.data);
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  const filterMovements = useCallback(() => {
    let filtered = movements.filter(movement => {
      const movementDate = new Date(movement.created_at);
      const matchesMonth = movementDate.getMonth() === selectedMonth;
      const matchesYear = movementDate.getFullYear() === selectedYear;
      
      if (filterType === 'all') {
        return matchesMonth && matchesYear;
      }
      return matchesMonth && matchesYear && movement.type === filterType;
    });

    setFilteredMovements(filtered);
  }, [movements, selectedMonth, selectedYear, filterType]);

  useEffect(() => {
    if (movements.length > 0) {
      filterMovements();
    }
  }, [movements, filterMovements]);

  // Resetar página quando os filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear, filterType]);

  const getSummary = () => {
    const entrada = filteredMovements.filter(m => m.type === 'entrada');
    const saida = filteredMovements.filter(m => m.type === 'saida');
    
    const totalEntrada = entrada.reduce((sum, m) => sum + (m.quantity || 0), 0);
    const totalSaida = saida.reduce((sum, m) => sum + (m.quantity || 0), 0);
    
    return { entrada: entrada.length, saida: saida.length, totalEntrada, totalSaida };
  };

  const exportReport = async (type = 'basic') => {
    const summary = getSummary();
    const period = `${months[selectedMonth]} ${selectedYear}`;
    
    try {
      if (type === 'advanced') {
        await generateAdvancedPDF(filteredMovements, summary, period);
      } else {
        await generateMovementsPDF(filteredMovements, summary, period);
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };

  const summary = getSummary();

  // Cálculos para paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMovements = filteredMovements.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);

  // Função para mudar de página
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Função para ir para a próxima página
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Função para ir para a página anterior
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AutoScrollWrapper className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
          <p className="text-gray-600 dark:text-gray-400">Controle de entrada e saída de produtos</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => exportReport('basic')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2 icon-button" />
            PDF Básico
          </button>
          <button
            onClick={() => exportReport('advanced')}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2 icon-button" />
            PDF Avançado
          </button>
        </div>
      </div>

      {/* Informações sobre Exportação */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 rounded-lg p-6 shadow-sm card-expand animate-grow-in">
        <div className="flex items-center mb-4">
          <Download className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Exportação de Relatórios</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2">📄 PDF Básico</h4>
            <ul className="text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Resumo visual com cards coloridos</li>
              <li>• Tabela detalhada de movimentações</li>
              <li>• Layout profissional e limpo</li>
              <li>• Ideal para relatórios mensais</li>
            </ul>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium text-purple-600 dark:text-purple-400 mb-2">📊 PDF Avançado</h4>
            <ul className="text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Gráficos e análises visuais</li>
              <li>• Análise de tendências</li>
              <li>• Produtos mais movimentados</li>
              <li>• Ideal para apresentações</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm card-expand animate-grow-in">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mês */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mês
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {months.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          </div>

          {/* Ano */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ano
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total de Entradas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm card-expand animate-grow-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Entradas</p>
              <p className="text-2xl font-bold text-green-600">{summary.entrada}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {summary.totalEntrada} unidades
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <ArrowUpRight className="h-6 w-6 text-green-600 dark:text-green-400 icon-status" />
            </div>
          </div>
        </div>

        {/* Total de Saídas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm card-expand animate-grow-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saídas</p>
              <p className="text-2xl font-bold text-red-600">{summary.saida}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {summary.totalSaida} unidades
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
              <ArrowDownRight className="h-6 w-6 text-red-600 dark:text-red-400 icon-status" />
            </div>
          </div>
        </div>

        {/* Saldo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm card-expand animate-grow-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saldo</p>
              <p className={`text-2xl font-bold ${summary.totalEntrada - summary.totalSaida >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.totalEntrada - summary.totalSaida}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">unidades</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Package className="h-6 w-6 text-blue-600 dark:text-blue-400 icon-status" />
            </div>
          </div>
        </div>

        {/* Período */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm card-expand animate-grow-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Período</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {months[selectedMonth]}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{selectedYear}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400 icon-status" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Movimentações */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm card-expand animate-grow-in">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Movimentações ({filteredMovements.length})
            </h3>
            {filteredMovements.length > 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Página {currentPage} de {totalPages} • 
                Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredMovements.length)} de {filteredMovements.length} registros
              </div>
            )}
          </div>
        </div>
        
        <div className="table-container card-scrollable">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Quantidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Motivo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Nenhuma movimentação encontrada para o período selecionado
                  </td>
                </tr>
              ) : (
                currentMovements.map((movement, index) => (
                  <tr key={movement.id} className={`table-row-expand`} style={{ animationDelay: `${index * 0.1}s` }}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDate(movement.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {movement.item_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        movement.type === 'entrada' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {movement.type === 'entrada' ? (
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        {movement.type === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {movement.quantity} {movement.unit || 'unidade'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {movement.reason}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Controles de Paginação */}
        {filteredMovements.length > itemsPerPage && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredMovements.length)} de {filteredMovements.length} resultados
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Botão Anterior */}
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    currentPage === 1
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Anterior
                </button>
                
                {/* Números das Páginas */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, index) => {
                    const pageNumber = index + 1;
                    const isCurrentPage = pageNumber === currentPage;
                    const isNearCurrent = Math.abs(pageNumber - currentPage) <= 1;
                    const isFirstOrLast = pageNumber === 1 || pageNumber === totalPages;
                    
                    // Mostrar apenas páginas próximas, primeira e última
                    if (isNearCurrent || isFirstOrLast) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            isCurrentPage
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    } else if (pageNumber === 2 && currentPage > 3) {
                      return <span key={pageNumber} className="px-2 text-gray-400">...</span>;
                    } else if (pageNumber === totalPages - 1 && currentPage < totalPages - 2) {
                      return <span key={pageNumber} className="px-2 text-gray-400">...</span>;
                    }
                    return null;
                  })}
                </div>
                
                {/* Botão Próximo */}
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    currentPage === totalPages
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Próximo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AutoScrollWrapper>
  );
};

export default Reports; 