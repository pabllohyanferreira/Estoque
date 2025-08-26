import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, CreditCard, Calendar, DollarSign } from 'lucide-react';
import { accountsPayableAPI } from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, isOverdue } from '../utils/formatters';
import AccountModal from '../components/AccountModal';
import ConfirmModal from '../components/ConfirmModal';


const AccountsPayable = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (searchTerm) params.search = searchTerm;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedSupplier) params.supplier = selectedSupplier;

      const response = await accountsPayableAPI.getAll(params);
      setAccounts(response.data);
    } catch (error) {
      toast.error('Erro ao carregar contas a pagar');
      console.error('Erro ao carregar contas a pagar:', error);
    } finally {
      setLoading(false);
    }
  };

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



  const getStatusColor = (status, dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    
    if (status === 'paid') return 'bg-green-100 text-green-800';
    if (status === 'pending' && due < today) return 'bg-red-100 text-red-800';
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contas a Pagar</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie suas obrigações financeiras
          </p>
        </div>
        <button
          onClick={() => setShowAccountModal(true)}
          className="mt-4 sm:mt-0 btn-primary btn-glow"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Descrição ou fornecedor..."
                className="pl-10 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="overdue">Vencido</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fornecedor
            </label>
            <input
              type="text"
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              placeholder="Nome do fornecedor..."
              className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={loadAccounts}
              className="w-full btn-secondary btn-elevate"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Contas */}
      <div className="bg-white shadow rounded-lg">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fornecedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CreditCard className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{account.description}</div>
                          {account.category && (
                            <div className="text-sm text-gray-500">{account.category}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {account.supplier || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(account.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                        <span className={`text-sm ${isOverdue(account.due_date) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
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
                        <button
                          onClick={() => openEditModal(account)}
                          className="text-indigo-600 hover:text-indigo-900 btn-action"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(account)}
                          className="text-red-600 hover:text-red-900 btn-action"
                          title="Deletar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && accounts.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma conta a pagar encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">
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
    </div>
  );
};

export default AccountsPayable; 