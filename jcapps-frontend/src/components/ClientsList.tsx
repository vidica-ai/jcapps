import React, { useState } from 'react';
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
  Users
} from 'lucide-react';
import { useProfessionalServices } from '../hooks/useProfessionalServices';
import ClientCard from './ClientCard';
import ClientFilters from './ClientFilters';
import type { ViewMode, SortOption } from '../types/professional-services';
import './ClientsList.css';

interface ClientsListProps {
  onBack?: () => void;
}

const ClientsList: React.FC<ClientsListProps> = ({ onBack }) => {
  const {
    filteredServices,
    loading,
    error,
    totalCount,
    filters,
    sortOption,
    filterOptions,
    updateFilters,
    updateSort,
    refreshData,
    exportData
  } = useProfessionalServices();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const sortOptions: Array<{ field: string, label: string }> = [
    { field: 'company_name', label: 'Nome da Empresa' },
    { field: 'contact_name', label: 'Nome do Contato' },
    { field: 'rating', label: 'Avaliação' },
    { field: 'years_experience', label: 'Experiência' },
    { field: 'city', label: 'Cidade' },
    { field: 'created_at', label: 'Data de Cadastro' }
  ];

  const handleSortChange = (field: string) => {
    const direction = sortOption.field === field && sortOption.direction === 'asc' ? 'desc' : 'asc';
    updateSort({ field, direction });
  };

  const handleClearFilters = () => {
    updateFilters({
      search: '',
      professions: [],
      cities: [],
      ratings: [],
      tags: []
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const LoadingSpinner = () => (
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

  const ErrorState = () => (
    <div className="error-container">
      <AlertCircle size={48} className="error-icon" />
      <h3>Ops! Algo deu errado</h3>
      <p>{error}</p>
      <button className="retry-btn" onClick={refreshData}>
        <RefreshCw size={16} />
        Tentar novamente
      </button>
    </div>
  );

  const EmptyState = () => (
    <div className="empty-container">
      <Users size={64} className="empty-icon" />
      <h3>Nenhum cliente encontrado</h3>
      <p>Tente ajustar os filtros ou adicione novos clientes ao sistema.</p>
      {(filters.search || filters.professions.length > 0 || filters.cities.length > 0 || 
        filters.ratings.length > 0 || filters.tags.length > 0) && (
        <button className="clear-filters-btn" onClick={handleClearFilters}>
          Limpar filtros
        </button>
      )}
    </div>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorState />;
  }

  return (
    <div className="clients-list-container">
      <div className="clients-header">
        <div className="header-top">
          {onBack && (
            <button className="back-btn" onClick={onBack}>
              <ChevronLeft size={20} />
              Voltar
            </button>
          )}
          <div className="header-title">
            <h1>Prospecção Ativa</h1>
            <p>Gerencie sua base de prospectos e clientes potenciais</p>
          </div>
        </div>

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
              value={sortOption.field}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              {sortOptions.map(option => (
                <option key={option.field} value={option.field}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              className="sort-direction"
              onClick={() => handleSortChange(sortOption.field)}
              title={`Ordenar ${sortOption.direction === 'asc' ? 'decrescente' : 'crescente'}`}
            >
              {sortOption.direction === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
            </button>
          </div>

          <div className="action-controls">
            <button
              className="refresh-btn"
              onClick={refreshData}
              title="Atualizar dados"
            >
              <RefreshCw size={18} />
            </button>
            <div className="export-controls">
              <button
                className="export-btn"
                onClick={() => exportData('csv')}
                title="Exportar CSV"
              >
                <Download size={18} />
                CSV
              </button>
              <button
                className="export-btn"
                onClick={() => exportData('pdf')}
                title="Exportar PDF"
              >
                <Download size={18} />
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <ClientFilters
        filters={filters}
        filterOptions={filterOptions}
        onFiltersChange={updateFilters}
        onClearFilters={handleClearFilters}
        totalResults={filteredServices.length}
        loading={loading}
      />

      <div className="clients-content">
        {filteredServices.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            className={`clients-grid ${viewMode}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {filteredServices.map((client, index) => (
                <motion.div
                  key={client.id}
                  variants={itemVariants}
                  layout
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ delay: index * 0.05 }}
                >
                  <ClientCard
                    client={client}
                    viewMode={viewMode}
                    onClick={() => setSelectedClient(
                      selectedClient === client.id ? null : client.id
                    )}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {filteredServices.length > 0 && (
        <div className="clients-footer">
          <div className="footer-stats">
            <span>
              Mostrando {filteredServices.length} de {totalCount} clientes
            </span>
            <span className="separator">•</span>
            <span>
              Última atualização: {new Date().toLocaleTimeString('pt-BR')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsList;