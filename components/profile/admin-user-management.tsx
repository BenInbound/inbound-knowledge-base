'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Shield, User } from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface AdminUserManagementProps {
  users: UserProfile[];
  currentUserId: string;
}

export default function AdminUserManagement({ users: initialUsers, currentUserId }: AdminUserManagementProps) {
  const [users, setUsers] = useState(initialUsers);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'member') => {
    setLoadingUserId(userId);

    try {
      const response = await fetch('/api/admin/users/role', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          role: newRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user role');
      }

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      toast.success(
        `User ${newRole === 'admin' ? 'promoted to admin' : 'changed to member'} successfully`
      );
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user role');
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-primary-700">Name</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-primary-700">Role</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-primary-700">Member Since</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-primary-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId;
              const isAdmin = user.role === 'admin';
              const isLoading = loadingUserId === user.id;

              return (
                <tr key={user.id} className="border-b border-primary-100 hover:bg-primary-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-primary-900">
                        {user.full_name}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-primary-500">(You)</span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {isAdmin ? (
                        <Shield className="h-4 w-4 text-accent-500" />
                      ) : (
                        <User className="h-4 w-4 text-primary-400" />
                      )}
                      <span className="text-sm text-primary-700 capitalize">{user.role}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-primary-600">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {!isCurrentUser && (
                      <div className="flex justify-end gap-2">
                        {isAdmin ? (
                          <button
                            onClick={() => handleRoleChange(user.id, 'member')}
                            disabled={isLoading}
                            className="px-3 py-1.5 text-sm border border-primary-300 text-primary-700 rounded hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? 'Updating...' : 'Remove Admin'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRoleChange(user.id, 'admin')}
                            disabled={isLoading}
                            className="px-3 py-1.5 text-sm bg-accent-500 text-white rounded hover:bg-accent-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? 'Updating...' : 'Make Admin'}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-8 text-primary-500">
          No users found
        </div>
      )}
    </div>
  );
}
