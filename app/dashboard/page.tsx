'use client';
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Building2, Briefcase, LayoutDashboard, PieChart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isProjectCardOpen, setIsProjectCardOpen] = useState(false);
  const [orgsList, setOrgsList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const supabase = createClient();

  const getOrgs = async () => {
    const { data: userOrgs } = await supabase
      .from('user-org')
      .select('*');

    if (userOrgs && userOrgs.length > 0) {
      const orgIds = userOrgs.map(uo => uo.org_id);
      const { data: organizations } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', orgIds);

      setOrgsList(organizations || []);
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

  const handleStatusChange = async (projectId: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);
        
      if (error) throw error;
      
      // Update the projects list with the new status
      setProjectsList(projectsList.map(project => 
        project.id === projectId 
          ? { ...project, status: newStatus } 
          : project
      ));
    } catch (error: any) {
      console.error('Error updating project status:', error.message);
      alert(`Failed to update project status: ${error.message}`);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/sign-in";
      }
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    getOrgs();
  }, [user]);

  useEffect(() => {
    if (selectedOrg) {
      getProjects();
    }
  }, [selectedOrg]);

  const getCurrentProject = () => {
    const project = projectsList.find(p => p.id.toString() === selectedProject);
    return project ? {
      id: project.id,
      name: project.name,
      progress: 0, // You can add these fields to your project data if needed
      tasks: '0/0',
      budget: 0,
      time: '0h',
      // Add any other required fields
    } : null;
  };

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Organization Selector Card */}
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

        {/* Projects and Status Summary */}
        {selectedOrg && projectsList.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Projects List - Takes 3/4 of the space on medium screens and up */}
            <div className="md:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Projects</CardTitle>
                </CardHeader>
                <CardContent>
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
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* No Projects Message */}
      {selectedOrg && projectsList.length === 0 && (
        <div className="text-center text-muted-foreground">
          No projects found for this organization.
        </div>
      )}
    </div>
  );
}
