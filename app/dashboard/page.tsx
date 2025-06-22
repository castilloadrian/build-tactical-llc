'use client';
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateProjectModal } from "@/components/create-project-modal";
import { SuccessDialog } from "@/components/success-dialog";
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Building2, Briefcase, LayoutDashboard, PieChart, Plus, Lock, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams } from 'next/navigation';
import { getUserSubscriptionStatus, hasUserAccess } from "@/utils/subscription";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isProjectCardOpen, setIsProjectCardOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [orgsList, setOrgsList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const supabase = createClient();

  const getOrgs = async () => {
    if (!user) return;

    // Check if user is a contractor
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const isContractor = userData?.role === 'Contractor';
    
    if (isContractor) {
      // For contractors, we don't load organizations
      setOrgsList([]);
      
      // Instead, load all projects the contractor is associated with
      const { data: userProjects } = await supabase
        .from('user-project')
        .select('project_id')
        .eq('user_id', user.id);
        
      if (userProjects && userProjects.length > 0) {
        const projectIds = userProjects.map(up => up.project_id);
        const { data: projects } = await supabase
          .from('projects')
          .select(`
            *,
            organization:organizations(
              name
            )
          `)
          .in('id', projectIds)
          .order('name');
          
        setProjectsList(projects || []);
      } else {
        setProjectsList([]);
      }
    } else {
      // Original code for non-contractor users
      const { data: userOrgs } = await supabase
        .from('user-org')
        .select('*')
        .eq('user_id', user.id);
      
      if (userOrgs && userOrgs.length > 0) {
        const orgIds = userOrgs.map(uo => uo.org_id);
        const { data: organizations } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', orgIds);

        setOrgsList(organizations || []);
      }
    }
  };

  const getProjects = async () => {
    if (!selectedOrg) return;
    
    const { data: projects } = await supabase
      .from('projects')
      .select(`
        *,
        organization:organizations!inner(
          name
        )
      `)
      .eq('organization_id', selectedOrg)
      .order('name');

    setProjectsList(projects || []);
    setSelectedProject(null); // Reset project selection when org changes
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/sign-in";
        return;
      }
      setUser(user);
      
      // Check access (subscription OR Org Owner with organizations)
      const accessResult = await hasUserAccess(user.id);
      setHasAccess(accessResult);
      
      if (!accessResult) {
        // User doesn't have access, redirect to pricing
        router.push('/pricing');
        return;
      }
      
      // Also check subscription status for UI purposes
      const status = await getUserSubscriptionStatus(user.id);
      setSubscriptionStatus(status);
      
      setLoading(false);
    };
    getUser();
  }, []);

  // Check for success parameter from Stripe redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const trial = searchParams.get('trial');
    
    if (success === 'true') {
      // Set refreshing flag to prevent dialog from showing
      setIsRefreshing(true);
      
      // Remove the original success parameters and add a flag for after refresh
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('success');
      newUrl.searchParams.delete('session_id');
      newUrl.searchParams.delete('trial');
      newUrl.searchParams.set('showSuccess', 'true');
      if (trial === 'true') {
        newUrl.searchParams.set('trialSuccess', 'true');
      }
      window.history.replaceState({}, '', newUrl.toString());
      
      // Force a full page refresh to ensure subscription status is updated
      window.location.reload();
    }
  }, [searchParams]);

  // Show success dialog after page loads (after refresh)
  useEffect(() => {
    // Only show success dialog after loading is complete, user has active subscription, and we're not in the process of refreshing
    if (!loading && subscriptionStatus && subscriptionStatus.hasActiveSubscription && !isRefreshing) {
      const showSuccess = searchParams.get('showSuccess');
      const trialSuccess = searchParams.get('trialSuccess');
      
      if (showSuccess === 'true') {
        let title, message;
        if (trialSuccess === 'true') {
          title = 'Free Trial Activated!';
          message = 'Your 24-hour free trial has been activated. You now have full access to all features. Upgrade to a paid plan before your trial expires to continue enjoying our services.';
        } else {
          title = 'Subscription Successful!';
          message = 'Welcome to Build Tactical LLC! Your subscription has been activated and you now have full access to all features.';
        }
        
        setSuccessMessage({ title, message });
        setShowSuccessDialog(true);
        
        // Remove the success parameters from the URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('showSuccess');
        newUrl.searchParams.delete('trialSuccess');
        window.history.replaceState({}, '', newUrl.toString());
      }
    }
  }, [loading, subscriptionStatus, searchParams, isRefreshing]);

  // Get success message based on trial parameter (keeping for backward compatibility)
  const getSuccessMessage = () => {
    const trial = searchParams.get('trial');
    if (trial === 'true') {
      return {
        title: 'Free Trial Activated!',
        message: 'Your 24-hour free trial has been activated. You now have full access to all features. Upgrade to a paid plan before your trial expires to continue enjoying our services.'
      };
    } else {
      return {
        title: 'Subscription Successful!',
        message: 'Welcome to Build Tactical LLC! Your subscription has been activated and you now have full access to all features.'
      };
    }
  };

  useEffect(() => {
    getOrgs();
  }, [user]);

  useEffect(() => {
    // Only fetch projects based on org for non-contractors
    // Contractors already have their projects loaded in getOrgs
    if (selectedOrg && orgsList.length > 0) {
      getProjects();
    }
  }, [selectedOrg, orgsList.length]);

  // Calculate status counts
  const getStatusCounts = () => {
    type StatusKey = 'Active' | 'On Hold' | 'Completed' | 'Cancelled' | 'Other';
    
    const counts: Record<StatusKey, number> = {
      'Active': 0,
      'On Hold': 0,
      'Completed': 0,
      'Cancelled': 0,
      'Other': 0
    };
    
    projectsList.forEach(project => {
      const rawStatus = project.status || 'Active';
      // Check if the status is one of our known keys
      const status = (Object.keys(counts) as StatusKey[]).includes(rawStatus as StatusKey) 
        ? rawStatus as StatusKey 
        : 'Other';
        
      counts[status]++;
    });
    
    return counts;
  };

  // Handle project creation
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
      const org = orgsList.find(o => o.id === parseInt(data.organization_id));
      
      // Create properly typed project
      const typedProject = {
        id: newProject.id,
        name: newProject.name,
        description: newProject.description,
        status: newProject.status,
        organization_id: newProject.organization_id,
        created_at: newProject.created_at,
        organization: org ? { name: org.name } : undefined
      };
      
      // Update the projects list
      setProjectsList(prevProjects => [...prevProjects, typedProject]);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      )}

      {/* Subscription Required State */}
      {!loading && !hasAccess && (
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Access Required</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            You need an active subscription or organization access to view the dashboard. Please choose a plan or contact your organization administrator.
          </p>
          <Button onClick={() => router.push('/pricing')} className="bg-accent hover:bg-accent/90">
            View Plans
          </Button>
        </div>
      )}

      {/* Dashboard Content - Only show if user has access */}
      {!loading && hasAccess && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Organization Selector Card - Only show for non-contractors */}
          {orgsList.length > 0 && (
            <Card className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base font-medium">Organization</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedOrg?.toString()}
                  onValueChange={(value) => {
                    setSelectedOrg(value);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select organization" className="truncate" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgsList.map((org) => (
                      <SelectItem key={org.id} value={org.id.toString()} className="truncate">
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Projects and Status Summary - Show when org is selected OR when contractor has projects */}
          {(selectedOrg || (orgsList.length === 0 && projectsList.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Projects List - Takes 3/4 of the space on medium screens and up */}
              <div className="md:col-span-3">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Projects</CardTitle>
                      {selectedOrg && (
                        <Button 
                          size="sm" 
                          onClick={() => setIsCreateProjectModalOpen(true)}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Create Project
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {projectsList.length > 0 ? (
                      <div className="space-y-4">
                        {projectsList.map((project) => (
                          <Card 
                            key={project.id} 
                            className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => router.push(`/projects/${project.id}`)}
                          >
                            <div className="flex justify-between items-center gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium truncate">{project.name}</h3>
                                <p className="text-sm text-muted-foreground truncate">
                                  {project.organization?.name}
                                </p>
                              </div>
                              <div className="flex-shrink-0">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                                  project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                  project.status === 'Active' ? 'bg-blue-100 text-blue-800' :
                                  project.status === 'On Hold' ? 'bg-yellow-100 text-yellow-800' :
                                  project.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {project.status || 'Active'}
                                </span>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        No projects found for this organization.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Status Summary - Takes 1/4 of the space on medium screens and up */}
              <div className="md:col-span-1">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base font-medium">Status Summary</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {projectsList.length > 0 ? (
                        <>
                          {Object.entries(getStatusCounts()).map(([status, count]) => 
                            count > 0 ? (
                              <div key={status} className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <span className={`w-3 h-3 rounded-full ${
                                    status === 'Completed' ? 'bg-green-500' :
                                    status === 'Active' ? 'bg-blue-500' :
                                    status === 'On Hold' ? 'bg-yellow-500' :
                                    status === 'Cancelled' ? 'bg-red-500' :
                                    'bg-purple-500'
                                  }`}></span>
                                  <span className="text-sm">{status}</span>
                                </div>
                                <span className="font-medium">{count}</span>
                              </div>
                            ) : null
                          )}
                          <div className="pt-2 border-t mt-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Total</span>
                              <span className="font-medium">{projectsList.length}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-muted-foreground text-sm py-4">
                          No projects yet.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onSubmit={handleCreateProject}
        organizations={orgsList}
        preselectedOrgId={selectedOrg || undefined}
      />

      {/* Success Dialog */}
      <SuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        title={successMessage.title}
        message={successMessage.message}
      />
    </div>
  );
}
