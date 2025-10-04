import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, User, Building, AlertCircle } from 'lucide-react';

const ClientModal = ({ isOpen, onClose, onSubmit, client }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) {
      if (client) {
        // Edição
        reset({
          name: client.name,
          email: client.email || '',
          phone: client.phone || '',
          address: client.address || '',
          cpf_cnpj: client.document || '',
          type: client.type || 'individual'
        });
      } else {
        // Criação
        reset({
          name: '',
          email: '',
          phone: '',
          address: '',
          cpf_cnpj: '',
          type: 'individual'
        });
      }
    }
  }, [isOpen, client, reset]);

  const handleFormSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-200 dark:border-gray-700">
          {/* Header com gradiente */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <User className="h-6 w-6 text-white icon-hover" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {client ? 'Editar Cliente' : 'Novo Cliente'}
                  </h3>
                  <p className="text-indigo-100 text-sm">
                    {client ? 'Atualize as informações do cliente' : 'Preencha as informações do novo cliente'}
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
              {/* Nome */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2 text-blue-600" />
                  Nome Completo
                </label>
                <input
                  type="text"
                  placeholder="Digite o nome completo"
                  {...register('name', { required: 'Nome é obrigatório' })}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Building className="h-4 w-4 mr-2 text-purple-600" />
                  Tipo de Cliente
                </label>
                <select
                  {...register('type', { required: 'Tipo é obrigatório' })}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-colors"
                >
                  <option value="individual">Pessoa Física</option>
                  <option value="company">Pessoa Jurídica</option>
                </select>
                {errors.type && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.type.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  {...register('email', { 
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido'
                    }
                  })}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Telefone
                </label>
                <input
                  type="text"
                  {...register('phone')}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="(11) 99999-9999"
                />
              </div>

              {/* CPF/CNPJ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  CPF/CNPJ
                </label>
                <input
                  type="text"
                  {...register('cpf_cnpj')}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                />
              </div>

              {/* Endereço */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Endereço
                </label>
                <textarea
                  {...register('address')}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Rua, número, bairro, cidade, estado, CEP"
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
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2 icon-button" />
                    {client ? 'Atualizar Cliente' : 'Criar Cliente'}
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

export default ClientModal; 