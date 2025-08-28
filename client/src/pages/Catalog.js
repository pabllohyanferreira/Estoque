import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, ExternalLink, Copy, Check } from 'lucide-react';
import { itemsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/formatters';
import ProductImage from '../components/ProductImage';

const Catalog = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    loadItems();
    loadCategories();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category = selectedCategory;

      const response = await itemsAPI.getAll(params);
      // Filtrar apenas itens com estoque disponível
      const availableItems = response.data.filter(item => item.quantity > 0);
      setItems(availableItems);
    } catch (error) {
      toast.error('Erro ao carregar produtos');
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await itemsAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleSearch = () => {
    loadItems();
  };

  const handleCopyLink = async () => {
    try {
      const publicUrl = `${window.location.origin}/public`;
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      toast.success('Link copiado para a área de transferência!');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const handleOpenInNewTab = () => {
    window.open(`${window.location.origin}/public`, '_blank');
  };

  const getStockStatus = (quantity, minQuantity) => {
    if (quantity <= 0) return { text: 'Indisponível', color: 'text-red-600 dark:text-red-400' };
    if (quantity <= minQuantity) return { text: 'Últimas unidades', color: 'text-yellow-600 dark:text-yellow-400' };
    return { text: 'Disponível', color: 'text-green-600 dark:text-green-400' };
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Catálogo</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Vitrine de produtos para seus clientes
          </p>
        </div>
        
        {/* Botões de Ação */}
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors btn-expand"
            title="Copiar link do catálogo"
          >
            {copiedLink ? (
              <Check className="h-4 w-4 mr-2 text-green-600" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copiedLink ? 'Copiado!' : 'Copiar Link'}
          </button>
          
          <button
            onClick={handleOpenInNewTab}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors btn-expand"
            title="Abrir em nova aba"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir Vitrine
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 card-expand animate-grow-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Busca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Buscar
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome, descrição ou código..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoria
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Botão Filtrar */}
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full btn-primary"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Produtos */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg card-expand animate-grow-in">
        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
            {items.map((item) => {
              const stockStatus = getStockStatus(item.quantity, item.min_quantity);
              return (
                <div key={item.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow card-expand animate-grow-in">
                  <div className="flex items-center mb-3">
                    <ProductImage 
                      imageData={item.image_data} 
                      alt={item.name}
                      className="h-12 w-12 object-cover rounded-lg mr-3 border border-gray-200 dark:border-gray-600"
                      fallbackClassName="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {item.category && (
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Categoria:</span> {item.category}
                      </div>
                    )}
                    
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Preço:</span> {formatCurrency(item.price)}
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Estoque:</span> {item.quantity} {item.unit}
                    </div>
                    
                    <div className={`text-sm font-medium ${stockStatus.color}`}>
                      {stockStatus.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Nenhum produto encontrado
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Tente ajustar os filtros de busca.
            </p>
          </div>
        )}
      </div>

      {/* Informações do Link */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ExternalLink className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Compartilhe este catálogo
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>Use o link abaixo para compartilhar este catálogo com seus clientes:</p>
              <p className="mt-1 font-mono text-xs bg-blue-100 dark:bg-blue-800 p-2 rounded break-all">
                {`${window.location.origin}/public`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Catalog; 