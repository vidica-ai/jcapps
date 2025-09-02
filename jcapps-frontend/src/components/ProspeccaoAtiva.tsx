import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid3x3,
  ChevronLeft,
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
  Calendar,
  TrendingUp,
  CheckSquare,
  Square
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ProfessionalService } from '../types/professional-services';
import ClientDetail from './ClientDetail';
import './Dashboard.css';

interface ProspeccaoAtivaProps {
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

const ProspeccaoAtiva: React.FC<ProspeccaoAtivaProps> = ({ onBack }) => {
  const [services, setServices] = useState<ProfessionalService[]>([]);
  const [filteredServices, setFilteredServices] = useState<ProfessionalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<ProfessionalService | null>(null);
  const [filterPopupOpen, setFilterPopupOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-2 rounded-full mx-auto mb-6"
              style={{ 
                borderColor: 'rgba(212, 175, 55, 0.3)',
                borderTopColor: '#d4af37'
              }}
            />
            <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Carregando prospects...</p>
          </div>
        </div>
        <div className="dashboard-background">
          <div className="grid-pattern"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                 style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
              <X className="w-8 h-8" style={{ color: '#ef4444' }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Erro ao carregar dados</h3>
            <p className="mb-6" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{error}</p>
            <motion.button 
              onClick={fetchServices}
              className="logout-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw size={16} />
              <span>Tentar Novamente</span>
            </motion.button>
          </div>
        </div>
        <div className="dashboard-background">
          <div className="grid-pattern"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <nav className="dashboard-nav">
        <div className="nav-brand">
          {onBack && (
            <motion.button
              onClick={onBack}
              className="logout-button mr-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft size={20} />
              <span>Dashboard</span>
            </motion.button>
          )}
          <Grid3x3 size={28} className="brand-icon" />
          <span className="brand-text">Prospecção Ativa</span>
        </div>
        <motion.button
          onClick={fetchServices}
          className="logout-button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RefreshCw size={20} />
          <span>Atualizar</span>
        </motion.button>
      </nav>

      <div className="dashboard-content">
        <motion.div 
          className="welcome-section"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="welcome-text">Seus Prospects</h1>
          <p className="welcome-subtitle">Gerencie e conecte-se com seus clientes potenciais</p>
        </motion.div>

        {/* Enhanced Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Enhanced Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" style={{ color: '#d4af37' }} />
              <input
                type="text"
                placeholder="Buscar por empresa, profissão, cidade, especialização..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-transparent border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none transition-colors backdrop-blur-sm"
                style={{
                  background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.8), rgba(26, 26, 26, 0.8))',
                  backdropFilter: 'blur(10px)'
                }}
              />
              {filters.search && (
                <button
                  onClick={() => updateFilter('search', '')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  style={{ color: 'rgba(212, 175, 55, 0.8)' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Quick Filters and Controls */}
            <div className="flex gap-3">
              <select
                value={filters.contactMethod}
                onChange={(e) => updateFilter('contactMethod', e.target.value)}
                className="px-4 py-4 bg-transparent border border-gray-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none transition-colors backdrop-blur-sm"
                style={{
                  background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.8), rgba(26, 26, 26, 0.8))',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <option value="all" className="bg-gray-800">Todos</option>
                <option value="whatsapp" className="bg-gray-800">Com WhatsApp</option>
                <option value="email" className="bg-gray-800">Com Email</option>
                <option value="phone" className="bg-gray-800">Com Telefone</option>
                <option value="website" className="bg-gray-800">Com Website</option>
              </select>

              <motion.button
                onClick={() => setFilterPopupOpen(true)}
                className="logout-button relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SlidersHorizontal size={16} />
                <span>Filtros</span>
                {getActiveFilterCount() > 0 && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {getActiveFilterCount()}
                  </div>
                )}
              </motion.button>

              <motion.button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="logout-button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {viewMode === 'grid' ? <Grid3x3 size={16} /> : <ArrowUpDown size={16} />}
                <span>{viewMode === 'grid' ? 'Grid' : 'Lista'}</span>
              </motion.button>
            </div>
          </div>

          {/* Results count and sorting */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              <Users size={16} className="mr-2" style={{ color: '#d4af37' }} />
              {filteredServices.length} prospect{filteredServices.length !== 1 ? 's' : ''}
              {filters.search && ` encontrado${filteredServices.length !== 1 ? 's' : ''} para "${filters.search}"`}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Ordenar:</span>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  updateFilter('sortBy', sortBy);
                  updateFilter('sortOrder', sortOrder);
                }}
                className="px-3 py-2 bg-transparent border border-gray-700 rounded-lg text-white text-sm focus:border-yellow-500 focus:outline-none transition-colors"
                style={{
                  background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.8), rgba(26, 26, 26, 0.8))'
                }}
              >
                <option value="name-asc" className="bg-gray-800">Nome (A-Z)</option>
                <option value="name-desc" className="bg-gray-800">Nome (Z-A)</option>
                <option value="city-asc" className="bg-gray-800">Cidade (A-Z)</option>
                <option value="city-desc" className="bg-gray-800">Cidade (Z-A)</option>
                <option value="profession-asc" className="bg-gray-800">Profissão (A-Z)</option>
                <option value="profession-desc" className="bg-gray-800">Profissão (Z-A)</option>
                <option value="created-desc" className="bg-gray-800">Mais recentes</option>
                <option value="created-asc" className="bg-gray-800">Mais antigos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Display */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" 
                 style={{ background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.05))' }}>
              <Users size={32} style={{ color: '#d4af37' }} />
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Nenhum prospect encontrado</h3>
            <p className="mb-6" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              {filters.search ? 'Tente ajustar os filtros ou termos de busca' : 'Nenhum prospect disponível'}
            </p>
            {getActiveFilterCount() > 0 && (
              <motion.button
                onClick={clearFilters}
                className="logout-button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Limpar filtros
              </motion.button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="apps-grid">
            <AnimatePresence>
              {filteredServices.map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="app-card active"
                  onClick={() => setSelectedClient(client)}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="app-header">
                    <div className="app-icon" style={{ background: 'linear-gradient(135deg, #d4af37, #f4e4bc)' }}>
                      <Building2 size={24} />
                    </div>
                    <div className="app-status">
                      <Users size={12} />
                      <span>Prospect</span>
                    </div>
                  </div>

                  <h3 className="app-name">{client.company_name}</h3>
                  {client.contact_name && (
                    <p className="app-description">{client.contact_name}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    {client.profession && (
                      <div className="flex items-center text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        <Briefcase size={14} className="mr-2 flex-shrink-0" style={{ color: '#d4af37' }} />
                        <span className="truncate">{client.profession}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      <MapPin size={14} className="mr-2 flex-shrink-0" style={{ color: '#d4af37' }} />
                      <span className="truncate">{client.city}, {client.state}</span>
                    </div>
                  </div>

                  {/* Contact Methods */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex space-x-2">
                      {client.whatsapp && (
                        <motion.button
                          onClick={(e) => handleWhatsApp(e, client)}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                          style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="WhatsApp"
                        >
                          <MessageCircle size={14} />
                        </motion.button>
                      )}
                      {client.phone && (
                        <motion.button
                          onClick={(e) => handleCall(e, client)}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                          style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Telefone"
                        >
                          <Phone size={14} />
                        </motion.button>
                      )}
                      {client.email && (
                        <motion.button
                          onClick={(e) => handleEmail(e, client)}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                          style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Email"
                        >
                          <Mail size={14} />
                        </motion.button>
                      )}
                      {client.website && (
                        <motion.button
                          onClick={(e) => handleWebsite(e, client)}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                          style={{ background: 'rgba(212, 175, 55, 0.2)', color: '#d4af37' }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Website"
                        >
                          <ExternalLink size={14} />
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* Specialization Tag */}
                  {client.specialization && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(212, 175, 55, 0.1)' }}>
                      <span className="inline-block px-3 py-1 rounded-full text-xs truncate max-w-full"
                            style={{ 
                              background: 'rgba(212, 175, 55, 0.1)', 
                              color: 'rgba(212, 175, 55, 0.8)',
                              border: '1px solid rgba(212, 175, 55, 0.2)'
                            }}>
                        {client.specialization}
                      </span>
                    </div>
                  )}

                  <div className="app-footer">
                    <div className="app-action">
                      <span>Ver CRM</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>

                  <div className="app-glow"></div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          // List View
          <div className="space-y-3">
            <AnimatePresence>
              {filteredServices.map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="app-card active p-4 cursor-pointer"
                  onClick={() => setSelectedClient(client)}
                  whileHover={{ scale: 1.01, x: 5 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '20px' }}
                >
                  <div className="app-icon flex-shrink-0" style={{ background: 'linear-gradient(135deg, #d4af37, #f4e4bc)', width: '40px', height: '40px' }}>
                    <Building2 size={20} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-lg mb-1">{client.company_name}</h3>
                    <div className="flex items-center gap-4 text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      {client.contact_name && <span>{client.contact_name}</span>}
                      {client.profession && (
                        <>
                          <span>•</span>
                          <span>{client.profession}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{client.city}, {client.state}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {client.whatsapp && (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(34, 197, 94, 0.2)' }}>
                        <MessageCircle size={12} style={{ color: '#22c55e' }} />
                      </div>
                    )}
                    {client.email && (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(168, 85, 247, 0.2)' }}>
                        <Mail size={12} style={{ color: '#a855f7' }} />
                      </div>
                    )}
                    {client.phone && (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                        <Phone size={12} style={{ color: '#3b82f6' }} />
                      </div>
                    )}
                    {client.website && (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
                        <ExternalLink size={12} style={{ color: '#d4af37' }} />
                      </div>
                    )}
                    <ArrowRight size={16} style={{ color: '#d4af37', marginLeft: '10px' }} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Advanced Filter Popup */}
      <AnimatePresence>
        {filterPopupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setFilterPopupOpen(false)}
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
                  <h3 className="text-lg font-semibold" style={{ color: '#d4af37' }}>Filtros Avançados</h3>
                  <button
                    onClick={() => setFilterPopupOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Profession Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      Profissão
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {uniqueProfessions.map(profession => (
                        <label key={profession} className="flex items-center cursor-pointer">
                          <button
                            onClick={() => updateFilter('profession', filters.profession === profession ? '' : profession)}
                            className="mr-3 transition-colors"
                          >
                            {filters.profession === profession ? (
                              <CheckSquare size={16} style={{ color: '#d4af37' }} />
                            ) : (
                              <Square size={16} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                            )}
                          </button>
                          <span 
                            className="text-sm"
                            style={{ color: filters.profession === profession ? '#d4af37' : 'rgba(255, 255, 255, 0.7)' }}
                          >
                            {profession}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* City Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      Cidade
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {uniqueCities.map(city => (
                        <label key={city} className="flex items-center cursor-pointer">
                          <button
                            onClick={() => updateFilter('city', filters.city === city ? '' : city)}
                            className="mr-3 transition-colors"
                          >
                            {filters.city === city ? (
                              <CheckSquare size={16} style={{ color: '#d4af37' }} />
                            ) : (
                              <Square size={16} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                            )}
                          </button>
                          <span 
                            className="text-sm"
                            style={{ color: filters.city === city ? '#d4af37' : 'rgba(255, 255, 255, 0.7)' }}
                          >
                            {city}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8 pt-6 border-t" style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}>
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 rounded-lg transition-colors"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    Limpar
                  </button>
                  <button
                    onClick={() => setFilterPopupOpen(false)}
                    className="px-4 py-2 rounded-lg transition-colors"
                    style={{ 
                      background: 'linear-gradient(135deg, #d4af37, #f4e4bc)',
                      color: '#000',
                      fontWeight: '500'
                    }}
                  >
                    Aplicar
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

export default ProspeccaoAtiva;