import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileForm from '@/components/profile/profile-form';
import AdminUserManagement from '@/components/profile/admin-user-management';

export const metadata = {
  title: 'Profile | Inbound Knowledge Base',
  description: 'Manage your profile settings',
};

async function getProfile() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
    return null;
  }

  return {
    user,
    profile,
  };
}

async function getAllUsers() {
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .order('full_name');

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return profiles;
}

export default async function ProfilePage() {
  const data = await getProfile();

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading profile. Please try again.</p>
        </div>
      </div>
    );
  }

  const { user, profile } = data;
  const isAdmin = profile.role === 'admin';

  // Only fetch all users if current user is admin
  const allUsers = isAdmin ? await getAllUsers() : [];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary-900 mb-2">Profile Settings</h1>
        <p className="text-primary-600">Manage your account information</p>
      </div>

      <div className="bg-white rounded-lg border border-primary-200 p-6">
        <h2 className="text-xl font-semibold text-primary-900 mb-4">Personal Information</h2>
        <ProfileForm
          profile={profile}
          userEmail={user.email || ''}
        />
      </div>

      {isAdmin && (
        <div className="bg-white rounded-lg border border-primary-200 p-6">
          <h2 className="text-xl font-semibold text-primary-900 mb-4">User Management</h2>
          <p className="text-sm text-primary-600 mb-4">
            As an admin, you can promote users to admin status or demote them to regular members.
          </p>
          <AdminUserManagement users={allUsers} currentUserId={user.id} />
        </div>
      )}
    </div>
  );
}
