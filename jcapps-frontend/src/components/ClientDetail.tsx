import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Building2,
  User,
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Globe,
  Clock,
  Plus,
  Edit3,
  Save,
  X,
  MessageSquare,
  CheckCircle,
  Target,
  Flag,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ProfessionalService } from '../types/professional-services';
import './Dashboard.css';

interface ClientDetailProps {
  client: ProfessionalService;
  onBack: () => void;
}

interface ClientInteraction {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  interaction_type: 'call' | 'whatsapp' | 'email' | 'meeting' | 'proposal' | 'follow_up' | 'note';
  created_at: string;
}

interface EnhancedClient extends ProfessionalService {
  status?: 'lead' | 'prospect' | 'qualified' | 'proposal' | 'negotiation' | 'client' | 'inactive' | 'lost';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  last_contact_at?: string;
}

const ClientDetail: React.FC<ClientDetailProps> = ({ client, onBack }) => {
  const [enhancedClient, setEnhancedClient] = useState<EnhancedClient>(client);
  const [interactions, setInteractions] = useState<ClientInteraction[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    description: '',
    notes: '',
    type: 'note' as ClientInteraction['interaction_type']
  });

  const statusConfig = {
    lead: { color: '#8b5cf6', label: 'Lead', icon: Target },
    prospect: { color: '#3b82f6', label: 'Prospecto', icon: User },
    qualified: { color: '#06b6d4', label: 'Qualificado', icon: CheckCircle },
    proposal: { color: '#f59e0b', label: 'Proposta', icon: MessageSquare },
    negotiation: { color: '#f97316', label: 'Negociação', icon: Edit3 },
    client: { color: '#10b981', label: 'Cliente', icon: CheckCircle },
    inactive: { color: '#6b7280', label: 'Inativo', icon: Clock },
    lost: { color: '#ef4444', label: 'Perdido', icon: X }
  };

  const priorityConfig = {
    low: { color: '#6b7280', label: 'Baixa' },
    medium: { color: '#3b82f6', label: 'Média' },
    high: { color: '#f59e0b', label: 'Alta' },
    urgent: { color: '#ef4444', label: 'Urgente' }
  };

  useEffect(() => {
    fetchClientData();
  }, [client.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchClientData = async () => {
    try {
      // Fetch updated client data
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', client.id)
        .single();

      if (clientData) {
        setEnhancedClient({
          ...clientData,
          status: clientData.status || 'prospect',
          priority: clientData.priority || 'medium'
        });
      }

      // Try to fetch interactions
      try {
        const { data: interactionsData } = await supabase
          .from('client_interactions')
          .select('*')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false });
        
        setInteractions(interactionsData || []);
      } catch (error) {
        // Table might not exist yet
        setInteractions([]);
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
    }
  };

  const updateClientStatus = async (status: EnhancedClient['status']) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ 
          status,
          last_contact_at: new Date().toISOString()
        })
        .eq('id', client.id);

      if (error) throw error;

      setEnhancedClient(prev => ({ ...prev, status }));
      setEditingStatus(false);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const addInteraction = async () => {
    if (!newNote.title.trim()) return;

    try {
      const user = await supabase.auth.getUser();
      const interactionData = {
        client_id: client.id,
        user_id: user.data.user?.id,
        interaction_type: newNote.type,
        interaction_status: 'completed',
        title: newNote.title,
        description: newNote.description,
        notes: newNote.notes,
        completed_at: new Date().toISOString()
      };

      try {
        const { data, error } = await supabase
          .from('client_interactions')
          .insert([interactionData])
          .select()
          .single();

        if (error) throw error;
        setInteractions(prev => [data, ...prev]);
      } catch (dbError) {
        // If database insert fails, add to local state
        const interaction: ClientInteraction = {
          id: Date.now().toString(),
          title: newNote.title,
          description: newNote.description,
          notes: newNote.notes,
          interaction_type: newNote.type,
          created_at: new Date().toISOString()
        };
        setInteractions(prev => [interaction, ...prev]);
      }

      // Update last contact
      await supabase
        .from('clients')
        .update({ last_contact_at: new Date().toISOString() })
        .eq('id', client.id);

      setNewNote({ title: '', description: '', notes: '', type: 'note' });
      setShowAddNote(false);
    } catch (error) {
      console.error('Error adding interaction:', error);
    }
  };

  const formatWhatsApp = (whatsapp: string) => {
    if (!whatsapp) return '';
    const digits = whatsapp.replace(/\D/g, '');
    return digits.startsWith('55') ? digits : `55${digits}`;
  };

  const handleWhatsApp = () => {
    if (enhancedClient.whatsapp) {
      const formattedNumber = formatWhatsApp(enhancedClient.whatsapp);
      window.open(`https://wa.me/${formattedNumber}`, '_blank');
    }
  };

  const handleCall = () => {
    if (enhancedClient.phone) {
      window.open(`tel:${enhancedClient.phone}`, '_self');
    }
  };

  const handleEmail = () => {
    if (enhancedClient.email) {
      window.open(`mailto:${enhancedClient.email}`, '_self');
    }
  };

  const handleWebsite = () => {
    if (enhancedClient.website) {
      const url = enhancedClient.website.startsWith('http') 
        ? enhancedClient.website 
        : `https://${enhancedClient.website}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const statusInfo = statusConfig[enhancedClient.status || 'prospect'];
  const priorityInfo = priorityConfig[enhancedClient.priority || 'medium'];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <motion.button
            onClick={onBack}
            className="logout-button mr-4"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft size={20} />
            <span>Voltar</span>
          </motion.button>
          <div className="app-icon mr-3" style={{ background: 'linear-gradient(135deg, #d4af37, #f4e4bc)' }}>
            <Building2 size={24} />
          </div>
          <div>
            <span className="brand-text">{enhancedClient.company_name}</span>
            <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Gestão CRM</p>
          </div>
        </div>
        <motion.button
          onClick={() => setShowAddNote(true)}
          className="logout-button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={16} />
          <span>Nova Observação</span>
        </motion.button>
      </nav>

      <div className="dashboard-content">
        <motion.div 
          className="welcome-section"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="welcome-text">CRM Cliente</h1>
          <p className="welcome-subtitle">Gestão completa do relacionamento com o cliente</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status and Priority */}
            <div className="app-card active p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="app-name">Status do Cliente</h2>
                <motion.button
                  onClick={() => setEditingStatus(!editingStatus)}
                  className="logout-button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Edit3 size={16} />
                </motion.button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Status</label>
                  {editingStatus ? (
                    <select
                      value={enhancedClient.status || 'prospect'}
                      onChange={(e) => updateClientStatus(e.target.value as EnhancedClient['status'])}
                      className="w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none transition-colors"
                      style={{
                        background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.8), rgba(26, 26, 26, 0.8))'
                      }}
                    >
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <option key={key} value={key} className="bg-gray-800">{config.label}</option>
                      ))}
                    </select>
                  ) : (
                    <div 
                      className="inline-flex items-center px-4 py-3 rounded-lg border"
                      style={{ 
                        backgroundColor: `${statusInfo.color}20`,
                        color: statusInfo.color,
                        borderColor: `${statusInfo.color}40`
                      }}
                    >
                      <StatusIcon size={16} className="mr-2" />
                      {statusInfo.label}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Prioridade</label>
                  <div 
                    className="inline-flex items-center px-4 py-3 rounded-lg border"
                    style={{ 
                      backgroundColor: `${priorityInfo.color}20`,
                      color: priorityInfo.color,
                      borderColor: `${priorityInfo.color}40`
                    }}
                  >
                    <Flag size={16} className="mr-2" />
                    {priorityInfo.label}
                  </div>
                </div>
              </div>

              {enhancedClient.last_contact_at && (
                <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(212, 175, 55, 0.1)' }}>
                  <div className="flex items-center text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    <Clock size={16} className="mr-2" style={{ color: '#d4af37' }} />
                    Último contato: {new Date(enhancedClient.last_contact_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              )}
            </div>

            {/* Client Information */}
            <div className="app-card active p-8">
              <h2 className="app-name mb-6">Informações do Cliente</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Empresa</label>
                  <p className="text-white text-lg">{enhancedClient.company_name}</p>
                </div>
                
                {enhancedClient.contact_name && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Contato</label>
                    <p className="text-white text-lg">{enhancedClient.contact_name}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Profissão</label>
                  <p className="text-white text-lg">{enhancedClient.profession}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Localização</label>
                  <p className="text-white text-lg">{enhancedClient.city}, {enhancedClient.state}</p>
                </div>

                {enhancedClient.specialization && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Especialização</label>
                    <p className="text-white text-lg">{enhancedClient.specialization}</p>
                  </div>
                )}

                {enhancedClient.services && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Serviços</label>
                    <p className="text-white text-lg">{enhancedClient.services}</p>
                  </div>
                )}

                {enhancedClient.years_experience && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Experiência</label>
                    <p className="text-white text-lg">{enhancedClient.years_experience} anos</p>
                  </div>
                )}
              </div>
            </div>

            {/* Interactions Timeline */}
            <div className="app-card active p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="app-name">Histórico de Interações</h2>
                <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  {interactions.length} interação{interactions.length === 1 ? '' : 'ões'}
                </span>
              </div>

              {interactions.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare size={48} className="mx-auto mb-4" style={{ color: 'rgba(255, 255, 255, 0.3)' }} />
                  <p className="mb-4" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Nenhuma interação registrada</p>
                  <motion.button
                    onClick={() => setShowAddNote(true)}
                    className="logout-button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Adicionar primeira observação
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {interactions.map((interaction, index) => (
                    <motion.div
                      key={interaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-lg"
                      style={{
                        background: 'rgba(212, 175, 55, 0.1)',
                        border: '1px solid rgba(212, 175, 55, 0.2)'
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(212, 175, 55, 0.3)' }}>
                          <MessageSquare size={16} style={{ color: '#d4af37' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white mb-1">{interaction.title}</h4>
                          {interaction.description && (
                            <p className="text-sm mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{interaction.description}</p>
                          )}
                          {interaction.notes && (
                            <p className="text-sm italic mb-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{interaction.notes}</p>
                          )}
                          <div className="flex items-center text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                            <span className="capitalize">{interaction.interaction_type}</span>
                            <span className="mx-2">•</span>
                            <span>{new Date(interaction.created_at).toLocaleString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contact Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="app-card active p-6">
              <h3 className="app-name mb-4">Ações Rápidas</h3>
              <div className="space-y-3">
                {enhancedClient.whatsapp && (
                  <motion.button
                    onClick={handleWhatsApp}
                    className="w-full flex items-center px-4 py-3 rounded-lg transition-colors"
                    style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <MessageCircle size={18} className="mr-3" />
                    Enviar WhatsApp
                  </motion.button>
                )}
                
                {enhancedClient.phone && (
                  <motion.button
                    onClick={handleCall}
                    className="w-full flex items-center px-4 py-3 rounded-lg transition-colors"
                    style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Phone size={18} className="mr-3" />
                    Ligar
                  </motion.button>
                )}
                
                {enhancedClient.email && (
                  <motion.button
                    onClick={handleEmail}
                    className="w-full flex items-center px-4 py-3 rounded-lg transition-colors"
                    style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.3)' }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Mail size={18} className="mr-3" />
                    Enviar Email
                  </motion.button>
                )}
                
                {enhancedClient.website && (
                  <motion.button
                    onClick={handleWebsite}
                    className="w-full flex items-center px-4 py-3 rounded-lg transition-colors"
                    style={{ background: 'rgba(212, 175, 55, 0.2)', color: '#d4af37', border: '1px solid rgba(212, 175, 55, 0.3)' }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Globe size={18} className="mr-3" />
                    Visitar Website
                  </motion.button>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="app-card active p-6">
              <h3 className="app-name mb-4">Informações de Contato</h3>
              <div className="space-y-3 text-sm">
                {enhancedClient.phone && (
                  <div className="flex items-center">
                    <Phone size={16} className="mr-3" style={{ color: '#d4af37' }} />
                    <span className="text-white">{enhancedClient.phone}</span>
                  </div>
                )}
                
                {enhancedClient.whatsapp && (
                  <div className="flex items-center">
                    <MessageCircle size={16} className="mr-3" style={{ color: '#d4af37' }} />
                    <span className="text-white">{enhancedClient.whatsapp}</span>
                  </div>
                )}
                
                {enhancedClient.email && (
                  <div className="flex items-center">
                    <Mail size={16} className="mr-3" style={{ color: '#d4af37' }} />
                    <span className="text-white truncate">{enhancedClient.email}</span>
                  </div>
                )}
                
                {enhancedClient.website && (
                  <div className="flex items-center">
                    <Globe size={16} className="mr-3" style={{ color: '#d4af37' }} />
                    <span className="text-white truncate">{enhancedClient.website}</span>
                  </div>
                )}

                <div className="flex items-center">
                  <MapPin size={16} className="mr-3" style={{ color: '#d4af37' }} />
                  <span className="text-white">{enhancedClient.city}, {enhancedClient.state}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      <AnimatePresence>
        {showAddNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddNote(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full max-h-[90vh] overflow-y-auto"
              style={{
                background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '16px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold" style={{ color: '#d4af37' }}>Nova Observação</h3>
                  <button
                    onClick={() => setShowAddNote(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      Tipo de Interação
                    </label>
                    <select
                      value={newNote.type}
                      onChange={(e) => setNewNote(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                      style={{
                        background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.8), rgba(26, 26, 26, 0.8))'
                      }}
                    >
                      <option value="note" className="bg-gray-800">Observação</option>
                      <option value="call" className="bg-gray-800">Ligação</option>
                      <option value="whatsapp" className="bg-gray-800">WhatsApp</option>
                      <option value="email" className="bg-gray-800">Email</option>
                      <option value="meeting" className="bg-gray-800">Reunião</option>
                      <option value="proposal" className="bg-gray-800">Proposta</option>
                      <option value="follow_up" className="bg-gray-800">Follow-up</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      Título *
                    </label>
                    <input
                      type="text"
                      value={newNote.title}
                      onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: Primeira conversa telefônica"
                      className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                      style={{
                        background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.8), rgba(26, 26, 26, 0.8))'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      Descrição
                    </label>
                    <textarea
                      value={newNote.description}
                      onChange={(e) => setNewNote(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição da interação..."
                      rows={3}
                      className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none resize-vertical"
                      style={{
                        background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.8), rgba(26, 26, 26, 0.8))'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      Observações
                    </label>
                    <textarea
                      value={newNote.notes}
                      onChange={(e) => setNewNote(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Observações adicionais, próximos passos..."
                      rows={3}
                      className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none resize-vertical"
                      style={{
                        background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.8), rgba(26, 26, 26, 0.8))'
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-6" style={{ borderTop: '1px solid rgba(212, 175, 55, 0.2)' }}>
                  <button
                    onClick={() => setShowAddNote(false)}
                    className="px-4 py-2 rounded-lg transition-colors"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addInteraction}
                    disabled={!newNote.title.trim()}
                    className="inline-flex items-center px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: !newNote.title.trim() 
                        ? 'rgba(212, 175, 55, 0.3)' 
                        : 'linear-gradient(135deg, #d4af37, #f4e4bc)',
                      color: !newNote.title.trim() ? 'rgba(255, 255, 255, 0.5)' : '#000',
                      fontWeight: '500'
                    }}
                  >
                    <Save size={16} className="mr-2" />
                    Salvar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="dashboard-background">
        <div className="grid-pattern"></div>
      </div>
    </div>
  );
};

export default ClientDetail;