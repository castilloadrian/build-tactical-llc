'use client';
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from 'react';
import { ProjectDetailCard } from '../../components/project-detail-card';
import { User } from '@supabase/supabase-js';
import { List, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [orgsList, setOrgsList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);

  const getOrgs = async () => {
    // First get user's organization memberships
    const { data: userOrgs } = await supabase
      .from('user-org')
      .select('*');

    if (userOrgs && userOrgs.length > 0) {
      // Get organization details for each org_id
      console.log(userOrgs);

      const orgIds = userOrgs.map(uo => uo.org_id);
      const { data: organizations } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', orgIds);

        setOrgsList(organizations || []);
    }
  };
  const getProjects = async () => {
    const {data: projects} = await supabase.from('projects').select('*').eq('organization_id', selectedOrg);
    console.log(projects);
    setProjectsList(projects || []);
  }

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
  },[user]);
  
  useEffect(() => {
    getProjects();
  },[selectedOrg]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // TODO: Handle file upload logic here
      console.log('Selected files:', files);
    }
  };

  return (
    <div className="min-h-[85vh] p-8 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header with Organization Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary mb-2">Organization Overview</h1>
            <p className="text-muted-foreground">Manage your projects and track progress</p>
          </div>
          <div className="w-full sm:w-64">
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger className="w-full h-10 border-primary/20">
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {orgsList.map((org: any) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="flex flex-col sm:flex-row sm:space-x-8 space-y-6 sm:space-y-0 overflow-x-auto pb-6 mb-8">
          {projectsList.map((project) => (
            <Card 
              key={project.name}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-primary/20 sm:min-w-[320px]"
              onClick={() => setSelectedProject({
                name: project.name,
                progress: 65,
                tasks: '24/36',
                budget: '$12.4k',
                time: '164h'
              })}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-primary">{project.name}</CardTitle>
                <CardDescription className="text-base">Last updated 2 days ago</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-base font-medium">Progress</p>
                      <p className="text-base text-primary">65%</p>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                  <div className="flex justify-between text-base">
                    <div>
                      <p className="text-muted-foreground">Tasks</p>
                      <p className="font-medium text-primary mt-1">24/36</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Budget</p>
                      <p className="font-medium text-primary mt-1">$12.4k</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Time</p>
                      <p className="font-medium text-primary mt-1">164h</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Project Detail Modal */}
        {selectedProject && (
          <ProjectDetailCard
            project={selectedProject}
            isOpen={!!selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}

        {/* Organization Stats */}
        {selectedOrg && (
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-primary">Organization Statistics</CardTitle>
              <CardDescription className="text-base">Overall performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <Card className="border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium text-primary">Total Projects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">12</div>
                    <p className="text-sm text-muted-foreground mt-1">3 active</p>
                  </CardContent>
                </Card>
                <Card className="border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium text-primary">Total Budget</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">$234.5k</div>
                    <p className="text-sm text-muted-foreground mt-1">$45k this month</p>
                  </CardContent>
                </Card>
                <Card className="border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium text-primary">Team Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">24</div>
                    <p className="text-sm text-muted-foreground mt-1">Across all projects</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
