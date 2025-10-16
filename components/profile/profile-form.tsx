'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface ProfileFormProps {
  profile: {
    id: string;
    full_name: string;
    role: string;
    avatar_url: string | null;
  };
  userEmail: string;
}

export default function ProfileForm({ profile, userEmail }: ProfileFormProps) {
  const [fullName, setFullName] = useState(profile.full_name);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: fullName,
          avatar_url: avatarUrl || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-primary-700 mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={userEmail}
          disabled
          className="w-full px-4 py-2 border border-primary-200 rounded-lg bg-primary-50 text-primary-500 cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-primary-500">Email cannot be changed</p>
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-primary-700 mb-2">
          Role
        </label>
        <input
          type="text"
          id="role"
          value={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
          disabled
          className="w-full px-4 py-2 border border-primary-200 rounded-lg bg-primary-50 text-primary-500 cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-primary-500">
          {profile.role === 'admin' ? 'You have administrator privileges' : 'Contact an admin to change your role'}
        </p>
      </div>

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-primary-700 mb-2">
          Full Name *
        </label>
        <input
          type="text"
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label htmlFor="avatarUrl" className="block text-sm font-medium text-primary-700 mb-2">
          Avatar URL
        </label>
        <input
          type="url"
          id="avatarUrl"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://example.com/avatar.jpg"
          className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="mt-1 text-xs text-primary-500">Optional: Add a URL to your profile picture</p>
      </div>

      {avatarUrl && (
        <div>
          <p className="block text-sm font-medium text-primary-700 mb-2">Avatar Preview</p>
          <img
            src={avatarUrl}
            alt="Avatar preview"
            className="w-20 h-20 rounded-full object-cover border-2 border-primary-200"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
