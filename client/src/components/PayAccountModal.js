import React from 'react';
import { X, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const PayAccountModal = ({ isOpen, onClose, onConfirm, account, type }) => {
  if (!isOpen) return null;

  // const accountType = type === 'payable' ? 'a pagar' : 'a receber';
  // const actionType = type === 'payable' ? 'pagar' : 'receber';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full modal-expand scrollable-content">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Confirmar Pagamento
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex items-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500 mr-4" />
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Tem certeza que deseja marcar como paga a conta:
                </p>
                <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">
                  {account?.description}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Valor: {formatCurrency(account?.amount)}
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Atenção:</strong> Esta ação marcará a conta como paga e não poderá ser desfeita facilmente.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onConfirm}
                              className="w-full btn-primary sm:ml-3 sm:w-auto sm:text-sm"
            >
              Confirmar Pagamento
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

export default PayAccountModal; 