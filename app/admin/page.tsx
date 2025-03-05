'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { CreateOrganizationModal } from '@/components/create-organization-modal';
import { CreateProjectModal } from '@/components/create-project-modal';
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';

interface ItemToDelete {
  type: 'organization' | 'project';
  id: number;
  name: string;
}

interface UserData {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  organizations?: {
    id: number;
    name: string | null;
    description: string | null;
    created_at: string;
  }[];
}

interface Organization {
  id: number;
  name: string | null;
  description: string | null;
  created_at: string;
}

interface Project {
  id: number;
  name: string | null;
  description: string | null;
  status: string | null;
  organization_id: number;
  created_at: string;
  organization?: {
    name: string | null;
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemToDelete | null>(null);
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
        router.push('/sign-in');
        return;
      }
      
      setUser(user);

      // Get public.users data with organization details through user-org junction table
      const { data: publicUserData, error } = await supabase
        .from('users')
        .select(`
          *,
          organizations:"user-org"(
            organization:organizations(*)
          )
        `)
        .eq('id', user.id)
        .single();
      
      if (!publicUserData || publicUserData.role !== 'Admin') {
        router.push('/404');
        return;
      }
      
      // Transform the data to match our interface
      const userData: UserData = {
        id: publicUserData.id,
        full_name: publicUserData.full_name,
        email: publicUserData.email,
        role: publicUserData.role,
        organizations: publicUserData.organizations?.map((org: any) => ({
          id: org.organization.id,
          name: org.organization.name,
          description: org.organization.description,
          created_at: org.organization.created_at
        }))
      };
      
      setPublicUser(userData);

      // Get all users with their organizations
      const { data: usersData } = await supabase
        .from('users')
        .select(`
          *,
          organizations:"user-org"(
            organization:organizations(*)
          )
        `)
        .order('full_name');
      
      // Transform the users data to match our interface
      const transformedUsers = usersData?.map((user: any) => ({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        organizations: user.organizations?.map((org: any) => ({
          id: org.organization.id,
          name: org.organization.name,
          description: org.organization.description,
          created_at: org.organization.created_at
        }))
      })) || [];
      
      setUsers(transformedUsers);
        
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
          organization:organizations!inner(
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
          name: data.name || null,
          description: data.description || null
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating organization:', error.message);
      console.error('Error details:', error);
      alert(`Failed to create organization: ${error.message}`);
      return;
    }
    
    // Update the organizations list
    if (newOrg) {
      setOrganizations([...organizations, newOrg as Organization]);
    }
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
          name: data.name || null,
          description: data.description || null,
          organization_id: parseInt(data.organization_id),
          status: data.status || null
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating project:', error);
      return;
    }
    
    if (newProject) {
      // Get the organization name for the new project
      const org = organizations.find(o => o.id === parseInt(data.organization_id));
      
      // Update the projects list with properly typed project
      const typedProject: Project = {
        id: newProject.id,
        name: newProject.name,
        description: newProject.description,
        status: newProject.status,
        organization_id: newProject.organization_id,
        created_at: newProject.created_at,
        organization: org ? { name: org.name } : undefined
      };
      
      setProjects([...projects, typedProject]);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    
    try {
      if (itemToDelete.type === 'organization') {
        const { error } = await supabase
          .from('organizations')
          .delete()
          .eq('id', itemToDelete.id);
          
        if (error) throw error;
        
        // Update state to remove the deleted organization
        setOrganizations(organizations.filter(org => org.id !== itemToDelete.id));
        
        // Also remove any projects associated with this organization
        setProjects(projects.filter(project => project.organization_id !== itemToDelete.id));
      } else {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', itemToDelete.id);
          
        if (error) throw error;
        
        // Update state to remove the deleted project
        setProjects(projects.filter(project => project.id !== itemToDelete.id));
      }
    } catch (error: any) {
      console.error(`Error deleting ${itemToDelete.type}:`, error.message);
      alert(`Failed to delete ${itemToDelete.type}: ${error.message}`);
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const confirmDelete = (type: 'organization' | 'project', id: number, name: string) => {
    setItemToDelete({ type, id, name });
    setDeleteConfirmOpen(true);
  };

  // Add this function to handle status changes
  const handleStatusChange = async (projectId: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);
        
      if (error) throw error;
      
      // Update the projects list with the new status
      setProjects(projects.map(project => 
        project.id === projectId 
          ? { ...project, status: newStatus } 
          : project
      ));
    } catch (error: any) {
      console.error('Error updating project status:', error.message);
      alert(`Failed to update project status: ${error.message}`);
    }
  };

  // Add this function to handle role changes
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Update the users list with the new role
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole } 
          : user
      ));
    } catch (error: any) {
      console.error('Error updating user role:', error.message);
      alert(`Failed to update user role: ${error.message}`);
    }
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
                <div className="text-sm break-words">
                  {user.organizations?.map(org => org.name || 'N/A').join(', ') || 'N/A'}
                </div>
                
                <div className="text-sm font-medium text-primary">Role</div>
                <div className="text-sm">
                  <Select
                    defaultValue={user.role ?? undefined}
                    onValueChange={(value) => handleRoleChange(user.id, value)}
                    disabled={user.id === publicUser?.id} // Prevent changing own role
                  >
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="User">User</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.organizations?.map(org => org.name || 'N/A').join(', ') || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Select
                      defaultValue={user.role ?? undefined}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                      disabled={user.id === publicUser?.id} // Prevent changing own role
                    >
                      <SelectTrigger className="w-full max-w-[180px] h-8">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="User">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Actions</th>
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => confirmDelete('organization', org.id, org.name ?? 'Unnamed Organization')}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
                <div className="text-sm">
                  <Select
                    defaultValue={project.status ?? undefined}
                    onValueChange={(value) => handleStatusChange(project.id, value)}
                  >
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Actions</th>
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Select
                      defaultValue={project.status ?? undefined}
                      onValueChange={(value) => handleStatusChange(project.id, value)}
                    >
                      <SelectTrigger className="w-full max-w-[180px] h-8">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="On Hold">On Hold</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => confirmDelete('project', project.id, project.name ?? 'Unnamed Project')}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {itemToDelete?.type} "{itemToDelete?.name}".
              {itemToDelete?.type === 'organization' && 
                " This may also affect any projects associated with this organization."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 