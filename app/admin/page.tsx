'use client';

import { createClient } from '@/utils/supabase/client';
import { Button } from "@/components/ui/button";
import { CreateOrganizationModal } from '@/components/create-organization-modal';
import { CreateProjectModal } from '@/components/create-project-modal';
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';

interface UserData {
  id: string;
  full_name: string;
  email: string;
  role: string;
  organization_id: string;
  organization?: {
    id: string;
    name: string;
    description: string;
  };
}

interface Organization {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  organization_id: string;
  created_at: string;
  organization?: {
    name: string;
  };
}

export default function AdminPage() {
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [publicUser, setPublicUser] = useState<UserData | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = '/sign-in';
        return;
      }
      
      setUser(user);

      // Get public.users data with organization details
      const { data: publicUserData, error } = await supabase
        .from('users')
        .select(`
          *,
          organization:organization_id (*)
        `)
        .eq('id', user.id)
        .single();
      
      if (publicUserData?.role !== 'Admin') {
        window.location.href = '/404';
        return;
      }
      
      setPublicUser(publicUserData as UserData);

      // Get all users
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('full_name');
      
      setUsers(usersData as UserData[] || []);
        
      // Get all projects with organization details
      const { data: projectsData } = await supabase
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
      
      if (projectsData) {
        const typedProjects: Project[] = projectsData.map((project: any) => ({
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          organization_id: project.organization_id,
          created_at: project.created_at,
          organization: project.organization ? { name: project.organization.name } : undefined
        }));
        setProjects(typedProjects);
      }
        
      // Get all organizations
      const { data: orgsData } = await supabase
        .from('organizations')
        .select('*')
        .order('name');
      
      setOrganizations(orgsData as Organization[] || []);
    };

    fetchData();
  }, []);

  const handleCreateOrganization = async (data: { name: string; description: string }) => {
    const { data: newOrg, error } = await supabase
      .from('organizations')
      .insert([
        { 
          name: data.name,
          description: data.description
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating organization:', error);
      return;
    }
    
    // Update the organizations list
    setOrganizations([...organizations, newOrg as Organization]);
  };

  const handleCreateProject = async (data: { 
    name: string; 
    description: string; 
    organization_id: string; 
    status: string 
  }) => {
    const { data: newProject, error } = await supabase
      .from('projects')
      .insert([
        { 
          name: data.name,
          description: data.description,
          organization_id: data.organization_id,
          status: data.status
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating project:', error);
      return;
    }
    
    // Get the organization name for the new project
    const org = organizations.find(o => o.id === data.organization_id);
    
    // Update the projects list with properly typed project
    const typedProject: Project = {
      id: newProject.id,
      name: newProject.name,
      description: newProject.description,
      status: newProject.status,
      organization_id: newProject.organization_id,
      created_at: newProject.created_at,
      organization: { name: org?.name || 'N/A' }
    };
    
    setProjects([...projects, typedProject]);
  };

  if (!user || !publicUser) {
    return <div className="p-10 text-center">Loading...</div>;
  }

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
                <div className="text-sm break-words">{user.organization?.name || 'N/A'}</div>
                
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
                  <td className="px-6 py-4 whitespace-nowrap">{user.organization?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.role || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      
      {/* Organization Management Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Organization Management</h2>
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => setIsOrgModalOpen(true)}
          >
            Create Organization
          </Button>
        </div>
        
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Project Management</h2>
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => setIsProjectModalOpen(true)}
          >
            Create Project
          </Button>
        </div>
        
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
                  {project.organization?.name || 'N/A'}
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
                    {project.organization?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{project.status || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modals */}
      <CreateOrganizationModal
        isOpen={isOrgModalOpen}
        onClose={() => setIsOrgModalOpen(false)}
        onSubmit={handleCreateOrganization}
      />
      
      <CreateProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSubmit={handleCreateProject}
        organizations={organizations}
      />
    </div>
  );
} 