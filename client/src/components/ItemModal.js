import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';

const ItemModal = ({ isOpen, onClose, onSubmit, item, categories }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) {
      if (item) {
        // Edição
        reset({
          name: item.name,
          description: item.description || '',
          category: item.category || '',
          price: item.price,
          cost: item.cost,
          quantity: item.quantity,
          min_quantity: item.min_quantity,
          unit: item.unit || 'un',
          barcode: item.barcode || '',
          supplier: item.supplier || ''
        });
      } else {
        // Criação
        reset({
          name: '',
          description: '',
          category: '',
          price: '',
          cost: '',
          quantity: 0,
          min_quantity: 0,
          unit: 'un',
          barcode: '',
          supplier: ''
        });
      }
    }
  }, [isOpen, item, reset]);

  const handleFormSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {item ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 btn-close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Nome *
                  </label>
                  <input
                    type="text"
                    {...register('name', { required: 'Nome é obrigatório' })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Descrição */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Descrição
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Categoria
                  </label>
                  <select
                    {...register('category')}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Código de Barras */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Código de Barras
                  </label>
                  <input
                    type="text"
                    {...register('barcode')}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Preço */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Preço de Venda *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('price', { 
                      required: 'Preço é obrigatório',
                      min: { value: 0, message: 'Preço deve ser positivo' }
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                  )}
                </div>

                {/* Custo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Custo *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('cost', { 
                      required: 'Custo é obrigatório',
                      min: { value: 0, message: 'Custo deve ser positivo' }
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.cost && (
                    <p className="mt-1 text-sm text-red-600">{errors.cost.message}</p>
                  )}
                </div>

                {/* Quantidade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quantidade Inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('quantity', { 
                      min: { value: 0, message: 'Quantidade deve ser positiva' }
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
                  )}
                </div>

                {/* Quantidade Mínima */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quantidade Mínima
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('min_quantity', { 
                      min: { value: 0, message: 'Quantidade mínima deve ser positiva' }
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.min_quantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.min_quantity.message}</p>
                  )}
                </div>

                {/* Unidade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Unidade
                  </label>
                  <select
                    {...register('unit')}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="un">Unidade</option>
                    <option value="kg">Quilograma</option>
                    <option value="g">Grama</option>
                    <option value="l">Litro</option>
                    <option value="ml">Mililitro</option>
                    <option value="m">Metro</option>
                    <option value="cm">Centímetro</option>
                    <option value="pct">Pacote</option>
                    <option value="cx">Caixa</option>
                  </select>
                </div>

                {/* Fornecedor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fornecedor
                  </label>
                  <input
                    type="text"
                    {...register('supplier')}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </form>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSubmit(handleFormSubmit)}
              disabled={isSubmitting}
              className="w-full btn-primary btn-glow disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="spinner mr-2"></div>
                  Salvando...
                </>
              ) : (
                item ? 'Atualizar' : 'Criar'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full btn-secondary btn-elevate sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemModal; 