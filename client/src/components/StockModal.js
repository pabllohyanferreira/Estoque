import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Package, TrendingUp, TrendingDown, Hash, FileText, AlertCircle } from 'lucide-react';

const StockModal = ({ isOpen, onClose, onSubmit, item }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const movementType = watch('type', 'entrada');

  useEffect(() => {
    if (isOpen) {
      reset({
        type: 'entrada',
        quantity: '',
        reason: ''
      });
    }
  }, [isOpen, reset]);

  const handleFormSubmit = async (data) => {
    if (isSubmitting) return; // Prevenir submissões duplas
    
    try {
      setIsSubmitting(true);
  
      await onSubmit(data);
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-200 dark:border-gray-700">
          {/* Header com gradiente */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <Package className="h-6 w-6 text-white icon-hover" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Ajustar Estoque
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Gerencie o estoque do produto selecionado
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 icon-hover" />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 px-6 py-6">
            {/* Informações do Produto */}
            <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-lg mr-4">
                  <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.name}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <Hash className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-gray-600 dark:text-gray-300">Estoque atual:</span>
                      <span className="font-semibold text-gray-900 dark:text-white ml-1">{item.stock} un</span>
                    </div>
                    <div className="flex items-center">
                      <TrendingDown className="h-4 w-4 text-orange-600 mr-2" />
                      <span className="text-gray-600 dark:text-gray-300">Estoque mínimo:</span>
                      <span className="font-semibold text-gray-900 dark:text-white ml-1">{item.min_stock} un</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
              {/* Tipo de Movimentação */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
                  Tipo de Movimentação
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`relative flex cursor-pointer rounded-xl border-2 p-4 shadow-lg focus:outline-none transition-all transform hover:scale-105 ${
                    movementType === 'entrada' 
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 border-green-500 shadow-green-100 dark:shadow-green-900' 
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600'
                  }`}>
                    <input
                      type="radio"
                      value="entrada"
                      {...register('type', { required: 'Tipo é obrigatório' })}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        movementType === 'entrada' 
                          ? 'bg-green-100 dark:bg-green-800' 
                          : 'bg-gray-100 dark:bg-gray-600'
                      }`}>
                        <TrendingUp className={`h-5 w-5 ${
                          movementType === 'entrada' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`} />
                      </div>
                      <div>
                        <span className={`block text-sm font-semibold ${
                          movementType === 'entrada' 
                            ? 'text-green-900 dark:text-green-200' 
                            : 'text-gray-900 dark:text-white'
                        }`}>Entrada</span>
                        <span className={`text-xs ${
                          movementType === 'entrada' 
                            ? 'text-green-700 dark:text-green-300' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          Adicionar ao estoque
                        </span>
                      </div>
                    </div>
                  </label>

                  <label className={`relative flex cursor-pointer rounded-xl border-2 p-4 shadow-lg focus:outline-none transition-all transform hover:scale-105 ${
                    movementType === 'saida' 
                      ? 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 border-blue-500 shadow-blue-100 dark:shadow-blue-900' 
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}>
                    <input
                      type="radio"
                      value="saida"
                      {...register('type', { required: 'Tipo é obrigatório' })}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        movementType === 'saida' 
                          ? 'bg-blue-100 dark:bg-blue-800' 
                          : 'bg-gray-100 dark:bg-gray-600'
                      }`}>
                        <TrendingDown className={`h-5 w-5 ${
                          movementType === 'saida' 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`} />
                      </div>
                      <div>
                        <span className={`block text-sm font-semibold ${
                          movementType === 'saida' 
                            ? 'text-blue-900 dark:text-blue-200' 
                            : 'text-gray-900 dark:text-white'
                        }`}>Saída</span>
                        <span className={`text-xs ${
                          movementType === 'saida' 
                            ? 'text-blue-700 dark:text-blue-300' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          Remover do estoque
                        </span>
                      </div>
                    </div>
                  </label>
                </div>
                {errors.type && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.type.message}
                  </p>
                )}
              </div>

              {/* Quantidade */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Hash className="h-4 w-4 mr-2 text-green-600" />
                  Quantidade
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    placeholder="Digite a quantidade"
                    {...register('quantity', { 
                      required: 'Quantidade é obrigatória',
                      min: { value: 1, message: 'Quantidade deve ser maior que zero' },
                      validate: (value) => {
                        if (movementType === 'saida' && parseInt(value) > item.stock) {
                          return 'Quantidade insuficiente em estoque';
                        }
                        return true;
                      }
                    })}
                    className="w-full px-4 py-3 pr-16 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">un</span>
                  </div>
                </div>
                {errors.quantity && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.quantity.message}
                  </p>
                )}
                {movementType === 'saida' && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <TrendingDown className="h-4 w-4 mr-1 text-blue-600" />
                    Estoque disponível: <span className="font-semibold ml-1">{item.stock} un</span>
                  </p>
                )}
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-blue-600" />
                  Motivo da Movimentação
                </label>
                <select
                  {...register('reason', { required: 'Motivo é obrigatório' })}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                >
                  <option value="">Selecione um motivo</option>
                  {movementType === 'entrada' ? (
                    <>
                      <option value="Compra">Compra</option>
                      <option value="Devolução de Cliente">Devolução de Cliente</option>
                      <option value="Ajuste de Inventário">Ajuste de Inventário</option>
                      <option value="Transferência">Transferência</option>
                      <option value="Produção">Produção</option>
                      <option value="Outros">Outros</option>
                    </>
                  ) : (
                    <>
                      <option value="Venda">Venda</option>
                      <option value="Devolução ao Fornecedor">Devolução ao Fornecedor</option>
                      <option value="Ajuste de Inventário">Ajuste de Inventário</option>
                      <option value="Transferência">Transferência</option>
                      <option value="Perda">Perda</option>
                      <option value="Outros">Outros</option>
                    </>
                  )}
                </select>
                {errors.reason && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.reason.message}
                  </p>
                )}
              </div>

              {/* Preview do Resultado */}
              {watch('quantity') && (
                <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-xl p-6 border border-green-200 dark:border-green-700">
                  <h4 className="text-sm font-semibold text-green-900 dark:text-green-200 mb-3 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Resultado da Operação
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Estoque atual:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{item.stock} un</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">
                        {movementType === 'entrada' ? 'Adicionando:' : 'Removendo:'}
                      </span>
                      <span className={`font-semibold ${
                        movementType === 'entrada' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {movementType === 'entrada' ? '+' : '-'} {watch('quantity')} un
                      </span>
                    </div>
                    <div className="border-t border-green-200 dark:border-green-700 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-green-900 dark:text-green-200 font-semibold">Novo estoque:</span>
                        <span className="text-green-900 dark:text-green-200 font-bold text-lg">
                          {movementType === 'entrada' 
                            ? item.stock + parseInt(watch('quantity') || 0)
                            : item.stock - parseInt(watch('quantity') || 0)
                          } un
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row-reverse gap-3">
              <button
                type="button"
                onClick={handleSubmit(handleFormSubmit)}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Atualizando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Package className="h-5 w-5 mr-2 icon-button" />
                    Atualizar Estoque
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-8 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <div className="flex items-center justify-center">
                  <X className="h-5 w-5 mr-2 icon-button" />
                  Cancelar
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockModal; 