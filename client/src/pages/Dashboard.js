import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Users, 
  CreditCard, 
  Receipt, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  Calendar
} from 'lucide-react';
import { itemsAPI, clientsAPI, statsAPI } from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Dashboard = () => {
  const [stats, setStats] = useState({
    items: { total: 0, lowStock: 0 },
    clients: { total: 0 },
    accounts: { payable: {}, receivable: {} }
  });
  const [loading, setLoading] = useState(true);
  const [recentItems, setRecentItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Carregar dados em paralelo
      const [itemsRes, clientsRes, accountsStatsRes, lowStockRes] = await Promise.all([
        itemsAPI.getAll(),
        clientsAPI.getAll(),
        statsAPI.getAccountsStats(),
        itemsAPI.getAll({ lowStock: 'true' })
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
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
              {subtitle && (
                <dd className="text-sm text-gray-500">{subtitle}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
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

      {/* Alertas e Informações */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Produtos com Estoque Baixo */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <h3 className="ml-2 text-lg leading-6 font-medium text-gray-900">
                Produtos com Estoque Baixo
              </h3>
            </div>
            <div className="mt-4">
              {lowStockItems.length > 0 ? (
                <div className="space-y-3">
                  {lowStockItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-md">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          Estoque: {item.quantity} {item.unit} (Mín: {item.min_quantity})
                        </p>
                      </div>
                      <span className="text-sm font-medium text-yellow-800">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nenhum produto com estoque baixo</p>
              )}
            </div>
          </div>
        </div>

        {/* Contas Vencidas */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-red-500" />
              <h3 className="ml-2 text-lg leading-6 font-medium text-gray-900">
                Contas Vencidas
              </h3>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-md">
                <div>
                  <p className="text-sm font-medium text-gray-900">Contas a Pagar</p>
                  <p className="text-sm text-gray-500">Valor total vencido</p>
                </div>
                <span className="text-sm font-medium text-red-800">
                  {formatCurrency(stats.accounts.overdue_payable)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-md">
                <div>
                  <p className="text-sm font-medium text-gray-900">Contas a Receber</p>
                  <p className="text-sm text-gray-500">Valor total vencido</p>
                </div>
                <span className="text-sm font-medium text-red-800">
                  {formatCurrency(stats.accounts.overdue_receivable)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Produtos Recentes */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Produtos Recentes
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estoque
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.category || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.quantity <= item.min_quantity 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 