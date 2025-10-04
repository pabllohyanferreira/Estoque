import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Heart, 
  ShoppingCart, 
  Eye,
  Grid,
  List,
  SortAsc,
  SortDesc,
  X,
  Phone,
  Truck,
  Shield,
  CreditCard,
  QrCode,
  MessageCircle,
  Instagram
} from 'lucide-react';
import { itemsAPI, settingsAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import ProductImage from '../components/ProductImage';
import toast from 'react-hot-toast';

const CatalogPublic = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid'); // grid ou list
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
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
      const response = await itemsAPI.getAll();
      // Filtrar apenas itens com estoque disponível
      const availableItems = response.data.filter(item => item.stock > 0);
      setItems(availableItems);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCatalogSettings = useCallback(async () => {
    try {
      const response = await settingsAPI.getAll();
      if (response.data.success && response.data.data) {
        const settings = response.data.data;
        setCatalogSettings(prev => ({
          ...prev,
          ...settings
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do catálogo:', error);
      // Fallback para localStorage se a API falhar
      const savedSettings = localStorage.getItem('catalogSettings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          setCatalogSettings(parsedSettings);
        } catch (parseError) {
          console.error('Erro ao fazer parse das configurações do localStorage:', parseError);
        }
      }
    }
  }, []);

  const filterAndSortItems = useCallback(() => {
    let filtered = [...items];

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por categoria
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filtro por faixa de preço
    if (priceRange.min) {
      filtered = filtered.filter(item => item.price >= parseFloat(priceRange.min));
    }
    if (priceRange.max) {
      filtered = filtered.filter(item => item.price <= parseFloat(priceRange.max));
    }

    // Ordenação
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'name':
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredItems(filtered);
  }, [items, searchTerm, selectedCategory, priceRange, sortBy, sortOrder]);

  useEffect(() => {
    loadItems();
    loadCatalogSettings();
  }, [loadItems, loadCatalogSettings]);

  useEffect(() => {
    filterAndSortItems();
  }, [filterAndSortItems]);

  const getCategories = () => {
    const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
    return categories;
  };

  const getStockStatus = (quantity, minQuantity) => {
    if (quantity <= 0) return { text: 'Indisponível', color: 'text-red-600', bg: 'bg-red-100' };
    if (quantity <= minQuantity) return { text: 'Últimas unidades', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'Disponível', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const toggleWishlist = (itemId) => {
    setWishlist(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
    toast.success(wishlist.includes(itemId) ? 'Removido da lista de desejos' : 'Adicionado à lista de desejos');
  };


  const viewProduct = (item) => {
    setSelectedProduct(item);
    setShowProductModal(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setSortBy('name');
    setSortOrder('asc');
  };


  const openWhatsApp = (item) => {
    const message = `Olá! Gostaria de saber mais sobre o produto: ${item.name}`;
    const whatsappUrl = `https://wa.me/${catalogSettings.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: catalogSettings.backgroundColor }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: catalogSettings.backgroundColor }}
    >
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {catalogSettings.logoUrl && (
                <img 
                  src={catalogSettings.logoUrl} 
                  alt="Logo" 
                  className="h-10 w-auto mr-3"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{catalogSettings.businessName}</h1>
                <p className="text-sm text-gray-600">{catalogSettings.businessSubtitle}</p>
              </div>
            </div>
            
            {/* Carrinho */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button className="p-2 text-gray-600 hover:text-red-600 transition-colors">
                  <Heart className="h-6 w-6" />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {wishlist.length}
                    </span>
                  )}
                </button>
              </div>
              
              <div className="relative">
                <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                  <ShoppingCart className="h-6 w-6" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar de Filtros */}
          <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Busca */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar produtos
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nome, descrição..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Categoria */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todas as categorias</option>
                  {getCategories().map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Faixa de Preço */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Faixa de Preço
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    placeholder="Preço mínimo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    placeholder="Preço máximo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Limpar Filtros */}
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="flex-1">
            {/* Barra de Controles */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowFilters(true)}
                    className="lg:hidden flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                  </button>
                  
                  <span className="text-sm text-gray-600">
                    {filteredItems.length} produto{filteredItems.length !== 1 ? 's' : ''} encontrado{filteredItems.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Ordenação */}
                  <div className="flex items-center space-x-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="name">Nome</option>
                      <option value="price">Preço</option>
                    </select>
                    
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="p-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Modo de Visualização */}
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:text-gray-800'}`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:text-gray-800'}`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid/Lista de Produtos */}
            {filteredItems.length > 0 ? (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
              }>
                {filteredItems.map((item) => {
                  const stockStatus = getStockStatus(item.stock, item.min_stock);
                  const isInWishlist = wishlist.includes(item.id);
                  
                  if (viewMode === 'grid') {
                    return (
                      <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
                        {/* Imagem do Produto */}
                        <div className="relative aspect-square bg-gray-100">
                          <ProductImage 
                            imageData={item.image_url} 
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          
                          {/* Badges */}
                          <div className="absolute top-2 left-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.bg} ${stockStatus.color}`}>
                              {stockStatus.text}
                            </span>
                          </div>
                          
                          {/* Botões de Ação */}
                          <div className="absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => toggleWishlist(item.id)}
                              className={`p-2 rounded-full shadow-lg transition-colors ${
                                isInWishlist 
                                  ? 'bg-red-500 text-white' 
                                  : 'bg-white text-gray-600 hover:text-red-500'
                              }`}
                            >
                              <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
                            </button>
                            
                            <button
                              onClick={() => viewProduct(item)}
                              className="p-2 bg-white text-gray-600 hover:text-blue-500 rounded-full shadow-lg transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
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

                          {item.category && (
                            <p className="text-xs text-blue-600 mb-2">
                              {item.category}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xl font-bold text-gray-900">
                              {formatCurrency(item.price)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {item.stock} un
                            </span>
                          </div>
                          
                          <button
                            onClick={() => openWhatsApp(item)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Entrar em Contato
                          </button>
                        </div>
                      </div>
                    );
                  } else {
                    // Modo Lista
                    return (
                      <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-4">
                          {/* Imagem */}
                          <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
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
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                  {item.name}
                                </h3>
                                
                                {item.description && (
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                                
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  {item.category && (
                                    <span className="text-blue-600">{item.category}</span>
                                  )}
                                  <span>{item.stock} un</span>
                                  <span className={`font-medium ${stockStatus.color}`}>
                                    {stockStatus.text}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end space-y-2">
                                <span className="text-xl font-bold text-gray-900">
                                  {formatCurrency(item.price)}
                                </span>
                                
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => toggleWishlist(item.id)}
                                    className={`p-2 rounded-lg transition-colors ${
                                      isInWishlist 
                                        ? 'bg-red-500 text-white' 
                                        : 'bg-gray-100 text-gray-600 hover:text-red-500'
                                    }`}
                                  >
                                    <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
                                  </button>
                                  
                                  <button
                                    onClick={() => viewProduct(item)}
                                    className="p-2 bg-gray-100 text-gray-600 hover:text-blue-500 rounded-lg transition-colors"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  
                                  <button
                                    onClick={() => openWhatsApp(item)}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center"
                                  >
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Contato
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
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-gray-500 mb-4">
                  Tente ajustar os filtros de busca ou limpar os filtros.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Limpar Filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Produto */}
      {showProductModal && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={() => setShowProductModal(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedProduct.name}
                  </h3>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Imagem */}
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <ProductImage 
                      imageData={selectedProduct.image_url} 
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Informações */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">
                        {formatCurrency(selectedProduct.price)}
                      </h4>
                      
                      {selectedProduct.description && (
                        <p className="text-gray-600 mb-4">
                          {selectedProduct.description}
                        </p>
                      )}
                      
                      <div className="space-y-2 text-sm">
                        {selectedProduct.category && (
                          <div className="flex items-center">
                            <span className="font-medium text-gray-700 w-20">Categoria:</span>
                            <span className="text-blue-600">{selectedProduct.category}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <span className="font-medium text-gray-700 w-20">Estoque:</span>
                          <span className="text-gray-900">{selectedProduct.stock} un</span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="font-medium text-gray-700 w-20">Status:</span>
                          <span className={`font-medium ${getStockStatus(selectedProduct.stock, selectedProduct.min_stock).color}`}>
                            {getStockStatus(selectedProduct.stock, selectedProduct.min_stock).text}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="space-y-3">
                      <button
                        onClick={() => openWhatsApp(selectedProduct)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                      >
                        <MessageCircle className="h-5 w-5 mr-2" />
                        Entrar em Contato
                      </button>
                      
                      <button
                        onClick={() => toggleWishlist(selectedProduct.id)}
                        className={`w-full font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center ${
                          wishlist.includes(selectedProduct.id)
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Heart className={`h-5 w-5 mr-2 ${wishlist.includes(selectedProduct.id) ? 'fill-current' : ''}`} />
                        {wishlist.includes(selectedProduct.id) ? 'Remover da Lista' : 'Adicionar à Lista de Desejos'}
                      </button>
                    </div>

                    {/* Informações de Contato */}
                    <div className="border-t border-gray-200 pt-4">
                      <h5 className="font-medium text-gray-900 mb-3">Entre em contato para mais informações:</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>{catalogSettings.phoneNumber}</span>
                        </div>
                        {catalogSettings.instagramHandle && (
                          <div className="flex items-center text-gray-600">
                            <Instagram className="h-4 w-4 mr-2" />
                            <span>{catalogSettings.instagramHandle}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contato</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{catalogSettings.phoneNumber}</span>
                </div>
                {catalogSettings.instagramHandle && (
                  <div className="flex items-center">
                    <Instagram className="h-4 w-4 mr-2" />
                    <span>{catalogSettings.instagramHandle}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Formas de Pagamento</h3>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <QrCode className="h-5 w-5 text-green-600" />
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Garantias</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  <span>Produtos originais</span>
                </div>
                <div className="flex items-center">
                  <Truck className="h-4 w-4 mr-2" />
                  <span>Entrega rápida</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2024 {catalogSettings.businessName}. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CatalogPublic;
