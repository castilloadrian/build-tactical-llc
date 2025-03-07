'use client';
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Building2, Briefcase, LayoutDashboard } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectDetailCard } from '@/components/project-detail-card';
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
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
      budget: '$0',
      time: '0h',
      // Add any other required fields
    } : null;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="max-w-md mx-auto space-y-4">
        {/* Organization Selector Card - Adjusted spacing */}
        <Card>
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
                setSelectedProject(null);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {orgsList.map((org) => (
                  <SelectItem key={org.id} value={org.id.toString()}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Project Selector Card - Matching the new style */}
        {selectedOrg && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base font-medium">Project</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedProject?.toString()}
                onValueChange={setSelectedProject}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projectsList.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Button */}
        {selectedProject && (
          <Button
            className="w-full flex items-center justify-center gap-2 mt-6"
            onClick={() => setIsProjectCardOpen(true)}
          >
            <LayoutDashboard className="h-5 w-5" />
            Open Project Dashboard
          </Button>
        )}
      </div>

      {/* Project Detail Card Dialog */}
      {selectedProject && getCurrentProject() && (
        <ProjectDetailCard
          project={getCurrentProject()!}
          isOpen={isProjectCardOpen}
          onClose={() => setIsProjectCardOpen(false)}
        />
      )}

      {/* No Projects Message */}
      {selectedOrg && projectsList.length === 0 && (
        <div className="text-center text-muted-foreground">
          No projects found for this organization.
        </div>
      )}
    </div>
  );
}
