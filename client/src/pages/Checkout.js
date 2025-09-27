import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CreditCard, 
  Smartphone, 
  QrCode, 
  Copy, 
  CheckCircle,
  Clock,
  Shield,
  Truck,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/formatters';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems, totalAmount } = location.state || { cartItems: [], totalAmount: 0 };
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('pix');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: ''
  });
  const [loading, setLoading] = useState(false);
  // const [paymentData, setPaymentData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, processing, success, error
  const [qrCodeData, setQrCodeData] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      navigate('/public');
      return;
    }
  }, [cartItems, navigate]);

  useEffect(() => {
    if (expiresAt) {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(expiresAt).getTime();
        const difference = expiry - now;

        if (difference > 0) {
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setTimeLeft('Expirado');
          setPaymentStatus('error');
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [expiresAt]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!customerInfo.name.trim()) {
      toast.error('Nome é obrigatório');
      return false;
    }
    if (!customerInfo.email.trim()) {
      toast.error('Email é obrigatório');
      return false;
    }
    if (!customerInfo.phone.trim()) {
      toast.error('Telefone é obrigatório');
      return false;
    }
    if (!customerInfo.cpf.trim()) {
      toast.error('CPF é obrigatório');
      return false;
    }
    return true;
  };

  const generatePaymentLink = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setPaymentStatus('processing');

    try {
      const paymentMethods = selectedPaymentMethod === 'pix' 
        ? ['pix'] 
        : ['credit_card', 'debit_card'];

      const linkData = {
        client_name: customerInfo.name,
        title: `Compra - ${cartItems.length} item(s)`,
        description: `Compra de ${cartItems.length} produto(s) no Lojify`,
        amount: totalAmount,
        payment_methods: paymentMethods,
        expires_in_days: 1
      };

      // Simular processamento de pedido
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPaymentStatus('success');
      toast.success('Pedido processado com sucesso! Entre em contato para finalizar o pagamento.');

    } catch (error) {
      console.error('❌ Erro ao gerar link de pagamento:', error);
      
      // Tratamento específico de erros
      if (error.response) {
        // Erro de resposta do servidor
        const errorMessage = error.response.data?.error || 'Erro no servidor';
        toast.error(`Erro: ${errorMessage}`);
        console.error('📊 Detalhes do erro:', error.response.data);
      } else if (error.request) {
        // Erro de rede
        toast.error('Erro de conexão. Verifique se o servidor está rodando.');
        console.error('🔌 Erro de rede:', error.request);
      } else {
        // Outros erros
        toast.error('Erro inesperado ao gerar link de pagamento');
        console.error('⚠️ Erro inesperado:', error.message);
      }
      
      setPaymentStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  const formatCPF = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(\d{4})-(\d)(\d{4})/, '$1$2-$3')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const handleCPFChange = (e) => {
    const formatted = formatCPF(e.target.value);
    setCustomerInfo(prev => ({ ...prev, cpf: formatted }));
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setCustomerInfo(prev => ({ ...prev, phone: formatted }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/public')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar ao catálogo
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Finalizar Compra
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete seus dados e escolha a forma de pagamento
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de Dados e Pagamento */}
          <div className="space-y-6">
            {/* Dados do Cliente */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Dados do Cliente
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={customerInfo.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={customerInfo.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    placeholder="seu@email.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={customerInfo.phone}
                      onChange={handlePhoneChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                      placeholder="(81) 99999-9999"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CPF *
                    </label>
                    <input
                      type="text"
                      name="cpf"
                      value={customerInfo.cpf}
                      onChange={handleCPFChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Método de Pagamento */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Forma de Pagamento
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedPaymentMethod('pix')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedPaymentMethod === 'pix'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Smartphone className={`h-6 w-6 ${
                        selectedPaymentMethod === 'pix' ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <div className="text-left">
                        <div className={`font-semibold ${
                          selectedPaymentMethod === 'pix' ? 'text-green-600' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          PIX
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Aprovação instantânea
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedPaymentMethod('card')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedPaymentMethod === 'card'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <CreditCard className={`h-6 w-6 ${
                        selectedPaymentMethod === 'card' ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <div className="text-left">
                        <div className={`font-semibold ${
                          selectedPaymentMethod === 'card' ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          Cartão
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Crédito ou Débito
                        </div>
                      </div>
                    </div>
                  </button>
                </div>

                <button
                  onClick={generatePaymentLink}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Gerando pagamento...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Gerar Link de Pagamento
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Resumo do Pedido e Pagamento */}
          <div className="space-y-6">
            {/* Resumo do Pedido */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Resumo do Pedido
              </h2>
              
              <div className="space-y-3">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {item.quantity}x {formatCurrency(item.price)}
                      </div>
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200 dark:border-gray-600">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">Total:</div>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(totalAmount)}
                  </div>
                </div>
              </div>
            </div>

            {/* Informações de Segurança */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Segurança e Garantias
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Pagamento 100% seguro
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Truck className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Entrega rápida e segura
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Produtos originais garantidos
                  </span>
                </div>
              </div>
            </div>

            {/* Área de Pagamento */}
            {paymentStatus === 'success' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="text-center mb-6">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Link de Pagamento Gerado!
                  </h3>
                  {timeLeft && (
                    <div className="flex items-center justify-center space-x-2 text-orange-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Expira em: {timeLeft}
                      </span>
                    </div>
                  )}
                </div>

                {selectedPaymentMethod === 'pix' && qrCodeData && (
                  <div className="text-center mb-6">
                    <div className="bg-white p-4 rounded-xl border-2 border-gray-200 inline-block">
                      <QrCode className="h-32 w-32 text-gray-400" />
                      <p className="text-xs text-gray-500 mt-2">QR Code PIX</p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                      Escaneie o QR Code com seu app de pagamento
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Link de Pagamento:
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={paymentUrl}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(paymentUrl)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => window.open(paymentUrl, '_blank')}
                      className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200"
                    >
                      Abrir Link de Pagamento
                    </button>
                  </div>
                </div>
              </div>
            )}

            {paymentStatus === 'error' && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <div className="h-5 w-5 text-red-600">⚠️</div>
                  <span className="text-red-800 dark:text-red-200 font-medium">
                    Erro ao gerar pagamento
                  </span>
                </div>
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                  Tente novamente ou entre em contato conosco.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
