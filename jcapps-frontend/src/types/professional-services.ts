export interface ProfessionalService {
  id: string; // UUID
  company_name: string;
  contact_name: string | null;
  profession: string | null;
  specialization: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  social_media?: string | null;
  rating: string | null;
  years_experience: string | null;
  services: string | null;
  notes: string | null;
  is_active: boolean;
  tags: string[];
  metadata: any;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientFilters {
  search: string;
  professions: string[];
  cities: string[];
  ratings: string[];
  tags: string[];
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

export type ViewMode = 'grid' | 'list';

export interface ExportFormat {
  type: 'csv' | 'pdf';
  data: ProfessionalService[];
}

// Helper types for filtering
export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface QuickAction {
  type: 'whatsapp' | 'call' | 'email';
  label: string;
  icon: string;
  value: string;
}