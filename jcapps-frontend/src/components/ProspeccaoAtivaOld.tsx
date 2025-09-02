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
  Building
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ProfessionalService } from '../types/professional-services';
import './ProspeccaoAtiva.css';

interface ProspeccaoAtivaProps {
  onBack?: () => void;
}

interface FilterState {
  profession: string[];
  city: string[];
  state: string[];
  yearsExperience: { min: number; max: number };
  hasWhatsapp: boolean | null;
  hasEmail: boolean | null;
  hasWebsite: boolean | null;
}

const ProspeccaoAtiva: React.FC<ProspeccaoAtivaProps> = ({ onBack }) => {
  const [services, setServices] = useState<ProfessionalService[]>([]);
  const [filteredServices, setFilteredServices] = useState<ProfessionalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ProfessionalService | null>(null);
  
  // Advanced filter state
  const [filters, setFilters] = useState<FilterState>({
    profession: [],
    city: [],
    state: [],
    yearsExperience: { min: 0, max: 50 },
    hasWhatsapp: null,
    hasEmail: null,
    hasWebsite: null
  });

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const professions = services.map(s => s.profession).filter(Boolean) as string[];
    const cities = services.map(s => s.city).filter(Boolean) as string[];
    const states = services.map(s => s.state).filter(Boolean) as string[];
    
    return {
      professions: Array.from(new Set(professions)).sort(),
      cities: Array.from(new Set(cities)).sort(),
      states: Array.from(new Set(states)).sort()
    };
  }, [services]);

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

      setServices(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setError(errorMessage);
      console.error('Error fetching professional services:', err);
    } finally {
      setLoading(false);
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

    // Years experience filter
    filtered = filtered.filter(service => {
      if (!service.years_experience) return true;
      const years = parseInt(service.years_experience.replace(/\D/g, '')) || 0;
      return years >= filters.yearsExperience.min && years <= filters.yearsExperience.max;
    });

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

  const clearFilters = () => {
    setFilters({
      profession: [],
      city: [],
      state: [],
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
      ['Empresa', 'Contato', 'Profissão', 'Cidade', 'Estado', 'Telefone', 'WhatsApp', 'Email', 'Website'].join(','),
      ...filteredServices.map(service => [
        `"${service.company_name || ''}"`,
        `"${service.contact_name || ''}"`,
        `"${service.profession || ''}"`,
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
    link.download = `prospeccao-ativa-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const ClientCard: React.FC<{ client: ProfessionalService; index: number }> = ({ client, index }) => {
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

    return (
      <motion.div
        className="modern-client-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => setSelectedClient(client)}
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="card-header">
          <div className="client-avatar">
            <Building size={20} />
          </div>
          <div className="card-actions">
            <div className="contact-badges">
              {client.whatsapp && <div className="badge whatsapp"><MessageCircle size={12} /></div>}
              {client.phone && <div className="badge phone"><Phone size={12} /></div>}
              {client.email && <div className="badge email"><Mail size={12} /></div>}
              {client.website && <div className="badge website"><Globe size={12} /></div>}
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
            <span>Detalhes</span>
          </button>
        </div>
      </motion.div>
    );
  };

  const FilterPanel: React.FC = () => (
    <motion.div
      className="filter-panel"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: showFilters ? 1 : 0, height: showFilters ? 'auto' : 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="filter-content">
        <div className="filter-section">
          <h4>Profissão</h4>
          <div className="filter-chips">
            {filterOptions.professions.map(profession => (
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
            {filterOptions.cities.slice(0, 10).map(city => (
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
  );

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
        <p>Carregando prospectos...</p>
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
    <div className="prospeccao-ativa-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <Grid3x3 size={28} className="brand-icon" />
          <span className="brand-text">JC Apps</span>
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
          <h1 className="welcome-text">Prospecção Ativa</h1>
          <p className="welcome-subtitle">Sua base inteligente de prospectos profissionais</p>
        </motion.div>

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
              Filtros
              <ChevronDown size={16} className={showFilters ? 'rotated' : ''} />
            </button>

            <div className="action-buttons">
              <button className="refresh-button" onClick={fetchServices}>
                <RefreshCw size={18} />
              </button>
              <button className="export-button" onClick={exportToCSV}>
                <Download size={18} />
                Exportar
              </button>
            </div>
          </div>
        </div>

        <FilterPanel />

        <div className="results-summary">
          <div className="results-info">
            <Users size={20} />
            <span>{filteredServices.length} prospect{filteredServices.length !== 1 ? 's' : ''} encontrado{filteredServices.length !== 1 ? 's' : ''}</span>
          </div>
          {(filters.profession.length > 0 || filters.city.length > 0 || searchTerm) && (
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
                <h3>Nenhum prospect encontrado</h3>
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

      {/* Client Detail Modal */}
      <AnimatePresence>
        {selectedClient && (
          <motion.div 
            className="client-detail-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedClient(null)}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>{selectedClient.company_name}</h2>
                <button onClick={() => setSelectedClient(null)}>
                  <X size={24} />
                </button>
              </div>
              <div className="modal-body">
                {/* Detailed client information */}
                <div className="client-full-details">
                  <div className="detail-section">
                    <h4>Informações Básicas</h4>
                    <p><strong>Contato:</strong> {selectedClient.contact_name}</p>
                    <p><strong>Profissão:</strong> {selectedClient.profession}</p>
                    <p><strong>Especialização:</strong> {selectedClient.specialization}</p>
                    <p><strong>Localização:</strong> {selectedClient.city}, {selectedClient.state}</p>
                    <p><strong>Experiência:</strong> {selectedClient.years_experience}</p>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Contato</h4>
                    <p><strong>Telefone:</strong> {selectedClient.phone}</p>
                    <p><strong>WhatsApp:</strong> {selectedClient.whatsapp}</p>
                    <p><strong>Email:</strong> {selectedClient.email}</p>
                    <p><strong>Website:</strong> {selectedClient.website}</p>
                  </div>
                  
                  {selectedClient.services && (
                    <div className="detail-section">
                      <h4>Serviços</h4>
                      <p>{selectedClient.services}</p>
                    </div>
                  )}
                  
                  {selectedClient.notes && (
                    <div className="detail-section">
                      <h4>Observações</h4>
                      <p>{selectedClient.notes}</p>
                    </div>
                  )}
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

export default ProspeccaoAtiva;