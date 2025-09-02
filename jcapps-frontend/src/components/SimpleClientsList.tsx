import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid3x3,
  List,
  SortAsc,
  SortDesc,
  Download,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  Users,
  Search,
  Phone,
  MessageCircle,
  Mail,
  Globe,
  MapPin,
  Star,
  Calendar,
  Briefcase,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ProfessionalService } from '../types/professional-services';
import './ClientsList.css';

interface SimpleClientsListProps {
  onBack?: () => void;
}

const SimpleClientsList: React.FC<SimpleClientsListProps> = ({ onBack }) => {
  const [services, setServices] = useState<ProfessionalService[]>([]);
  const [filteredServices, setFilteredServices] = useState<ProfessionalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortField, setSortField] = useState('company_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching data';
      setError(errorMessage);
      console.error('Error fetching professional services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    let filtered = [...services];

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(service =>
        service.company_name?.toLowerCase().includes(search) ||
        service.contact_name?.toLowerCase().includes(search) ||
        service.profession?.toLowerCase().includes(search) ||
        service.city?.toLowerCase().includes(search) ||
        service.specialization?.toLowerCase().includes(search)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = (a as any)[sortField] || '';
      const bValue = (b as any)[sortField] || '';
      
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredServices(filtered);
  }, [services, searchTerm, sortField, sortDirection]);

  const handleSortChange = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Empresa', 'Contato', 'Profissão', 'Cidade', 'Estado', 'Telefone', 'Email'].join(','),
      ...filteredServices.map(service => [
        `"${service.company_name || ''}"`,
        `"${service.contact_name || ''}"`,
        `"${service.profession || ''}"`,
        `"${service.city || ''}"`,
        `"${service.state || ''}"`,
        `"${service.phone || ''}"`,
        `"${service.email || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `prospeccao-ativa-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const ClientCard: React.FC<{ client: ProfessionalService; viewMode: 'grid' | 'list' }> = ({ client, viewMode }) => {
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

    const renderStars = (rating: string | null) => {
      const numRating = rating ? parseFloat(rating) : 0;
      const stars = [];
      for (let i = 1; i <= 5; i++) {
        stars.push(
          <Star 
            key={i} 
            size={14} 
            className={`star ${i <= numRating ? 'filled' : 'empty'}`}
            fill={i <= numRating ? 'currentColor' : 'none'}
          />
        );
      }
      return stars;
    };

    if (viewMode === 'list') {
      return (
        <motion.div
          className="client-card list-view"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2, boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)' }}
        >
          <div className="client-header">
            <div className="client-info">
              <h3 className="client-name">{client.company_name}</h3>
              <p className="contact-name">{client.contact_name}</p>
            </div>
            <div className="client-rating">
              <div className="stars">{renderStars(client.rating)}</div>
              <span className="rating-text">{client.rating}</span>
            </div>
          </div>

          <div className="client-details">
            <div className="detail-item">
              <Briefcase size={16} />
              <span>{client.profession}</span>
            </div>
            <div className="detail-item">
              <MapPin size={16} />
              <span>{client.city}, {client.state}</span>
            </div>
            <div className="detail-item">
              <Calendar size={16} />
              <span>{client.years_experience} anos</span>
            </div>
          </div>

          <div className="client-actions">
            {client.whatsapp && (
              <button className="action-btn whatsapp" onClick={handleWhatsApp} title="WhatsApp">
                <MessageCircle size={18} />
              </button>
            )}
            {client.phone && (
              <button className="action-btn call" onClick={handleCall} title="Ligar">
                <Phone size={18} />
              </button>
            )}
            {client.email && (
              <button className="action-btn email" onClick={handleEmail} title="Email">
                <Mail size={18} />
              </button>
            )}
            {client.website && (
              <button className="action-btn website" onClick={handleWebsite} title="Website">
                <Globe size={18} />
              </button>
            )}
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        className="client-card grid-view"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' }}
      >
        <div className="card-header">
          <div className="client-avatar">
            <span className="avatar-text">
              {client.company_name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="client-rating">
            <div className="stars">{renderStars(client.rating)}</div>
            <span className="rating-text">{client.rating}</span>
          </div>
        </div>

        <div className="card-content">
          <h3 className="client-name">{client.company_name}</h3>
          <p className="contact-name">{client.contact_name}</p>
          
          <div className="client-meta">
            <div className="meta-item">
              <Briefcase size={14} />
              <span className="profession">{client.profession}</span>
            </div>
            {client.specialization && (
              <div className="meta-item">
                <span className="specialization">{client.specialization}</span>
              </div>
            )}
            <div className="meta-item">
              <MapPin size={14} />
              <span className="location">{client.city}, {client.state}</span>
            </div>
            <div className="meta-item">
              <Calendar size={14} />
              <span className="experience">{client.years_experience} anos</span>
            </div>
          </div>

          {client.services && (
            <div className="services-tags">
              {client.services.split(',').slice(0, 3).map((service, index) => (
                <span key={index} className="service-tag">
                  {service.trim()}
                </span>
              ))}
              {client.services.split(',').length > 3 && (
                <span className="service-tag more">
                  +{client.services.split(',').length - 3}
                </span>
              )}
            </div>
          )}

          {client.notes && (
            <p className="client-notes">
              {client.notes.slice(0, 100)}{client.notes.length > 100 ? '...' : ''}
            </p>
          )}
        </div>

        <div className="card-actions">
          {client.whatsapp && (
            <button className="action-btn whatsapp" onClick={handleWhatsApp} title="WhatsApp">
              <MessageCircle size={18} />
              <span>WhatsApp</span>
            </button>
          )}
          {client.phone && (
            <button className="action-btn call" onClick={handleCall} title="Ligar">
              <Phone size={18} />
            </button>
          )}
          {client.email && (
            <button className="action-btn email" onClick={handleEmail} title="Email">
              <Mail size={18} />
            </button>
          )}
          {client.website && (
            <button className="action-btn website" onClick={handleWebsite} title="Website">
              <ExternalLink size={16} />
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw size={24} />
        </motion.div>
        <p>Carregando dados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertCircle size={48} className="error-icon" />
        <h3>Ops! Algo deu errado</h3>
        <p>{error}</p>
        <button className="retry-btn" onClick={fetchServices}>
          <RefreshCw size={16} />
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="clients-list-container">
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
            <span>Voltar ao Dashboard</span>
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
          <p className="welcome-subtitle">Gerencie sua base de prospectos e clientes potenciais</p>
        </motion.div>

        <div className="clients-header">
          <div className="header-actions">
            <div className="view-controls">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Visualização em grade"
              >
                <Grid3x3 size={18} />
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Visualização em lista"
              >
                <List size={18} />
              </button>
            </div>

            <div className="sort-controls">
              <select
                className="sort-select"
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
              >
                <option value="company_name">Nome da Empresa</option>
                <option value="contact_name">Nome do Contato</option>
                <option value="profession">Profissão</option>
                <option value="city">Cidade</option>
                <option value="rating">Avaliação</option>
                <option value="years_experience">Experiência</option>
              </select>
              <button
                className="sort-direction"
                onClick={() => handleSortChange(sortField)}
                title={`Ordenar ${sortDirection === 'asc' ? 'decrescente' : 'crescente'}`}
              >
                {sortDirection === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
              </button>
            </div>

            <div className="action-controls">
              <button className="refresh-btn" onClick={fetchServices} title="Atualizar dados">
                <RefreshCw size={18} />
              </button>
              <button className="export-btn" onClick={exportToCSV} title="Exportar CSV">
                <Download size={18} />
                CSV
              </button>
            </div>
          </div>
        </div>

        <div className="client-filters">
          <div className="search-container">
            <div className="search-input-wrapper">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar por empresa, contato, profissão ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          <div className="results-summary">
            <span className="results-count">
              {filteredServices.length} resultado{filteredServices.length !== 1 ? 's' : ''} encontrado{filteredServices.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="clients-content">
          {filteredServices.length === 0 ? (
            <div className="empty-container">
              <Users size={64} className="empty-icon" />
              <h3>Nenhum cliente encontrado</h3>
              <p>Tente ajustar os filtros ou adicione novos clientes ao sistema.</p>
              {searchTerm && (
                <button className="clear-filters-btn" onClick={() => setSearchTerm('')}>
                  Limpar busca
                </button>
              )}
            </div>
          ) : (
            <div className={`clients-grid ${viewMode}`}>
              <AnimatePresence>
                {filteredServices.map((client) => (
                  <ClientCard key={client.id} client={client} viewMode={viewMode} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {filteredServices.length > 0 && (
          <div className="clients-footer">
            <div className="footer-stats">
              <span>
                Mostrando {filteredServices.length} de {services.length} clientes
              </span>
              <span className="separator">•</span>
              <span>
                Última atualização: {new Date().toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-background">
        <div className="grid-pattern"></div>
      </div>
    </div>
  );
};

export default SimpleClientsList;