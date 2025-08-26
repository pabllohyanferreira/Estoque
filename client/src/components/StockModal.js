import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Package } from 'lucide-react';

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
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Ajustar Estoque
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 btn-close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Informações do Produto */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-gray-400 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-500">
                    Estoque atual: <span className="font-medium">{item.quantity} {item.unit}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Estoque mínimo: <span className="font-medium">{item.min_quantity} {item.unit}</span>
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              {/* Tipo de Movimentação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Movimentação *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none">
                    <input
                      type="radio"
                      value="entrada"
                      {...register('type', { required: 'Tipo é obrigatório' })}
                      className="sr-only"
                    />
                    <span className="flex flex-1">
                      <span className="flex flex-col">
                        <span className="block text-sm font-medium text-gray-900">Entrada</span>
                        <span className="mt-1 flex items-center text-sm text-gray-500">
                          Adicionar ao estoque
                        </span>
                      </span>
                    </span>
                    <span className={`pointer-events-none absolute -inset-px rounded-lg border-2 ${
                      movementType === 'entrada' ? 'border-blue-500' : 'border-transparent'
                    }`}></span>
                  </label>

                  <label className="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none">
                    <input
                      type="radio"
                      value="saida"
                      {...register('type', { required: 'Tipo é obrigatório' })}
                      className="sr-only"
                    />
                    <span className="flex flex-1">
                      <span className="flex flex-col">
                        <span className="block text-sm font-medium text-gray-900">Saída</span>
                        <span className="mt-1 flex items-center text-sm text-gray-500">
                          Remover do estoque
                        </span>
                      </span>
                    </span>
                    <span className={`pointer-events-none absolute -inset-px rounded-lg border-2 ${
                      movementType === 'saida' ? 'border-blue-500' : 'border-transparent'
                    }`}></span>
                  </label>
                </div>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                )}
              </div>

              {/* Quantidade */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantidade *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    min="1"
                    {...register('quantity', { 
                      required: 'Quantidade é obrigatória',
                      min: { value: 1, message: 'Quantidade deve ser maior que zero' },
                      validate: (value) => {
                        if (movementType === 'saida' && parseInt(value) > item.quantity) {
                          return 'Quantidade insuficiente em estoque';
                        }
                        return true;
                      }
                    })}
                    className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">{item.unit}</span>
                  </div>
                </div>
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
                )}
                {movementType === 'saida' && (
                  <p className="mt-1 text-sm text-gray-500">
                    Estoque disponível: {item.quantity} {item.unit}
                  </p>
                )}
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Motivo *
                </label>
                <select
                  {...register('reason', { required: 'Motivo é obrigatório' })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione um motivo</option>
                  {movementType === 'entrada' ? (
                    <>
                      <option value="Compra">Compra</option>
                      <option value="Devolução de Cliente">Devolução de Cliente</option>
                      <option value="Ajuste de Inventário">Ajuste de Inventário</option>
                      <option value="Transferência">Transferência</option>
                      <option value="Outro">Outro</option>
                    </>
                  ) : (
                    <>
                      <option value="Venda">Venda</option>
                      <option value="Devolução ao Fornecedor">Devolução ao Fornecedor</option>
                      <option value="Perda/Avaria">Perda/Avaria</option>
                      <option value="Ajuste de Inventário">Ajuste de Inventário</option>
                      <option value="Transferência">Transferência</option>
                      <option value="Outro">Outro</option>
                    </>
                  )}
                </select>
                {errors.reason && (
                  <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
                )}
              </div>

              {/* Preview do Resultado */}
              {watch('quantity') && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Resultado da Operação</h4>
                  <div className="text-sm text-blue-700">
                    <p>
                      Estoque atual: <span className="font-medium">{item.quantity} {item.unit}</span>
                    </p>
                    <p>
                      {movementType === 'entrada' ? '+' : '-'} {watch('quantity')} {item.unit}
                    </p>
                    <p className="font-medium">
                      Novo estoque: {movementType === 'entrada' 
                        ? item.quantity + parseInt(watch('quantity') || 0)
                        : item.quantity - parseInt(watch('quantity') || 0)
                      } {item.unit}
                    </p>
                  </div>
                </div>
              )}
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
                  Atualizando...
                </>
              ) : (
                'Atualizar Estoque'
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

export default StockModal; 