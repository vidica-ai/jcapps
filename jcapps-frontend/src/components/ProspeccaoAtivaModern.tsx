import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Briefcase,
  ExternalLink,
  RefreshCw,
  Users,
  X,
  Building2,
  ArrowUpDown,
  ArrowRight,
  Filter,
  SlidersHorizontal,
  Grid3x3,
  ChevronLeft,
  Download,
  Star,
  Heart,
  Eye,
  MoreVertical,
  Target,
  Zap,
  Activity,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ProfessionalService } from '../types/professional-services';
import ClientDetail from './ClientDetail';
import './ProspeccaoAtivaModern.css';

interface ProspeccaoAtivaModernProps {
  onBack?: () => void;
}

interface FilterState {
  search: string;
  contactMethod: 'all' | 'whatsapp' | 'email' | 'phone' | 'website';
  profession: string;
  city: string;
  sortBy: 'name' | 'city' | 'profession' | 'created';
  sortOrder: 'asc' | 'desc';
}

const ProspeccaoAtivaModern: React.FC<ProspeccaoAtivaModernProps> = ({ onBack }) => {
  const [services, setServices] = useState<ProfessionalService[]>([]);
  const [filteredServices, setFilteredServices] = useState<ProfessionalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<ProfessionalService | null>(null);
  const [filterSheetOpened, setFilterSheetOpened] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [uniqueProfessions, setUniqueProfessions] = useState<string[]>([]);
  const [uniqueCities, setUniqueCities] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    contactMethod: 'all',
    profession: '',
    city: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

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

      const serviceData = data || [];
      setServices(serviceData);
      
      // Extract unique values for filters
      const professions = Array.from(new Set(serviceData.map(s => s.profession).filter(Boolean)));
      const cities = Array.from(new Set(serviceData.map(s => s.city).filter(Boolean)));
      setUniqueProfessions(professions);
      setUniqueCities(cities);
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

  // Advanced filtering and search
  const applyFilters = useCallback(() => {
    let filtered = [...services];

    // Search filter - enhanced to include multiple fields
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(service =>
        service.company_name?.toLowerCase().includes(search) ||
        service.contact_name?.toLowerCase().includes(search) ||
        service.profession?.toLowerCase().includes(search) ||
        service.city?.toLowerCase().includes(search) ||
        service.specialization?.toLowerCase().includes(search) ||
        service.email?.toLowerCase().includes(search)
      );
    }

    // Contact method filter
    if (filters.contactMethod !== 'all') {
      filtered = filtered.filter(service => {
        switch (filters.contactMethod) {
          case 'whatsapp':
            return service.whatsapp;
          case 'email':
            return service.email;
          case 'phone':
            return service.phone;
          case 'website':
            return service.website;
          default:
            return true;
        }
      });
    }

    // Profession filter
    if (filters.profession) {
      filtered = filtered.filter(service => 
        service.profession?.toLowerCase().includes(filters.profession.toLowerCase())
      );
    }

    // City filter
    if (filters.city) {
      filtered = filtered.filter(service => 
        service.city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    // Advanced sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = (a.company_name || '').localeCompare(b.company_name || '');
          break;
        case 'city':
          comparison = (a.city || '').localeCompare(b.city || '');
          break;
        case 'profession':
          comparison = (a.profession || '').localeCompare(b.profession || '');
          break;
        case 'created':
          comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
          break;
        default:
          return 0;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredServices(filtered);
  }, [services, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      contactMethod: 'all',
      profession: '',
      city: '',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.contactMethod !== 'all') count++;
    if (filters.profession) count++;
    if (filters.city) count++;
    return count;
  };

  const formatWhatsApp = (whatsapp: string) => {
    if (!whatsapp) return '';
    const digits = whatsapp.replace(/\D/g, '');
    return digits.startsWith('55') ? digits : `55${digits}`;
  };

  const handleWhatsApp = (e: React.MouseEvent, client: ProfessionalService) => {
    e.stopPropagation();
    if (client.whatsapp) {
      const formattedNumber = formatWhatsApp(client.whatsapp);
      window.open(`https://wa.me/${formattedNumber}`, '_blank');
    }
  };

  const handleCall = (e: React.MouseEvent, client: ProfessionalService) => {
    e.stopPropagation();
    if (client.phone) {
      window.open(`tel:${client.phone}`, '_self');
    }
  };

  const handleEmail = (e: React.MouseEvent, client: ProfessionalService) => {
    e.stopPropagation();
    if (client.email) {
      window.open(`mailto:${client.email}`, '_self');
    }
  };

  const handleWebsite = (e: React.MouseEvent, client: ProfessionalService) => {
    e.stopPropagation();
    if (client.website) {
      const url = client.website.startsWith('http') 
        ? client.website 
        : `https://${client.website}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (selectedClient) {
    return (
      <ClientDetail 
        client={selectedClient} 
        onBack={() => setSelectedClient(null)} 
      />
    );
  }

  const ClientCard: React.FC<{ client: ProfessionalService; index: number }> = ({ client, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.05,
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      className="modern-client-card"
      onClick={() => setSelectedClient(client)}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="card-glow"></div>
      
      <div className="card-header">
        <div className="client-avatar">
          <Building2 size={24} />
          <div className="avatar-glow"></div>
        </div>
        <div className="card-actions">
          <motion.button 
            className="action-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MoreVertical size={16} />
          </motion.button>
        </div>
      </div>

      <div className="card-content">
        <div className="client-info">
          <h3 className="client-name">{client.company_name}</h3>
          {client.contact_name && <p className="contact-name">{client.contact_name}</p>}
        </div>
        
        <div className="client-details">
          {client.profession && (
            <div className="detail-item">
              <Briefcase size={14} />
              <span>{client.profession}</span>
            </div>
          )}
          <div className="detail-item">
            <MapPin size={14} />
            <span>{client.city}, {client.state}</span>
          </div>
        </div>

        {client.specialization && (
          <div className="specialization-tag">
            <Star size={12} />
            <span>{client.specialization}</span>
          </div>
        )}

        <div className="contact-methods">
          {client.whatsapp && (
            <motion.button 
              className="contact-btn whatsapp"
              onClick={(e) => handleWhatsApp(e, client)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <MessageCircle size={14} />
            </motion.button>
          )}
          {client.phone && (
            <motion.button 
              className="contact-btn phone"
              onClick={(e) => handleCall(e, client)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Phone size={14} />
            </motion.button>
          )}
          {client.email && (
            <motion.button 
              className="contact-btn email"
              onClick={(e) => handleEmail(e, client)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Mail size={14} />
            </motion.button>
          )}
          {client.website && (
            <motion.button 
              className="contact-btn website"
              onClick={(e) => handleWebsite(e, client)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ExternalLink size={14} />
            </motion.button>
          )}
        </div>

        <div className="card-footer">
          <motion.button 
            className="view-crm-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Eye size={14} />
            <span>Ver CRM</span>
            <ArrowRight size={12} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  const StatsCard: React.FC<{ icon: React.ReactNode; value: number; label: string; color: string }> = ({
    icon, value, label, color
  }) => (
    <motion.div 
      className="stats-card"
      whileHover={{ scale: 1.05, y: -2 }}
    >
      <div className="stats-icon" style={{ color }}>
        {icon}
        <div className="icon-glow" style={{ backgroundColor: `${color}20` }}></div>
      </div>
      <div className="stats-info">
        <div className="stats-number">{value}</div>
        <div className="stats-label">{label}</div>
      </div>
    </motion.div>
  );

  return (
    <div className="modern-prospeccao-container">
      {/* Modern Header */}
      <motion.header 
        className="modern-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="header-content">
          <div className="header-left">
            {onBack && (
              <motion.button
                onClick={onBack}
                className="back-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft size={20} />
                <span>Dashboard</span>
              </motion.button>
            )}
            <div className="page-title">
              <h1>Prospecção Ativa</h1>
              <p>Sistema moderno de gestão de prospects</p>
            </div>
          </div>
          <div className="header-actions">
            <motion.button
              onClick={fetchServices}
              className="action-btn secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw size={18} />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Modern Stats Section */}
      <motion.section 
        className="stats-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="stats-grid">
          <StatsCard 
            icon={<Target size={24} />}
            value={filteredServices.length}
            label="Total Prospects"
            color="#d4af37"
          />
          <StatsCard 
            icon={<MessageCircle size={24} />}
            value={filteredServices.filter(s => s.whatsapp).length}
            label="Com WhatsApp"
            color="#22c55e"
          />
          <StatsCard 
            icon={<Mail size={24} />}
            value={filteredServices.filter(s => s.email).length}
            label="Com Email"
            color="#a855f7"
          />
          <StatsCard 
            icon={<ExternalLink size={24} />}
            value={filteredServices.filter(s => s.website).length}
            label="Com Website"
            color="#3b82f6"
          />
        </div>
      </motion.section>

      {/* Modern Search and Controls */}
      <motion.section 
        className="search-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Buscar por empresa, profissão, cidade..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="search-input"
            />
            {filters.search && (
              <motion.button 
                className="clear-search"
                onClick={() => updateFilter('search', '')}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={18} />
              </motion.button>
            )}
          </div>
          
          <div className="search-controls">
            <div className="view-toggle">
              <motion.button
                className={`toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Grid3x3 size={16} />
                Cards
              </motion.button>
              <motion.button
                className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowUpDown size={16} />
                Lista
              </motion.button>
            </div>

            <motion.button 
              className="filter-btn"
              onClick={() => setFilterSheetOpened(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <SlidersHorizontal size={16} />
              Filtros
              {getActiveFilterCount() > 0 && (
                <div className="filter-badge">{getActiveFilterCount()}</div>
              )}
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* Results Section */}
      <main className="results-section">
        {/* Loading State */}
        {loading && (
          <motion.div 
            className="loading-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="loading-spinner"
            >
              <RefreshCw size={40} />
            </motion.div>
            <p>Carregando prospects...</p>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div 
            className="error-state"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <X size={48} />
            <h3>Erro ao carregar dados</h3>
            <p>{error}</p>
            <motion.button 
              onClick={fetchServices}
              className="retry-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw size={16} />
              Tentar Novamente
            </motion.button>
          </motion.div>
        )}

        {/* Results */}
        {!loading && !error && (
          <>
            <div className="results-header">
              <div className="results-count">
                <Users size={20} />
                <span>
                  {filteredServices.length} prospect{filteredServices.length !== 1 ? 's' : ''}
                  {filters.search && ` encontrado${filteredServices.length !== 1 ? 's' : ''} para "${filters.search}"`}
                </span>
              </div>
              {getActiveFilterCount() > 0 && (
                <motion.button
                  onClick={clearFilters}
                  className="clear-filters-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Limpar filtros
                </motion.button>
              )}
            </div>

            {filteredServices.length === 0 ? (
              <motion.div 
                className="empty-state"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Users size={80} />
                <h3>Nenhum prospect encontrado</h3>
                <p>Tente ajustar os filtros ou termos de busca</p>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                {viewMode === 'cards' ? (
                  <motion.div 
                    className="prospects-grid"
                    key="cards"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {filteredServices.map((client, index) => (
                      <ClientCard key={client.id} client={client} index={index} />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    className="prospects-list"
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {filteredServices.map((client, index) => (
                      <motion.div
                        key={client.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="list-item"
                        onClick={() => setSelectedClient(client)}
                        whileHover={{ x: 5, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="list-avatar">
                          <Building2 size={20} />
                        </div>
                        <div className="list-content">
                          <h4>{client.company_name}</h4>
                          <div className="list-details">
                            {client.contact_name && <span>{client.contact_name}</span>}
                            {client.profession && <span>• {client.profession}</span>}
                            <span>• {client.city}, {client.state}</span>
                          </div>
                        </div>
                        <div className="list-contacts">
                          {client.whatsapp && <MessageCircle size={14} />}
                          {client.email && <Mail size={14} />}
                          {client.phone && <Phone size={14} />}
                          <ArrowRight size={16} />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </>
        )}
      </main>

      {/* Filter Sheet */}
      <AnimatePresence>
        {filterSheetOpened && (
          <motion.div 
            className="filter-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFilterSheetOpened(false)}
          >
            <motion.div 
              className="filter-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sheet-header">
                <h3>Filtros Avançados</h3>
                <motion.button 
                  onClick={() => setFilterSheetOpened(false)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div className="sheet-content">
                <div className="filter-group">
                  <label>Método de Contato</label>
                  <select
                    value={filters.contactMethod}
                    onChange={(e) => updateFilter('contactMethod', e.target.value)}
                  >
                    <option value="all">Todos</option>
                    <option value="whatsapp">Com WhatsApp</option>
                    <option value="email">Com Email</option>
                    <option value="phone">Com Telefone</option>
                    <option value="website">Com Website</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Profissão</label>
                  <select
                    value={filters.profession}
                    onChange={(e) => updateFilter('profession', e.target.value)}
                  >
                    <option value="">Todas</option>
                    {uniqueProfessions.map(profession => (
                      <option key={profession} value={profession}>{profession}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Cidade</label>
                  <select
                    value={filters.city}
                    onChange={(e) => updateFilter('city', e.target.value)}
                  >
                    <option value="">Todas</option>
                    {uniqueCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Ordenar por</label>
                  <select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-');
                      updateFilter('sortBy', sortBy);
                      updateFilter('sortOrder', sortOrder);
                    }}
                  >
                    <option value="name-asc">Nome (A-Z)</option>
                    <option value="name-desc">Nome (Z-A)</option>
                    <option value="city-asc">Cidade (A-Z)</option>
                    <option value="city-desc">Cidade (Z-A)</option>
                    <option value="profession-asc">Profissão (A-Z)</option>
                    <option value="profession-desc">Profissão (Z-A)</option>
                    <option value="created-desc">Mais recentes</option>
                    <option value="created-asc">Mais antigos</option>
                  </select>
                </div>
              </div>

              <div className="sheet-actions">
                <motion.button 
                  onClick={clearFilters}
                  className="clear-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Limpar
                </motion.button>
                <motion.button 
                  onClick={() => setFilterSheetOpened(false)}
                  className="apply-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Aplicar
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button 
        className="fab"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Download size={20} />
      </motion.button>
    </div>
  );
};

export default ProspeccaoAtivaModern;