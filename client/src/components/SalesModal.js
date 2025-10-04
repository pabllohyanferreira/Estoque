import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart, User, Package, Calendar } from 'lucide-react';
import { itemsAPI, clientsAPI, salesAPI, accountsReceivableAPI } from '../services/api';
import toast from 'react-hot-toast';

const SalesModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    client_id: '',
    items: [{ item_id: '', quantity: 1, price: 0 }],
    payment_method: 'cash',
    installments: 1,
    notes: ''
  });
  const [clients, setClients] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
      resetForm();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientsRes, itemsRes] = await Promise.all([
        clientsAPI.getAll(),
        itemsAPI.getAll()
      ]);
      setClients(clientsRes.data);
      setItems(itemsRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      items: [{ item_id: '', quantity: 1, price: 0 }],
      payment_method: 'cash',
      installments: 1,
      notes: ''
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { item_id: '', quantity: 1, price: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          // Se mudou o item, atualizar o preço
          if (field === 'item_id') {
            const selectedItem = items.find(item => item.id === parseInt(value));
            updatedItem.price = selectedItem ? selectedItem.price : 0;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const calculateInstallmentValue = () => {
    const total = calculateTotal();
    return formData.installments > 0 ? total / formData.installments : total;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.client_id) {
      toast.error('Selecione um cliente');
      return;
    }

    const validItems = formData.items.filter(item => item.item_id && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Adicione pelo menos um item');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Preparar dados dos itens
      const processedItems = validItems.map(item => {
        const selectedItem = items.find(i => i.id === parseInt(item.item_id));
        return {
          item_id: parseInt(item.item_id),
          item_name: selectedItem ? selectedItem.name : 'Item não encontrado',
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.price),
          total_price: parseFloat(item.price * item.quantity)
        };
      });

      // Criar a venda
      const today = new Date();
      const formattedDate = today.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      const saleData = {
        client_id: parseInt(formData.client_id),
        title: `Venda - ${formattedDate}`,
        total_amount: calculateTotal(),
        items: processedItems,
        payment_method: formData.payment_method,
        installments: parseInt(formData.installments),
        installment_value: calculateInstallmentValue(),
        installment_payment_method: formData.payment_method,
        notes: formData.notes,
        due_date: today.toISOString().split('T')[0] // Data da venda em formato ISO
      };

      console.log('Dados da venda:', saleData);
      console.log('Token atual:', localStorage.getItem('token'));

      const saleResponse = await salesAPI.create(saleData);
      
      // Se for parcelado, criar contas a receber
      if (formData.installments > 1) {
        console.log('🔄 Criando parcelas para venda parcelada...');
        console.log('📊 Dados da venda:', {
          saleId: saleResponse.data.id,
          installments: formData.installments,
          clientId: formData.client_id
        });
        
        const installmentValue = calculateInstallmentValue();
        const today = new Date();
        
        console.log('💰 Valor da parcela:', installmentValue);
        
        for (let i = 1; i <= formData.installments; i++) {
          const dueDate = new Date(today);
          dueDate.setMonth(dueDate.getMonth() + i);
          
          console.log(`📅 Criando parcela ${i}/${formData.installments} com vencimento:`, dueDate.toISOString().split('T')[0]);
          
          try {
            const parcelResponse = await accountsReceivableAPI.create({
              client_id: formData.client_id,
              description: `Parcela ${i}/${formData.installments} - Venda #${saleResponse.data.id}`,
              amount: installmentValue,
              due_date: dueDate.toISOString().split('T')[0],
              sale_id: saleResponse.data.id
            });
            
            console.log(`✅ Parcela ${i} criada com sucesso:`, parcelResponse.data);
          } catch (parcelError) {
            console.error(`❌ Erro ao criar parcela ${i}:`, parcelError);
            throw parcelError;
          }
        }
        
        console.log('✅ Todas as parcelas foram criadas com sucesso!');
      } else {
        console.log('ℹ️ Venda à vista - não criando parcelas');
      }
      
      toast.success('Venda realizada com sucesso!');
      onSubmit && onSubmit(saleResponse.data);
      onClose();
      resetForm();
      
    } catch (error) {
      console.error('Erro ao realizar venda:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
        fullError: error
      });
      
      // Log mais detalhado
      if (error.response?.data) {
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      if (error.response?.status) {
        console.error('Status code:', error.response.status);
      }
      if (error.response?.statusText) {
        console.error('Status text:', error.response.statusText);
      }
      
      let errorMessage = 'Erro ao realizar venda';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Erro de conexão. Verifique se o servidor está rodando.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <ShoppingCart className="h-6 w-6 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Nova Venda
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Carregando dados...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Cliente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <User className="h-4 w-4 mr-2 text-blue-600" />
                    Cliente
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Itens */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <Package className="h-4 w-4 mr-2 text-purple-600" />
                      Itens
                    </label>
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-green-600 hover:text-green-700 flex items-center text-sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Item
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <select
                          value={item.item_id}
                          onChange={(e) => updateItem(index, 'item_id', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-gray-600 dark:text-white"
                          required
                        >
                          <option value="">Selecione um item</option>
                          {items.map(itemOption => (
                            <option key={itemOption.id} value={itemOption.id}>
                              {itemOption.name} - R$ {itemOption.price.toFixed(2)}
                            </option>
                          ))}
                        </select>
                        
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-gray-600 dark:text-white"
                        />
                        
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </span>
                        
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Forma de Pagamento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Forma de Pagamento
                    </label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                    >
                      <option value="cash">Dinheiro</option>
                      <option value="credit_card">Cartão de Crédito</option>
                      <option value="debit_card">Cartão de Débito</option>
                      <option value="pix">PIX</option>
                      <option value="installments">Parcelado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                      Parcelas
                    </label>
                    <select
                      value={formData.installments}
                      onChange={(e) => setFormData(prev => ({ ...prev, installments: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                    >
                      {[1, 2, 3, 4, 5, 6, 10, 12].map(num => (
                        <option key={num} value={num}>
                          {num}x {num > 1 ? 'parcelas' : 'à vista'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="Observações sobre a venda..."
                  />
                </div>

                {/* Resumo */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total:</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      R$ {calculateTotal().toFixed(2)}
                    </span>
                  </div>
                  {formData.installments > 1 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Valor da parcela ({formData.installments}x):
                      </span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        R$ {calculateInstallmentValue().toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </form>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row-reverse gap-3">
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || loading}
                className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Finalizar Venda
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesModal;
