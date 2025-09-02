import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { 
  ProfessionalService, 
  ClientFilters, 
  SortOption, 
  FilterOption 
} from '../types/professional-services';

interface UseProfessionalServicesReturn {
  services: ProfessionalService[];
  filteredServices: ProfessionalService[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  filters: ClientFilters;
  sortOption: SortOption;
  filterOptions: {
    professions: FilterOption[];
    cities: FilterOption[];
    ratings: FilterOption[];
    tags: FilterOption[];
  };
  updateFilters: (filters: Partial<ClientFilters>) => void;
  updateSort: (sort: SortOption) => void;
  refreshData: () => Promise<void>;
  exportData: (format: 'csv' | 'pdf') => void;
}

export const useProfessionalServices = (): UseProfessionalServicesReturn => {
  const [services, setServices] = useState<ProfessionalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<ClientFilters>({
    search: '',
    professions: [],
    cities: [],
    ratings: [],
    tags: []
  });
  
  const [sortOption, setSortOption] = useState<SortOption>({
    field: 'company_name',
    direction: 'asc'
  });

  // Fetch data from Supabase
  const fetchServices = useCallback(async () => {
    try {
      console.log('🔄 Starting to fetch clients data...');
      setLoading(true);
      setError(null);
      
      console.log('📡 Making Supabase query to clients table...');
      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 Query result:', { data: data?.length, error: fetchError });

      if (fetchError) {
        console.error('❌ Supabase error:', fetchError);
        throw fetchError;
      }

      console.log('✅ Successfully fetched', data?.length || 0, 'clients');
      setServices(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching data';
      console.error('❌ Final error in fetchServices:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Generate filter options from data
  const filterOptions = useMemo(() => {
    const professionCounts = new Map<string, number>();
    const cityCounts = new Map<string, number>();
    const ratingCounts = new Map<string, number>();
    const tagCounts = new Map<string, number>();

    services.forEach(service => {
      // Count professions
      if (service.profession) {
        professionCounts.set(
          service.profession, 
          (professionCounts.get(service.profession) || 0) + 1
        );
      }

      // Count cities
      if (service.city) {
        cityCounts.set(
          service.city, 
          (cityCounts.get(service.city) || 0) + 1
        );
      }

      // Count ratings
      if (service.rating) {
        ratingCounts.set(
          service.rating, 
          (ratingCounts.get(service.rating) || 0) + 1
        );
      }

      // Count tags (assuming services field contains comma-separated tags)
      if (service.services) {
        const serviceTags = service.services.split(',').map(tag => tag.trim());
        serviceTags.forEach(tag => {
          if (tag) {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          }
        });
      }
    });

    return {
      professions: Array.from(professionCounts.entries())
        .map(([value, count]) => ({ value, label: value, count }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      
      cities: Array.from(cityCounts.entries())
        .map(([value, count]) => ({ value, label: value, count }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      
      ratings: Array.from(ratingCounts.entries())
        .map(([value, count]) => ({ value, label: `${value} estrelas`, count }))
        .sort((a, b) => parseFloat(b.value) - parseFloat(a.value)),
      
      tags: Array.from(tagCounts.entries())
        .map(([value, count]) => ({ value, label: value, count }))
        .sort((a, b) => b.count! - a.count!)
        .slice(0, 20) // Limit to top 20 tags
    };
  }, [services]);

  // Filter and sort services
  const filteredServices = useMemo(() => {
    let filtered = [...services];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(service =>
        service.company_name?.toLowerCase().includes(searchTerm) ||
        service.contact_name?.toLowerCase().includes(searchTerm) ||
        service.profession?.toLowerCase().includes(searchTerm) ||
        service.city?.toLowerCase().includes(searchTerm) ||
        service.specialization?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply profession filter
    if (filters.professions.length > 0) {
      filtered = filtered.filter(service =>
        service.profession && filters.professions.includes(service.profession)
      );
    }

    // Apply city filter
    if (filters.cities.length > 0) {
      filtered = filtered.filter(service =>
        service.city && filters.cities.includes(service.city)
      );
    }

    // Apply rating filter
    if (filters.ratings.length > 0) {
      filtered = filtered.filter(service =>
        service.rating && filters.ratings.includes(service.rating)
      );
    }

    // Apply tag filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(service => {
        if (!service.services) return false;
        const serviceTags = service.services.split(',').map(tag => tag.trim());
        return filters.tags.some(tag => serviceTags.includes(tag));
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = (a as any)[sortOption.field];
      const bValue = (b as any)[sortOption.field];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortOption.direction === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [services, filters, sortOption]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<ClientFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Update sort
  const updateSort = useCallback((newSort: SortOption) => {
    setSortOption(newSort);
  }, []);

  // Export functionality
  const exportData = useCallback((format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const csvContent = [
        // Header
        [
          'Empresa',
          'Contato',
          'Profissão',
          'Especialização',
          'Cidade',
          'Estado',
          'Telefone',
          'WhatsApp',
          'Email',
          'Website',
          'Avaliação',
          'Anos de Experiência',
          'Serviços'
        ].join(','),
        // Data rows
        ...filteredServices.map(service => [
          `"${service.company_name || ''}"`,
          `"${service.contact_name || ''}"`,
          `"${service.profession || ''}"`,
          `"${service.specialization || ''}"`,
          `"${service.city || ''}"`,
          `"${service.state || ''}"`,
          `"${service.phone || ''}"`,
          `"${service.whatsapp || ''}"`,
          `"${service.email || ''}"`,
          `"${service.website || ''}"`,
          `"${service.rating || ''}"`,
          `"${service.years_experience || ''}"`,
          `"${service.services || ''}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `prospeccao-ativa-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } else if (format === 'pdf') {
      // For PDF export, you would typically use a library like jsPDF
      // For now, we'll just alert the user that this feature is coming
      alert('Exportação em PDF será implementada em breve!');
    }
  }, [filteredServices]);

  return {
    services,
    filteredServices,
    loading,
    error,
    totalCount: services.length,
    filters,
    sortOption,
    filterOptions,
    updateFilters,
    updateSort,
    refreshData: fetchServices,
    exportData
  };
};