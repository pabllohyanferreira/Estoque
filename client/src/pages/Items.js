import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import { itemsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/formatters';
import ItemModal from '../components/ItemModal';
import StockModal from '../components/StockModal';
import ConfirmModal from '../components/ConfirmModal';
import ProductImage from '../components/ProductImage';

const Items = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category = selectedCategory;
      if (showLowStockOnly) params.lowStock = 'true';

      const response = await itemsAPI.getAll(params);
      setItems(response.data);
    } catch (error) {
      toast.error('Erro ao carregar produtos');
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, showLowStockOnly]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await itemsAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      
      // Se não há categorias, inicializar com array vazio
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    loadItems();
    loadCategories();
  }, [loadItems, loadCategories]);

  const handleCreateItem = async (itemData) => {
    try {
      // Se itemData é FormData (com imagem), enviar diretamente
      if (itemData instanceof FormData) {
        await itemsAPI.create(itemData);
      } else {
        // Se não é FormData, enviar como JSON
        await itemsAPI.create(itemData);
      }
      toast.success('Produto criado com sucesso!');
      setShowItemModal(false);
      loadItems();
    } catch (error) {
      console.error('Erro detalhado ao criar produto:', error);
      console.error('Resposta do servidor:', error.response?.data);
      console.error('Status do erro:', error.response?.status);
      toast.error('Erro ao criar produto');
      console.error('Erro ao criar produto:', error);
    }
  };

  const handleUpdateItem = async (itemData) => {
    try {
      // Se itemData é FormData (com imagem), enviar diretamente
      if (itemData instanceof FormData) {
        await itemsAPI.update(editingItem.id, itemData);
      } else {
        // Se não é FormData, enviar como JSON
        await itemsAPI.update(editingItem.id, itemData);
      }
      toast.success('Produto atualizado com sucesso!');
      setShowItemModal(false);
      setEditingItem(null);
      loadItems();
    } catch (error) {
      console.error('Erro detalhado ao atualizar produto:', error);
      toast.error('Erro ao atualizar produto');
      console.error('Erro ao atualizar produto:', error);
    }
  };

  const handleDeleteItem = async () => {
    try {
      await itemsAPI.delete(selectedItem.id);
      toast.success('Produto deletado com sucesso!');
      setShowConfirmModal(false);
      setSelectedItem(null);
      loadItems();
    } catch (error) {
      toast.error('Erro ao deletar produto');
      console.error('Erro ao deletar produto:', error);
    }
  };

  const handleStockUpdate = async (stockData) => {
    try {

      
      await itemsAPI.updateStock(selectedItem.id, stockData);
      toast.success('Estoque atualizado com sucesso!');
      setShowStockModal(false);
      setSelectedItem(null);
      loadItems();
    } catch (error) {
      toast.error('Erro ao atualizar estoque');
      console.error('Erro ao atualizar estoque:', error);
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setShowItemModal(true);
  };

  const openStockModal = (item) => {
    setSelectedItem(item);
    setShowStockModal(true);
  };

  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setShowConfirmModal(true);
  };

  const handleFilter = () => {
    loadItems();
  };


  // const getStatusColor = (item) => {
  //   if (item.quantity <= item.min_quantity) return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200';
  //   if (item.quantity <= item.min_quantity * 1.5) return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200';
  //   return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200';
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header da Página */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg shadow-blue-500/25">
              <Package className="h-8 w-8 text-white drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Produtos
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Gerencie seu catálogo de produtos e estoque
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Ações */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Busca e Filtros */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 flex-1">
              {/* Campo de Busca */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Nome, descrição ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                />
              </div>

              {/* Filtro de Categoria */}
              <div className="sm:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                >
                  <option value="">Todas as categorias</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Checkbox de Estoque Baixo */}
              <div className="flex items-center">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLowStockOnly}
                    onChange={(e) => setShowLowStockOnly(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Apenas estoque baixo
                  </span>
                </label>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex space-x-3">
              <button
                onClick={handleFilter}
                className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-xl shadow-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </button>
              <button
                onClick={() => setShowItemModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de Produtos */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum produto encontrado</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Comece adicionando seu primeiro produto.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Estoque
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Preço
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Parcelamento
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-700 dark:hover:to-blue-900/20 transition-all duration-200 transform hover:scale-[1.01]" style={{ animationDelay: `${index * 50}ms` }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ProductImage imageData={item.image_url} alt={item.name} />
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{item.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{item.description}</div>
                            {item.barcode && (
                              <div className="text-xs text-gray-400 dark:text-gray-500">Código: {item.barcode}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          item.category 
                            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {item.category || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className={`text-sm font-semibold ${
                            item.stock <= item.min_stock 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            {item.stock} un
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Mín: {item.min_stock} un
                          </span>
                          {item.stock <= item.min_stock && (
                            <AlertTriangle className="h-4 w-4 text-red-500 ml-2" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(item.price)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.installments > 1 ? `${item.installments}x` : 'À vista'}
                          </span>
                          {item.installments > 1 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatCurrency(item.installment_value)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openStockModal(item)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 transform hover:scale-110"
                            title="Ajustar Estoque"
                          >
                            <Package className="h-4 w-4 icon-action" />
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200 transform hover:scale-110"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4 icon-action" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(item)}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 transform hover:scale-110"
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
      </div>

      {/* Modais */}
      <ItemModal
        isOpen={showItemModal}
        onClose={() => {
          setShowItemModal(false);
          setEditingItem(null);
        }}
        onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
        item={editingItem}
        categories={categories}
      />

      <StockModal
        isOpen={showStockModal}
        onClose={() => {
          setShowStockModal(false);
          setSelectedItem(null);
        }}
        onSubmit={handleStockUpdate}
        item={selectedItem}
      />

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setSelectedItem(null);
        }}
        onConfirm={handleDeleteItem}
        title="Deletar Produto"
        message={`Tem certeza que deseja deletar o produto "${selectedItem?.name}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
};

export default Items; 