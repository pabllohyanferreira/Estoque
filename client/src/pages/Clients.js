import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Users, Mail, Phone, Building } from 'lucide-react';
import { clientsAPI } from '../services/api';
import toast from 'react-hot-toast';
import ClientModal from '../components/ClientModal';
import ConfirmModal from '../components/ConfirmModal';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showClientModal, setShowClientModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (searchTerm) params.search = searchTerm;
      if (selectedType) params.type = selectedType;

      const response = await clientsAPI.getAll(params);
      setClients(response.data);
    } catch (error) {
      toast.error('Erro ao carregar clientes');
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (clientData) => {
    try {
      await clientsAPI.create(clientData);
      toast.success('Cliente criado com sucesso!');
      setShowClientModal(false);
      loadClients();
    } catch (error) {
      toast.error('Erro ao criar cliente');
      console.error('Erro ao criar cliente:', error);
    }
  };

  const handleUpdateClient = async (clientData) => {
    try {
      await clientsAPI.update(editingClient.id, clientData);
      toast.success('Cliente atualizado com sucesso!');
      setShowClientModal(false);
      setEditingClient(null);
      loadClients();
    } catch (error) {
      toast.error('Erro ao atualizar cliente');
      console.error('Erro ao atualizar cliente:', error);
    }
  };

  const handleDeleteClient = async () => {
    try {
      await clientsAPI.delete(selectedClient.id);
      toast.success('Cliente deletado com sucesso!');
      setShowConfirmModal(false);
      setSelectedClient(null);
      loadClients();
    } catch (error) {
      toast.error('Erro ao deletar cliente');
      console.error('Erro ao deletar cliente:', error);
    }
  };

  const openEditModal = (client) => {
    setEditingClient(client);
    setShowClientModal(true);
  };

  const openDeleteModal = (client) => {
    setSelectedClient(client);
    setShowConfirmModal(true);
  };

  const getTypeLabel = (type) => {
    return type === 'individual' ? 'Pessoa Física' : 'Pessoa Jurídica';
  };

  const getTypeIcon = (type) => {
    return type === 'individual' ? Users : Building;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clientes</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie sua base de clientes
          </p>
        </div>
        <button
          onClick={() => setShowClientModal(true)}
          className="mt-4 sm:mt-0 btn-primary btn-glow btn-expand"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors duration-200 card-expand animate-grow-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome, email, telefone ou CPF/CNPJ..."
                className="pl-10 block w-full border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="block w-full border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos os tipos</option>
              <option value="individual">Pessoa Física</option>
              <option value="company">Pessoa Jurídica</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadClients}
              className="w-full btn-secondary btn-elevate"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200 card-expand animate-grow-in">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="spinner"></div>
          </div>
        ) : (
          <div>
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    CPF/CNPJ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {clients.map((client, index) => {
                  const TypeIcon = getTypeIcon(client.type);
                  return (
                    <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors table-row-expand" style={{ animationDelay: `${index * 50}ms` }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <TypeIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{client.name}</div>
                            {client.address && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">{client.address}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          client.type === 'individual' 
                            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200' 
                            : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                        }`}>
                          {getTypeLabel(client.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {client.email && (
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <Mail className="h-4 w-4 mr-1" />
                              {client.email}
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <Phone className="h-4 w-4 mr-1" />
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {client.cpf_cnpj || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(client)}
                            className="text-indigo-600 hover:text-indigo-900 btn-action"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(client)}
                            className="text-red-600 hover:text-red-900 btn-action"
                            title="Deletar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && clients.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum cliente encontrado</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Comece criando seu primeiro cliente.
            </p>
          </div>
        )}
      </div>

      {/* Modais */}
      <ClientModal
        isOpen={showClientModal}
        onClose={() => {
          setShowClientModal(false);
          setEditingClient(null);
        }}
        onSubmit={editingClient ? handleUpdateClient : handleCreateClient}
        client={editingClient}
      />

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setSelectedClient(null);
        }}
        onConfirm={handleDeleteClient}
        title="Deletar Cliente"
        message={`Tem certeza que deseja deletar o cliente "${selectedClient?.name}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
};

export default Clients; 