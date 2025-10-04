import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Users, 
  CreditCard, 
  Receipt, 
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ShoppingCart
} from 'lucide-react';
import { itemsAPI, clientsAPI, statsAPI, accountsPayableAPI, accountsReceivableAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';
import PayAccountModal from '../components/PayAccountModal';
import SalesModal from '../components/SalesModal';

const Dashboard = () => {
  const [stats, setStats] = useState({
    items: { total: 0, lowStock: 0 },
    clients: { total: 0 },
    accounts: { payable: {}, receivable: {} }
  });
  const [loading, setLoading] = useState(true);
  const [recentItems, setRecentItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [accountToPay, setAccountToPay] = useState(null);
  const [overdueAccounts, setOverdueAccounts] = useState({ payable: [], receivable: [] });
  const [expandedSections, setExpandedSections] = useState({
    payable: false,
    receivable: false,
    lowStock: false,
    recentItems: false
  });
  const [showSalesModal, setShowSalesModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Carregar dados em paralelo
      const [itemsRes, clientsRes, accountsStatsRes, lowStockRes, overduePayableRes, overdueReceivableRes] = await Promise.all([
        itemsAPI.getAll(),
        clientsAPI.getAll(),
        statsAPI.getAccountsStats(),
        itemsAPI.getAll({ lowStock: 'true' }),
        accountsPayableAPI.getAll({ status: 'pending', overdue: 'true' }),
        accountsReceivableAPI.getAll({ status: 'pending', overdue: 'true' })
      ]);

      setStats({
        items: { 
          total: itemsRes.data.length,
          lowStock: lowStockRes.data.length
        },
        clients: { 
          total: clientsRes.data.length 
        },
        accounts: accountsStatsRes.data
      });

      setLowStockItems(lowStockRes.data.slice(0, 5));
      setRecentItems(itemsRes.data.slice(0, 5));
      setOverdueAccounts({
        payable: overduePayableRes.data.slice(0, 3),
        receivable: overdueReceivableRes.data.slice(0, 3)
      });
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const openPayModal = (account, type) => {
    setAccountToPay({ ...account, type });
    setShowPayModal(true);
  };

  const handlePayAccount = async () => {
    try {
      console.log('Tentando marcar conta como paga no Dashboard:', accountToPay);
      if (accountToPay.type === 'payable') {
        await accountsPayableAPI.markAsPaid(accountToPay.id);
      } else {
        await accountsReceivableAPI.markAsPaid(accountToPay.id);
      }
      toast.success('Conta marcada como paga com sucesso!');
      setShowPayModal(false);
      setAccountToPay(null);
      loadDashboardData();
    } catch (error) {
      toast.error('Erro ao marcar conta como paga');
      console.error('Erro ao marcar conta como paga:', error);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200 card-expand animate-grow-in">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${color} icon-status`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900 dark:text-white">{value}</dd>
              {subtitle && (
                <dd className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visão Geral</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Visão geral do seu sistema de estoque
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Produtos"
          value={stats.items.total}
          icon={Package}
          color="text-blue-600"
        />
        <StatCard
          title="Clientes Cadastrados"
          value={stats.clients.total}
          icon={Users}
          color="text-green-600"
        />
        <StatCard
          title="Contas a Pagar"
          value={formatCurrency(stats.accounts.pending_payable)}
          icon={CreditCard}
          color="text-red-600"
          subtitle={`${stats.accounts.total_payable || 0} contas`}
        />
        <StatCard
          title="Contas a Receber"
          value={formatCurrency(stats.accounts.pending_receivable)}
          icon={Receipt}
          color="text-purple-600"
          subtitle={`${stats.accounts.total_receivable || 0} contas`}
        />
      </div>

      {/* Botão de Vendas Rápido */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setShowSalesModal(true)}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center space-x-2"
        >
          <ShoppingCart className="h-5 w-5" />
          <span>Nova Venda</span>
        </button>
      </div>

      {/* Alertas e Informações */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Produtos com Estoque Baixo */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200 card-expand animate-grow-in">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <h3 className="ml-2 text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Produtos com Estoque Baixo
                </h3>
                <span className="ml-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded-full">
                  {lowStockItems.length}
                </span>
              </div>
              {lowStockItems.length > 0 && (
                <button
                  onClick={() => toggleSection('lowStock')}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {expandedSections.lowStock ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </button>
              )}
            </div>
            <div className="mt-4">
              {lowStockItems.length > 0 ? (
                <div className="space-y-3">
                  {(expandedSections.lowStock ? lowStockItems : lowStockItems.slice(0, 2)).map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Estoque: {item.stock} un (Mín: {item.min_stock})
                        </p>
                      </div>
                      <span className="bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded-full font-medium">
                        {item.stock} un
                      </span>
                    </div>
                  ))}
                  {!expandedSections.lowStock && lowStockItems.length > 2 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      +{lowStockItems.length - 2} produtos adicionais
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <AlertTriangle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Todos os produtos com estoque adequado</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contas a Pagar Vencidas */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200 card-expand animate-grow-in">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-red-500" />
                <h3 className="ml-2 text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Contas a Pagar Vencidas
                </h3>
                <span className="ml-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs px-2 py-1 rounded-full">
                  {overdueAccounts.payable.length}
                </span>
              </div>
              {overdueAccounts.payable.length > 0 && (
                <button
                  onClick={() => toggleSection('payable')}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {expandedSections.payable ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </button>
              )}
            </div>
            <div className="mt-4 space-y-3">
              {overdueAccounts.payable.length > 0 ? (
                <>
                  {(expandedSections.payable ? overdueAccounts.payable : overdueAccounts.payable.slice(0, 2)).map((account) => (
                    <div key={account.id} className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{account.description}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {account.supplier || 'Fornecedor não informado'} • Vencimento: {new Date(account.due_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-red-800 dark:text-red-200">
                          {formatCurrency(account.amount)}
                        </span>
                        {account.status !== 'paid' && (
                          <button
                            onClick={() => openPayModal(account, 'payable')}
                            className="text-green-600 hover:text-green-900 btn-action"
                            title="Marcar como Paga"
                          >
                            <CheckCircle className="h-4 w-4 icon-action" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {!expandedSections.payable && overdueAccounts.payable.length > 2 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      +{overdueAccounts.payable.length - 2} contas adicionais
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <CreditCard className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma conta vencida</p>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    Total: {formatCurrency(stats.accounts.overdue_payable || 0)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contas a Receber Vencidas */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200 card-expand animate-grow-in">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Receipt className="h-5 w-5 text-purple-500" />
                <h3 className="ml-2 text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Contas a Receber Vencidas
                </h3>
                <span className="ml-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs px-2 py-1 rounded-full">
                  {overdueAccounts.receivable.length}
                </span>
              </div>
              {overdueAccounts.receivable.length > 0 && (
                <button
                  onClick={() => toggleSection('receivable')}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {expandedSections.receivable ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </button>
              )}
            </div>
            <div className="mt-4 space-y-3">
              {overdueAccounts.receivable.length > 0 ? (
                <>
                  {(expandedSections.receivable ? overdueAccounts.receivable : overdueAccounts.receivable.slice(0, 2)).map((account) => (
                    <div key={account.id} className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{account.description}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {account.client_name || 'Cliente não informado'} • Vencimento: {new Date(account.due_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                          {formatCurrency(account.amount)}
                        </span>
                        {account.status !== 'paid' && (
                          <button
                            onClick={() => openPayModal(account, 'receivable')}
                            className="text-green-600 hover:text-green-900 btn-action"
                            title="Marcar como Paga"
                          >
                            <CheckCircle className="h-4 w-4 icon-action" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {!expandedSections.receivable && overdueAccounts.receivable.length > 2 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      +{overdueAccounts.receivable.length - 2} contas adicionais
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <Receipt className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma conta vencida</p>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    Total: {formatCurrency(stats.accounts.overdue_receivable || 0)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Produtos Recentes */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200 card-expand animate-grow-in">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
            Produtos Recentes
          </h3>
          <div>
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estoque
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Preço
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {recentItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors table-row-expand" style={{ animationDelay: `${index * 50}ms` }}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{item.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.category || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.stock <= item.min_stock 
                          ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200' 
                          : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                      }`}>
                        {item.stock} un
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Pagamento */}
      <PayAccountModal
        isOpen={showPayModal}
        onClose={() => {
          setShowPayModal(false);
          setAccountToPay(null);
        }}
        onConfirm={handlePayAccount}
        account={accountToPay}
      />

      {/* Modal de Vendas */}
      <SalesModal
        isOpen={showSalesModal}
        onClose={() => setShowSalesModal(false)}
        onSubmit={() => {
          setShowSalesModal(false);
          loadDashboardData(); // Recarregar dados após venda
        }}
      />

    </div>
  );
};

export default Dashboard; 