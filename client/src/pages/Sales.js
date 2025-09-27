import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  CreditCard,
  DollarSign,
  QrCode,
  Calendar,
  Package,
  Trash2,
  X,
  Search,
  Users,
  Eye,
  Edit,
  Filter,
  CheckCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { itemsAPI, clientsAPI, salesAPI } from '../services/api';
import toast from 'react-hot-toast';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [installments, setInstallments] = useState(1);
  const [dueDate, setDueDate] = useState('');
  const [installmentPaymentMethod, setInstallmentPaymentMethod] = useState('pix');
  const [maxInstallments, setMaxInstallments] = useState(12);
  const [saleTitle, setSaleTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // const [showProductModal, setShowProductModal] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState('');
  
  // Estados para modais de ação
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [editingSale, setEditingSale] = useState(null);
  const [saleDetails, setSaleDetails] = useState(null);
  const [loadingSaleDetails, setLoadingSaleDetails] = useState(false);
  
  // Estados para criação de link de pagamento
  const [paymentLinkTitle, setPaymentLinkTitle] = useState('');
  const [paymentLinkDescription, setPaymentLinkDescription] = useState('');
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState(['pix', 'credit_card']);
  const [expiresInDays, setExpiresInDays] = useState(7);

  // Filtrar itens baseado no termo de busca
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.barcode?.includes(searchTerm)
  );

  const salePaymentMethods = [
    { id: 'pix', name: 'PIX', icon: QrCode, color: 'text-green-600' },
    { id: 'money', name: 'Dinheiro', icon: DollarSign, color: 'text-green-600' },
    { id: 'credit_card', name: 'Cartão de Crédito', icon: CreditCard, color: 'text-blue-600' },
    { id: 'installments', name: 'Parcelado', icon: Calendar, color: 'text-purple-600' }
  ];

  const loadSales = useCallback(async () => {
    try {
      setSalesLoading(true);
      const params = {};
      
      if (searchTerm) params.search = searchTerm;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedClientFilter) params.client_id = selectedClientFilter;

      const response = await salesAPI.getAll(params);
      setSales(response.data);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      toast.error('Erro ao carregar vendas');
    } finally {
      setSalesLoading(false);
    }
  }, [searchTerm, selectedStatus, selectedClientFilter]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [itemsResponse, clientsResponse] = await Promise.all([
        itemsAPI.getAll(),
        clientsAPI.getAll()
      ]);
      setItems(itemsResponse.data);
      setClients(clientsResponse.data);
      loadSales();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [loadSales]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  const addItemToSale = (item) => {
    const existingItem = selectedItems.find(selected => selected.id === item.id);
    if (existingItem) {
      setSelectedItems(selectedItems.map(selected => 
        selected.id === item.id 
          ? { ...selected, quantity: selected.quantity + 1 }
          : selected
      ));
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    }
    
    // Atualizar número máximo de parcelas baseado nos itens selecionados
    updateMaxInstallments();
  };

  const removeItemFromSale = (itemId) => {
    setSelectedItems(selectedItems.filter(item => item.id !== itemId));
    // Atualizar número máximo de parcelas após remover item
    setTimeout(() => updateMaxInstallments(), 0);
  };

  const updateItemQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeItemFromSale(itemId);
      return;
    }
    setSelectedItems(selectedItems.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ));
    // Atualizar número máximo de parcelas após alterar quantidade
    setTimeout(() => updateMaxInstallments(), 0);
  };

  const getTotalAmount = () => {
    return selectedItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const getInstallmentValue = () => {
    const total = getTotalAmount();
    return total / installments;
  };

  const updateMaxInstallments = () => {
    // Sempre manter 12 como máximo de parcelas
    setMaxInstallments(12);
    
    // Ajustar o número de parcelas se exceder o máximo
    if (installments > 12) {
      setInstallments(12);
    }
  };

  const handleCreateSale = async () => {
    if (!selectedClient || selectedClient === '') {
      toast.error('Selecione um cliente');
      return;
    }
    if (selectedItems.length === 0) {
      toast.error('Adicione pelo menos um item');
      return;
    }
    if (paymentMethod === 'installments' && installments > maxInstallments) {
      toast.error(`Número de parcelas não pode exceder ${maxInstallments}`);
      return;
    }
    if (paymentMethod === 'installments' && !dueDate) {
      toast.error('Selecione uma data de vencimento para vendas parceladas');
      return;
    }

    // Validar estoque antes de criar a venda
    const stockErrors = [];
    selectedItems.forEach(item => {
      const originalItem = items.find(i => i.id === item.id);
      if (originalItem && item.quantity > originalItem.quantity) {
        stockErrors.push(`${item.name}: quantidade solicitada (${item.quantity}) maior que estoque disponível (${originalItem.quantity})`);
      }
    });

    if (stockErrors.length > 0) {
      toast.error('Estoque insuficiente para alguns itens:');
      stockErrors.forEach(error => {
        toast.error(error);
      });
      return;
    }

    try {
      const selectedClientData = clients.find(c => c.id === parseInt(selectedClient));
      
      const saleData = {
        client_id: parseInt(selectedClient),
        client_name: selectedClientData?.name || 'Cliente não encontrado',
        title: saleTitle || `Venda ${new Date().toLocaleDateString()}`,
        items: selectedItems.map(item => ({
          item_id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        payment_method: paymentMethod,
        installments: paymentMethod === 'installments' ? installments : 1,
        installment_value: paymentMethod === 'installments' ? getInstallmentValue() : getTotalAmount(),
        installment_payment_method: paymentMethod === 'installments' ? installmentPaymentMethod : null,
        due_date: paymentMethod === 'installments' ? dueDate : null,
        total_amount: getTotalAmount()
      };

      console.log('Criando venda:', saleData);
      
      const response = await salesAPI.create(saleData);
      
      toast.success('Venda criada com sucesso!');
      if (response.data.stock_updated) {
        toast.success('Estoque atualizado automaticamente!');
      }
      if (response.data.account_created) {
        if (response.data.installments_created) {
          toast.success(`${response.data.installments_created} contas a receber criadas automaticamente!`);
        } else {
          toast.success('Conta a receber criada automaticamente!');
        }
      }
      
      setShowModal(false);
      resetForm();
      loadSales(); // Recarregar lista de vendas
      
    } catch (error) {
      console.error('Erro ao criar venda:', error);
      if (error.response?.data?.error) {
        if (error.response.data.stock_error) {
          toast.error(`Erro de estoque: ${error.response.data.error}`);
        } else {
          toast.error(`Erro: ${error.response.data.error}`);
        }
      } else {
        toast.error('Erro ao criar venda');
      }
    }
  };

  const resetForm = () => {
    setSelectedItems([]);
    setSelectedClient('');
    setPaymentMethod('pix');
    setInstallments(1);
    setDueDate('');
    setInstallmentPaymentMethod('pix');
    setSaleTitle('');
    setSearchTerm('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200';
      case 'refunded': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      case 'refunded': return 'Reembolsada';
      default: return status;
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

  // Função para carregar detalhes da venda
  const loadSaleDetails = async (saleId) => {
    try {
      setLoadingSaleDetails(true);
      const response = await salesAPI.getById(saleId);
      setSaleDetails(response.data);
    } catch (error) {
      console.error('Erro ao carregar detalhes da venda:', error);
      toast.error('Erro ao carregar detalhes da venda');
    } finally {
      setLoadingSaleDetails(false);
    }
  };

  // Função para visualizar venda
  const handleViewSale = async (sale) => {
    setSelectedSale(sale);
    setShowViewModal(true);
    await loadSaleDetails(sale.id);
  };

  // Função para editar venda
  const handleEditSale = async (sale) => {
    setSelectedSale(sale);
    setEditingSale(sale);
    setShowEditModal(true);
    await loadSaleDetails(sale.id);
  };

  // Função para excluir venda
  const handleDeleteSale = async (sale) => {
    setSelectedSale(sale);
    setShowDeleteModal(true);
  };

  // Função para confirmar exclusão
  const confirmDeleteSale = async () => {
    try {
      console.log('Tentando excluir venda:', selectedSale.id);
      await salesAPI.delete(selectedSale.id);
      toast.success('Venda excluída com sucesso!');
      setShowDeleteModal(false);
      setSelectedSale(null);
      loadSales(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao excluir venda:', error);
      if (error.response?.data?.error) {
        toast.error(`Erro ao excluir venda: ${error.response.data.error}`);
      } else {
        toast.error('Erro ao excluir venda');
      }
    }
  };

  // Função para salvar edição
  const handleSaveEdit = async () => {
    try {
      // Implementar lógica de edição
      toast.success('Funcionalidade de edição será implementada em breve');
      setShowEditModal(false);
      setEditingSale(null);
      setSelectedSale(null);
    } catch (error) {
      console.error('Erro ao editar venda:', error);
      toast.error('Erro ao editar venda');
    }
  };

  // Função para criar link de pagamento
  const handleCreatePaymentLink = async (sale) => {
    setSelectedSale(sale);
    setPaymentLinkTitle(`Pagamento - Venda #${sale.id}`);
    setPaymentLinkDescription(`Pagamento da venda para ${sale.client_name} no valor de ${formatCurrency(sale.total_amount)}`);
    setShowPaymentLinkModal(true);
  };

  // Função para confirmar criação do link de pagamento
  const confirmCreatePaymentLink = async () => {
    if (!paymentLinkTitle.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    if (selectedPaymentMethods.length === 0) {
      toast.error('Selecione pelo menos um método de pagamento');
      return;
    }

    try {
      const linkData = {
        sale_id: selectedSale.id,
        client_id: selectedSale.client_id,
        client_name: selectedSale.client_name,
        title: paymentLinkTitle,
        description: paymentLinkDescription,
        amount: selectedSale.total_amount,
        payment_methods: selectedPaymentMethods,
        expires_in_days: expiresInDays
      };

      // Simular criação de link de pagamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Funcionalidade de pagamento não disponível. Entre em contato para finalizar a venda.');
      setShowPaymentLinkModal(false);
      resetPaymentLinkForm();
      
    } catch (error) {
      console.error('Erro ao criar link de pagamento:', error);
      if (error.response?.data?.error) {
        toast.error(`Erro: ${error.response.data.error}`);
      } else {
        toast.error('Erro ao criar link de pagamento');
      }
    }
  };

  // Função para resetar formulário de link de pagamento
  const resetPaymentLinkForm = () => {
    setPaymentLinkTitle('');
    setPaymentLinkDescription('');
    setSelectedPaymentMethods(['pix', 'credit_card']);
    setExpiresInDays(7);
    setSelectedSale(null);
  };

  // Função para alternar método de pagamento
  const togglePaymentMethod = (methodId) => {
    setSelectedPaymentMethods(prev => 
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header da Página */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/25">
              <ShoppingCart className="h-8 w-8 text-white drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Vendas
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Registre e gerencie suas vendas
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
                  placeholder="Buscar vendas por cliente ou ID..."
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
                <option value="completed">Concluída</option>
                <option value="cancelled">Cancelada</option>
                <option value="refunded">Reembolsada</option>
              </select>
              
              <select
                value={selectedClientFilter}
                onChange={(e) => setSelectedClientFilter(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
              >
                <option value="">Todos os clientes</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>

              <button
                onClick={loadSales}
                className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-xl shadow-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </button>
            </div>

            {/* Botão de Nova Venda */}
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Venda
            </button>
          </div>
        </div>

        {/* Lista de Vendas */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Vendas ({sales.length})
            </h3>
          </div>
          
          <div className="p-6">
            {salesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Carregando vendas...</p>
              </div>
            ) : sales.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Nenhuma venda encontrada</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Clique em "Nova Venda" para começar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sales.map((sale) => (
                  <div key={sale.id} className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-700 dark:to-slate-700 rounded-xl border border-gray-200 dark:border-gray-600 p-6 hover:shadow-lg transition-all duration-200">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                      {/* Informações da Venda */}
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-gray-500 rounded-xl">
                          <ShoppingCart className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                              {sale.title || `Venda #${sale.id}`}
                            </h4>
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(sale.status)}`}>
                              {getStatusLabel(sale.status)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Cliente:</span>
                              <p className="font-medium text-gray-900 dark:text-white">{sale.client_name}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Total:</span>
                              <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(sale.total_amount)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Pagamento:</span>
                              <p className="font-medium text-gray-900 dark:text-white">{getPaymentMethodLabel(sale.payment_method)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Data:</span>
                              <p className="font-medium text-gray-900 dark:text-white">{formatDate(sale.created_at)}</p>
                            </div>
                          </div>
                          
                          {sale.payment_method === 'installments' && (
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <div className="flex items-center space-x-2 text-sm">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <span className="text-blue-800 dark:text-blue-200 font-medium">
                                  {sale.installments}x de {formatCurrency(sale.installment_value)}
                                </span>
                                {sale.due_date && (
                                  <span className="text-blue-600 dark:text-blue-400">
                                    • Vencimento: {formatDate(sale.due_date)}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {sale.items_summary && (
                            <div className="mt-3">
                              <span className="text-gray-500 dark:text-gray-400 text-sm">Itens:</span>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{sale.items_summary}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Ações */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewSale(sale)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 transform hover:scale-110"
                          title="Visualizar detalhes"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleCreatePaymentLink(sale)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200 transform hover:scale-110"
                          title="Criar link de pagamento"
                        >
                          <CreditCard className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditSale(sale)}
                          className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200 transform hover:scale-110"
                          title="Editar venda"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSale(sale)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 transform hover:scale-110"
                          title="Excluir venda"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal de Nova Venda */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
                {/* Header do Modal */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                        <ShoppingCart className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          Nova Venda
                        </h3>
                        <p className="text-green-100 text-sm">
                          Registre uma nova venda no sistema
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Coluna Esquerda - Seleção de Cliente e Itens */}
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
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200"
                        >
                          <option value="">Selecione um cliente</option>
                          {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Título da Venda */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 bg-gray-500 rounded-lg">
                            <Edit className="h-5 w-5 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Título da Venda</h4>
                        </div>
                        <input
                          type="text"
                          value={saleTitle}
                          onChange={(e) => setSaleTitle(e.target.value)}
                          placeholder="Ex: Venda de joias, Compra de anéis, etc."
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Adicione um título para identificar facilmente esta venda
                        </p>
                      </div>

                      {/* Lista de Produtos */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 bg-gray-500 rounded-lg">
                            <Package className="h-5 w-5 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Produtos Disponíveis</h4>
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-3">
                          {filteredItems.map((item) => (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 cursor-pointer group ${
                                item.quantity === 0 ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              onClick={() => item.quantity > 0 && addItemToSale(item)}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded-lg">
                                  <Package className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {formatCurrency(item.price)} - Estoque: {item.quantity}
                                  </div>
                                  {item.quantity === 0 && (
                                    <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                                      Sem estoque
                                    </div>
                                  )}
                                  {item.quantity > 0 && item.quantity <= 5 && (
                                    <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                                      Estoque baixo
                                    </div>
                                  )}
                                </div>
                              </div>
                              <button 
                                className={`p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 transform hover:scale-110 ${
                                  item.quantity === 0 ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                disabled={item.quantity === 0}
                              >
                                <Plus className="h-5 w-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Coluna Direita - Itens Selecionados e Resumo */}
                    <div className="space-y-6">
                      {/* Itens Selecionados */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 bg-gray-500 rounded-lg">
                            <ShoppingCart className="h-5 w-5 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Itens Selecionados</h4>
                        </div>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          {selectedItems.length === 0 ? (
                            <div className="text-center py-8">
                              <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum item selecionado</p>
                              <p className="text-gray-400 dark:text-gray-500 text-xs">Clique nos produtos para adicionar</p>
                            </div>
                          ) : (
                            selectedItems.map((item) => {
                              const originalItem = items.find(i => i.id === item.id);
                              const stockExceeded = originalItem && item.quantity > originalItem.quantity;
                              
                              return (
                                <div key={item.id} className={`flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border ${
                                  stockExceeded 
                                    ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                                    : 'border-gray-200 dark:border-gray-600'
                                }`}>
                                  <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded-lg">
                                      <Package className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {formatCurrency(item.price)} x {item.quantity}
                                      </div>
                                      {stockExceeded && (
                                        <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                                          Estoque insuficiente! Disponível: {originalItem.quantity}
                                        </div>
                                      )}
                                      {!stockExceeded && originalItem && item.quantity > originalItem.quantity * 0.8 && (
                                        <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                                          Atenção: Estoque baixo
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="number"
                                      min="1"
                                      max={originalItem ? originalItem.quantity : undefined}
                                      value={item.quantity}
                                      onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                                      className={`w-16 px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                                        stockExceeded 
                                          ? 'border-red-300 dark:border-red-600' 
                                          : 'border-gray-300 dark:border-gray-600'
                                      }`}
                                    />
                                    <button
                                      onClick={() => removeItemFromSale(item.id)}
                                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 transform hover:scale-110"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Método de Pagamento */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 bg-gray-500 rounded-lg">
                            <CreditCard className="h-5 w-5 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Método de Pagamento</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {salePaymentMethods.map((method) => {
                            const Icon = method.icon;
                            return (
                              <button
                                key={method.id}
                                onClick={() => setPaymentMethod(method.id)}
                                className={`flex items-center justify-center p-3 border-2 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                                  paymentMethod === method.id
                                    ? 'border-gray-500 bg-gray-100 dark:bg-gray-600 shadow-lg shadow-gray-500/25'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                              >
                                <Icon className={`h-5 w-5 mr-2 text-gray-600 dark:text-gray-300`} />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {method.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Parcelamento */}
                      {paymentMethod === 'installments' && (
                        <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-gray-500 rounded-lg">
                              <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Configuração de Parcelamento</h4>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Número de Parcelas
                              </label>
                              <input
                                type="number"
                                min="1"
                                max={maxInstallments}
                                value={installments}
                                onChange={(e) => setInstallments(parseInt(e.target.value))}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200"
                              />
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Máximo: {maxInstallments} parcelas
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Forma de Pagamento das Parcelas
                              </label>
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={() => setInstallmentPaymentMethod('pix')}
                                  className={`flex items-center justify-center p-3 border-2 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                                    installmentPaymentMethod === 'pix'
                                      ? 'border-gray-500 bg-gray-100 dark:bg-gray-600 shadow-lg shadow-gray-500/25'
                                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  <QrCode className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-300" />
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">PIX</span>
                                </button>
                                <button
                                  onClick={() => setInstallmentPaymentMethod('money')}
                                  className={`flex items-center justify-center p-3 border-2 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                                    installmentPaymentMethod === 'money'
                                      ? 'border-gray-500 bg-gray-100 dark:bg-gray-600 shadow-lg shadow-gray-500/25'
                                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  <DollarSign className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-300" />
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">Dinheiro</span>
                                </button>
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Data de Vencimento
                              </label>
                              <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Resumo da Venda */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 bg-gray-500 rounded-lg">
                            <DollarSign className="h-5 w-5 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo da Venda</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal:</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(getTotalAmount())}
                            </span>
                          </div>
                          {paymentMethod === 'installments' && (
                            <>
                              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Parcelas:</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {installments}x {formatCurrency(getInstallmentValue())}
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Pagamento:</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {installmentPaymentMethod === 'pix' ? 'PIX' : 'Dinheiro'}
                                </span>
                              </div>
                              {maxInstallments > 1 && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                  Limite máximo: {maxInstallments} parcelas
                                </div>
                              )}
                            </>
                          )}
                          <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 dark:border-gray-500">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">Total:</span>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                              {formatCurrency(getTotalAmount())}
                            </span>
                          </div>
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
                      onClick={handleCreateSale}
                      disabled={selectedItems.length === 0 || !selectedClient || selectedClient === ''}
                      className="px-8 py-3 bg-gradient-to-r from-gray-600 to-slate-600 text-white font-semibold rounded-xl shadow-lg hover:from-gray-700 hover:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Finalizar Venda
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Visualização de Venda */}
        {showViewModal && selectedSale && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={() => setShowViewModal(false)}></div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
                {/* Header do Modal */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                        <ShoppingCart className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          Detalhes da Venda #{selectedSale.id}
                        </h3>
                        <p className="text-green-100 text-sm">
                          Informações completas sobre a venda
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
                  {loadingSaleDetails ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-500 dark:text-gray-400">Carregando detalhes da venda...</p>
                    </div>
                  ) : saleDetails ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Informações Gerais */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações Gerais</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">ID da Venda:</span>
                            <p className="font-medium text-gray-900 dark:text-white">{saleDetails.id}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Status:</span>
                            <p className={`font-medium text-gray-900 dark:text-white ${getStatusColor(saleDetails.status)}`}>
                              {getStatusLabel(saleDetails.status)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Cliente:</span>
                            <p className="font-medium text-gray-900 dark:text-white">{saleDetails.client_name}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Total:</span>
                            <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(saleDetails.total_amount)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Método de Pagamento:</span>
                            <p className="font-medium text-gray-900 dark:text-white">{getPaymentMethodLabel(saleDetails.payment_method)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Data da Venda:</span>
                            <p className="font-medium text-gray-900 dark:text-white">{formatDate(saleDetails.created_at)}</p>
                          </div>
                          {saleDetails.due_date && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Data de Vencimento:</span>
                              <p className="font-medium text-gray-900 dark:text-white">{formatDate(saleDetails.due_date)}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Itens da Venda */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Itens da Venda</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full bg-white dark:bg-gray-700 rounded-lg shadow-md">
                            <thead className="bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-200">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Item</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Quantidade</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Preço Unitário</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Total</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {saleDetails.items.map((item) => (
                                <tr key={item.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.quantity}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(item.price)}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(item.total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Resumo da Venda */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumo da Venda</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Subtotal:</span>
                            <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(saleDetails.total_amount)}</p>
                          </div>
                          {saleDetails.payment_method === 'installments' && (
                            <>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Parcelas:</span>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {saleDetails.installments}x {formatCurrency(saleDetails.installment_value)}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Pagamento das Parcelas:</span>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {saleDetails.installment_payment_method === 'pix' ? 'PIX' : 'Dinheiro'}
                                </p>
                              </div>
                              {saleDetails.installments > 1 && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                  Limite máximo: {saleDetails.installments} parcelas
                                </div>
                              )}
                            </>
                          )}
                          <div className="col-span-2">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">Total:</span>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(saleDetails.total_amount)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">Nenhum detalhe disponível para esta venda.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edição de Venda */}
        {showEditModal && editingSale && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={() => setShowEditModal(false)}></div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
                {/* Header do Modal */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                        <ShoppingCart className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          Editar Venda #{editingSale.id}
                        </h3>
                        <p className="text-green-100 text-sm">
                          Modifique as informações da venda
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Conteúdo do Modal */}
                <div className="px-6 py-6">
                  {loadingSaleDetails ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-500 dark:text-gray-400">Carregando detalhes da venda...</p>
                    </div>
                  ) : saleDetails ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Informações Gerais */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações Gerais</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Status
                            </label>
                            <select
                              value={saleDetails.status}
                              onChange={(e) => {
                                // Implementar lógica de atualização de status
                                toast.info('Funcionalidade de edição de status será implementada em breve');
                              }}
                              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200"
                            >
                              <option value="completed">Concluída</option>
                              <option value="cancelled">Cancelada</option>
                              <option value="refunded">Reembolsada</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Método de Pagamento
                            </label>
                            <select
                              value={saleDetails.payment_method}
                              onChange={(e) => {
                                // Implementar lógica de atualização de método de pagamento
                                toast.info('Funcionalidade de edição de método de pagamento será implementada em breve');
                              }}
                              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200"
                            >
                              <option value="pix">PIX</option>
                              <option value="money">Dinheiro</option>
                              <option value="credit_card">Cartão de Crédito</option>
                              <option value="installments">Parcelado</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Data de Vencimento (Parcelado)
                            </label>
                            <input
                              type="date"
                              value={saleDetails.due_date}
                              onChange={(e) => {
                                // Implementar lógica de atualização de data de vencimento
                                toast.info('Funcionalidade de edição de data de vencimento será implementada em breve');
                              }}
                              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Número de Parcelas (Parcelado)
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={saleDetails.installments}
                              onChange={(e) => {
                                // Implementar lógica de atualização de número de parcelas
                                toast.info('Funcionalidade de edição de número de parcelas será implementada em breve');
                              }}
                              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Forma de Pagamento das Parcelas (Parcelado)
                            </label>
                            <select
                              value={saleDetails.installment_payment_method}
                              onChange={(e) => {
                                // Implementar lógica de atualização de forma de pagamento das parcelas
                                toast.info('Funcionalidade de edição de forma de pagamento das parcelas será implementada em breve');
                              }}
                              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200"
                            >
                              <option value="pix">PIX</option>
                              <option value="money">Dinheiro</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Itens da Venda */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Itens da Venda</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full bg-white dark:bg-gray-700 rounded-lg shadow-md">
                            <thead className="bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-200">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Item</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Quantidade</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Preço Unitário</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Total</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {saleDetails.items.map((item) => (
                                <tr key={item.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.quantity}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(item.price)}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(item.total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Resumo da Venda */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumo da Venda</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Subtotal:</span>
                            <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(saleDetails.total_amount)}</p>
                          </div>
                          {saleDetails.payment_method === 'installments' && (
                            <>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Parcelas:</span>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {saleDetails.installments}x {formatCurrency(saleDetails.installment_value)}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Pagamento das Parcelas:</span>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {saleDetails.installment_payment_method === 'pix' ? 'PIX' : 'Dinheiro'}
                                </p>
                              </div>
                              {saleDetails.installments > 1 && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                  Limite máximo: {saleDetails.installments} parcelas
                                </div>
                              )}
                            </>
                          )}
                          <div className="col-span-2">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">Total:</span>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(saleDetails.total_amount)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">Nenhum detalhe disponível para esta venda.</p>
                    </div>
                  )}
                </div>

                {/* Botões de Ação */}
                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-8 py-3 bg-gradient-to-r from-gray-600 to-slate-600 text-white font-semibold rounded-xl shadow-lg hover:from-gray-700 hover:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center"
                  >
                    <Edit className="h-5 w-5 mr-2" />
                    Salvar Edição
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Exclusão de Venda */}
        {showDeleteModal && selectedSale && (
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
                          Confirmar Exclusão
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
                      Excluir Venda #{selectedSale.id}?
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Esta ação não pode ser desfeita. A venda e todas as contas a receber vinculadas serão removidas permanentemente.
                    </p>
                    
                    {/* Botões */}
                    <div className="flex flex-col space-y-3">
                      <button
                        onClick={confirmDeleteSale}
                        className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-xl shadow-lg hover:bg-red-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center"
                      >
                        <Trash2 className="h-5 w-5 mr-2" />
                        Excluir Venda
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(false)}
                        className="w-full px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Criação de Link de Pagamento */}
        {showPaymentLinkModal && selectedSale && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={() => setShowPaymentLinkModal(false)}></div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                {/* Header do Modal */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          Criar Link de Pagamento
                        </h3>
                        <p className="text-green-100 text-sm">
                          Venda #{selectedSale.id} - {selectedSale.client_name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPaymentLinkModal(false)}
                      className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Conteúdo do Modal */}
                <div className="px-6 py-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Coluna Esquerda - Informações da Venda */}
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações da Venda</h4>
                        <div className="space-y-3 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">ID da Venda:</span>
                            <p className="font-medium text-gray-900 dark:text-white">#{selectedSale.id}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Cliente:</span>
                            <p className="font-medium text-gray-900 dark:text-white">{selectedSale.client_name}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Valor Total:</span>
                            <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(selectedSale.total_amount)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Método de Pagamento:</span>
                            <p className="font-medium text-gray-900 dark:text-white">{getPaymentMethodLabel(selectedSale.payment_method)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Data da Venda:</span>
                            <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedSale.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Coluna Direita - Configuração do Link */}
                    <div className="space-y-6">
                      {/* Título e Descrição */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configuração do Link</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Título *
                            </label>
                            <input
                              type="text"
                              value={paymentLinkTitle}
                              onChange={(e) => setPaymentLinkTitle(e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Descrição
                            </label>
                            <textarea
                              value={paymentLinkDescription}
                              onChange={(e) => setPaymentLinkDescription(e.target.value)}
                              rows={3}
                              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Métodos de Pagamento */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Métodos de Pagamento</h4>
                        <div className="space-y-3">
                          {[
                            { id: 'pix', name: 'PIX', icon: QrCode },
                            { id: 'credit_card', name: 'Cartão de Crédito', icon: CreditCard },
                            { id: 'debit_card', name: 'Cartão de Débito', icon: CreditCard }
                          ].map((methodOption) => {
                            const Icon = methodOption.icon;
                            return (
                              <button
                                key={methodOption.id}
                                onClick={() => togglePaymentMethod(methodOption.id)}
                                className={`w-full flex items-center justify-between p-3 border-2 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                                  selectedPaymentMethods.includes(methodOption.id)
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg shadow-green-500/25'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                              >
                                <div className="flex items-center">
                                  <Icon className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-300" />
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {methodOption.name}
                                  </span>
                                </div>
                                {selectedPaymentMethods.includes(methodOption.id) && (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Expiração */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expiração</h4>
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
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
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
                      onClick={() => setShowPaymentLinkModal(false)}
                      className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmCreatePaymentLink}
                      disabled={!paymentLinkTitle.trim() || selectedPaymentMethods.length === 0}
                      className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center"
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      Criar Link de Pagamento
                    </button>
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

export default Sales; 