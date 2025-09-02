// TypeScript types for the profiles table
export interface Profile {
  id: string; // UUID that references auth.users.id
  full_name: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// Type for creating a new profile
export interface CreateProfile {
  id: string;
  full_name?: string | null;
}

// Type for updating a profile
export interface UpdateProfile {
  full_name?: string | null;
}