import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
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
  UserCog,
  LogOut,
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

const Layout = ({ children, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const screenInfo = useScreenInfo();
  const { contentRef } = useAutoScroll();

  // Carregar dados do usuário do localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    // Limpar dados do localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Limpar estado do usuário
    setUser(null);
    
    // Atualizar estado de autenticação no App
    if (onLogout) {
      onLogout();
    }
    
    // Mostrar mensagem de sucesso
    toast.success('Logout realizado com sucesso!');
    
    // Redirecionar para login
    navigate('/login');
  };

  const navigation = [
    { name: 'Visão Geral', href: '/', icon: Home },
    { name: 'Produtos', href: '/items', icon: Package },
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Contas a Pagar', href: '/accounts-payable', icon: CreditCard },
    { name: 'Contas a Receber', href: '/accounts-receivable', icon: Receipt },
    { name: 'Catálogo', href: '/catalog', icon: ShoppingBag },
    { name: 'Relatórios', href: '/reports', icon: BarChart3 },
    { name: 'Usuários', href: '/users', icon: UserCog },
  ];

  const logoutItem = { name: 'Sair', href: '#', icon: LogOut, onClick: handleLogout };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Desktop */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out ${screenInfo.canShowSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header do Sidebar */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg shadow-blue-500/25">
                  <Package className="h-8 w-8 text-white drop-shadow-sm" />
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Lojify
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Sistema de Vendas
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleTheme}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-all duration-200 transform hover:scale-110"
                  title={isDark ? 'Modo claro' : 'Modo escuro'}
                >
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 transform hover:scale-110"
                  title="Sair"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Informações do usuário separadas */}
            {user && (
              <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border border-blue-200 dark:border-blue-700 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {user.role === 'admin' ? '👑 Administrador' : '👤 Revendedor'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navegação */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    }`}
                  >
                    <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-0 group-hover:opacity-100'
                    }`}></div>
                    <item.icon className={`mr-3 flex-shrink-0 h-5 w-5 relative z-10 ${
                      isActive 
                        ? 'text-white' 
                        : 'text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400'
                    }`} />
                    <span className="font-medium relative z-10">{item.name}</span>
                    <div className={`ml-auto w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 relative z-10 ${
                      isActive ? 'bg-white' : 'bg-blue-500'
                    }`}></div>
                  </Link>
                );
              })}
              
              {/* Botão de Logout */}
              <button
                onClick={logoutItem.onClick}
                className="w-full group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 transform hover:scale-105 border border-transparent hover:border-red-200 dark:hover:border-red-800"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <logoutItem.icon className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-red-500 dark:group-hover:text-red-400 icon-hover relative z-10" />
                <span className="font-medium relative z-10">{logoutItem.name}</span>
                <div className="ml-auto w-2 h-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 relative z-10"></div>
              </button>
            </nav>
          </div>

          {/* Footer do Sidebar */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="mb-3">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
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
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
                >
                  <span className="sr-only">Abrir sidebar</span>
                  {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
                <h1 className="ml-4 text-2xl font-semibold text-gray-900 dark:text-white">
                  {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleTheme}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-all duration-200 transform hover:scale-110"
                  title={isDark ? 'Modo claro' : 'Modo escuro'}
                >
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 transform hover:scale-110"
                  title="Sair"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo da página */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <span className="sr-only">Fechar sidebar</span>
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg shadow-blue-500/25">
                    <Package className="h-6 w-6 text-white drop-shadow-sm" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Lojify
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Sistema de Vendas
                    </p>
                  </div>
                </div>
                
                {/* Informações do usuário mobile */}
                {user && (
                  <div className="mt-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {user.role === 'admin' ? '👑 Admin' : '👤 Revendedor'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleTheme}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-all duration-200 transform hover:scale-110"
                  title={isDark ? 'Modo claro' : 'Modo escuro'}
                >
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 transform hover:scale-110"
                  title="Sair"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
              
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                        isActive
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <item.icon className={`mr-4 flex-shrink-0 h-6 w-6 ${
                        isActive 
                          ? 'text-blue-500 dark:text-blue-400' 
                          : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                      }`} />
                      {item.name}
                    </Link>
                  );
                })}
                
                {/* Botão de Logout Mobile */}
                <button
                  onClick={() => {
                    handleLogout();
                    setSidebarOpen(false);
                  }}
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 w-full"
                >
                  <LogOut className="mr-4 flex-shrink-0 h-6 w-6 text-gray-400 dark:text-gray-500 group-hover:text-red-500 dark:group-hover:text-red-400" />
                  Sair
                </button>
              </nav>
            </div>
            
            <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Suporte
                    </h3>
                  </div>
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
        </div>
      )}
    </div>
  );
};

export default Layout;
