import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid3x3,
  ChevronLeft,
  Search,
  SlidersHorizontal,
  Phone,
  MessageCircle,
  Mail,
  Globe,
  MapPin,
  Calendar,
  Briefcase,
  ExternalLink,
  RefreshCw,
  Download,
  Users,
  X,
  Check,
  ChevronDown,
  Eye,
  Building,
  Plus,
  Clock,
  AlertCircle,
  PhoneCall,
  Send,
  UserCheck,
  Target,
  TrendingUp,
  Flag,
  CalendarPlus,
  MessageSquare,
  FileText,
  Activity,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ProfessionalService } from '../types/professional-services';
import './ProspeccaoAtiva.css';

interface ProspeccaoAtivaCRMProps {
  onBack?: () => void;
}

interface FilterState {
  profession: string[];
  city: string[];
  state: string[];
  status: string[];
  priority: string[];
  yearsExperience: { min: number; max: number };
  hasWhatsapp: boolean | null;
  hasEmail: boolean | null;
  hasWebsite: boolean | null;
}

interface ClientInteraction {
  id: string;
  client_id: string;
  interaction_type: 'call' | 'whatsapp' | 'email' | 'meeting' | 'proposal' | 'follow_up' | 'note';
  interaction_status: 'scheduled' | 'completed' | 'cancelled' | 'no_response';
  title: string;
  description?: string;
  notes?: string;
  scheduled_at?: string;
  completed_at?: string;
  created_at: string;
}

interface ClientTask {
  id: string;
  client_id: string;
  title: string;
  description?: string;
  task_type: 'call' | 'email' | 'meeting' | 'follow_up' | 'proposal' | 'contract' | 'other';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  completed_at?: string;
  created_at: string;
}

interface EnhancedClient extends ProfessionalService {
  status?: 'lead' | 'prospect' | 'qualified' | 'proposal' | 'negotiation' | 'client' | 'inactive' | 'lost';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  lead_source?: string;
  last_contact_at?: string;
  next_follow_up?: string;
  deal_value?: number;
  probability?: number;
}

