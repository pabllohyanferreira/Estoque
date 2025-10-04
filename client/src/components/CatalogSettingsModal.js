import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Palette, Image, Save, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const CatalogSettingsModal = ({ isOpen, onClose, onSave, currentSettings }) => {
  const [settings, setSettings] = useState({
    backgroundColor: currentSettings?.backgroundColor || '#ffffff',
    logoUrl: currentSettings?.logoUrl || '',
    businessName: currentSettings?.businessName || '',
    businessSubtitle: currentSettings?.businessSubtitle || '',
    phoneNumber: currentSettings?.phoneNumber || '',
    instagramHandle: currentSettings?.instagramHandle || '',
    whatsappNumber: currentSettings?.whatsappNumber || '',
    showPrices: currentSettings?.showPrices !== false,
    showInstallments: currentSettings?.showInstallments !== false,
    ...currentSettings
  });

  const [logoPreview, setLogoPreview] = useState(currentSettings?.logoUrl || '');
  const logoInputRef = useRef(null);

  // Atualizar estado quando currentSettings mudar
  useEffect(() => {
    if (currentSettings) {
      console.log('🔄 Atualizando configurações no modal:', currentSettings);
      setSettings({
        backgroundColor: currentSettings.backgroundColor || '#ffffff',
        logoUrl: currentSettings.logoUrl || '',
        businessName: currentSettings.businessName || '',
        businessSubtitle: currentSettings.businessSubtitle || '',
        phoneNumber: currentSettings.phoneNumber || '',
        instagramHandle: currentSettings.instagramHandle || '',
        whatsappNumber: currentSettings.whatsappNumber || '',
        showPrices: currentSettings.showPrices !== false,
        showInstallments: currentSettings.showInstallments !== false,
        ...currentSettings
      });
      setLogoPreview(currentSettings.logoUrl || '');
      console.log('✅ Logo preview atualizada:', currentSettings.logoUrl);
    }
  }, [currentSettings]);

  const handleColorChange = (color) => {
    setSettings(prev => ({ ...prev, backgroundColor: color }));
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error('A imagem deve ter no máximo 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const logoUrl = e.target.result;
        setLogoPreview(logoUrl);
        setSettings(prev => ({ ...prev, logoUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview('');
    setSettings(prev => ({ ...prev, logoUrl: '' }));
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    onSave(settings);
    toast.success('Configurações salvas com sucesso!');
    onClose();
  };

  const handleReset = () => {
    setSettings({
      backgroundColor: '#ffffff',
      logoUrl: '',
      businessName: '',
      businessSubtitle: '',
      phoneNumber: '',
      instagramHandle: '',
      whatsappNumber: '',
      showPrices: true,
      showInstallments: true
    });
    setLogoPreview('');
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const presetColors = [
    '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6',
    '#f1f3f4', '#fafafa', '#ffffff', '#fefefe',
    '#f5f5f5', '#eeeeee', '#e0e0e0', '#bdbdbd',
    '#9e9e9e', '#757575', '#616161', '#424242'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <Palette className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Configurações do Catálogo
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Personalize a aparência do seu catálogo
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Preview */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Preview do Catálogo
                </h4>
                <div 
                  className="w-full h-96 rounded-xl border-2 border-gray-200 dark:border-gray-600 p-4"
                  style={{ backgroundColor: settings.backgroundColor }}
                >
                  {/* Logo Preview */}
                  {logoPreview && (
                    <div className="text-center mb-4">
                      <img 
                        src={logoPreview} 
                        alt="Logo Preview" 
                        className="h-16 mx-auto mb-2 object-contain"
                      />
                      <div className="text-lg font-bold text-gray-800" style={{ color: '#333' }}>
                        {settings.businessName || 'SEU NEGÓCIO'}
                      </div>
                      {settings.businessSubtitle && (
                        <div className="text-sm text-gray-600" style={{ color: '#666' }}>
                          {settings.businessSubtitle}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Sample Products */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="h-20 bg-gray-200 rounded mb-2"></div>
                      <div className="text-xs text-gray-600">Produto 1</div>
                      <div className="text-sm font-bold text-gray-800">R$ 50,00</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="h-20 bg-gray-200 rounded mb-2"></div>
                      <div className="text-xs text-gray-600">Produto 2</div>
                      <div className="text-sm font-bold text-gray-800">R$ 75,00</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-6">
                {/* Background Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Cor de Fundo
                  </label>
                  <div className="grid grid-cols-8 gap-2 mb-3">
                    {presetColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorChange(color)}
                        className={`w-8 h-8 rounded-lg border-2 ${
                          settings.backgroundColor === color 
                            ? 'border-blue-500 ring-2 ring-blue-200' 
                            : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={settings.backgroundColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                  />
                </div>

                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Logo da Empresa
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </button>
                    {logoPreview && (
                      <button
                        onClick={handleRemoveLogo}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remover
                      </button>
                    )}
                  </div>
                </div>

                {/* Business Info */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Informações da Empresa
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome da Empresa
                    </label>
                    <input
                      type="text"
                      value={settings.businessName}
                      onChange={(e) => setSettings(prev => ({ ...prev, businessName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ex: DETTY FERRAZ"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subtítulo
                    </label>
                    <input
                      type="text"
                      value={settings.businessSubtitle}
                      onChange={(e) => setSettings(prev => ({ ...prev, businessSubtitle: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ex: SEMIJOIAS"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Telefone/WhatsApp
                    </label>
                    <input
                      type="text"
                      value={settings.phoneNumber}
                      onChange={(e) => setSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ex: (81) 99726-9325"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={settings.instagramHandle}
                      onChange={(e) => setSettings(prev => ({ ...prev, instagramHandle: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ex: @dettyferrazsemijoias"
                    />
                  </div>
                </div>

                {/* Display Options */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Opções de Exibição
                  </h4>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showPrices"
                      checked={settings.showPrices}
                      onChange={(e) => setSettings(prev => ({ ...prev, showPrices: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="showPrices" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Mostrar preços
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showInstallments"
                      checked={settings.showInstallments}
                      onChange={(e) => setSettings(prev => ({ ...prev, showInstallments: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="showInstallments" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Mostrar parcelamento
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex justify-end space-x-4">
              <button
                onClick={handleReset}
                className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Resetar
              </button>
              <button
                onClick={handleSave}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center"
              >
                <Save className="h-5 w-5 mr-2" />
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogSettingsModal;

