import { createClient } from '@/utils/supabase/server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

interface Organization {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

interface UserOrg {
  organization: Organization;
}

interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string | null;
  organization_id: number | null;
  created_at: string;
}

interface UserProject {
  project: Project;
}

export default async function ProfilePage() {
  const supabase = await createClient();
  
  // Get auth user data
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get public.users data with organization and project details
  const { data: publicUser, error } = await supabase
    .from('users')
    .select(`
      *,
      user_orgs:"user-org"(
        organization:organizations(
          id,
          name,
          description,
          created_at
        )
      ),
      user_projects:"user-project"(
        project:projects(
          id,
          name,
          description,
          status,
          organization_id,
          created_at
        )
      )
    `)
    .eq('id', user.id)
    .single();

  // Get the organizations and projects
  const organizations = publicUser?.user_orgs?.map((uo: UserOrg) => uo.organization) || [];
  const projects = publicUser?.user_projects?.map((up: UserProject) => up.project) || [];
  const userRole = publicUser?.role;

  return (
    <div className="container max-w-7xl py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      
      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        <div className="bg-background p-4 rounded-lg border border-primary/20 hover:bg-primary/5">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium text-primary">Name</div>
            <div className="text-sm break-words">{publicUser?.full_name || user.user_metadata.full_name}</div>
            
            <div className="text-sm font-medium text-primary">Email</div>
            <div className="text-sm break-all">{user.email}</div>
            
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
              <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Name</th>
              <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Email</th>
              <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Role</th>
              <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Last Sign In</th>
              <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Account Created</th>
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-primary/10">
            <tr className="hover:bg-primary/5">
              <td className="px-4 py-4 text-sm truncate">{publicUser?.full_name || user.user_metadata.full_name}</td>
              <td className="px-4 py-4 text-sm truncate">{user.email}</td>
              <td className="px-4 py-4 text-sm truncate">{publicUser?.role || 'Not specified'}</td>
              <td className="px-4 py-4 text-sm truncate">{new Date(user.last_sign_in_at || '').toLocaleString()}</td>
              <td className="px-4 py-4 text-sm truncate">{new Date(user.created_at).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Conditional Organizations/Projects Section */}
      <div className="mb-8 mt-8 md:mt-0">
        {userRole === 'Contractor' ? (
          // Projects Section for Contractors
          <>
            <h2 className="text-xl font-bold mb-4">My Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project: Project) => (
                <div key={project.id} className="bg-background p-6 rounded-lg border border-primary/20 hover:bg-primary/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{project.name}</h3>
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
                  )}
                  <div className="flex flex-col gap-2">
                    <div className="text-xs text-muted-foreground">
                      Status: <span className="font-medium">{project.status || 'Not specified'}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Added on {new Date(project.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  You are not assigned to any projects yet.
                </div>
              )}
            </div>
          </>
        ) : (
          // Original Organizations Section for non-Contractors
          <>
            <h2 className="text-xl font-bold mb-4">My Organizations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {organizations.map((org: Organization) => (
                <div key={org.id} className="bg-background p-6 rounded-lg border border-primary/20 hover:bg-primary/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{org.name}</h3>
                  </div>
                  {org.description && (
                    <p className="text-sm text-muted-foreground mb-4">{org.description}</p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Member since {new Date(org.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {organizations.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  You are not a member of any organizations yet.
                </div>
              )}
            </div>
          </>
        )}
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