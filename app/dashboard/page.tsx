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
    <div className="flex flex-col sm:flex-row h-[600px] bg-background rounded-lg border">
      {/* Organization Sidebar */}
      <div className="w-full sm:w-48 p-3 flex flex-col">
        {/* Organizations dropdown */}
        <div className="flex-1 mb-4">
          <h2 className="text-sm font-semibold mb-2 px-2 text-primary">Organizations</h2>
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger className="w-full">
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

        {/* File Upload Box */}
        <label 
          className="
            min-h-[100px] 
            rounded-lg 
            border-2 
            border-dashed 
            border-primary/20
            hover:border-primary/50
            transition-colors
            flex 
            flex-col 
            items-center 
            justify-center 
            gap-2
            p-4
            cursor-pointer
            mb-2
          "
        >
          <input 
            type="file" 
            className="hidden" 
            onChange={handleFileChange}
          />
          <Upload className="w-6 h-6 text-primary/50" />
          <p className="text-sm text-center text-muted-foreground">
            Click to upload files
          </p>
        </label>
      </div>

      {/* Subtle Divider - only show on desktop */}
      <div className="hidden sm:block w-[1px] bg-border h-full" />

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl">
          {/* Organization Header */}
          <div className="mb-4">
            <p className="text-muted-foreground">Organization Overview</p>
          </div>

          {/* Projects Grid */}
          <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-4 sm:space-y-0 overflow-x-auto pb-4 mb-6">
            {projectsList.map((project) => (
              <Card 
                key={project.name}
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-primary/20 sm:min-w-[280px]"
                onClick={() => setSelectedProject({
                  name: project.name,
                  progress: 65,
                  tasks: '24/36',
                  budget: '$12.4k',
                  time: '164h'
                })}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-primary">{project.name}</CardTitle>
                  <CardDescription>Last updated 2 days ago</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Progress</p>
                        <p className="text-sm text-primary">65%</p>
                      </div>
                      <Progress value={65} />
                    </div>
                    <div className="flex justify-between text-sm">
                      <div>
                        <p className="text-muted-foreground">Tasks</p>
                        <p className="font-medium text-primary">24/36</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Budget</p>
                        <p className="font-medium text-primary">$12.4k</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Time</p>
                        <p className="font-medium text-primary">164h</p>
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
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-primary">Organization Statistics</CardTitle>
              <CardDescription>Overall performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card className="border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-primary">Total Projects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">12</div>
                    <p className="text-xs text-muted-foreground">3 active</p>
                  </CardContent>
                </Card>
                <Card className="border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-primary">Total Budget</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">$234.5k</div>
                    <p className="text-xs text-muted-foreground">$45k this month</p>
                  </CardContent>
                </Card>
                <Card className="border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-primary">Team Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">24</div>
                    <p className="text-xs text-muted-foreground">Across all projects</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
