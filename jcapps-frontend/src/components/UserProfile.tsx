import React, { useState, useEffect } from 'react';
import { Profile, getCurrentUserProfile, updateCurrentUserProfile } from '../lib/profiles';

const UserProfile: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const userProfile = await getCurrentUserProfile();
      setProfile(userProfile);
      setFullName(userProfile?.full_name || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUpdating(true);
      setError(null);
      const updatedProfile = await updateCurrentUserProfile({ full_name: fullName });
      setProfile(updatedProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (error) {
    return (
      <div style={{ color: 'red' }}>
        <p>Error: {error}</p>
        <button onClick={loadProfile}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h2>User Profile</h2>
      
      {profile && (
        <div>
          <p><strong>User ID:</strong> {profile.id}</p>
          <p><strong>Created:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
          <p><strong>Last Updated:</strong> {new Date(profile.updated_at).toLocaleDateString()}</p>
        </div>
      )}

      <form onSubmit={handleUpdateProfile}>
        <div>
          <label htmlFor="fullName">Full Name:</label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            disabled={updating}
          />
        </div>
        
        <button type="submit" disabled={updating}>
          {updating ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
};

export default UserProfile;