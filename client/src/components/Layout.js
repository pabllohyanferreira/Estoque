import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useScreenInfo } from '../hooks/useScreenResolution';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { 
  Home, 
  Package, 
  Users, 
  CreditCard, 
  Receipt, 
  ShoppingBag,
  BarChart3,
  ShoppingCart,
  Menu, 
  X,
  Sun,
  Moon,
  Mail,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// Componente do ícone do WhatsApp
const WhatsAppIcon = ({ className }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
  </svg>
);

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const screenInfo = useScreenInfo();
  const { contentRef } = useAutoScroll();

  const navigation = [
    { name: 'Visão Geral', href: '/', icon: Home },
    { name: 'Produtos', href: '/items', icon: Package },
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Vendas', href: '/sales', icon: ShoppingCart },
    { name: 'Links de Pagamento', href: '/payment-links', icon: CreditCard },
    { name: 'Contas a Pagar', href: '/accounts-payable', icon: Receipt },
    { name: 'Contas a Receber', href: '/accounts-receivable', icon: Receipt },
    { name: 'Catálogo', href: '/catalog', icon: ShoppingBag },
    { name: 'Relatórios', href: '/reports', icon: BarChart3 },
  ];

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="main-layout bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Sidebar para desktop */}
      <div className={`${screenInfo.canShowSidebar ? 'flex' : 'hidden'} md:w-64 md:flex-col sidebar-fixed`}>
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg">
          {/* Header da Sidebar */}
          <div className="flex-shrink-0 px-6 py-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg shadow-blue-500/25">
                  <Package className="h-8 w-8 text-white drop-shadow-sm" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Lojify
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Lojify
                  </p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-all duration-200 transform hover:scale-110"
              >
                {isDark ? (
                  <Sun className="h-5 w-5 icon-hover" />
                ) : (
                  <Moon className="h-5 w-5 icon-hover" />
                )}
              </button>
            </div>
          </div>
          
          {/* Navegação - com altura máxima para garantir espaço para suporte */}
          <div className="flex-1 px-4 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
              {navigation.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105 ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400/20'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-700 dark:hover:to-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 border border-transparent hover:border-blue-200 dark:hover:border-blue-800'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-blue-600/10 to-purple-600/10'
                        : 'group-hover:bg-gradient-to-r group-hover:from-blue-500/5 group-hover:to-purple-500/5'
                    }`}></div>
                    <Icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 icon-nav relative z-10 ${
                        isActive(item.href) 
                          ? 'text-white drop-shadow-sm' 
                          : 'text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400'
                      }`}
                    />
                    <span className="font-medium relative z-10">{item.name}</span>
                    {isActive(item.href) && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full shadow-sm relative z-10"></div>
                    )}
                    <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                      isActive(item.href)
                        ? 'ring-2 ring-blue-400/30 ring-offset-2 ring-offset-gray-800'
                        : 'group-hover:ring-1 group-hover:ring-blue-300/30 group-hover:ring-offset-1 group-hover:ring-offset-gray-800'
                    }`}></div>
                  </Link>
                );
              })}
            </nav>
          </div>
          
          {/* Seção de Suporte na Sidebar - Fixa na parte inferior */}
          <div className="flex-shrink-0 px-4 py-6 sidebar-support-section">
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 mb-3 flex items-center">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-2"></div>
                Suporte
              </h3>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => window.open('https://mail.google.com/mail/?view=cm&fs=1&to=pablohyan64@gmail.com&su=Suporte%20-%20Lojify&body=Olá!%20Preciso%20de%20suporte%20com%20o%20sistema%20Lojify.', '_blank')}
                className="w-full group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 transform hover:scale-105 border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                title="Enviar email para suporte"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Mail className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 icon-hover relative z-10" />
                <span className="font-medium relative z-10">Email</span>
                <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 relative z-10"></div>
              </button>
              <button
                onClick={() => {
                  const message = encodeURIComponent('Olá! Preciso de suporte com o sistema Lojify.');
                  window.open(`https://wa.me/5581996201464?text=${message}`, '_blank');
                }}
                className="w-full group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-all duration-300 transform hover:scale-105 border border-transparent hover:border-green-200 dark:hover:border-green-800"
                title="Abrir WhatsApp para suporte"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <WhatsAppIcon className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-green-500 dark:group-hover:text-green-400 icon-hover relative z-10" />
                <span className="font-medium relative z-10">WhatsApp</span>
                <div className="ml-auto w-2 h-2 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 relative z-10"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div 
        ref={contentRef}
        className={`${screenInfo.canShowSidebar ? 'md:pl-64' : ''} content-scrollable`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-100 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 btn-action"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Abrir sidebar</span>
              <Menu className="h-6 w-6" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors mr-2"
              title={isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Conteúdo da página */}
        <main className="flex-1">
          <div className="h-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="relative z-50 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-0 flex z-40">
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800 shadow-2xl">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white btn-close"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sr-only">Fechar sidebar</span>
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex flex-col h-full">
                {/* Header da Sidebar Mobile */}
                <div className="flex-shrink-0 px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg shadow-blue-500/25">
                        <Package className="h-6 w-6 text-white drop-shadow-sm" />
                      </div>
                      <div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          Lojify
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          Lojify
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={toggleTheme}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-all duration-200 transform hover:scale-110"
                      >
                        {isDark ? (
                          <Sun className="h-4 w-4 icon-hover" />
                        ) : (
                          <Moon className="h-4 w-4 icon-hover" />
                        )}
                      </button>
                      <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 transform hover:scale-110"
                      >
                        <X className="h-4 w-4 icon-hover" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Navegação Mobile */}
                <div className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600" style={{ maxHeight: 'calc(100vh - 320px)' }}>
                  <nav className="space-y-1">
                    {navigation.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105 ${
                            isActive(item.href)
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400/20'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-700 dark:hover:to-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 border border-transparent hover:border-blue-200 dark:hover:border-blue-800'
                          }`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                            isActive(item.href)
                              ? 'bg-gradient-to-r from-blue-600/10 to-purple-600/10'
                              : 'group-hover:bg-gradient-to-r group-hover:from-blue-500/5 group-hover:to-purple-500/5'
                          }`}></div>
                          <Icon
                            className={`mr-3 flex-shrink-0 h-5 w-5 icon-nav relative z-10 ${
                              isActive(item.href) 
                                ? 'text-white drop-shadow-sm' 
                                : 'text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400'
                            }`}
                          />
                          <span className="font-medium relative z-10">{item.name}</span>
                          {isActive(item.href) && (
                            <div className="ml-auto w-2 h-2 bg-white rounded-full shadow-sm relative z-10"></div>
                          )}
                          <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                            isActive(item.href)
                              ? 'ring-2 ring-blue-400/30 ring-offset-2 ring-offset-gray-800'
                              : 'group-hover:ring-1 group-hover:ring-blue-300/30 group-hover:ring-offset-1 group-hover:ring-offset-gray-800'
                          }`}></div>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
                
                  {/* Seção de Suporte Mobile */}
                  <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="mb-3">
                      <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 mb-2 flex items-center">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-2"></div>
                        Suporte
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => window.open('https://mail.google.com/mail/?view=cm&fs=1&to=pablohyan64@gmail.com&su=Suporte%20-%20Lojify&body=Olá!%20Preciso%20de%20suporte%20com%20o%20sistema%20Lojify.', '_blank')}
                        className="w-full group relative flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 transform hover:scale-105 border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                        title="Enviar email para suporte"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <Mail className="mr-2 flex-shrink-0 h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 icon-hover relative z-10" />
                        <span className="font-medium relative z-10">Email</span>
                        <div className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 relative z-10"></div>
                      </button>
                      <button
                        onClick={() => {
                          const message = encodeURIComponent('Olá! Preciso de suporte com o sistema Lojify.');
                          window.open(`https://wa.me/5581996201464?text=${message}`, '_blank');
                        }}
                        className="w-full group relative flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-all duration-300 transform hover:scale-105 border border-transparent hover:border-green-200 dark:hover:border-green-800"
                        title="Abrir WhatsApp para suporte"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <WhatsAppIcon className="mr-2 flex-shrink-0 h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-green-500 dark:group-hover:text-green-400 icon-hover relative z-10" />
                        <span className="font-medium relative z-10">WhatsApp</span>
                        <div className="ml-auto w-1.5 h-1.5 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 relative z-10"></div>
                      </button>
                    </div>
                  </div>
              </div>
            </div>
            <div className="flex-shrink-0 w-14">
              {/* Força o sidebar a ter a largura correta */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout; 