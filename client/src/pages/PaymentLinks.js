import React, { useState, useEffect, useCallback } from 'react';
import { 
  CreditCard, 
  Plus, 
  QrCode,
  DollarSign,
  Calendar,
  Users,
  Eye,
  Copy,
  ExternalLink,
  Trash2,
  X,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { paymentsAPI, clientsAPI, salesAPI } from '../services/api';
import toast from 'react-hot-toast';

const PaymentLinks = () => {
  const [paymentLinks, setPaymentLinks] = useState([]);
  const [clients, setClients] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState('');
  const [linksLoading, setLinksLoading] = useState(false);
  
  // Estados para o modal de criação
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedSale, setSelectedSale] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [linkAmount, setLinkAmount] = useState('');
  const [paymentMethods, setPaymentMethods] = useState(['pix', 'credit_card']);
  const [expiresInDays, setExpiresInDays] = useState(7);
  
  // Estados para modais de ação
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);

  const paymentMethodOptions = [
    { id: 'pix', name: 'PIX', icon: QrCode, color: 'text-green-600' },
    { id: 'credit_card', name: 'Cartão de Crédito', icon: CreditCard, color: 'text-blue-600' },
    { id: 'debit_card', name: 'Cartão de Débito', icon: CreditCard, color: 'text-purple-600' }
  ];

  const loadPaymentLinks = useCallback(async () => {
    try {
      setLinksLoading(true);
      const params = {};
      
      if (searchTerm) params.search = searchTerm;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedClientFilter) params.client_id = selectedClientFilter;

      const response = await paymentsAPI.getAll(params);
      setPaymentLinks(response.data);
    } catch (error) {
      console.error('Erro ao carregar links de pagamento:', error);
      toast.error('Erro ao carregar links de pagamento');
    } finally {
      setLinksLoading(false);
    }
  }, [searchTerm, selectedStatus, selectedClientFilter]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [clientsResponse, salesResponse] = await Promise.all([
        clientsAPI.getAll(),
        salesAPI.getAll()
      ]);
      setClients(clientsResponse.data);
      setSales(salesResponse.data);
      loadPaymentLinks();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [loadPaymentLinks]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  const handleCreateLink = async () => {
    if (!selectedClient || selectedClient === '') {
      toast.error('Selecione um cliente');
      return;
    }
    if (!linkTitle.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    if (!linkAmount || parseFloat(linkAmount) <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }
    if (paymentMethods.length === 0) {
      toast.error('Selecione pelo menos um método de pagamento');
      return;
    }

    try {
      const selectedClientData = clients.find(c => c.id === parseInt(selectedClient));
      // const selectedSaleData = selectedSale ? sales.find(s => s.id === parseInt(selectedSale)) : null;

      const linkData = {
        sale_id: selectedSale || null,
        client_id: parseInt(selectedClient),
        client_name: selectedClientData?.name || 'Cliente não encontrado',
        title: linkTitle,
        description: linkDescription,
        amount: parseFloat(linkAmount),
        payment_methods: paymentMethods,
        expires_in_days: expiresInDays
      };

      const response = await paymentsAPI.createLink(linkData);
      
      toast.success('Link de pagamento criado com sucesso!');
      setShowModal(false);
      resetForm();
      loadPaymentLinks();
      
      // Copiar link para área de transferência
      if (response.data.payment_url) {
        navigator.clipboard.writeText(response.data.payment_url);
        toast.success('Link copiado para área de transferência!');
      }
      
    } catch (error) {
      console.error('Erro ao criar link de pagamento:', error);
      if (error.response?.data?.error) {
        toast.error(`Erro: ${error.response.data.error}`);
      } else {
        toast.error('Erro ao criar link de pagamento');
      }
    }
  };

  const resetForm = () => {
    setSelectedClient('');
    setSelectedSale('');
    setLinkTitle('');
    setLinkDescription('');
    setLinkAmount('');
    setPaymentMethods(['pix', 'credit_card']);
    setExpiresInDays(7);
  };

  const handleViewLink = (link) => {
    setSelectedLink(link);
    setShowViewModal(true);
  };

  const handleDeleteLink = (link) => {
    setSelectedLink(link);
    setShowDeleteModal(true);
  };

  const confirmDeleteLink = async () => {
    try {
      await paymentsAPI.cancel(selectedLink.id);
      toast.success('Link de pagamento cancelado com sucesso!');
      setShowDeleteModal(false);
      setSelectedLink(null);
      loadPaymentLinks();
    } catch (error) {
      console.error('Erro ao cancelar link de pagamento:', error);
      if (error.response?.data?.error) {
        toast.error(`Erro: ${error.response.data.error}`);
      } else {
        toast.error('Erro ao cancelar link de pagamento');
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para área de transferência!');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200';
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200';
      case 'expired': return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelado';
      case 'expired': return 'Expirado';
      default: return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return CheckCircle;
      case 'pending': return Clock;
      case 'cancelled': return XCircle;
      case 'expired': return AlertCircle;
      default: return Clock;
    }
  };

  const togglePaymentMethod = (methodId) => {
    setPaymentMethods(prev => 
      prev.includes(methodId) 
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header da Página */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/25">
              <CreditCard className="h-8 w-8 text-white drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Links de Pagamento
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Crie e gerencie links de pagamento para PIX e cartão de crédito
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
                  placeholder="Buscar links por cliente ou título..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex space-x-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
              >
                <option value="">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="cancelled">Cancelado</option>
                <option value="expired">Expirado</option>
              </select>
              
              <select
                value={selectedClientFilter}
                onChange={(e) => setSelectedClientFilter(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
              >
                <option value="">Todos os clientes</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>

              <button
                onClick={loadPaymentLinks}
                className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-xl shadow-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </button>
            </div>

            {/* Botão de Novo Link */}
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Link
            </button>
          </div>
        </div>

        {/* Lista de Links de Pagamento */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Links de Pagamento ({paymentLinks.length})
            </h3>
          </div>
          
          <div className="p-6">
            {linksLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Carregando links...</p>
              </div>
            ) : paymentLinks.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Nenhum link de pagamento encontrado</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Clique em "Novo Link" para começar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentLinks.map((link) => {
                  const StatusIcon = getStatusIcon(link.status);
                  return (
                    <div key={link.id} className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-700 dark:to-slate-700 rounded-xl border border-gray-200 dark:border-gray-600 p-6 hover:shadow-lg transition-all duration-200">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        {/* Informações do Link */}
                        <div className="flex items-start space-x-4">
                          <div className="p-3 bg-blue-500 rounded-xl">
                            <CreditCard className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                                {link.title}
                              </h4>
                              <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(link.status)}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {getStatusLabel(link.status)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Cliente:</span>
                                <p className="font-medium text-gray-900 dark:text-white">{link.client_name}</p>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Valor:</span>
                                <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(link.amount)}</p>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Métodos:</span>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {link.payment_methods.map(method => {
                                    const methodOption = paymentMethodOptions.find(m => m.id === method);
                                    return methodOption ? methodOption.name : method;
                                  }).join(', ')}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Criado:</span>
                                <p className="font-medium text-gray-900 dark:text-white">{formatDate(link.created_at)}</p>
                              </div>
                            </div>
                            
                            {link.description && (
                              <div className="mt-3">
                                <span className="text-gray-500 dark:text-gray-400 text-sm">Descrição:</span>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{link.description}</p>
                              </div>
                            )}
                            
                            {link.expires_at && (
                              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                <div className="flex items-center space-x-2 text-sm">
                                  <Calendar className="h-4 w-4 text-yellow-600" />
                                  <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                                    Expira em: {formatDate(link.expires_at)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Ações */}
                        <div className="flex items-center space-x-2">
                          {link.mercado_pago_url && (
                            <button
                              onClick={() => copyToClipboard(link.mercado_pago_url)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 transform hover:scale-110"
                              title="Copiar link"
                            >
                              <Copy className="h-5 w-5" />
                            </button>
                          )}
                          
                          {link.mercado_pago_url && (
                            <button
                              onClick={() => window.open(link.mercado_pago_url, '_blank')}
                              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200 transform hover:scale-110"
                              title="Abrir link"
                            >
                              <ExternalLink className="h-5 w-5" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleViewLink(link)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 transform hover:scale-110"
                            title="Visualizar detalhes"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          
                          {link.status === 'pending' && (
                            <button
                              onClick={() => handleDeleteLink(link)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 transform hover:scale-110"
                              title="Cancelar link"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal de Novo Link */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                {/* Header do Modal */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          Novo Link de Pagamento
                        </h3>
                        <p className="text-blue-100 text-sm">
                          Crie um link para receber pagamentos via PIX e cartão
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowModal(false)}
                      className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Conteúdo do Modal */}
                <div className="px-6 py-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Coluna Esquerda */}
                    <div className="space-y-6">
                      {/* Seleção de Cliente */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 bg-gray-500 rounded-lg">
                            <Users className="h-5 w-5 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Cliente</h4>
                        </div>
                        <select
                          value={selectedClient}
                          onChange={(e) => setSelectedClient(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                          <option value="">Selecione um cliente</option>
                          {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Venda Vinculada (Opcional) */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 bg-gray-500 rounded-lg">
                            <DollarSign className="h-5 w-5 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Venda Vinculada (Opcional)</h4>
                        </div>
                        <select
                          value={selectedSale}
                          onChange={(e) => setSelectedSale(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                          <option value="">Nenhuma venda vinculada</option>
                          {sales.map((sale) => (
                            <option key={sale.id} value={sale.id}>
                              Venda #{sale.id} - {sale.client_name} - {formatCurrency(sale.total_amount)}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Vincule a uma venda existente para facilitar o controle
                        </p>
                      </div>

                      {/* Título e Descrição */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 bg-gray-500 rounded-lg">
                            <CreditCard className="h-5 w-5 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Informações do Link</h4>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Título *
                            </label>
                            <input
                              type="text"
                              value={linkTitle}
                              onChange={(e) => setLinkTitle(e.target.value)}
                              placeholder="Ex: Pagamento de joias, Compra de anéis, etc."
                              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Descrição
                            </label>
                            <textarea
                              value={linkDescription}
                              onChange={(e) => setLinkDescription(e.target.value)}
                              placeholder="Descrição adicional do pagamento..."
                              rows={3}
                              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Coluna Direita */}
                    <div className="space-y-6">
                      {/* Valor */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 bg-gray-500 rounded-lg">
                            <DollarSign className="h-5 w-5 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Valor</h4>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={linkAmount}
                          onChange={(e) => setLinkAmount(e.target.value)}
                          placeholder="0,00"
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg font-semibold"
                        />
                      </div>

                      {/* Métodos de Pagamento */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 bg-gray-500 rounded-lg">
                            <CreditCard className="h-5 w-5 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Métodos de Pagamento</h4>
                        </div>
                        <div className="space-y-3">
                          {paymentMethodOptions.map((method) => {
                            const Icon = method.icon;
                            return (
                              <button
                                key={method.id}
                                onClick={() => togglePaymentMethod(method.id)}
                                className={`w-full flex items-center justify-between p-3 border-2 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                                  paymentMethods.includes(method.id)
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/25'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                              >
                                <div className="flex items-center">
                                  <Icon className={`h-5 w-5 mr-3 ${method.color}`} />
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {method.name}
                                  </span>
                                </div>
                                {paymentMethods.includes(method.id) && (
                                  <CheckCircle className="h-5 w-5 text-blue-500" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Expiração */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 bg-gray-500 rounded-lg">
                            <Calendar className="h-5 w-5 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Expiração</h4>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Expira em (dias)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={expiresInDays}
                            onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            O link expirará automaticamente após {expiresInDays} dias
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="mt-8 flex justify-end space-x-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreateLink}
                      disabled={!selectedClient || !linkTitle.trim() || !linkAmount || paymentMethods.length === 0}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      Criar Link
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Visualização */}
        {showViewModal && selectedLink && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={() => setShowViewModal(false)}></div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                {/* Header do Modal */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          Detalhes do Link #{selectedLink.id}
                        </h3>
                        <p className="text-blue-100 text-sm">
                          Informações completas sobre o link de pagamento
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowViewModal(false)}
                      className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Conteúdo do Modal */}
                <div className="px-6 py-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Informações Gerais */}
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações Gerais</h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">ID:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedLink.id}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Título:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedLink.title}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Cliente:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedLink.client_name}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Valor:</span>
                          <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(selectedLink.amount)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Status:</span>
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ml-2 ${getStatusColor(selectedLink.status)}`}>
                            {getStatusLabel(selectedLink.status)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Criado em:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedLink.created_at)}</p>
                        </div>
                        {selectedLink.expires_at && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Expira em:</span>
                            <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedLink.expires_at)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Métodos de Pagamento e Link */}
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Métodos de Pagamento</h4>
                      <div className="space-y-2 mb-6">
                        {selectedLink.payment_methods.map(method => {
                          const methodOption = paymentMethodOptions.find(m => m.id === method);
                          const Icon = methodOption?.icon || CreditCard;
                          return (
                            <div key={method} className="flex items-center space-x-2">
                              <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              <span className="text-sm text-gray-900 dark:text-white">{methodOption?.name || method}</span>
                            </div>
                          );
                        })}
                      </div>

                      {selectedLink.mercado_pago_url && (
                        <div>
                          <h5 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Link de Pagamento</h5>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={selectedLink.mercado_pago_url}
                              readOnly
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <button
                              onClick={() => copyToClipboard(selectedLink.mercado_pago_url)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                              title="Copiar link"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => window.open(selectedLink.mercado_pago_url, '_blank')}
                              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200"
                              title="Abrir link"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Exclusão */}
        {showDeleteModal && selectedLink && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={() => setShowDeleteModal(false)}></div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                {/* Header do Modal */}
                <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                        <Trash2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          Cancelar Link
                        </h3>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Conteúdo do Modal */}
                <div className="px-6 py-8">
                  <div className="text-center">
                    {/* Ícone de Aviso */}
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                      <Trash2 className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    
                    {/* Mensagem */}
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Cancelar Link #{selectedLink.id}?
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Esta ação cancelará o link de pagamento. Clientes não conseguirão mais acessar este link.
                    </p>
                    
                    {/* Botões */}
                    <div className="flex flex-col space-y-3">
                      <button
                        onClick={confirmDeleteLink}
                        className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-xl shadow-lg hover:bg-red-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center"
                      >
                        <Trash2 className="h-5 w-5 mr-2" />
                        Cancelar Link
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(false)}
                        className="w-full px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        Voltar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentLinks;

