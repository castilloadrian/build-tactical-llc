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
import { UserOrganizationsPopover } from '@/components/user-organizations-popover';
import { UserProjectsPopover } from '@/components/user-projects-popover';

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
  projects?: {
    id: number;
    name: string | null;
    description: string | null;
    status: string | null;
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

interface UserToChangeRole {
  id: string;
  newRole: string;
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
  const [roleChangeConfirmOpen, setRoleChangeConfirmOpen] = useState(false);
  const [userToChangeRole, setUserToChangeRole] = useState<UserToChangeRole | null>(null);
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
          ),
          projects:"user-project"(
            project:projects(*)
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
        })),
        projects: publicUserData.projects?.map((proj: any) => ({
          id: proj.project.id,
          name: proj.project.name,
          description: proj.project.description,
          status: proj.project.status,
          created_at: proj.project.created_at
        }))
      };
      
      setPublicUser(userData);

      // Get all users with their organizations and projects
      const { data: usersData } = await supabase
        .from('users')
        .select(`
          *,
          organizations:"user-org"(
            organization:organizations(*)
          ),
          projects:"user-project"(
            project:projects(*)
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
        })),
        projects: user.projects?.map((proj: any) => ({
          id: proj.project.id,
          name: proj.project.name,
          description: proj.project.description,
          status: proj.project.status,
          created_at: proj.project.created_at
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

  // Update the handleRoleChange function
  const handleRoleChange = async (userId: string, newRole: string) => {
    // Get the current user's role
    const currentUser = users.find(u => u.id === userId);
    const isCurrentlyContractor = currentUser?.role === "Contractor";
    
    // If changing to Contractor, show confirmation dialog
    if (newRole === "Contractor") {
      setUserToChangeRole({ id: userId, newRole });
      setRoleChangeConfirmOpen(true);
      return;
    }
    
    // If changing FROM Contractor, show confirmation dialog too
    if (isCurrentlyContractor) {
      setUserToChangeRole({ id: userId, newRole });
      setRoleChangeConfirmOpen(true);
      return;
    }
    
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

  // Update the confirmRoleChange function to handle switching from Contractor
  const confirmRoleChange = async () => {
    if (!userToChangeRole) return;
    
    try {
      // First update the user's role
      const { error: roleError } = await supabase
        .from('users')
        .update({ role: userToChangeRole.newRole })
        .eq('id', userToChangeRole.id);
        
      if (roleError) throw roleError;
      
      // Get the current user's role before the change
      const currentUser = users.find(u => u.id === userToChangeRole.id);
      const isCurrentlyContractor = currentUser?.role === "Contractor";
      
      // If changing to Contractor, remove all organization associations
      if (userToChangeRole.newRole === "Contractor") {
        const { error: deleteError } = await supabase
          .from('user-org')
          .delete()
          .eq('user_id', userToChangeRole.id);
          
        if (deleteError) throw deleteError;
      }
      // If changing FROM Contractor to another role, remove all project associations
      else if (isCurrentlyContractor) {
        const { error: deleteError } = await supabase
          .from('user-project')
          .delete()
          .eq('user_id', userToChangeRole.id);
          
        if (deleteError) throw deleteError;
      }
      
      // Update the users list with the new role
      setUsers(users.map(user => {
        if (user.id === userToChangeRole.id) {
          return { 
            ...user, 
            role: userToChangeRole.newRole,
            // Clear organizations if changing to Contractor
            organizations: userToChangeRole.newRole === "Contractor" ? [] : user.organizations,
            // Clear projects if changing from Contractor
            projects: isCurrentlyContractor ? [] : user.projects
          };
        }
        return user;
      }));
    } catch (error: any) {
      console.error('Error updating user role:', error.message);
      alert(`Failed to update user role: ${error.message}`);
    } finally {
      setRoleChangeConfirmOpen(false);
      setUserToChangeRole(null);
    }
  };

  const refreshUserData = async () => {
    // Get all users with their organizations and projects
    const { data: usersData } = await supabase
      .from('users')
      .select(`
        *,
        organizations:"user-org"(
          organization:organizations(*)
        ),
        projects:"user-project"(
          project:projects(*)
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
      })),
      projects: user.projects?.map((proj: any) => ({
        id: proj.project.id,
        name: proj.project.name,
        description: proj.project.description,
        status: proj.project.status,
        created_at: proj.project.created_at
      }))
    })) || [];
    
    setUsers(transformedUsers);
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
                
                <div className="text-sm font-medium text-primary">Organizations/Projects</div>
                <div className="text-sm break-words flex items-center gap-2">
                  <span className="text-muted-foreground min-w-[120px]">
                    {user.role === "Contractor" 
                      ? `${user.projects?.length || 0} project(s)${"\u00A0".repeat(4)}`
                      : `${user.organizations?.length || 0} organization(s)`
                    }
                  </span>
                  {user.role === "Contractor" ? (
                    <UserProjectsPopover
                      userId={user.id}
                      userProjects={user.projects || []}
                      allProjects={projects}
                      onUpdate={refreshUserData}
                    />
                  ) : (
                    <UserOrganizationsPopover
                      userId={user.id}
                      userOrganizations={user.organizations || []}
                      allOrganizations={organizations}
                      onUpdate={refreshUserData}
                    />
                  )}
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
                      <SelectItem value="Contractor">Contractor</SelectItem>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Organizations/Projects</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Role</th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-primary/10">
              {users?.map((user) => (
                <tr key={user.id} className="hover:bg-primary/5">
                  <td className="px-6 py-4 whitespace-nowrap">{user.full_name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground min-w-[120px]">
                        {user.role === "Contractor" 
                          ? `${user.projects?.length || 0} project(s)${"\u00A0".repeat(4)}`
                          : `${user.organizations?.length || 0} organization(s)`
                        }
                      </span>
                      {user.role === "Contractor" ? (
                        <UserProjectsPopover
                          userId={user.id}
                          userProjects={user.projects || []}
                          allProjects={projects}
                          onUpdate={refreshUserData}
                        />
                      ) : (
                        <UserOrganizationsPopover
                          userId={user.id}
                          userOrganizations={user.organizations || []}
                          allOrganizations={organizations}
                          onUpdate={refreshUserData}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Select
                      defaultValue={user.role ?? undefined}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                      disabled={user.id === publicUser?.id}
                    >
                      <SelectTrigger className="w-full max-w-[180px] h-8">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="User">User</SelectItem>
                        <SelectItem value="Contractor">Contractor</SelectItem>
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
                
                <div className="text-sm font-medium text-primary">Actions</div>
                <div className="text-sm">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => confirmDelete('organization', org.id, org.name ?? 'Unnamed Organization')}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
                
                <div className="text-sm font-medium text-primary">Actions</div>
                <div className="text-sm">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => confirmDelete('project', project.id, project.name ?? 'Unnamed Project')}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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

      {/* Role Change Confirmation Dialog */}
      <AlertDialog open={roleChangeConfirmOpen} onOpenChange={setRoleChangeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role?</AlertDialogTitle>
            <AlertDialogDescription>
              {userToChangeRole?.newRole === "Contractor" ? (
                <>
                  Changing this user to a Contractor will remove all their organization associations.
                  Contractors can only be associated with specific projects.
                </>
              ) : (
                <>
                  Changing this user from a Contractor will remove all their project assignments.
                  Regular users are associated with organizations instead of specific projects.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRoleChange}
            >
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 