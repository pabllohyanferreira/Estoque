import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Edit, Trash2, CreditCard, Calendar, CheckCircle } from 'lucide-react';
import { accountsPayableAPI } from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, isOverdue } from '../utils/formatters';
import AccountModal from '../components/AccountModal';
import ConfirmModal from '../components/ConfirmModal';
import PayAccountModal from '../components/PayAccountModal';
import useScroll from '../hooks/useScroll';

const AccountsPayable = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountToPay, setAccountToPay] = useState(null);
  
  // Estados para agrupamento por fornecedor (sempre ativo)
  const [expandedSuppliers, setExpandedSuppliers] = useState(new Set());
  
  // Hook personalizado para scroll
  const { scrollContainerRef, scrollStyles, scrollClasses } = useScroll({
    scrollSpeed: 0.5,
    smooth: true,
    maxHeight: 600
  });

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (searchTerm) params.search = searchTerm;
      if (selectedStatus) params.status = selectedStatus;

      const response = await accountsPayableAPI.getAll(params);
      setAccounts(response.data);
    } catch (error) {
      toast.error('Erro ao carregar contas a pagar');
      console.error('Erro ao carregar contas a pagar:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedStatus]);

  // Função para agrupar contas por fornecedor
  const getAccountsBySupplier = () => {
    const grouped = {};
    
    accounts.forEach(account => {
      const supplier = account.description || 'Fornecedor não informado';
      
      if (!grouped[supplier]) {
        grouped[supplier] = {
          supplier,
          accounts: [],
          totalAmount: 0,
          pendingAmount: 0,
          paidAmount: 0,
          overdueAmount: 0
        };
      }
      
      grouped[supplier].accounts.push(account);
      grouped[supplier].totalAmount += account.amount;
      
      if (account.status === 'paid') {
        grouped[supplier].paidAmount += account.amount;
      } else if (account.status === 'pending') {
        if (isOverdue(account.due_date)) {
          grouped[supplier].overdueAmount += account.amount;
        } else {
          grouped[supplier].pendingAmount += account.amount;
        }
      }
    });
    
    return Object.values(grouped).sort((a, b) => a.supplier.localeCompare(b.supplier));
  };

  // Função para alternar expansão de fornecedor
  const toggleSupplier = (supplier) => {
    const newExpanded = new Set(expandedSuppliers);
    if (newExpanded.has(supplier)) {
      newExpanded.delete(supplier);
    } else {
      newExpanded.add(supplier);
    }
    setExpandedSuppliers(newExpanded);
  };

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleCreateAccount = async (accountData) => {
    try {
      await accountsPayableAPI.create(accountData);
      toast.success('Conta a pagar criada com sucesso!');
      setShowAccountModal(false);
      loadAccounts();
    } catch (error) {
      toast.error('Erro ao criar conta a pagar');
      console.error('Erro ao criar conta a pagar:', error);
    }
  };

  const handleUpdateAccount = async (accountData) => {
    try {
      await accountsPayableAPI.update(editingAccount.id, accountData);
      toast.success('Conta a pagar atualizada com sucesso!');
      setShowAccountModal(false);
      setEditingAccount(null);
      loadAccounts();
    } catch (error) {
      toast.error('Erro ao atualizar conta a pagar');
      console.error('Erro ao atualizar conta a pagar:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await accountsPayableAPI.delete(selectedAccount.id);
      toast.success('Conta a pagar deletada com sucesso!');
      setShowConfirmModal(false);
      setSelectedAccount(null);
      loadAccounts();
    } catch (error) {
      toast.error('Erro ao deletar conta a pagar');
      console.error('Erro ao deletar conta a pagar:', error);
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
      console.log('Tentando marcar conta como paga:', accountToPay);
      await accountsPayableAPI.markAsPaid(accountToPay.id);
      toast.success('Conta marcada como paga com sucesso!');
      setShowPayModal(false);
      setAccountToPay(null);
      loadAccounts();
    } catch (error) {
      toast.error('Erro ao marcar conta como paga');
      console.error('Erro ao marcar conta como paga:', error);
    }
  };

  const getStatusColor = (status, dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    
    if (status === 'paid') return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200';
    if (status === 'pending' && due < today) return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200';
    if (status === 'pending') return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'paid': return 'Pago';
      case 'overdue': return 'Vencido';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header da Página */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-lg shadow-red-500/25">
              <CreditCard className="h-8 w-8 text-white drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Contas a Pagar
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Gerencie suas obrigações financeiras
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
                  placeholder="Buscar por descrição ou fornecedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex space-x-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
              >
                <option value="">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="overdue">Vencido</option>
              </select>
              <div className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Agrupado por Fornecedor
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
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:from-red-700 hover:to-orange-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta a Pagar
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
          ) : (
            <div 
              ref={scrollContainerRef}
              className={scrollClasses}
              style={scrollStyles}
            >
              {getAccountsBySupplier().map((supplierGroup, index) => (
                <div key={supplierGroup.supplier} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6" style={{ animationDelay: `${index * 100}ms` }}>
                  {/* Header do Fornecedor */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 p-6 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                          <CreditCard className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {supplierGroup.supplier}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {supplierGroup.accounts.length} conta{supplierGroup.accounts.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatCurrency(supplierGroup.totalAmount)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 dark:text-gray-400">Pendente</div>
                          <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                            {formatCurrency(supplierGroup.pendingAmount)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 dark:text-gray-400">Vencido</div>
                          <div className="text-lg font-bold text-red-600 dark:text-red-400">
                            {formatCurrency(supplierGroup.overdueAmount)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 dark:text-gray-400">Pago</div>
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(supplierGroup.paidAmount)}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => toggleSupplier(supplierGroup.supplier)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          title={expandedSuppliers.has(supplierGroup.supplier) ? 'Recolher' : 'Expandir'}
                        >
                          <div className={`transform transition-transform duration-200 ${
                            expandedSuppliers.has(supplierGroup.supplier) ? 'rotate-180' : ''
                          }`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Lista de Contas do Fornecedor */}
                  {expandedSuppliers.has(supplierGroup.supplier) && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Descrição
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
                          {supplierGroup.accounts.map((account) => (
                            <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <CreditCard className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{account.description}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">ID: {account.id}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(account.amount)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                                  <div>
                                    <div className={`text-sm ${isOverdue(account.due_date) ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-900 dark:text-white'}`}>
                                      {formatDate(account.due_date)}
                                    </div>
                                    {isOverdue(account.due_date) && (
                                      <div className="text-xs text-red-500 dark:text-red-400">Vencido</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  account.status === 'paid' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                    : account.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                }`}>
                                  {getStatusLabel(account.status)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  {account.status !== 'paid' && (
                                    <button
                                      onClick={() => openPayModal(account)}
                                      className="text-green-600 hover:text-green-900 btn-action"
                                      title="Marcar como Pago"
                                    >
                                      <CheckCircle className="h-4 w-4 icon-action" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => openEditModal(account)}
                                    className="text-blue-600 hover:text-blue-900 btn-action"
                                    title="Editar"
                                  >
                                    <Edit className="h-4 w-4 icon-action" />
                                  </button>
                                  <button
                                    onClick={() => openDeleteModal(account)}
                                    className="text-red-600 hover:text-red-900 btn-action"
                                    title="Excluir"
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
          )}
          
          {!loading && accounts.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhuma conta a pagar encontrada</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Comece criando sua primeira conta a pagar.
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
          type="payable"
        />

        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setSelectedAccount(null);
          }}
          onConfirm={handleDeleteAccount}
          title="Deletar Conta a Pagar"
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

      </div>
    </div>
  );
};

export default AccountsPayable; 