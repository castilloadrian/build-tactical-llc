import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from '@/utils/supabase/client';
import { Briefcase, Check } from 'lucide-react';

interface Project {
  id: number;
  name: string | null;
  description: string | null;
  status: string | null;
  created_at: string;
}

interface UserProjectsPopoverProps {
  userId: string;
  userProjects: Project[];
  allProjects: Project[];
  onUpdate: () => void;
}

export function UserProjectsPopover({
  userId,
  userProjects,
  allProjects,
  onUpdate
}: UserProjectsPopoverProps) {
  const [selectedProjects, setSelectedProjects] = useState<Set<number>>(
    new Set(userProjects.map(project => project.id))
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  const handleToggleProject = async (projectId: number) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const selectedProjectsArray = Array.from(selectedProjects);
      const existingProjectIds = userProjects.map(project => project.id);
      
      // Find projects to add and remove
      const projectsToAdd = selectedProjectsArray.filter(id => !existingProjectIds.includes(id));
      const projectsToRemove = existingProjectIds.filter(id => !selectedProjectsArray.includes(id));

      // Remove projects first
      if (projectsToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('user-project')
          .delete()
          .eq('user_id', userId)
          .in('project_id', projectsToRemove);

        if (removeError) throw removeError;
      }

      // Add new projects
      if (projectsToAdd.length > 0) {
        const projectRows = projectsToAdd.map(projectId => ({
          user_id: userId,
          project_id: projectId
        }));

        const { error: addError } = await supabase
          .from('user-project')
          .insert(projectRows);

        if (addError) throw addError;
      }
      
      onUpdate();
      setOpen(false);
    } catch (error) {
      console.error('Error updating user projects:', error);
      alert('Failed to update project assignments. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-sm w-full md:w-[180px] justify-start hover:bg-primary/10"
        >
          <Briefcase className="h-4 w-4 flex-shrink-0" />
          <span className="hidden md:inline truncate">Manage Projects</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 border-b">
          <h4 className="font-medium">Project Assignments</h4>
          <p className="text-sm text-muted-foreground">
            Select the projects this contractor is assigned to
          </p>
        </div>
        <ScrollArea className="h-72">
          <div className="p-4 space-y-4">
            {allProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center space-x-3"
              >
                <Checkbox
                  id={`project-${project.id}`}
                  checked={selectedProjects.has(project.id)}
                  onCheckedChange={() => handleToggleProject(project.id)}
                />
                <label
                  htmlFor={`project-${project.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {project.name}
                </label>
              </div>
            ))}
            {allProjects.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">
                No projects available
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={isUpdating}
          >
            {isUpdating ? (
              "Saving..."
            ) : (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4" /> Save Changes
              </span>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
} 