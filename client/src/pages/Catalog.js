import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  ExternalLink, 
  Copy, 
  Check, 
  Settings, 
  Phone, 
  Instagram, 
  MessageCircle,
  Grid,
  List,
  Plus,
  Edit,
  Trash2,
  Globe
} from 'lucide-react';
import { itemsAPI, settingsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/formatters';
import ProductImage from '../components/ProductImage';
import CatalogSettingsModal from '../components/CatalogSettingsModal';
import ItemModal from '../components/ItemModal';
import ConfirmModal from '../components/ConfirmModal';

const Catalog = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [categories, setCategories] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid ou list
  const [activeTab, setActiveTab] = useState('manage'); // 'manage' ou 'public'
  
  // Configurações do catálogo
  const [catalogSettings, setCatalogSettings] = useState({
    backgroundColor: '#ffffff',
    logoUrl: '',
    businessName: 'DETTY FERRAZ',
    businessSubtitle: 'SEMIJOIAS',
    phoneNumber: '(81) 99726-9325',
    instagramHandle: '@dettyferrazsemijoias',
    whatsappNumber: '5581997269325',
    showPrices: true,
    showInstallments: true
  });

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category = selectedCategory;

      const response = await itemsAPI.getAll(params);
      // Mostrar todos os itens (não filtrar por estoque)
      const allItems = response.data;
      
      // Ordenar itens
      let sortedItems = [...allItems];
      switch (sortBy) {
        case 'price_asc':
          sortedItems.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          sortedItems.sort((a, b) => b.price - a.price);
          break;
        case 'name_asc':
          sortedItems.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'name_desc':
          sortedItems.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case 'newest':
        default:
          sortedItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          break;
      }
      
      setItems(sortedItems);
    } catch (error) {
      toast.error('Erro ao carregar produtos');
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, sortBy]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await itemsAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  }, []);

  const loadCatalogSettings = useCallback(async () => {
    try {
      console.log('🔍 Carregando configurações do catálogo...');
      const response = await settingsAPI.getAll();
      if (response.data.success && response.data.data) {
        const settings = response.data.data;
        setCatalogSettings(prev => ({
          ...prev,
          ...settings
        }));
        console.log('✅ Configurações do catálogo carregadas:', Object.keys(settings));
        console.log('📸 Logo URL carregada:', settings.logoUrl);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configurações do catálogo:', error);
      // Fallback para localStorage se a API falhar
      const savedSettings = localStorage.getItem('catalogSettings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          setCatalogSettings(parsedSettings);
          console.log('📱 Configurações carregadas do localStorage como fallback');
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse das configurações do localStorage:', parseError);
        }
      }
    }
  }, []);

  useEffect(() => {
    loadItems();
    loadCategories();
    loadCatalogSettings();
  }, [loadItems, loadCategories, loadCatalogSettings]);

  const handleSearch = () => {
    loadItems();
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const copyCatalogLink = () => {
    const catalogUrl = `${window.location.origin}/catalog-public`;
    navigator.clipboard.writeText(catalogUrl).then(() => {
      setCopiedLink(true);
      toast.success('Link do catálogo copiado!');
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const openPublicCatalog = () => {
    const catalogUrl = `${window.location.origin}/catalog-public`;
    window.open(catalogUrl, '_blank');
  };

  const handleSettingsSave = async (newSettings) => {
    try {
      console.log('💾 Salvando configurações do catálogo...');
      setCatalogSettings(newSettings);
      
      // Salvar no banco de dados
      await settingsAPI.save(newSettings);
      console.log('✅ Configurações salvas no banco de dados');
      
      // Também salvar no localStorage como backup
      localStorage.setItem('catalogSettings', JSON.stringify(newSettings));
      console.log('📱 Configurações salvas no localStorage como backup');
      
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao salvar configurações:', error);
      
      // Fallback: salvar apenas no localStorage
      localStorage.setItem('catalogSettings', JSON.stringify(newSettings));
      console.log('📱 Configurações salvas apenas no localStorage (fallback)');
      
      toast.error('Erro ao salvar no servidor. Configurações salvas localmente.');
    }
  };

  const handleCreateItem = async (itemData) => {
    try {
      await itemsAPI.create(itemData);
      toast.success('Produto criado com sucesso!');
      setShowItemModal(false);
      loadItems();
    } catch (error) {
      toast.error('Erro ao criar produto');
      console.error('Erro ao criar produto:', error);
    }
  };

  const handleUpdateItem = async (itemData) => {
    try {
      await itemsAPI.update(editingItem.id, itemData);
      toast.success('Produto atualizado com sucesso!');
      setShowItemModal(false);
      setEditingItem(null);
      loadItems();
    } catch (error) {
      toast.error('Erro ao atualizar produto');
      console.error('Erro ao atualizar produto:', error);
    }
  };

  const handleDeleteItem = async () => {
    try {
      await itemsAPI.delete(selectedItem.id);
      toast.success('Produto deletado com sucesso!');
      setShowConfirmModal(false);
      setSelectedItem(null);
      loadItems();
    } catch (error) {
      toast.error('Erro ao deletar produto');
      console.error('Erro ao deletar produto:', error);
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setShowItemModal(true);
  };

  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setShowConfirmModal(true);
  };

  const openWhatsApp = (item) => {
    const message = `Olá! Gostaria de saber mais sobre o produto: ${item.name}`;
    const whatsappUrl = `https://wa.me/${catalogSettings.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getStockStatus = (stock, minStock) => {
    if (stock <= 0) return { text: 'Indisponível', color: 'text-red-600', bg: 'bg-red-100' };
    if (stock <= minStock) return { text: 'Últimas unidades', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'Disponível', color: 'text-green-600', bg: 'bg-green-100' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header da Página */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg shadow-blue-500/25">
              <Package className="h-8 w-8 text-white drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Catálogo de Produtos
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Gerencie e visualize seu catálogo de produtos
              </p>
            </div>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('manage')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'manage'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Gerenciar Catálogo</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('public')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'public'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>Visualização Pública</span>
              </div>
            </button>
          </div>
        </div>

        {/* Conteúdo da Aba de Gerenciamento */}
        {activeTab === 'manage' && (
          <div className="space-y-6">
            {/* Barra de Ações */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                {/* Busca e Filtros */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 flex-1">
                  {/* Campo de Busca */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder="Nome, descrição ou código..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    />
                  </div>

                  {/* Filtro de Categoria */}
                  <div className="sm:w-48">
                    <select
                      value={selectedCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    >
                      <option value="">Todas as categorias</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleSearch}
                    className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-xl shadow-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrar
                  </button>
                  <button
                    onClick={() => setShowItemModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Produto
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar
                  </button>
                </div>
              </div>
            </div>

            {/* Controles de Visualização */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Produtos ({items.length})
                  </h3>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Ordenação */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="newest">Novidades</option>
                    <option value="name_asc">Nome A-Z</option>
                    <option value="name_desc">Nome Z-A</option>
                    <option value="price_asc">Menor preço</option>
                    <option value="price_desc">Maior preço</option>
                  </select>

                  {/* Modo de Visualização */}
                  <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid/Lista de Produtos */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                <Package className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum produto encontrado</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Comece adicionando seu primeiro produto.
                </p>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
              }>
                {items.map((item) => {
                  const stockStatus = getStockStatus(item.stock, item.min_stock);
                  
                  if (viewMode === 'grid') {
                    return (
                      <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                        {/* Imagem do Produto */}
                        <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                          <ProductImage 
                            imageData={item.image_url} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.bg} ${stockStatus.color}`}>
                              {stockStatus.text}
                            </span>
                          </div>
                        </div>

                        {/* Informações do Produto */}
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                            {item.name}
                          </h3>
                          
                          {item.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                              {item.description}
                            </p>
                          )}

                          {/* Categoria */}
                          {item.category && (
                            <div className="mb-2">
                              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                {item.category}
                              </span>
                            </div>
                          )}

                          {/* Preços */}
                          <div className="mb-4">
                            <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                              {formatCurrency(item.price)}
                            </div>
                            {item.installments > 1 && (
                              <div className="text-sm text-gray-600 font-medium">
                                <strong>{item.installments}x de {formatCurrency(item.installment_value)}</strong>
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              Estoque: {item.stock} un
                            </div>
                          </div>

                          {/* Botões de Ação */}
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openEditModal(item)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-center text-sm"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </button>
                            <button
                              onClick={() => openDeleteModal(item)}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-center text-sm"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Deletar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    // Modo Lista
                    return (
                      <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-4">
                          {/* Imagem */}
                          <div className="relative w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                            <ProductImage 
                              imageData={item.image_url} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Informações */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                  {item.name}
                                </h3>
                                
                                {item.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                                
                                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                  {item.category && (
                                    <span className="text-blue-600 dark:text-blue-400">{item.category}</span>
                                  )}
                                  <span>Estoque: {item.stock} un</span>
                                  <span className={`font-medium ${stockStatus.color}`}>
                                    {stockStatus.text}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end space-y-2">
                                <span className="text-xl font-bold text-gray-900 dark:text-white">
                                  {formatCurrency(item.price)}
                                </span>
                                
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => openEditModal(item)}
                                    className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  
                                  <button
                                    onClick={() => openDeleteModal(item)}
                                    className="p-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </div>
        )}

        {/* Conteúdo da Aba de Visualização Pública */}
        {activeTab === 'public' && (
          <div 
            className="min-h-screen p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700"
            style={{ backgroundColor: catalogSettings.backgroundColor }}
          >
            {/* Header com Logo */}
            <div className="text-center mb-8">
              {catalogSettings.logoUrl && (
                <div className="mb-6">
                  <img 
                    src={catalogSettings.logoUrl} 
                    alt="Logo" 
                    className="h-32 w-auto mx-auto object-contain max-w-md"
                  />
                </div>
              )}
              <h1 className="text-4xl font-bold text-gray-800 mb-2" style={{ color: '#333' }}>
                {catalogSettings.businessName}
              </h1>
              {catalogSettings.businessSubtitle && (
                <p className="text-xl text-gray-600" style={{ color: '#666' }}>
                  {catalogSettings.businessSubtitle}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar de Filtros */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sticky top-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
                  
                  {/* Pesquisa */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pesquisar
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Digite aqui..."
                      />
                      <button
                        onClick={handleSearch}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Search className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Ordenação */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ordenar por
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'newest', label: 'Novidades' },
                        { value: 'price_asc', label: 'Menor preço' },
                        { value: 'price_desc', label: 'Maior preço' },
                        { value: 'name_asc', label: 'A-Z' },
                        { value: 'name_desc', label: 'Z-A' }
                      ].map((option) => (
                        <label key={option.value} className="flex items-center">
                          <input
                            type="radio"
                            name="sort"
                            value={option.value}
                            checked={sortBy === option.value}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Categoria */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Todas</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Informações de Contato */}
                  {catalogSettings.phoneNumber && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center mb-2">
                          <Phone className="h-4 w-4 mr-2" />
                          {catalogSettings.phoneNumber}
                        </div>
                        {catalogSettings.instagramHandle && (
                          <div className="flex items-center">
                            <Instagram className="h-4 w-4 mr-2" />
                            {catalogSettings.instagramHandle}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Área Principal - Produtos */}
              <div className="lg:col-span-3">
                {/* Barra de Ações */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-4">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Produtos ({items.length})
                      </h2>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={openPublicCatalog}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir em Nova Aba
                      </button>
                      
                      <button
                        onClick={copyCatalogLink}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center"
                      >
                        {copiedLink ? (
                          <Check className="h-4 w-4 mr-2" />
                        ) : (
                          <Copy className="h-4 w-4 mr-2" />
                        )}
                        {copiedLink ? 'Copiado!' : 'Copiar Link'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Grid de Produtos */}
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="spinner"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item, index) => (
                      <div 
                        key={item.id} 
                        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {/* Imagem do Produto */}
                        <div className="relative h-48 bg-gray-100">
                          <ProductImage 
                            imageData={item.image_url} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full p-1">
                            <span className="text-xs font-semibold text-gray-600">
                              {catalogSettings.businessName}
                            </span>
                          </div>
                        </div>

                        {/* Informações do Produto */}
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {item.name}
                          </h3>
                          
                          {item.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {item.description}
                            </p>
                          )}

                          {/* Categoria */}
                          {item.category && (
                            <div className="mb-2">
                              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                {item.category}
                              </span>
                            </div>
                          )}

                          {/* Preços */}
                          {catalogSettings.showPrices && (
                            <div className="mb-4">
                              <div className="text-xl font-bold text-gray-900 mb-1">
                                {formatCurrency(item.price)}
                              </div>
                              {catalogSettings.showInstallments && item.installments > 1 && (
                                <div className="text-sm text-gray-600 font-medium">
                                  <strong>{item.installments}x de {formatCurrency(item.installment_value)}</strong>
                                </div>
                              )}
                              {/* Garantia */}
                              <div className="text-xs text-gray-500 mt-1">
                                ✓ 1 Ano de garantia
                              </div>
                            </div>
                          )}

                          {/* Botão de Contato */}
                          <button
                            onClick={() => openWhatsApp(item)}
                            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Entre em contato
                          </button>

                          {/* Informações de Contato no Card */}
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{catalogSettings.phoneNumber}</span>
                              <span>{catalogSettings.instagramHandle}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Mensagem quando não há produtos */}
                {!loading && items.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-2xl shadow-xl border border-gray-200">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto encontrado</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Tente ajustar os filtros ou adicione mais produtos ao estoque.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Botões de Contato Flutuantes */}
            <div className="fixed bottom-6 right-6 z-40 flex flex-col space-y-3">
              {/* Botão do WhatsApp */}
              {catalogSettings.whatsappNumber && (
                <a
                  href={`https://wa.me/${catalogSettings.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110 flex items-center justify-center"
                  title="Contato via WhatsApp"
                >
                  <MessageCircle className="h-6 w-6" />
                </a>
              )}
              
              {/* Botão do Instagram */}
              {catalogSettings.instagramHandle && (
                <a
                  href={`https://instagram.com/${catalogSettings.instagramHandle.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-4 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110 flex items-center justify-center"
                  title="Siga no Instagram"
                >
                  <Instagram className="h-6 w-6" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Modais */}
        <CatalogSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSave={handleSettingsSave}
          currentSettings={catalogSettings}
        />

        <ItemModal
          isOpen={showItemModal}
          onClose={() => {
            setShowItemModal(false);
            setEditingItem(null);
          }}
          onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
          item={editingItem}
          categories={categories}
        />

        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setSelectedItem(null);
          }}
          onConfirm={handleDeleteItem}
          title="Deletar Produto"
          message={`Tem certeza que deseja deletar o produto "${selectedItem?.name}"? Esta ação não pode ser desfeita.`}
        />
      </div>
    </div>
  );
};

export default Catalog;