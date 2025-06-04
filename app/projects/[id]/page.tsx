'use client';

import { useState, useEffect, use, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Upload, Download, RefreshCw, File, Trash, BarChart3, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskList } from "@/components/task-list";
import { ProjectUpdates } from "@/components/project-updates";
import { User } from '@supabase/supabase-js';
import { toast } from "sonner";
import { ExpensesChart } from "@/components/expenses-chart";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import Link from "next/link";

interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  created_at?: string;
  due_at?: string;
}

interface ExpenseRow {
  id: number;
  description: string;
  amount: string;
  date: string;
  isEditing: boolean;
  dbId?: number;
}

interface ProjectFile {
  name: string;
  url: string;
  tags: string[];
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const today = new Date().toISOString().split('T')[0];
  
  const [curr_tasks, setCurrTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [projectBudget, setProjectBudget] = useState<number>(0);
  const [budgetUsage, setBudgetUsage] = useState<number>(0);
  const [isLoadingBudget, setIsLoadingBudget] = useState(false);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState<string>('0');
  const [projectStatus, setProjectStatus] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [isExpensesChartOpen, setIsExpensesChartOpen] = useState(false);
  const [newFileTags, setNewFileTags] = useState<string>('');
  const [fileTagFilter, setFileTagFilter] = useState<string>('');
  const [isTagEditDialogOpen, setIsTagEditDialogOpen] = useState(false);
  const [fileToEditTags, setFileToEditTags] = useState<ProjectFile | null>(null);
  const [editingTags, setEditingTags] = useState<string>('');
  const [isOrgOwner, setIsOrgOwner] = useState<boolean>(false);
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          return;
        }

