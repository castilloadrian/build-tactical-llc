import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

export default async function AdminPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  // Get public.users data with organization details
  const { data: publicUser, error } = await supabase
    .from('users')
    .select(`
      *,
      organization:organization_id (*)
    `)
    .eq('id', user.id)
    .single();
  
  if (publicUser?.role !== 'Admin') {
    notFound();
  }

  // Get all users
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('full_name');

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="overflow-x-auto rounded-lg border border-primary/20">
        <table className="min-w-full divide-y divide-primary/10">
          <thead className="bg-primary/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Organization</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Role</th>
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-primary/10">
            {users?.map((user) => (
              <tr key={user.id} className="hover:bg-primary/5">
                <td className="px-6 py-4 whitespace-nowrap">{user.full_name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{publicUser?.organization?.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.role || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 