const ProspeccaoAtivaCRM: React.FC<ProspeccaoAtivaCRMProps> = ({ onBack }) => {
  const [services, setServices] = useState<EnhancedClient[]>([]);
  const [filteredServices, setFilteredServices] = useState<EnhancedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedClient, setSelectedClient] = useState<EnhancedClient | null>(null);
  const [clientInteractions, setClientInteractions] = useState<ClientInteraction[]>([]);
  const [clientTasks] = useState<ClientTask[]>([]);
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  
  // Advanced filter state
  const [filters, setFilters] = useState<FilterState>({
    profession: [],
    city: [],
    state: [],
    status: [],
    priority: [],
    yearsExperience: { min: 0, max: 50 },
    hasWhatsapp: null,
    hasEmail: null,
    hasWebsite: null
  });

  // New interaction form state
  const [newInteraction, setNewInteraction] = useState({
    type: 'note' as ClientInteraction['interaction_type'],
    title: '',
    description: '',
    notes: '',
    scheduled_at: ''
  });

  // New task form state will be added when implementing tasks

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const professions = services.map(s => s.profession).filter(Boolean) as string[];
    const cities = services.map(s => s.city).filter(Boolean) as string[];
    const states = services.map(s => s.state).filter(Boolean) as string[];
    const statuses = services.map(s => s.status).filter(Boolean) as string[];
    const priorities = services.map(s => s.priority).filter(Boolean) as string[];
    
    return {
      professions: Array.from(new Set(professions)).sort(),
      cities: Array.from(new Set(cities)).sort(),
      states: Array.from(new Set(states)).sort(),
      statuses: Array.from(new Set(statuses)).sort(),
      priorities: Array.from(new Set(priorities)).sort()
    };
  }, [services]);

  const statusConfig = {
    lead: { color: '#8b5cf6', label: 'Lead', icon: Target },
    prospect: { color: '#3b82f6', label: 'Prospecto', icon: Users },
    qualified: { color: '#06b6d4', label: 'Qualificado', icon: UserCheck },
    proposal: { color: '#f59e0b', label: 'Proposta', icon: FileText },
    negotiation: { color: '#f97316', label: 'Negociação', icon: TrendingUp },
    client: { color: '#10b981', label: 'Cliente', icon: CheckCircle },
    inactive: { color: '#6b7280', label: 'Inativo', icon: Clock },
    lost: { color: '#ef4444', label: 'Perdido', icon: X }
  };

  const priorityConfig = {
    low: { color: '#6b7280', label: 'Baixa', icon: Flag },
    medium: { color: '#3b82f6', label: 'Média', icon: Flag },
    high: { color: '#f59e0b', label: 'Alta', icon: Flag },
    urgent: { color: '#ef4444', label: 'Urgente', icon: AlertCircle }
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Add default CRM fields if they don't exist
      const enhancedData = (data || []).map(client => ({
        ...client,
        status: client.status || 'prospect',
        priority: client.priority || 'medium',
        lead_source: client.lead_source || 'imported'
      }));

      setServices(enhancedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setError(errorMessage);
      console.error('Error fetching professional services:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientData = async (clientId: string) => {
    try {
      // Try to fetch interactions from the database (it may not exist yet)
      try {
        const { data: interactions } = await supabase
          .from('client_interactions')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });
        
        setClientInteractions(interactions || []);
      } catch (interactionError) {
        // Table doesn't exist yet, use empty array
        setClientInteractions([]);
      }
      
      // Tasks will be implemented later
    } catch (err) {
      console.error('Error fetching client data:', err);
      setClientInteractions([]);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Advanced filtering logic
  const applyFilters = useCallback(() => {
    let filtered = [...services];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(service =>
        service.company_name?.toLowerCase().includes(search) ||
        service.contact_name?.toLowerCase().includes(search) ||
        service.profession?.toLowerCase().includes(search) ||
        service.city?.toLowerCase().includes(search) ||
        service.specialization?.toLowerCase().includes(search) ||
        service.services?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(service => 
        filters.status.includes(service.status || 'prospect')
      );
    }

    // Priority filter
    if (filters.priority.length > 0) {
      filtered = filtered.filter(service => 
        filters.priority.includes(service.priority || 'medium')
      );
    }

    // Profession filter
    if (filters.profession.length > 0) {
      filtered = filtered.filter(service => 
        filters.profession.includes(service.profession || '')
      );
    }

    // City filter
    if (filters.city.length > 0) {
      filtered = filtered.filter(service => 
        filters.city.includes(service.city || '')
      );
    }

    // State filter
    if (filters.state.length > 0) {
      filtered = filtered.filter(service => 
        filters.state.includes(service.state || '')
      );
    }

    // Contact method filters
    if (filters.hasWhatsapp === true) {
      filtered = filtered.filter(service => service.whatsapp);
    } else if (filters.hasWhatsapp === false) {
      filtered = filtered.filter(service => !service.whatsapp);
    }

    if (filters.hasEmail === true) {
      filtered = filtered.filter(service => service.email);
    } else if (filters.hasEmail === false) {
      filtered = filtered.filter(service => !service.email);
    }

    if (filters.hasWebsite === true) {
      filtered = filtered.filter(service => service.website);
    } else if (filters.hasWebsite === false) {
      filtered = filtered.filter(service => !service.website);
    }

    setFilteredServices(filtered);
  }, [services, searchTerm, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const updateClientStatus = async (clientId: string, status: EnhancedClient['status']) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ 
          status,
          last_contact_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (error) throw error;

      // Update local state
      setServices(prev => prev.map(client => 
        client.id === clientId ? { ...client, status } : client
      ));

      if (selectedClient && selectedClient.id === clientId) {
        setSelectedClient(prev => prev ? { ...prev, status } : null);
      }
    } catch (error) {
      console.error('Error updating client status:', error);
    }
  };

  // Priority update functionality will be added when implementing priority management

  const addInteraction = async () => {
    if (!selectedClient || !newInteraction.title.trim()) return;

    try {
      // Try to insert into database first
      const interactionData = {
        client_id: selectedClient.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        interaction_type: newInteraction.type,
        interaction_status: 'completed',
        title: newInteraction.title,
        description: newInteraction.description,
        notes: newInteraction.notes,
        completed_at: new Date().toISOString()
      };

      try {
        const { data, error } = await supabase
          .from('client_interactions')
          .insert([interactionData])
          .select()
          .single();

        if (error) throw error;

        // Add to local state if successful
        setClientInteractions(prev => [data, ...prev]);
      } catch (dbError) {
        // If database insert fails, add to local state only
        const interaction: ClientInteraction = {
          id: Date.now().toString(),
          client_id: selectedClient.id,
          interaction_type: newInteraction.type,
          interaction_status: 'completed',
          title: newInteraction.title,
          description: newInteraction.description,
          notes: newInteraction.notes,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        };

        setClientInteractions(prev => [interaction, ...prev]);
        console.warn('Database insert failed, using local state:', dbError);
      }
      
      // Reset form
      setNewInteraction({
        type: 'note',
        title: '',
        description: '',
        notes: '',
        scheduled_at: ''
      });
      setShowAddInteraction(false);

      // Update last contact
      await supabase
        .from('clients')
        .update({ last_contact_at: new Date().toISOString() })
        .eq('id', selectedClient.id);

    } catch (error) {
      console.error('Error adding interaction:', error);
    }
  };

  const clearFilters = () => {
    setFilters({
      profession: [],
      city: [],
      state: [],
      status: [],
      priority: [],
      yearsExperience: { min: 0, max: 50 },
      hasWhatsapp: null,
      hasEmail: null,
      hasWebsite: null
    });
    setSearchTerm('');
  };

  const toggleArrayFilter = (filterKey: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: (prev[filterKey] as string[]).includes(value)
        ? (prev[filterKey] as string[]).filter(item => item !== value)
        : [...(prev[filterKey] as string[]), value]
    }));
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Empresa', 'Contato', 'Profissão', 'Status', 'Prioridade', 'Cidade', 'Estado', 'Telefone', 'WhatsApp', 'Email', 'Website'].join(','),
      ...filteredServices.map(service => [
        `"${service.company_name || ''}"`,
        `"${service.contact_name || ''}"`,
        `"${service.profession || ''}"`,
        `"${service.status || ''}"`,
        `"${service.priority || ''}"`,
        `"${service.city || ''}"`,
        `"${service.state || ''}"`,
        `"${service.phone || ''}"`,
        `"${service.whatsapp || ''}"`,
        `"${service.email || ''}"`,
        `"${service.website || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `crm-prospects-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const ClientCard: React.FC<{ client: EnhancedClient; index: number }> = ({ client, index }) => {
    const statusInfo = statusConfig[client.status || 'prospect'];
    const priorityInfo = priorityConfig[client.priority || 'medium'];
    const StatusIcon = statusInfo.icon;
    const PriorityIcon = priorityInfo.icon;

    const formatWhatsApp = (whatsapp: string) => {
      if (!whatsapp) return '';
      const digits = whatsapp.replace(/\D/g, '');
      return digits.startsWith('55') ? digits : `55${digits}`;
    };

    const handleWhatsApp = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (client.whatsapp) {
        const formattedNumber = formatWhatsApp(client.whatsapp);
        window.open(`https://wa.me/${formattedNumber}`, '_blank');
      }
    };

    const handleCall = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (client.phone) {
        window.open(`tel:${client.phone}`, '_self');
      }
    };

    const handleEmail = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (client.email) {
        window.open(`mailto:${client.email}`, '_self');
      }
    };

    const handleWebsite = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (client.website) {
        const url = client.website.startsWith('http') 
          ? client.website 
          : `https://${client.website}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    };

    const handleStatusChange = (e: React.MouseEvent, newStatus: EnhancedClient['status']) => {
      e.stopPropagation();
      updateClientStatus(client.id, newStatus);
    };

    // Priority change functionality will be added later

    return (
      <motion.div
        className="modern-client-card crm-enhanced"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => {
          setSelectedClient(client);
          fetchClientData(client.id);
        }}
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="card-header">
          <div className="client-avatar">
            <Building size={20} />
          </div>
          <div className="card-status-controls">
            <div className="status-priority-row">
              <div className="status-dropdown">
                <div 
                  className="status-badge"
                  style={{ backgroundColor: `${statusInfo.color}20`, color: statusInfo.color, borderColor: `${statusInfo.color}40` }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <StatusIcon size={12} />
                  <span>{statusInfo.label}</span>
                  <ChevronDown size={12} />
                </div>
                <div className="dropdown-menu">
                  {Object.entries(statusConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={key}
                        className="dropdown-item"
                        onClick={(e) => handleStatusChange(e, key as EnhancedClient['status'])}
                        style={{ color: config.color }}
                      >
                        <Icon size={14} />
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="priority-indicator" style={{ color: priorityInfo.color }}>
                <PriorityIcon size={14} />
              </div>
            </div>
            
            <div className="contact-badges">
              {client.whatsapp && <div className="badge whatsapp"><MessageCircle size={10} /></div>}
              {client.phone && <div className="badge phone"><Phone size={10} /></div>}
              {client.email && <div className="badge email"><Mail size={10} /></div>}
              {client.website && <div className="badge website"><Globe size={10} /></div>}
            </div>
          </div>
        </div>

        <div className="card-content">
          <h3 className="client-name">{client.company_name}</h3>
          {client.contact_name && <p className="contact-name">{client.contact_name}</p>}
          
          <div className="client-details">
            <div className="detail-row">
              <Briefcase size={14} />
              <span>{client.profession}</span>
            </div>
            <div className="detail-row">
              <MapPin size={14} />
              <span>{client.city}, {client.state}</span>
            </div>
            {client.years_experience && (
              <div className="detail-row">
                <Calendar size={14} />
                <span>{client.years_experience} de experiência</span>
              </div>
            )}
            {client.last_contact_at && (
              <div className="detail-row">
                <Activity size={14} />
                <span>Último contato: {new Date(client.last_contact_at).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
          </div>

          {client.specialization && (
            <div className="specialization-tag">
              {client.specialization}
            </div>
          )}
        </div>

        <div className="card-footer">
          <div className="quick-actions">
            {client.whatsapp && (
              <button className="quick-action whatsapp" onClick={handleWhatsApp}>
                <MessageCircle size={16} />
              </button>
            )}
            {client.phone && (
              <button className="quick-action call" onClick={handleCall}>
                <Phone size={16} />
              </button>
            )}
            {client.email && (
              <button className="quick-action email" onClick={handleEmail}>
                <Mail size={16} />
              </button>
            )}
            {client.website && (
              <button className="quick-action website" onClick={handleWebsite}>
                <ExternalLink size={16} />
              </button>
            )}
          </div>
          <button className="view-details">
            <Eye size={16} />
            <span>CRM</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    );
  };

  // Continue in next part due to length...
  
  if (loading) {
    return (
      <div className="loading-state">
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw size={32} />
        </motion.div>
        <p>Carregando CRM...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <div className="error-content">
          <h3>Erro ao carregar dados</h3>
          <p>{error}</p>
          <button onClick={fetchServices}>
            <RefreshCw size={16} />
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="prospeccao-ativa-container crm-mode">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <Grid3x3 size={28} className="brand-icon" />
          <span className="brand-text">JC Apps CRM</span>
        </div>
        {onBack && (
          <motion.button 
            className="back-button"
            onClick={onBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft size={20} />
            <span>Dashboard</span>
          </motion.button>
        )}
      </nav>

      <div className="dashboard-content">
        <motion.div 
          className="welcome-section"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="welcome-text">CRM Prospecção Ativa</h1>
          <p className="welcome-subtitle">Sistema completo de gestão de clientes e prospectos</p>
        </motion.div>

        {/* CRM Stats Bar */}
        <div className="crm-stats-bar">
          <div className="stat-card">
            <div className="stat-icon leads">
              <Target size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{filteredServices.filter(s => s.status === 'lead').length}</div>
              <div className="stat-label">Leads</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon prospects">
              <Users size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{filteredServices.filter(s => s.status === 'prospect').length}</div>
              <div className="stat-label">Prospectos</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon clients">
              <CheckCircle size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{filteredServices.filter(s => s.status === 'client').length}</div>
              <div className="stat-label">Clientes</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon high-priority">
              <AlertCircle size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{filteredServices.filter(s => ['high', 'urgent'].includes(s.priority || '')).length}</div>
              <div className="stat-label">Alta Prioridade</div>
            </div>
          </div>
        </div>

        <div className="search-and-filters">
          <div className="search-container">
            <div className="search-input-wrapper">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar por empresa, profissão, cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button className="clear-search" onClick={() => setSearchTerm('')}>
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="filter-controls">
            <button 
              className={`filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={18} />
              Filtros CRM
              <ChevronDown size={16} className={showFilters ? 'rotated' : ''} />
            </button>

            <div className="action-buttons">
              <button className="refresh-button" onClick={fetchServices}>
                <RefreshCw size={18} />
              </button>
              <button className="export-button" onClick={exportToCSV}>
                <Download size={18} />
                Exportar CRM
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Filter Panel with CRM Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="filter-panel crm-filters"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="filter-content">
                <div className="filter-row">
                  <div className="filter-section">
                    <h4>Status CRM</h4>
                    <div className="filter-chips">
                      {Object.entries(statusConfig).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <button
                            key={key}
                            className={`filter-chip status-chip ${filters.status.includes(key) ? 'active' : ''}`}
                            onClick={() => toggleArrayFilter('status', key)}
                            style={{ 
                              borderColor: filters.status.includes(key) ? config.color : undefined,
                              color: filters.status.includes(key) ? config.color : undefined
                            }}
                          >
                            <Icon size={14} />
                            {config.label}
                            {filters.status.includes(key) && <Check size={14} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="filter-section">
                    <h4>Prioridade</h4>
                    <div className="filter-chips">
                      {Object.entries(priorityConfig).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <button
                            key={key}
                            className={`filter-chip priority-chip ${filters.priority.includes(key) ? 'active' : ''}`}
                            onClick={() => toggleArrayFilter('priority', key)}
                            style={{ 
                              borderColor: filters.priority.includes(key) ? config.color : undefined,
                              color: filters.priority.includes(key) ? config.color : undefined
                            }}
                          >
                            <Icon size={14} />
                            {config.label}
                            {filters.priority.includes(key) && <Check size={14} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="filter-row">
                  <div className="filter-section">
                    <h4>Profissão</h4>
                    <div className="filter-chips">
                      {filterOptions.professions.slice(0, 8).map(profession => (
                        <button
                          key={profession}
                          className={`filter-chip ${filters.profession.includes(profession) ? 'active' : ''}`}
                          onClick={() => toggleArrayFilter('profession', profession)}
                        >
                          {profession}
                          {filters.profession.includes(profession) && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="filter-section">
                    <h4>Cidade</h4>
                    <div className="filter-chips">
                      {filterOptions.cities.slice(0, 6).map(city => (
                        <button
                          key={city}
                          className={`filter-chip ${filters.city.includes(city) ? 'active' : ''}`}
                          onClick={() => toggleArrayFilter('city', city)}
                        >
                          {city}
                          {filters.city.includes(city) && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="filter-section">
                  <h4>Métodos de Contato</h4>
                  <div className="contact-filters">
                    <button
                      className={`contact-filter ${filters.hasWhatsapp === true ? 'active' : ''}`}
                      onClick={() => setFilters(prev => ({ ...prev, hasWhatsapp: prev.hasWhatsapp === true ? null : true }))}
                    >
                      <MessageCircle size={16} />
                      Tem WhatsApp
                    </button>
                    <button
                      className={`contact-filter ${filters.hasEmail === true ? 'active' : ''}`}
                      onClick={() => setFilters(prev => ({ ...prev, hasEmail: prev.hasEmail === true ? null : true }))}
                    >
                      <Mail size={16} />
                      Tem Email
                    </button>
                    <button
                      className={`contact-filter ${filters.hasWebsite === true ? 'active' : ''}`}
                      onClick={() => setFilters(prev => ({ ...prev, hasWebsite: prev.hasWebsite === true ? null : true }))}
                    >
                      <Globe size={16} />
                      Tem Website
                    </button>
                  </div>
                </div>

                <div className="filter-actions">
                  <button className="clear-filters" onClick={clearFilters}>
                    <X size={16} />
                    Limpar Filtros
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="results-summary">
          <div className="results-info">
            <Users size={20} />
            <span>{filteredServices.length} cliente{filteredServices.length !== 1 ? 's' : ''} no CRM</span>
          </div>
          {(filters.profession.length > 0 || filters.city.length > 0 || filters.status.length > 0 || searchTerm) && (
            <button className="clear-all" onClick={clearFilters}>
              Limpar tudo
            </button>
          )}
        </div>

        <div className="clients-grid">
          <AnimatePresence>
            {filteredServices.length === 0 ? (
              <motion.div 
                className="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Users size={64} />
                <h3>Nenhum cliente encontrado</h3>
                <p>Tente ajustar os filtros ou termos de busca</p>
              </motion.div>
            ) : (
              filteredServices.map((client, index) => (
                <ClientCard key={client.id} client={client} index={index} />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Enhanced Client Detail Modal with CRM Features */}
      <AnimatePresence>
        {selectedClient && (
          <motion.div 
            className="client-detail-modal crm-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedClient(null)}
          >
            <motion.div 
              className="modal-content large-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="client-header-info">
                  <h2>{selectedClient.company_name}</h2>
                  <div className="client-meta-info">
                    <div 
                      className="status-badge large"
                      style={{ 
                        backgroundColor: `${statusConfig[selectedClient.status || 'prospect'].color}20`, 
                        color: statusConfig[selectedClient.status || 'prospect'].color,
                        borderColor: `${statusConfig[selectedClient.status || 'prospect'].color}40`
                      }}
                    >
                      {React.createElement(statusConfig[selectedClient.status || 'prospect'].icon, { size: 16 })}
                      {statusConfig[selectedClient.status || 'prospect'].label}
                    </div>
                    <div 
                      className="priority-badge"
                      style={{ color: priorityConfig[selectedClient.priority || 'medium'].color }}
                    >
                      {React.createElement(priorityConfig[selectedClient.priority || 'medium'].icon, { size: 14 })}
                      {priorityConfig[selectedClient.priority || 'medium'].label}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedClient(null)}>
                  <X size={24} />
                </button>
              </div>

              <div className="modal-body crm-body">
                <div className="crm-layout">
                  <div className="client-info-section">
                    <h3>Informações do Cliente</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Contato:</span>
                        <span>{selectedClient.contact_name}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Profissão:</span>
                        <span>{selectedClient.profession}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Especialização:</span>
                        <span>{selectedClient.specialization}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Localização:</span>
                        <span>{selectedClient.city}, {selectedClient.state}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Telefone:</span>
                        <span>{selectedClient.phone}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">WhatsApp:</span>
                        <span>{selectedClient.whatsapp}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Email:</span>
                        <span>{selectedClient.email}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Website:</span>
                        <span>{selectedClient.website}</span>
                      </div>
                    </div>
                  </div>

                  <div className="crm-actions-section">
                    <h3>Ações CRM</h3>
                    <div className="action-buttons-grid">
                      <button 
                        className="crm-action-btn add-note"
                        onClick={() => setShowAddInteraction(true)}
                      >
                        <MessageSquare size={18} />
                        Adicionar Observação
                      </button>
                      <button className="crm-action-btn schedule-call">
                        <PhoneCall size={18} />
                        Agendar Ligação
                      </button>
                      <button className="crm-action-btn send-email">
                        <Send size={18} />
                        Enviar Email
                      </button>
                      <button 
                        className="crm-action-btn add-task"
                        onClick={() => console.log('Task creation will be implemented')}
                      >
                        <CalendarPlus size={18} />
                        Criar Tarefa
                      </button>
                    </div>
                  </div>
                </div>

                {/* Interactions Timeline */}
                <div className="interactions-timeline">
                  <h3>Histórico de Interações</h3>
                  {clientInteractions.length === 0 ? (
                    <div className="empty-timeline">
                      <Activity size={32} />
                      <p>Nenhuma interação registrada</p>
                    </div>
                  ) : (
                    <div className="timeline-items">
                      {clientInteractions.map((interaction) => (
                        <div key={interaction.id} className="timeline-item">
                          <div className="timeline-marker"></div>
                          <div className="timeline-content">
                            <h4>{interaction.title}</h4>
                            <p>{interaction.description}</p>
                            {interaction.notes && (
                              <div className="interaction-notes">{interaction.notes}</div>
                            )}
                            <div className="timeline-meta">
                              <span className="interaction-type">{interaction.interaction_type}</span>
                              <span className="interaction-date">
                                {new Date(interaction.created_at).toLocaleString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Interaction Modal */}
      <AnimatePresence>
        {showAddInteraction && (
          <motion.div 
            className="add-interaction-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="interaction-form"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="form-header">
                <h3>Nova Observação</h3>
                <button onClick={() => setShowAddInteraction(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="form-content">
                <div className="form-group">
                  <label>Tipo de Interação</label>
                  <select
                    value={newInteraction.type}
                    onChange={(e) => setNewInteraction(prev => ({ 
                      ...prev, 
                      type: e.target.value as ClientInteraction['interaction_type'] 
                    }))}
                  >
                    <option value="note">Observação</option>
                    <option value="call">Ligação</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="meeting">Reunião</option>
                    <option value="proposal">Proposta</option>
                    <option value="follow_up">Follow-up</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Título *</label>
                  <input
                    type="text"
                    value={newInteraction.title}
                    onChange={(e) => setNewInteraction(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Primeira conversa telefônica"
                  />
                </div>
                <div className="form-group">
                  <label>Descrição</label>
                  <textarea
                    value={newInteraction.description}
                    onChange={(e) => setNewInteraction(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição da interação..."
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Observações</label>
                  <textarea
                    value={newInteraction.notes}
                    onChange={(e) => setNewInteraction(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Observações adicionais, próximos passos..."
                    rows={3}
                  />
                </div>
                <div className="form-actions">
                  <button 
                    className="cancel-btn"
                    onClick={() => setShowAddInteraction(false)}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="save-btn"
                    onClick={addInteraction}
                    disabled={!newInteraction.title.trim()}
                  >
                    <Plus size={16} />
                    Adicionar Observação
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

export default ProspeccaoAtivaCRM;