        setIsOrgOwner(userData?.role === 'Org Owner');
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
      }
    };

    fetchUserRole();

    const fetchProjectDetails = async () => {
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (project) {
        setProjectName(project.name || '');
        const budget = project.budget || 0;
        setProjectBudget(budget);
        setNewBudget(budget.toString());
        setProjectStatus(project.status || '');
      }
    };

    const fetchTasks = async () => {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      // Format tasks to match TaskList component expectations
      const formattedTasks = (tasks || []).map(task => ({
        id: task.id,
        title: task.title || '',
        description: task.description || '',
        completed: Boolean(task.is_complete),
        created_at: task.created_at || undefined,
        due_at: task.due_at || undefined
      }));

      setCurrTasks(formattedTasks);
    };

    fetchProjectDetails();
    fetchTasks();
    fetchProjectFiles();
    fetchProjectBudget();
    fetchExpenses();
  }, [projectId]);

  const fetchProjectFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const bucketName = `project-${projectId}`;
      
      // List all files in the bucket
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list();
        
      if (error) {
        console.error('Error fetching files:', error);
        toast.error('Failed to load project files');
      } else if (data) {
        // Get file metadata from the database
        const { data: fileMetadata, error: metadataError } = await supabase
          .from('file_data')
          .select('*')
          .eq('project_id', projectId);
        console.log(fileMetadata);
        if (metadataError) {
          console.error('Error fetching file metadata:', metadataError);
        }
        
        // Create a map of filename to tags
        const fileTagsMap = new Map();
        if (fileMetadata) {
          fileMetadata.forEach(file => {
            fileTagsMap.set(file.file_name, file.tags || []);
          });
        }
        
        // Create URLs for each file
        const filesWithUrls = await Promise.all(
          data.map(async (file) => {
            const { data: urlData } = await supabase.storage
              .from(bucketName)
              .createSignedUrl(file.name, 3600); // URL valid for 1 hour
              
            return {
              name: file.name,
              url: urlData?.signedUrl || '',
              tags: fileTagsMap.get(file.name) || []
            };
          })
        );
        
        setProjectFiles(filesWithUrls.filter(file => file.url));
      }
    } catch (err) {
      console.error('Error in fetchProjectFiles:', err);
      toast.error('An error occurred while loading files');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const fetchProjectBudget = async () => {
    setIsLoadingBudget(true);
    try {
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('cost')
        .eq('project_id', projectId);

      if (error) throw error;

      const totalExpenses = expenses.reduce((sum, expense) => {
        return sum + parseFloat(expense.cost);
      }, 0);

      setBudgetUsage(totalExpenses);
    } catch (error: any) {
      console.error('Error fetching budget usage:', error.message);
      toast.error('Failed to fetch budget usage');
    } finally {
      setIsLoadingBudget(false);
    }
  };

  const fetchExpenses = async () => {
    setIsLoadingExpenses(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedExpenses: ExpenseRow[] = (data || []).map(expense => ({
        id: expense.id,
        description: expense.description || '',
        amount: expense.cost?.toString() || '0',
        date: expense.created_at || today,
        isEditing: false,
        dbId: expense.id
      }));

      setExpenses(formattedExpenses);
    } catch (error: any) {
      console.error('Error fetching expenses:', error.message);
      toast.error('Failed to fetch expenses');
    } finally {
      setIsLoadingExpenses(false);
    }
  };

  const updateProjectBudget = async () => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ budget: parseFloat(newBudget) })
        .eq('id', projectId);

      if (error) throw error;

      setProjectBudget(parseFloat(newBudget));
      setIsEditingBudget(false);
      toast.success('Budget updated successfully');
    } catch (error: any) {
      console.error('Error updating budget:', error.message);
      toast.error('Failed to update budget');
    }
  };

  const deleteFile = async (fileName: string) => {
    try {
      const bucketName = `project-${projectId}`;
      
      // First delete the file from storage
      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([fileName]);
        
      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        toast.error(`Failed to delete ${fileName}: ${storageError.message}`);
        return;
      }
      
      // Then delete the file metadata from the database
      const { error: dbError } = await supabase
        .from('file_data')
        .delete()
        .eq('project_id', projectId)
        .eq('file_name', fileName);
        
      if (dbError) {
        console.error('Error deleting file metadata:', dbError);
        toast.error(`File deleted but failed to remove metadata: ${dbError.message}`);
      } else {
        toast.success(`${fileName} has been deleted successfully.`);
      }
      
      // Refresh the file list after successful deletion
      fetchProjectFiles();
    } catch (err) {
      console.error('Error in deleteFile:', err);
      toast.error('An error occurred while deleting the file');
    } finally {
      setFileToDelete(null);
    }
  };

  const progress = projectBudget > 0 ? Math.min(Math.round((budgetUsage / projectBudget) * 100), 100) : 0;

  const handleTasksChange = (newTasks: Task[]) => {
    const formattedTasks = newTasks.map(task => ({
      ...task,
      title: task.title || '',
      description: task.description || '',
      completed: Boolean(task.completed),
      created_at: task.created_at || undefined,
      due_at: task.due_at || undefined
    }));
    setCurrTasks(formattedTasks);
  };

  const handleAddExpense = () => {
    const newId = Date.now();
    setExpenses([
      {
        id: newId,
        description: '',
        amount: '0',
        date: today,
        isEditing: true
      },
      ...expenses
    ]);
  };

  const renderExpenseForm = (expense: ExpenseRow) => (
    <div className="space-y-3">
      <Input
        placeholder="Description"
        value={expense.description}
        onChange={(e) => {
          setExpenses(expenses.map(exp =>
            exp.id === expense.id
              ? { ...exp, description: e.target.value }
              : exp
          ));
        }}
        className="border-primary/20"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          placeholder="Amount"
          type="number"
          value={expense.amount}
          onChange={(e) => {
            setExpenses(expenses.map(exp =>
              exp.id === expense.id
                ? { ...exp, amount: e.target.value || '0' }
                : exp
            ));
          }}
          className="border-primary/20"
        />
        <Input
          type="date"
          value={expense.date}
          onChange={(e) => {
            setExpenses(expenses.map(exp =>
              exp.id === expense.id
                ? { ...exp, date: e.target.value || today }
                : exp
            ));
          }}
          className="border-primary/20"
        />
      </div>
    </div>
  );

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);
        
      if (error) throw error;
      
      setProjectStatus(newStatus);
      toast.success('Project status updated successfully');
    } catch (error: any) {
      console.error('Error updating project status:', error.message);
      toast.error('Failed to update project status');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      const bucketName = `project-${projectId}`;
      const tags = newFileTags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = `${Date.now()}-${file.name}`;
        
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file);
          
        if (error) {
          toast.error(`Failed to upload ${file.name}: ${error.message}`);
        } else {
          // Save file metadata with tags
          const { error: metadataError } = await supabase
            .from('file_data')
            .insert({
              project_id: projectId,
              file_name: filePath,
              tags: tags,
            });
            
          if (metadataError) {
            console.error('Error saving file metadata:', metadataError);
            toast.error(`File uploaded but failed to save tags: ${metadataError.message}`);
          } else {
            toast.success(`${file.name} uploaded successfully with tags`);
          }
        }
      }
      
      // Reset the file input using the ref
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setNewFileTags('');
      fetchProjectFiles();
    } catch (error) {
      toast.error("An unexpected error occurred during upload");
      // Also reset on error
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const updateFileTags = async (fileName: string, tags: string[]) => {
    try {
      const { error } = await supabase
        .from('file_data')
        .update({ tags })
        .eq('project_id', projectId)
        .eq('file_name', fileName);
        
      if (error) {
        console.error('Error updating file tags:', error);
        toast.error('Failed to update tags');
        return false;
      }
      
      toast.success('Tags updated successfully');
      return true;
    } catch (err) {
      console.error('Error in updateFileTags:', err);
      toast.error('An error occurred while updating tags');
      return false;
    }
  };
  
  const getFilteredFiles = () => {
    if (!fileTagFilter.trim()) return projectFiles;
    
    return projectFiles.filter(file => 
      file.tags.some(tag => 
        tag.toLowerCase().includes(fileTagFilter.toLowerCase())
      )
    );
  };

  const openTagEditDialog = (file: ProjectFile) => {
    setFileToEditTags(file);
    setEditingTags(file.tags.join(', '));
    setIsTagEditDialogOpen(true);
  };
  
  const handleSaveFileTags = async () => {
    if (!fileToEditTags) return;
    
    const tagArray = editingTags.split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
      
    const success = await updateFileTags(fileToEditTags.name, tagArray);
    
    if (success) {
      setProjectFiles(projectFiles.map(f => 
        f.name === fileToEditTags.name ? { ...f, tags: tagArray } : f
      ));
      setIsTagEditDialogOpen(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-center sm:absolute sm:left-1/2 sm:transform sm:-translate-x-1/2">{projectName}</h1>
          <Select
            value={projectStatus}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className={`w-[140px] h-8 border-0 ${
              projectStatus === 'Completed' ? 'bg-green-500/20 hover:bg-green-500/30 dark:bg-green-500/30 dark:hover:bg-green-500/40' :
              projectStatus === 'Active' ? 'bg-blue-500/20 hover:bg-blue-500/30 dark:bg-blue-500/30 dark:hover:bg-blue-500/40' :
              projectStatus === 'On Hold' ? 'bg-amber-500/20 hover:bg-amber-500/30 dark:bg-amber-500/30 dark:hover:bg-amber-500/40' :
              projectStatus === 'Cancelled' ? 'bg-red-500/20 hover:bg-red-500/30 dark:bg-red-500/30 dark:hover:bg-red-500/40' :
              'bg-gray-500/20 hover:bg-gray-500/30 dark:bg-gray-500/30 dark:hover:bg-gray-500/40'
            }`}>
              <SelectValue 
                placeholder="Set Status"
                className={`text-sm font-semibold ${
                  projectStatus === 'Completed' ? 'text-green-700 dark:text-green-300' :
                  projectStatus === 'Active' ? 'text-blue-700 dark:text-blue-300' :
                  projectStatus === 'On Hold' ? 'text-amber-700 dark:text-amber-300' :
                  projectStatus === 'Cancelled' ? 'text-red-700 dark:text-red-300' :
                  'text-gray-700 dark:text-gray-300'
                }`}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem 
                value="Active" 
                className="text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 dark:hover:bg-blue-500/20 font-medium"
              >
                Active
              </SelectItem>
              <SelectItem 
                value="On Hold" 
                className="text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 dark:hover:bg-amber-500/20 font-medium"
              >
                On Hold
              </SelectItem>
              <SelectItem 
                value="Completed" 
                className="text-green-700 dark:text-green-300 hover:bg-green-500/20 dark:hover:bg-green-500/20 font-medium"
              >
                Completed
              </SelectItem>
              <SelectItem 
                value="Cancelled" 
                className="text-red-700 dark:text-red-300 hover:bg-red-500/20 dark:hover:bg-red-500/20 font-medium"
              >
                Cancelled
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Project Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-2">Total Tasks</p>
                <p className="text-3xl font-bold">{curr_tasks.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-2">Completed Tasks</p>
                <p className="text-3xl font-bold">{curr_tasks.filter(t => t.completed).length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-2">Total Budget</p>
                <p className={`font-bold ${
                  projectBudget.toLocaleString().length > 12 ? 'text-base' :
                  projectBudget.toLocaleString().length > 8 ? 'text-lg md:text-xl lg:text-2xl' :
                  'text-2xl md:text-3xl'
                }`}>
                  ${projectBudget.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-2">Budget Used</p>
                <p className={`font-bold ${
                  budgetUsage.toLocaleString().length > 12 ? 'text-base' :
                  budgetUsage.toLocaleString().length > 8 ? 'text-lg md:text-xl lg:text-2xl' :
                  'text-2xl md:text-3xl'
                }`}>
                  ${budgetUsage.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Tasks */}
        <Card className="lg:col-span-5 border-primary/20">
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="overflow-x-auto">
              <TaskList 
                projectId={parseInt(projectId)} 
                tasks={curr_tasks}
                onTasksChange={handleTasksChange}
                isOrgOwner={isOrgOwner}
              />
            </div>
          </CardContent>
        </Card>

        {/* Middle and Right Columns - Budget and Progress */}
        <div className="lg:col-span-7 space-y-6">
          {/* Budget Section with larger chart */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <CardTitle>Budget Overview</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsExpensesChartOpen(true)}
                    className="h-8 px-2"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Detailed Chart
                  </Button>
                  {!isOrgOwner && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsEditingBudget(!isEditingBudget)}
                      className="h-8 px-2"
                    >
                      {isEditingBudget ? 'Cancel' : 'Edit Budget'}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingBudget ? (
                <div className="flex items-center justify-center h-[300px]">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : isEditingBudget && !isOrgOwner ? (
                <div className="space-y-4 p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold">$</span>
                    <Input
                      type="number"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      className="border-primary/20 text-lg"
                      placeholder="Enter budget amount"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <Button
                    onClick={updateProjectBudget}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    Save Budget
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Budget Status</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Budget:</span>
                          <span className="font-medium">${projectBudget.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Used:</span>
                          <span className="font-medium">${budgetUsage.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Remaining:</span>
                          <span className="font-medium">${(projectBudget - budgetUsage).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="relative w-48 h-48">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="12"
                          className="opacity-30"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="12"
                          strokeLinecap="round"
                          className={`text-primary transition-all duration-300 ease-in-out ${
                            progress > 90 ? 'text-destructive' : 
                            progress > 75 ? 'text-warning' : 
                            'text-primary'
                          }`}
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                          transform="rotate(-90 50 50)"
                        />
                        <text
                          x="50"
                          y="50"
                          textAnchor="middle"
                          dy="0.3em"
                          className="text-2xl font-bold fill-primary"
                        >
                          {progress}%
                        </text>
                      </svg>
                      <p className="text-center mt-2 text-sm text-muted-foreground">
                        Budget Used
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Files Section with grid layout */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <CardTitle>Project Files</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchProjectFiles}
                  disabled={isLoadingFiles}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Only show file upload and tag input if not org owner */}
                {!isOrgOwner && (
                  <div className="space-y-4">
                    <label className="block min-h-[100px] rounded-lg border-2 border-dashed border-primary/20 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-3 p-4 cursor-pointer bg-background">
                      <input 
                        type="file" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        multiple
                      />
                      <Upload className="h-6 w-6 text-primary/50" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-primary">Drop files here or click to upload</p>
                        <p className="text-xs text-muted-foreground mt-1">Upload multiple files at once</p>
                      </div>
                    </label>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Add Tags (comma separated)</label>
                      <Input
                        value={newFileTags}
                        onChange={(e) => setNewFileTags(e.target.value)}
                        placeholder="e.g. invoice, contract, design"
                        className="border-primary/20"
                      />
                      <p className="text-xs text-muted-foreground">
                        Tags will be applied to all files in this upload
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Filter by tag</label>
                    {fileTagFilter && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setFileTagFilter('')}
                        className="h-6 px-2 text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <Input
                    value={fileTagFilter}
                    onChange={(e) => setFileTagFilter(e.target.value)}
                    placeholder="Type to filter by tag"
                    className="border-primary/20"
                  />
                </div>
                
                {isLoadingFiles ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {getFilteredFiles().map((file, index) => (
                      <div
                        key={index}
                        className="flex flex-col p-3 rounded-lg border border-primary/20 hover:bg-primary/5 group min-w-0 w-full"
                      >
                        <div className="flex items-center justify-between overflow-hidden mb-2">
                          <div className="flex items-center space-x-4 overflow-hidden">
                            <File className="h-5 w-5 text-primary flex-shrink-0" />
                            <div className="overflow-hidden">
                              <p className="text-sm font-medium break-all">{file.name}</p>
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                              >
                                Download
                              </a>
                            </div>
                          </div>
                          {/* Only show delete button if not org owner */}
                          {!isOrgOwner && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setFileToDelete(file.name)}
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity ml-4 flex-shrink-0"
                            >
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {file.tags.map((tag, tagIndex) => (
                              <span 
                                key={tagIndex} 
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                              >
                                {tag}
                              </span>
                            ))}
                            {/* Only show edit tags button if not org owner */}
                            {!isOrgOwner && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openTagEditDialog(file)}
                                className="h-6 px-2 text-xs"
                              >
                                {file.tags.length > 0 ? 'Edit tags' : 'Add tags'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {getFilteredFiles().length === 0 && (
                      <div className="col-span-2 text-center py-8 text-muted-foreground">
                        {projectFiles.length === 0 ? 'No files uploaded yet' : 'No files match the current tag filter'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Expenses Section - Full Width */}
      <Card className="mt-6 border-primary/20">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle>Expenses</CardTitle>
            {!isOrgOwner && (
              <Button
                variant="outline"
                size="default"
                onClick={handleAddExpense}
                className="border-primary/20 hover:bg-primary/5"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Expense
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingExpenses ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {expenses.length === 0 ? (
                <div className="col-span-full text-center text-muted-foreground py-8">
                  No expenses recorded yet
                </div>
              ) : (
                expenses.map((expense) => (
                  <Card key={expense.id} className="border-primary/10">
                    <CardContent className="p-4">
                      {expense.isEditing && !isOrgOwner ? (
                        <div className="space-y-4">
                          {renderExpenseForm(expense)}
                          <div className="flex flex-col gap-2 border-t border-primary/10 pt-3 mt-4">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={async () => {
                                try {
                                  if (!expense.description.trim() || !expense.amount.trim()) {
                                    toast.error('Description and amount are required');
                                    return;
                                  }

                                  const expenseData = {
                                    project_id: parseInt(projectId),
                                    description: expense.description,
                                    cost: parseFloat(expense.amount),
                                    created_at: expense.date
                                  };

                                  let result;
                                  if (expense.dbId) {
                                    result = await supabase
                                      .from('expenses')
                                      .update(expenseData)
                                      .eq('id', expense.dbId);
                                  } else {
                                    result = await supabase
                                      .from('expenses')
                                      .insert(expenseData)
                                      .select();
                                  }

                                  if (result.error) throw result.error;

                                  toast.success('Expense saved successfully');
                                  if (!expense.dbId && result.data?.[0]) {
                                    setExpenses(expenses.map(exp =>
                                      exp.id === expense.id
                                        ? { ...exp, dbId: result.data[0].id, isEditing: false }
                                        : exp
                                    ));
                                  } else {
                                    setExpenses(expenses.map(exp =>
                                      exp.id === expense.id
                                        ? { ...exp, isEditing: false }
                                        : exp
                                    ));
                                  }
                                  fetchProjectBudget();
                                } catch (error: any) {
                                  console.error('Error saving expense:', error);
                                  toast.error('Failed to save expense');
                                }
                              }}
                              className="bg-primary hover:bg-primary/90"
                            >
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setExpenses(expenses.map(exp =>
                                  exp.id === expense.id
                                    ? { ...exp, isEditing: false }
                                    : exp
                                ));
                              }}
                              className="px-4"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">{expense.description}</h4>
                              <p className="text-sm text-muted-foreground">
                                {expense.date ? new Date(expense.date).toLocaleDateString() : 'No date'}
                              </p>
                            </div>
                            <div className="text-xl font-bold text-primary">
                              ${parseFloat(expense.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </div>
                          </div>
                          {!isOrgOwner && (
                            <div className="flex justify-end space-x-2 mt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setExpenses(expenses.map(exp =>
                                    exp.id === expense.id
                                      ? { ...exp, isEditing: true }
                                      : exp
                                  ));
                                }}
                                className="h-8 px-2"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    if (expense.dbId) {
                                      const { error } = await supabase
                                        .from('expenses')
                                        .delete()
                                        .eq('id', expense.dbId);

                                      if (error) throw error;
                                    }
                                    setExpenses(expenses.filter(exp => exp.id !== expense.id));
                                    toast.success('Expense deleted successfully');
                                    fetchProjectBudget();
                                  } catch (error: any) {
                                    console.error('Error deleting expense:', error);
                                    toast.error('Failed to delete expense');
                                  }
                                }}
                                className="h-8 px-2 text-destructive hover:text-destructive"
                              >
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Updates Section - Full Width */}
      <div className="mt-6">
        <ProjectUpdates projectId={parseInt(projectId)} />
      </div>

      {/* Existing Dialogs */}
      <AlertDialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the file "{fileToDelete}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => fileToDelete && deleteFile(fileToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isExpensesChartOpen} onOpenChange={setIsExpensesChartOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Expense Analysis</DialogTitle>
          </DialogHeader>
          <ExpensesChart 
            projectId={parseInt(projectId)} 
            expenses={expenses.filter(exp => exp.dbId !== undefined)} 
            isLoading={isLoadingExpenses} 
            budget={projectBudget}
          />
          <div className="flex justify-end mt-4">
            <Button 
              onClick={() => setIsExpensesChartOpen(false)}
              variant="outline"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tag Edit Dialog */}
      <Dialog open={isTagEditDialogOpen} onOpenChange={setIsTagEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit File Tags</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-3">
              <File className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium break-all">
                {fileToEditTags?.name}
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="tags" className="text-sm font-medium">
                Tags (comma separated)
              </label>
              <Input
                id="tags"
                value={editingTags}
                onChange={(e) => setEditingTags(e.target.value)}
                placeholder="e.g. invoice, contract, design"
                className="border-primary/20"
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple tags with commas
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Suggested Tags</label>
              <div className="flex flex-wrap gap-1">
                {['invoice', 'contract', 'design', 'report', 'image', 'document'].map((tag) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      const currentTags = editingTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
                      if (!currentTags.includes(tag)) {
                        const newTags = [...currentTags, tag].join(', ');
                        setEditingTags(newTags);
                      }
                    }}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsTagEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveFileTags}
              className="bg-primary hover:bg-primary/90"
            >
              Save Tags
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}