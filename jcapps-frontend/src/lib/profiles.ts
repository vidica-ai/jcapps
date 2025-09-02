import { supabase } from './supabase';

export interface Profile {
  id: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating profile:', error);
    return false;
  }
}

export async function createProfile(userId: string, fullName: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName
      });

    if (error) {
      console.error('Error creating profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating profile:', error);
    return false;
  }
}

export async function getCurrentUserProfile(): Promise<Profile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    return await getProfile(user.id);
  } catch (error) {
    console.error('Error getting current user profile:', error);
    return null;
  }
}

export async function updateCurrentUserProfile(updates: Partial<Profile>): Promise<Profile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    const success = await updateProfile(user.id, updates);
    if (!success) {
      return null;
    }

    return await getProfile(user.id);
  } catch (error) {
    console.error('Error updating current user profile:', error);
    return null;
  }
}