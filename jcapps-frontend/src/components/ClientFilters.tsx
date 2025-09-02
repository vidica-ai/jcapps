import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import type { ClientFilters, FilterOption } from '../types/professional-services';
import './ClientFilters.css';

interface ClientFiltersProps {
  filters: ClientFilters;
  filterOptions: {
    professions: FilterOption[];
    cities: FilterOption[];
    ratings: FilterOption[];
    tags: FilterOption[];
  };
  onFiltersChange: (filters: Partial<ClientFilters>) => void;
  onClearFilters: () => void;
  totalResults: number;
  loading?: boolean;
}

const ClientFilters: React.FC<ClientFiltersProps> = ({
  filters,
  filterOptions,
  onFiltersChange,
  onClearFilters,
  totalResults,
  loading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    professions: false,
    cities: false,
    ratings: false,
    tags: false
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ search: e.target.value });
  };

  const handleFilterToggle = (
    filterType: keyof Omit<ClientFilters, 'search'>,
    value: string
  ) => {
    const currentValues = filters[filterType];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFiltersChange({ [filterType]: newValues });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getActiveFiltersCount = () => {
    return (
      filters.professions.length +
      filters.cities.length +
      filters.ratings.length +
      filters.tags.length +
      (filters.search ? 1 : 0)
    );
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  const FilterSection: React.FC<{
    title: string;
    filterKey: keyof Omit<ClientFilters, 'search'>;
    options: FilterOption[];
    maxVisible?: number;
  }> = ({ title, filterKey, options, maxVisible = 5 }) => {
    const isExpanded = expandedSections[filterKey];
    const visibleOptions = isExpanded ? options : options.slice(0, maxVisible);
    const hasMore = options.length > maxVisible;

    return (
      <div className="filter-section">
        <h4 className="filter-title">{title}</h4>
        <div className="filter-options">
          {visibleOptions.map(option => (
            <motion.label
              key={option.value}
              className="filter-option"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <input
                type="checkbox"
                checked={filters[filterKey].includes(option.value)}
                onChange={() => handleFilterToggle(filterKey, option.value)}
              />
              <span className="checkmark"></span>
              <span className="option-label">{option.label}</span>
              {option.count && (
                <span className="option-count">({option.count})</span>
              )}
            </motion.label>
          ))}
        </div>
        {hasMore && (
          <button
            className="show-more-btn"
            onClick={() => toggleSection(filterKey)}
          >
            {isExpanded ? (
              <>
                <ChevronUp size={16} />
                Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                Ver mais ({options.length - maxVisible})
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="client-filters">
      <div className="filters-header">
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por empresa, contato, profissão ou cidade..."
              value={filters.search}
              onChange={handleSearchChange}
              className="search-input"
            />
            {filters.search && (
              <button
                className="clear-search"
                onClick={() => onFiltersChange({ search: '' })}
                title="Limpar busca"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="filters-controls">
          <button
            className={`filter-toggle ${isExpanded ? 'active' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Filter size={18} />
            <span>Filtros</span>
            {hasActiveFilters && (
              <span className="active-count">{getActiveFiltersCount()}</span>
            )}
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {hasActiveFilters && (
            <motion.button
              className="clear-filters"
              onClick={onClearFilters}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw size={16} />
              <span>Limpar</span>
            </motion.button>
          )}
        </div>
      </div>

      <div className="results-summary">
        <span className="results-count">
          {loading ? 'Carregando...' : `${totalResults} resultado${totalResults !== 1 ? 's' : ''} encontrado${totalResults !== 1 ? 's' : ''}`}
        </span>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="filters-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="filters-grid">
              <FilterSection
                title="Profissões"
                filterKey="professions"
                options={filterOptions.professions}
                maxVisible={5}
              />
              
              <FilterSection
                title="Cidades"
                filterKey="cities"
                options={filterOptions.cities}
                maxVisible={5}
              />
              
              <FilterSection
                title="Avaliações"
                filterKey="ratings"
                options={filterOptions.ratings}
                maxVisible={5}
              />
              
              <FilterSection
                title="Serviços"
                filterKey="tags"
                options={filterOptions.tags}
                maxVisible={8}
              />
            </div>

            {hasActiveFilters && (
              <div className="active-filters">
                <h4 className="active-filters-title">Filtros ativos:</h4>
                <div className="active-filters-list">
                  {filters.search && (
                    <motion.span
                      className="active-filter"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      Busca: "{filters.search}"
                      <button
                        onClick={() => onFiltersChange({ search: '' })}
                        className="remove-filter"
                      >
                        <X size={14} />
                      </button>
                    </motion.span>
                  )}

                  {filters.professions.map(profession => (
                    <motion.span
                      key={`profession-${profession}`}
                      className="active-filter"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      {profession}
                      <button
                        onClick={() => handleFilterToggle('professions', profession)}
                        className="remove-filter"
                      >
                        <X size={14} />
                      </button>
                    </motion.span>
                  ))}

                  {filters.cities.map(city => (
                    <motion.span
                      key={`city-${city}`}
                      className="active-filter"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      {city}
                      <button
                        onClick={() => handleFilterToggle('cities', city)}
                        className="remove-filter"
                      >
                        <X size={14} />
                      </button>
                    </motion.span>
                  ))}

                  {filters.ratings.map(rating => (
                    <motion.span
                      key={`rating-${rating}`}
                      className="active-filter"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      {rating} estrelas
                      <button
                        onClick={() => handleFilterToggle('ratings', rating)}
                        className="remove-filter"
                      >
                        <X size={14} />
                      </button>
                    </motion.span>
                  ))}

                  {filters.tags.map(tag => (
                    <motion.span
                      key={`tag-${tag}`}
                      className="active-filter"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      {tag}
                      <button
                        onClick={() => handleFilterToggle('tags', tag)}
                        className="remove-filter"
                      >
                        <X size={14} />
                      </button>
                    </motion.span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientFilters;