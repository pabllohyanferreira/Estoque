import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { itemsAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import ProductImage from '../components/ProductImage';

const PublicCatalog = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.getAll();
      // Filtrar apenas itens com estoque disponível
      const availableItems = response.data.filter(item => item.quantity > 0);
      setItems(availableItems);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (quantity, minQuantity) => {
    if (quantity <= 0) return { text: 'Indisponível', color: 'text-red-600 dark:text-red-400' };
    if (quantity <= minQuantity) return { text: 'Últimas unidades', color: 'text-yellow-600 dark:text-yellow-400' };
    return { text: 'Disponível', color: 'text-green-600 dark:text-green-400' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Package className="h-12 w-12 text-blue-600 dark:text-blue-400 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">EzStock</h1>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Catálogo de Produtos</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Confira nossos produtos disponíveis
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Grid de Produtos */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          {items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
              {items.map((item) => {
                const stockStatus = getStockStatus(item.quantity, item.min_quantity);
                return (
                  <div key={item.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-600 card-expand animate-grow-in">
                                      <div className="flex items-center mb-3">
                    <ProductImage 
                      imageData={item.image_data} 
                      alt={item.name}
                      className="h-16 w-16 object-cover rounded-lg mr-3 border border-gray-200 dark:border-gray-600"
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

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Para mais informações, entre em contato conosco.</p>
        </div>
      </div>
    </div>
  );
};

export default PublicCatalog; 