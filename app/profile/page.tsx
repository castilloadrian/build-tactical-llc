import { createClient } from '@/utils/supabase/server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function ProfilePage() {
  const supabase = await createClient();
  
  // Get auth user data
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get public.users data with organization details
  const { data: publicUser, error } = await supabase
    .from('users')
    .select(`
      *,
      organization:organization_id (*)
    `)
    .eq('id', user.id)
    .single();

  return (
    <div className="container max-w-7xl py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      
      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        <div className="bg-background p-4 rounded-lg border border-primary/20 hover:bg-primary/5">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium text-primary">Name</div>
            <div className="text-sm break-words">{publicUser?.full_name || user.user_metadata.full_name}</div>
            
            <div className="text-sm font-medium text-primary">Email</div>
            <div className="text-sm break-all">{user.email}</div>
            
            <div className="text-sm font-medium text-primary">Organization</div>
            <div className="text-sm break-words">{publicUser?.organization?.name || 'Not specified'}</div>
            
            <div className="text-sm font-medium text-primary">Role</div>
            <div className="text-sm break-words">{publicUser?.role || 'Not specified'}</div>
            
            <div className="text-sm font-medium text-primary">Last Sign In</div>
            <div className="text-sm break-words">{new Date(user.last_sign_in_at || '').toLocaleString()}</div>
            
            <div className="text-sm font-medium text-primary">Account Created</div>
            <div className="text-sm break-words">{new Date(user.created_at).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-primary/20 mb-8">
        <table className="min-w-full table-fixed divide-y divide-primary/10">
          <thead className="bg-primary/5">
            <tr>
              <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Name</th>
              <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Email</th>
              <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Organization</th>
              <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Role</th>
              <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Last Sign In</th>
              <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Account Created</th>
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-primary/10">
            <tr className="hover:bg-primary/5">
              <td className="px-4 py-4 text-sm truncate">{publicUser?.full_name || user.user_metadata.full_name}</td>
              <td className="px-4 py-4 text-sm truncate">{user.email}</td>
              <td className="px-4 py-4 text-sm truncate">{publicUser?.organization?.name || 'Not specified'}</td>
              <td className="px-4 py-4 text-sm truncate">{publicUser?.role || 'Not specified'}</td>
              <td className="px-4 py-4 text-sm truncate">{new Date(user.last_sign_in_at || '').toLocaleString()}</td>
              <td className="px-4 py-4 text-sm truncate">{new Date(user.created_at).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="space-y-4">
        <Link href="/reset-password">
          <Button
            variant="outline"
            className="w-full"
          >
            Reset Password
          </Button>
        </Link>
      </div>
    </div>
  );
} 