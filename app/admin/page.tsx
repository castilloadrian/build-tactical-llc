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
    
  // Get all projects with organization details
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      description,
      status,
      organization_id,
      created_at,
      organization:organization_id (
        name
      )
    `)
    .order('name');
    
  // Get all organizations
  const { data: organizations } = await supabase
    .from('organizations')
    .select('*')
    .order('name');

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* User Management Section */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">User Management</h2>
        
        {/* Mobile card view */}
        <div className="md:hidden space-y-4">
          {users?.map((user) => (
            <div key={user.id} className="bg-background p-4 rounded-lg border border-primary/20 hover:bg-primary/5">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium text-primary">Name</div>
                <div className="text-sm break-words">{user.full_name || 'N/A'}</div>
                
                <div className="text-sm font-medium text-primary">Email</div>
                <div className="text-sm break-all">{user.email || 'N/A'}</div>
                
                <div className="text-sm font-medium text-primary">Organization</div>
                <div className="text-sm break-words">{publicUser?.organization?.name || 'N/A'}</div>
                
                <div className="text-sm font-medium text-primary">Role</div>
                <div className="text-sm break-words">{user.role || 'N/A'}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-primary/20">
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
      </section>
      
      {/* Organization Management Section */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">Organization Management</h2>
        
        {/* Mobile card view */}
        <div className="md:hidden space-y-4">
          {organizations?.map((org) => (
            <div key={org.id} className="bg-background p-4 rounded-lg border border-primary/20 hover:bg-primary/5">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium text-primary">Name</div>
                <div className="text-sm break-words">{org.name || 'N/A'}</div>
                
                <div className="text-sm font-medium text-primary">Description</div>
                <div className="text-sm break-words">{org.description || 'N/A'}</div>
                
                <div className="text-sm font-medium text-primary">Created</div>
                <div className="text-sm break-words">
                  {org.created_at ? new Date(org.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-primary/20">
          <table className="min-w-full divide-y divide-primary/10">
            <thead className="bg-primary/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-primary/10">
              {organizations?.map((org) => (
                <tr key={org.id} className="hover:bg-primary/5">
                  <td className="px-6 py-4 whitespace-nowrap">{org.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{org.description || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {org.created_at ? new Date(org.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      
      {/* Project Management Section */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">Project Management</h2>
        
        {/* Mobile card view */}
        <div className="md:hidden space-y-4">
          {projects?.map((project) => (
            <div key={project.id} className="bg-background p-4 rounded-lg border border-primary/20 hover:bg-primary/5">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium text-primary">Name</div>
                <div className="text-sm break-words">{project.name || 'N/A'}</div>
                
                <div className="text-sm font-medium text-primary">Description</div>
                <div className="text-sm break-words">{project.description || 'N/A'}</div>
                
                <div className="text-sm font-medium text-primary">Organization</div>
                <div className="text-sm break-words">
                  {(project.organization as any)?.name || 'N/A'}
                </div>
                
                <div className="text-sm font-medium text-primary">Status</div>
                <div className="text-sm break-words">{project.status || 'N/A'}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-primary/20">
          <table className="min-w-full divide-y divide-primary/10">
            <thead className="bg-primary/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-primary/10">
              {projects?.map((project) => (
                <tr key={project.id} className="hover:bg-primary/5">
                  <td className="px-6 py-4 whitespace-nowrap">{project.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{project.description || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(project.organization as any)?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{project.status || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
} 