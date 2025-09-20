import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, DollarSign, FileText, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

const AccountModal = ({ isOpen, onClose, onSubmit, account, type, clients = [] }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) {
      if (account) {
        // Edição
        reset({
          description: account.description,
          amount: account.amount,
          due_date: account.due_date,
          status: account.status || 'pending',
          supplier: account.supplier || '',
          category: account.category || '',
          notes: account.notes || '',
          client_id: account.client_id || ''
        });
      } else {
        // Criação
        reset({
          description: '',
          amount: '',
          due_date: '',
          status: 'pending',
          supplier: '',
          category: '',
          notes: '',
          client_id: ''
        });
      }
    }
  }, [isOpen, account, reset]);

  const handleFormSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (account) {
      return type === 'payable' ? 'Editar Conta a Pagar' : 'Editar Conta a Receber';
    }
    return type === 'payable' ? 'Nova Conta a Pagar' : 'Nova Conta a Receber';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-200 dark:border-gray-700">
          {/* Header com gradiente */}
          <div className={`px-6 py-4 ${type === 'payable' ? 'bg-gradient-to-r from-red-600 to-orange-600' : 'bg-gradient-to-r from-green-600 to-emerald-600'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  {type === 'payable' ? (
                    <TrendingDown className="h-6 w-6 text-white icon-hover" />
                  ) : (
                    <TrendingUp className="h-6 w-6 text-white icon-hover" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {getTitle()}
                  </h3>
                  <p className="text-white text-opacity-90 text-sm">
                    {account ? 'Atualize as informações da conta' : 'Preencha as informações da nova conta'}
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
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              {/* Descrição */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-blue-600" />
                  Descrição
                </label>
                <input
                  type="text"
                  {...register('description', { required: 'Descrição é obrigatória' })}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                  placeholder="Digite a descrição da conta..."
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Valor */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                  Valor
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('amount', { 
                      required: 'Valor é obrigatório',
                      min: { value: 0, message: 'Valor deve ser positivo' }
                    })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="0,00"
                  />
                </div>
                {errors.amount && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.amount.message}
                  </p>
                )}
              </div>

              {/* Data de Vencimento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Data de Vencimento *
                </label>
                <input
                  type="date"
                  {...register('due_date', { required: 'Data de vencimento é obrigatória' })}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                {errors.due_date && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.due_date.message}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  {...register('status')}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="overdue">Vencido</option>
                </select>
              </div>

              {/* Cliente (apenas para contas a receber) */}
              {type === 'receivable' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cliente
                  </label>
                  <select
                    {...register('client_id')}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Fornecedor (apenas para contas a pagar) */}
              {type === 'payable' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fornecedor
                  </label>
                  <input
                    type="text"
                    {...register('supplier')}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Nome do fornecedor..."
                  />
                </div>
              )}

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Categoria
                </label>
                <select
                  {...register('category')}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Selecione uma categoria</option>
                  <option value="Alimentação">Alimentação</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Serviços">Serviços</option>
                  <option value="Impostos">Impostos</option>
                  <option value="Fornecedores">Fornecedores</option>
                  <option value="Vendas">Vendas</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Observações
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Observações adicionais..."
                />
              </div>
            </form>
          </div>

          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row-reverse gap-3">
              <button
                type="button"
                onClick={handleSubmit(handleFormSubmit)}
                disabled={isSubmitting}
                className={`w-full sm:w-auto px-8 py-3 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  type === 'payable' 
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 focus:ring-red-500' 
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:ring-green-500'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    {type === 'payable' ? (
                      <TrendingDown className="h-5 w-5 mr-2 icon-button" />
                    ) : (
                      <TrendingUp className="h-5 w-5 mr-2 icon-button" />
                    )}
                    {account ? 'Atualizar Conta' : 'Criar Conta'}
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

export default AccountModal; 