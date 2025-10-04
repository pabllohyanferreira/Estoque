import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Receipt, Calendar, Users, CheckCircle, ShoppingCart, X, ChevronDown, ChevronRight } from 'lucide-react';
import { accountsReceivableAPI, clientsAPI, salesAPI } from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, isOverdue } from '../utils/formatters';
import AccountModal from '../components/AccountModal';
import ConfirmModal from '../components/ConfirmModal';
import PayAccountModal from '../components/PayAccountModal';
import useScroll from '../hooks/useScroll';

const AccountsReceivable = () => {
  const [accounts, setAccounts] = useState([]);
  const [clients, setClients] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountToPay, setAccountToPay] = useState(null);
  
  // Estados para mostrar vendas vinculadas
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [selectedClientSales, setSelectedClientSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);
  
  // Estados para organização por cliente (sempre ativo)
  const [groupByClient, setGroupByClient] = useState(true);
  const [expandedClients, setExpandedClients] = useState(new Set());
  
  // Estados para controlar gavetas das vendas
  const [expandedSales, setExpandedSales] = useState(new Set());
  
  // Hook personalizado para scroll
  const { scrollContainerRef, scrollStyles, scrollClasses } = useScroll({
    scrollSpeed: 0.5,
    smooth: true,
    maxHeight: 600
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsResponse, clientsResponse, salesResponse] = await Promise.all([
        accountsReceivableAPI.getAll(),
        clientsAPI.getAll(),
        salesAPI.getAll()
      ]);
      setAccounts(accountsResponse.data);
      setClients(clientsResponse.data);
      setSales(salesResponse.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para carregar vendas de um cliente específico
  const loadClientSales = async (clientId) => {
    try {
      setLoadingSales(true);
      const response = await salesAPI.getAll({ client_id: clientId });
      setSelectedClientSales(response.data);
    } catch (error) {
      console.error('Erro ao carregar vendas do cliente:', error);
      toast.error('Erro ao carregar vendas do cliente');
    } finally {
      setLoadingSales(false);
    }
  };

  // Função para mostrar vendas vinculadas
  const handleShowClientSales = async (clientId, clientName) => {
    setShowSalesModal(true);
    await loadClientSales(clientId);
  };

  // Função para obter vendas de um cliente
  // const getClientSales = (clientId) => {
  //   return sales.filter(sale => sale.client_id === clientId);
  // };

  // Função para obter contas a receber de vendas parceladas
  const getSalesAccounts = (clientId) => {
    return accounts.filter(account => 
      account.client_id === clientId && 
      account.category === 'Venda Parcelada'
    );
  };

  // Função para agrupar contas por cliente e venda
  const getAccountsByClient = () => {
    const grouped = {};
    
    console.log('🔄 Agrupando contas por cliente...');
    console.log('📊 Total de contas:', accounts.length);
    console.log('📋 Contas para agrupar:', accounts);
    
    accounts.forEach(account => {
      console.log('🔍 Processando conta:', {
        id: account.id,
        description: account.description,
        sale_id: account.sale_id,
        status: account.status,
        amount: account.amount
      });
      
      const clientId = account.client_id;
      const clientName = account.client_name || 'Cliente não informado';
      
      // Usar o sale_id diretamente da conta, ou extrair da descrição como fallback
      let saleId = account.sale_id;
      let saleKey = 'outros';
      
      if (saleId) {
        saleKey = `Venda #${saleId}`;
        console.log('✅ Usando sale_id direto:', saleId, 'saleKey:', saleKey);
      } else {
        // Fallback: extrair da descrição se não tiver sale_id
        const saleMatch = account.description.match(/Venda #(\d+)/);
        if (saleMatch) {
          saleId = saleMatch[1];
          saleKey = `Venda #${saleId}`;
          console.log('⚠️ Usando sale_id extraído da descrição:', saleId, 'saleKey:', saleKey);
        } else {
          console.log('❌ Nenhum sale_id encontrado para conta:', account.description);
        }
      }
      
      // Buscar título da venda correspondente
      const correspondingSale = sales.find(sale => sale.id === parseInt(saleId));
      const saleTitle = correspondingSale?.title || saleKey;
      
      console.log('🔍 Buscando venda com ID:', saleId, 'parseInt:', parseInt(saleId));
      console.log('📋 Vendas disponíveis:', sales.map(s => ({ id: s.id, title: s.title })));
      console.log('✅ Venda encontrada:', correspondingSale);
      console.log('📝 Título final:', saleTitle);
      
      if (!grouped[clientId]) {
        grouped[clientId] = {
          clientId,
          clientName,
          sales: {},
          totalAmount: 0,
          pendingAmount: 0,
          paidAmount: 0,
          overdueAmount: 0
        };
      }
      
      if (!grouped[clientId].sales[saleKey]) {
        grouped[clientId].sales[saleKey] = {
          saleId: saleId,
          saleKey: saleKey,
          saleTitle: saleTitle,
          accounts: [],
          totalAmount: 0,
          pendingAmount: 0,
          paidAmount: 0,
          overdueAmount: 0,
          installments: 0
        };
      }
      
      grouped[clientId].sales[saleKey].accounts.push(account);
      grouped[clientId].sales[saleKey].totalAmount += account.amount;
      grouped[clientId].sales[saleKey].installments = grouped[clientId].sales[saleKey].accounts.length;
      
      // Atualizar totais do cliente
      grouped[clientId].totalAmount += account.amount;
      
      if (account.status === 'paid') {
        grouped[clientId].sales[saleKey].paidAmount += account.amount;
        grouped[clientId].paidAmount += account.amount;
      } else if (account.status === 'pending') {
        if (isOverdue(account.due_date)) {
          grouped[clientId].sales[saleKey].overdueAmount += account.amount;
          grouped[clientId].overdueAmount += account.amount;
        } else {
          grouped[clientId].sales[saleKey].pendingAmount += account.amount;
          grouped[clientId].pendingAmount += account.amount;
        }
      }
    });
    
    // Converter sales de objeto para array e ordenar
    Object.keys(grouped).forEach(clientId => {
      const salesArray = Object.values(grouped[clientId].sales);
      salesArray.sort((a, b) => {
        // Ordenar por número da venda (se for numérico)
        const aNum = parseInt(a.saleId);
        const bNum = parseInt(b.saleId);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return a.saleKey.localeCompare(b.saleKey);
      });
      grouped[clientId].sales = salesArray;
    });
    
    return Object.values(grouped).sort((a, b) => a.clientName.localeCompare(b.clientName));
  };

  // Função para alternar expansão de cliente
  const toggleClientExpansion = (clientId) => {
    const newExpanded = new Set(expandedClients);
    if (newExpanded.has(clientId)) {
      newExpanded.delete(clientId);
    } else {
      newExpanded.add(clientId);
    }
    setExpandedClients(newExpanded);
  };

  const toggleSaleExpansion = (saleKey) => {
    const newExpanded = new Set(expandedSales);
    if (newExpanded.has(saleKey)) {
      newExpanded.delete(saleKey);
    } else {
      newExpanded.add(saleKey);
    }
    setExpandedSales(newExpanded);
  };

  // Função para filtrar contas baseado nos filtros ativos
  const getFilteredAccounts = () => {
    let filtered = accounts;
    
    if (searchTerm) {
      filtered = filtered.filter(account => 
        account.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedStatus) {
      filtered = filtered.filter(account => account.status === selectedStatus);
    }
    
    if (selectedClient) {
      filtered = filtered.filter(account => account.client_id === parseInt(selectedClient));
    }
    
    return filtered;
  };

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (searchTerm) params.search = searchTerm;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedClient) params.client_id = selectedClient;

      const response = await accountsReceivableAPI.getAll(params);
      setAccounts(response.data);
    } catch (error) {
      toast.error('Erro ao carregar contas a receber');
      console.error('Erro ao carregar contas a receber:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (accountData) => {
    try {
      await accountsReceivableAPI.create(accountData);
      toast.success('Conta a receber criada com sucesso!');
      setShowAccountModal(false);
      loadAccounts();
    } catch (error) {
      toast.error('Erro ao criar conta a receber');
      console.error('Erro ao criar conta a receber:', error);
    }
  };

  const handleUpdateAccount = async (accountData) => {
    try {
      await accountsReceivableAPI.update(editingAccount.id, accountData);
      toast.success('Conta a receber atualizada com sucesso!');
      setShowAccountModal(false);
      setEditingAccount(null);
      loadAccounts();
    } catch (error) {
      toast.error('Erro ao atualizar conta a receber');
      console.error('Erro ao atualizar conta a receber:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await accountsReceivableAPI.delete(selectedAccount.id);
      toast.success('Conta a receber deletada com sucesso!');
      setShowConfirmModal(false);
      setSelectedAccount(null);
      loadAccounts();
    } catch (error) {
      toast.error('Erro ao deletar conta a receber');
      console.error('Erro ao deletar conta a receber:', error);
    }
  };

  const openEditModal = (account) => {
    setEditingAccount(account);
    setShowAccountModal(true);
  };

  const openDeleteModal = (account) => {
    setSelectedAccount(account);
    setShowConfirmModal(true);
  };

  const openPayModal = (account) => {
    setAccountToPay(account);
    setShowPayModal(true);
  };

  const handlePayAccount = async () => {
    try {
      console.log('🔄 Tentando marcar conta como paga:', accountToPay);
      const response = await accountsReceivableAPI.markAsPaid(accountToPay.id);
      console.log('✅ Resposta da API:', response);
      toast.success('Conta marcada como paga com sucesso!');
      setShowPayModal(false);
      setAccountToPay(null);
      
      // Recarregar dados completos
      console.log('🔄 Recarregando dados após pagamento individual...');
      await loadData();
    } catch (error) {
      toast.error('Erro ao marcar conta como paga');
      console.error('❌ Erro ao marcar conta como paga:', error);
    }
  };

  // Função para deletar venda e todas suas parcelas
  const handleDeleteSale = async (saleId, saleTitle) => {
    try {
      console.log('🗑️ Iniciando deleção da venda:', saleId);
      
      // Buscar todas as parcelas desta venda
      const saleAccounts = accounts.filter(account => 
        (account.sale_id == saleId || account.sale_id === saleId)
      );

      console.log('📋 Parcelas encontradas para deletar:', saleAccounts.length);
      console.log('📋 Detalhes das parcelas:', saleAccounts);

      if (saleAccounts.length === 0) {
        console.log('❌ Nenhuma parcela encontrada para esta venda');
        toast('Não há parcelas para esta venda', {
          icon: 'ℹ️',
          style: {
            background: '#3b82f6',
            color: '#fff',
          },
        });
        return;
      }

      // Confirmar deleção
      const confirmMessage = `⚠️ ATENÇÃO: Esta ação não pode ser desfeita!\n\nDeseja deletar a venda "${saleTitle}" e todas as suas ${saleAccounts.length} parcelas?\n\nTotal a ser deletado: ${formatCurrency(saleAccounts.reduce((sum, acc) => sum + acc.amount, 0))}`;
      
      if (window.confirm(confirmMessage)) {
        console.log('✅ Usuário confirmou deleção da venda');
        
        // Deletar todas as parcelas
        const deletePromises = saleAccounts.map(account => {
          console.log('🗑️ Deletando parcela:', account.id);
          return accountsReceivableAPI.delete(account.id);
        });

        await Promise.all(deletePromises);
        
        console.log('✅ Todas as parcelas foram deletadas com sucesso');
        toast.success(`Venda "${saleTitle}" e suas ${saleAccounts.length} parcelas foram deletadas com sucesso!`);
        
        // Recarregar dados completos
        console.log('🔄 Recarregando dados...');
        await loadData();
      }
    } catch (error) {
      toast.error('Erro ao deletar venda');
      console.error('❌ Erro ao deletar venda:', error);
    }
  };

  // Função para pagar todas as parcelas de uma venda
  const handlePayAllInstallments = async (saleId, saleTitle) => {
    try {
      console.log('🔄 Iniciando pagamento em lote para venda:', saleId);
      console.log('📊 Contas disponíveis:', accounts.length);
      console.log('🔍 Buscando contas com sale_id:', saleId);
      
      // Buscar todas as contas pendentes desta venda
      const pendingAccounts = accounts.filter(account => 
        (account.sale_id == saleId || account.sale_id === saleId) && account.status !== 'paid'
      );

      console.log('📋 Contas pendentes encontradas:', pendingAccounts.length);
      console.log('📋 Detalhes das contas pendentes:', pendingAccounts);

      if (pendingAccounts.length === 0) {
        console.log('❌ Nenhuma conta pendente encontrada');
        toast('Não há parcelas pendentes para esta venda', {
          icon: 'ℹ️',
          style: {
            background: '#3b82f6',
            color: '#fff',
          },
        });
        return;
      }

      // Confirmar pagamento em lote
      const confirmMessage = `Deseja marcar todas as ${pendingAccounts.length} parcelas pendentes da venda "${saleTitle}" como pagas?\n\nTotal: ${formatCurrency(pendingAccounts.reduce((sum, acc) => sum + acc.amount, 0))}`;
      
      if (window.confirm(confirmMessage)) {
        console.log('✅ Usuário confirmou pagamento em lote');
        
        // Pagar todas as parcelas
        const promises = pendingAccounts.map(account => {
          console.log('💳 Pagando conta:', account.id);
          return accountsReceivableAPI.markAsPaid(account.id);
        });

        await Promise.all(promises);
        
        console.log('✅ Todas as parcelas foram pagas com sucesso');
        toast.success(`${pendingAccounts.length} parcelas marcadas como pagas com sucesso!`);
        
        // Recarregar dados completos
        console.log('🔄 Recarregando dados...');
        await loadData();
      }
    } catch (error) {
      toast.error('Erro ao pagar parcelas em lote');
      console.error('❌ Erro ao pagar parcelas em lote:', error);
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'pix': return 'PIX';
      case 'money': return 'Dinheiro';
      case 'credit_card': return 'Cartão de Crédito';
      case 'installments': return 'Parcelado';
      default: return method;
    }
  };

  const getStatusColor = (status, dueDate = null) => {
    if (status === 'paid') return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200';
    if (status === 'overdue' || (dueDate && isOverdue(dueDate))) return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200';
    return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200';
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'paid': return 'Pago';
      case 'overdue': return 'Vencido';
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      case 'refunded': return 'Reembolsada';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header da Página */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/25">
              <Receipt className="h-8 w-8 text-white drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Contas a Receber
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Gerencie seus recebimentos
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Ações */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar por descrição ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex space-x-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
              >
                <option value="">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="overdue">Vencido</option>
              </select>
              
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
              >
                <option value="">Todos os clientes</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              
              <div className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Agrupado por Cliente
              </div>
              
              <button
                onClick={loadAccounts}
                className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-xl shadow-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </button>
              <button
                onClick={() => setShowAccountModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta a Receber
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Contas */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="spinner"></div>
            </div>
          ) : groupByClient ? (
            // Visualização Agrupada por Cliente
            <div className="p-6">
              {getAccountsByClient().length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhuma conta a receber encontrada</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Comece criando sua primeira conta a receber.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {getAccountsByClient().map((clientGroup) => (
                    <div key={clientGroup.clientId} className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-700 dark:to-slate-700 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                      {/* Header do Cliente */}
                      <div 
                        className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        onClick={() => toggleClientExpansion(clientGroup.clientId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-500 rounded-lg">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {clientGroup.clientName}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {clientGroup.sales.length} venda{clientGroup.sales.length !== 1 ? 's' : ''} • {clientGroup.sales.reduce((total, sale) => total + sale.accounts.length, 0)} parcela{clientGroup.sales.reduce((total, sale) => total + sale.accounts.length, 0) !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            {/* Resumo Financeiro */}
                            <div className="text-right">
                              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatCurrency(clientGroup.totalAmount)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600 dark:text-gray-400">Pendente</div>
                              <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                                {formatCurrency(clientGroup.pendingAmount)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600 dark:text-gray-400">Vencido</div>
                              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                                {formatCurrency(clientGroup.overdueAmount)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600 dark:text-gray-400">Pago</div>
                              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(clientGroup.paidAmount)}
                              </div>
                            </div>
                            {/* Botão de Expansão */}
                            <button className="p-2 text-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors">
                              <svg 
                                className={`h-5 w-5 transform transition-transform ${expandedClients.has(clientGroup.clientId) ? 'rotate-180' : ''}`} 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Lista de Contas do Cliente */}
                      {expandedClients.has(clientGroup.clientId) && (
                        <div className="border-t border-gray-200 dark:border-gray-600">
                          <div className="p-4 space-y-4">
                            {clientGroup.sales.map((saleGroup) => (
                              <div key={saleGroup.saleKey} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                                {/* Header da Venda - Completo */}
                                <div 
                                  className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gradient-to-r hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30 transition-colors"
                                  onClick={() => toggleSaleExpansion(saleGroup.saleKey)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <div className="p-2 bg-purple-500 rounded-lg">
                                        <ShoppingCart className="h-4 w-4 text-white" />
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                          {saleGroup.saleTitle}
                                        </h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                          {saleGroup.installments} parcela{saleGroup.installments !== 1 ? 's' : ''} • Total: {formatCurrency(saleGroup.totalAmount)}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-4">
                                      {/* Resumo Financeiro */}
                                      <div className="flex items-center space-x-3 text-xs">
                                        <div className="text-right">
                                          <div className="text-gray-600 dark:text-gray-400">Pendente</div>
                                          <div className="font-semibold text-yellow-600 dark:text-yellow-400">
                                            {formatCurrency(saleGroup.pendingAmount)}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-gray-600 dark:text-gray-400">Vencido</div>
                                          <div className="font-semibold text-red-600 dark:text-red-400">
                                            {formatCurrency(saleGroup.overdueAmount)}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-gray-600 dark:text-gray-400">Pago</div>
                                          <div className="font-semibold text-green-600 dark:text-green-400">
                                            {formatCurrency(saleGroup.paidAmount)}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Botões de Ação */}
                                      <div className="flex items-center space-x-2">
                                        {/* Botão para pagar todas as parcelas */}
                                        {saleGroup.pendingAmount > 0 && (
                                          <button
                                            onClick={() => handlePayAllInstallments(saleGroup.saleId, saleGroup.saleTitle)}
                                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center space-x-1"
                                            title="Pagar todas as parcelas pendentes desta venda"
                                          >
                                            <CheckCircle className="h-3 w-3" />
                                            <span>Pagar Todas</span>
                                          </button>
                                        )}
                                        
                                        {/* Botão para deletar venda */}
                                        <button
                                          onClick={() => handleDeleteSale(saleGroup.saleId, saleGroup.saleTitle)}
                                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center space-x-1"
                                          title="Deletar esta venda e todas suas parcelas"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                          <span>Deletar Venda</span>
                                        </button>
                                        
                                        {/* Indicador de opções */}
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          ou clique individualmente
                                        </div>
                                      </div>
                                      
                                      {/* Ícone de seta para expandir/contrair */}
                                      <div className="flex items-center">
                                        {expandedSales.has(saleGroup.saleKey) ? (
                                          <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                        ) : (
                                          <ChevronRight className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Lista de Parcelas da Venda */}
                                {expandedSales.has(saleGroup.saleKey) && (
                                  <div className="overflow-x-auto">
                                    <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                          Parcela
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                          Valor
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                          Vencimento
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                          Status
                                        </th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                          Ações
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                                      {saleGroup.accounts.map((account) => (
                                        <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                          <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="flex items-center">
                                              <Receipt className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                                              <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{account.description}</div>
                                                {account.category && (
                                                  <div className="text-xs text-gray-500 dark:text-gray-400">{account.category}</div>
                                                )}
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {formatCurrency(account.amount)}
                                          </td>
                                          <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="flex items-center">
                                              <Calendar className="h-3 w-3 text-gray-400 dark:text-gray-500 mr-1" />
                                              <span className={`text-sm ${isOverdue(account.due_date) ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-900 dark:text-white'}`}>
                                                {formatDate(account.due_date)}
                                              </span>
                                            </div>
                                          </td>
                                          <td className="px-3 py-2 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(account.status, account.due_date)}`}>
                                              {getStatusLabel(account.status)}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-1">
                                              {account.status !== 'paid' && (
                                                <button
                                                  onClick={() => openPayModal(account)}
                                                  className="text-green-600 hover:text-green-900 btn-action"
                                                  title="Marcar como Paga"
                                                >
                                                  <CheckCircle className="h-4 w-4 icon-action" />
                                                </button>
                                              )}
                                              <button
                                                onClick={() => openEditModal(account)}
                                                className="text-indigo-600 hover:text-indigo-900 btn-action"
                                                title="Editar"
                                              >
                                                <Edit className="h-4 w-4 icon-action" />
                                              </button>
                                              <button
                                                onClick={() => openDeleteModal(account)}
                                                className="text-red-600 hover:text-red-900 btn-action"
                                                title="Deletar"
                                              >
                                                <Trash2 className="h-4 w-4 icon-action" />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Visualização em Tabela Simples (original)
            <div 
              ref={scrollContainerRef}
              className={scrollClasses}
              style={scrollStyles}
            >
              <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Vencimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {getFilteredAccounts().map((account, index) => (
                    <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors table-row-expand" style={{ animationDelay: `${index * 50}ms` }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Receipt className="h-8 w-8 text-gray-400 dark:text-gray-500 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{account.description}</div>
                            {account.sale_title && (
                              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                📦 {account.sale_title}
                              </div>
                            )}
                            {account.payment_method && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                💳 {getPaymentMethodLabel(account.payment_method)}
                                {account.installments > 1 && ` • ${account.installments}x`}
                              </div>
                            )}
                            {account.sale_date && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                📅 Venda: {formatDate(account.sale_date)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-1" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {account.client_name || 'Cliente não informado'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(account.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-1" />
                          <span className={`text-sm ${isOverdue(account.due_date) ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-900 dark:text-white'}`}>
                            {formatDate(account.due_date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(account.status, account.due_date)}`}>
                          {getStatusLabel(account.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Botão para visualizar vendas vinculadas */}
                          {account.client_id && (
                            <button
                              onClick={() => handleShowClientSales(account.client_id, account.client_name)}
                              className="text-blue-600 hover:text-blue-900 btn-action"
                              title="Visualizar Vendas do Cliente"
                            >
                              <ShoppingCart className="h-4 w-4 icon-action" />
                            </button>
                          )}
                          
                          {/* Botão para deletar venda (se houver sale_id) */}
                          {account.sale_id && (
                            <button
                              onClick={() => handleDeleteSale(account.sale_id, account.sale_title || account.description)}
                              className="text-red-600 hover:text-red-900 btn-action"
                              title="Deletar esta venda e todas suas parcelas"
                            >
                              <Trash2 className="h-4 w-4 icon-action" />
                            </button>
                          )}
                          
                          {/* Botão para pagar todas as parcelas desta venda (se houver sale_id) */}
                          {account.sale_id && account.status !== 'paid' && (
                            <button
                              onClick={() => handlePayAllInstallments(account.sale_id, account.sale_title || account.description)}
                              className="text-blue-600 hover:text-blue-900 btn-action"
                              title="Pagar todas as parcelas desta venda"
                            >
                              <CheckCircle className="h-4 w-4 icon-action" />
                            </button>
                          )}
                          
                          {/* Botão individual para pagar esta conta */}
                          {account.status !== 'paid' && (
                            <button
                              onClick={() => openPayModal(account)}
                              className="text-green-600 hover:text-green-900 btn-action"
                              title="Marcar como Paga"
                            >
                              <CheckCircle className="h-4 w-4 icon-action" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => openEditModal(account)}
                            className="text-indigo-600 hover:text-indigo-900 btn-action"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4 icon-action" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(account)}
                            className="text-red-600 hover:text-red-900 btn-action"
                            title="Deletar"
                          >
                            <Trash2 className="h-4 w-4 icon-action" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {!loading && getFilteredAccounts().length === 0 && (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhuma conta a receber encontrada</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Comece criando sua primeira conta a receber.
              </p>
            </div>
          )}
        </div>

        {/* Modais */}
        <AccountModal
          isOpen={showAccountModal}
          onClose={() => {
            setShowAccountModal(false);
            setEditingAccount(null);
          }}
          onSubmit={editingAccount ? handleUpdateAccount : handleCreateAccount}
          account={editingAccount}
          type="receivable"
          clients={clients}
        />

        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setSelectedAccount(null);
          }}
          onConfirm={handleDeleteAccount}
          title="Deletar Conta a Receber"
          message={`Tem certeza que deseja deletar a conta "${selectedAccount?.description}"? Esta ação não pode ser desfeita.`}
        />

        <PayAccountModal
          isOpen={showPayModal}
          onClose={() => {
            setShowPayModal(false);
            setAccountToPay(null);
          }}
          onConfirm={handlePayAccount}
          account={accountToPay}
        />

        {/* Modal de Vendas Vinculadas */}
        {showSalesModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={() => setShowSalesModal(false)}></div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
                {/* Header do Modal */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                        <ShoppingCart className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          Vendas do Cliente
                        </h3>
                        <p className="text-blue-100 text-sm">
                          Histórico completo de vendas e contas a receber
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowSalesModal(false)}
                      className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Conteúdo do Modal */}
                <div className="px-6 py-6">
                  {loadingSales ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-500 dark:text-gray-400">Carregando vendas do cliente...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Vendas do Cliente */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                          <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" />
                          Vendas Realizadas ({selectedClientSales.length})
                        </h4>
                        {selectedClientSales.length === 0 ? (
                          <div className="text-center py-8">
                            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">Nenhuma venda encontrada para este cliente</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {selectedClientSales.map((sale) => (
                              <div key={sale.id} className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-semibold text-gray-900 dark:text-white">
                                      Venda #{sale.id} - {formatCurrency(sale.total_amount)}
                                    </h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {formatDate(sale.created_at)} • {getPaymentMethodLabel(sale.payment_method)}
                                    </p>
                                    {sale.payment_method === 'installments' && (
                                      <p className="text-sm text-blue-600 dark:text-blue-400">
                                        {sale.installments}x de {formatCurrency(sale.installment_value)}
                                      </p>
                                    )}
                                  </div>
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sale.status)}`}>
                                    {getStatusLabel(sale.status)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Contas a Receber Vinculadas */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                          <Receipt className="h-5 w-5 mr-2 text-green-600" />
                          Contas a Receber Vinculadas
                        </h4>
                        {getSalesAccounts(selectedClientSales[0]?.client_id).length === 0 ? (
                          <div className="text-center py-8">
                            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">Nenhuma conta a receber vinculada</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {getSalesAccounts(selectedClientSales[0]?.client_id).map((account) => (
                              <div key={account.id} className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-semibold text-gray-900 dark:text-white">
                                      {account.description}
                                    </h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      Vencimento: {formatDate(account.due_date)}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                      {formatCurrency(account.amount)}
                                    </p>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(account.status, account.due_date)}`}>
                                      {getStatusLabel(account.status)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountsReceivable;