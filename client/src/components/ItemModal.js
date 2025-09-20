import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Upload, Image, Tag, AlertCircle, Package, DollarSign, Hash, FileText, Calendar, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';


const ItemModal = ({ isOpen, onClose, onSubmit, item, categories }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  
    // Observar mudanças nos campos de preço e parcelas
  const price = watch('price');
  const installments = watch('installments');

  // Calcular automaticamente o valor da parcela
  useEffect(() => {
    if (price && installments) {
      const priceFloat = parseFloat(price);
      const installmentsInt = parseInt(installments);
      
      if (!isNaN(priceFloat) && !isNaN(installmentsInt) && installmentsInt > 0 && priceFloat > 0) {
        const installmentValue = priceFloat / installmentsInt;
        setValue('installment_value', installmentValue.toFixed(2));
      } else {
        setValue('installment_value', '');
      }
    } else {
      setValue('installment_value', '');
    }
  }, [price, installments, setValue]);

  useEffect(() => {
    if (isOpen) {
      if (item) {
        // Edição
        const formData = {
          name: item.name,
          description: item.description || '',
          category: item.category || '',
          price: item.price,
          installments: item.installments || 1,
          installment_value: item.installment_value || item.price,
          quantity: item.quantity,
          min_quantity: item.min_quantity,
          unit: item.unit || 'unidade',
          barcode: item.barcode || '',
          supplier: item.supplier || ''
        };
        
        
        reset(formData);
        
        // Carregar imagem existente se houver
        if (item.image_data) {
          setImagePreview(item.image_data);
        } else {
          setImagePreview(null);
        }
      } else {
        // Criação
        const defaultData = {
          name: '',
          description: '',
          category: '',
          price: '',
          installments: '1',
          installment_value: '',
          quantity: 0,
          min_quantity: 0,
          unit: 'unidade',
          barcode: '',
          supplier: ''
        };
        

        reset(defaultData);
        setImagePreview(null);
        setSelectedImage(null);
        
        // Resetar o input de arquivo
        const fileInput = document.getElementById('image-upload');
        if (fileInput) {
          fileInput.value = '';
        }
      }
    }
  }, [isOpen, item, reset]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.');
        return;
      }

      setSelectedImage(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedImage(null);
      setImagePreview(null);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

    const handleFormSubmit = async (data) => {
    try {
      setIsSubmitting(true);



      // Validar dados obrigatórios
      if (!data.name || data.name.trim() === '') {
        throw new Error('Nome do produto é obrigatório');
      }

      if (!data.price || parseFloat(data.price) <= 0) {
        throw new Error('Preço deve ser maior que zero');
      }

      const formData = new FormData();

      // Adicionar dados do formulário com validação
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (value !== undefined && value !== null && value !== '') {
                  formData.append(key, value);
        }
      });



      // Adicionar imagem se selecionada
      if (selectedImage) {
        formData.append('image', selectedImage);
      }
      

      
      await onSubmit(formData);
    } catch (error) {
      console.error('Erro detalhado ao salvar produto:', error);
      console.error('Resposta do servidor:', error.response?.data);
      console.error('Status do erro:', error.response?.status);
      
      // Mostrar erro específico para o usuário
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao salvar produto');
      }
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

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-gray-200 dark:border-gray-700">
          {/* Header com gradiente */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <Package className="h-6 w-6 text-white icon-hover" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {item ? 'Editar Produto' : 'Novo Produto'}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    {item ? 'Atualize as informações do produto' : 'Preencha as informações do novo produto'}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Foto de Capa */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <Image className="h-4 w-4 mr-2 text-blue-600" />
                    Foto de Capa
                  </label>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                    <div className="flex items-center space-x-6">
                      {/* Preview da imagem */}
                      <div className="flex-shrink-0">
                        {imagePreview ? (
                          <div className="relative group">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="h-32 w-32 object-cover rounded-xl border-2 border-gray-200 dark:border-gray-600 shadow-lg"
                            />
                            <button
                              type="button"
                              onClick={removeImage}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-all transform hover:scale-110 shadow-lg"
                              title="Remover imagem"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="h-32 w-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                            <Image className="h-12 w-12 text-gray-400 mb-2" />
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Sem imagem</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Upload */}
                      <div className="flex-1">
                        <label 
                          htmlFor="image-upload" 
                          className="cursor-pointer inline-flex items-center px-6 py-3 border-2 border-blue-500 rounded-xl shadow-lg text-sm font-semibold text-blue-600 bg-white hover:bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700 transition-all transform hover:scale-105"
                        >
                          <Upload className="h-5 w-5 mr-2" />
                          {imagePreview ? 'Alterar Imagem' : 'Selecionar Imagem'}
                        </label>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Formatos aceitos:</span> JPG, PNG ou GIF
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          <span className="font-medium">Tamanho máximo:</span> 5MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nome */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Tag className="h-4 w-4 mr-2 text-blue-600" />
                    Nome do Produto
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Digite o nome do produto"
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
                </div>

                {/* Descrição */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                    Descrição
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    placeholder="Descreva o produto (opcional)"
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors resize-none"
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2 text-blue-600" />
                    Categoria
                  </label>
                  <select
                    {...register('category')}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
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
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Hash className="h-4 w-4 mr-2 text-blue-600" />
                    Código de Barras
                  </label>
                  <input
                    type="text"
                    placeholder="Digite o código de barras"
                    {...register('barcode')}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                  />
                </div>

                {/* Preço */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                    Preço de Venda
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      {...register('price', { 
                        required: 'Preço é obrigatório',
                        min: { value: 0, message: 'Preço deve ser positivo' }
                      })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                    />
                  </div>
                  {errors.price && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.price.message}
                    </p>
                  )}
                </div>

                {/* Parcelamento */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-purple-600" />
                    Parcelamento
                  </label>
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Número de Parcelas
                        </label>
                        <select
                          {...register('installments', { 
                            required: 'Número de parcelas é obrigatório',
                            min: { value: 1, message: 'Mínimo 1 parcela' },
                            max: { value: 12, message: 'Máximo 12 parcelas' }
                          })}
                          className="w-full px-4 py-3 border-2 border-purple-200 dark:border-purple-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        >
                          <option value="">Selecione</option>
                          <option value="1">1x (À vista)</option>
                          <option value="2">2x</option>
                          <option value="3">3x</option>
                          <option value="4">4x</option>
                          <option value="5">5x</option>
                          <option value="6">6x</option>
                          <option value="7">7x</option>
                          <option value="8">8x</option>
                          <option value="9">9x</option>
                          <option value="10">10x</option>
                          <option value="11">11x</option>
                          <option value="12">12x</option>
                        </select>
                        {errors.installments && (
                          <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.installments.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Valor da Parcela
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            readOnly
                            {...register('installment_value', { required: 'Valor da parcela é obrigatório' })}
                            className="w-full pl-10 pr-4 py-3 border-2 border-purple-200 dark:border-purple-600 rounded-xl bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed transition-colors"
                            placeholder="0,00"
                          />
                        </div>
                        {errors.installment_value && (
                          <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.installment_value.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  {price && installments && parseInt(installments) > 1 && parseFloat(price) > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        <strong>Resumo:</strong> {installments}x de R$ {parseFloat(price / installments).toFixed(2)} = R$ {parseFloat(price).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Quantidade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quantidade Inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('quantity', { 
                      min: { value: 0, message: 'Quantidade deve ser positiva' }
                    })}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.quantity.message}</p>
                  )}
                </div>

                {/* Quantidade Mínima */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quantidade Mínima
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('min_quantity', { 
                      min: { value: 0, message: 'Quantidade mínima deve ser positiva' }
                    })}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  {errors.min_quantity && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.min_quantity.message}</p>
                  )}
                </div>

                {/* Unidade */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Package className="h-4 w-4 mr-2 text-blue-600" />
                    Unidade
                  </label>
                  <input
                    type="text"
                    value="unidade"
                    readOnly
                    {...register('unit')}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed transition-colors"
                  />
                </div>

                {/* Fornecedor */}
                <div className="md:col-start-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fornecedor
                  </label>
                  <input
                    type="text"
                    {...register('supplier')}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
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
                    Salvando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Package className="h-5 w-5 mr-2 icon-button" />
                    {item ? 'Atualizar Produto' : 'Criar Produto'}
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

export default ItemModal; 