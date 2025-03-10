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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Upload, Download, RefreshCw, File, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { TaskList } from "@/components/task-list";
import { User } from '@supabase/supabase-js';
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";


interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

interface ExpenseRow {
  id: number;
  description: string;
  amount: string;
  date: string;
}

interface ProjectDetailCardProps {
  project: {
    id: number;
    name: string;
    tasks: string;
    budget: string;
    time: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectDetailCard({ project, isOpen, onClose }: ProjectDetailCardProps) {
  const [curr_tasks, setCurrTasks] = useState<Task[]>([]);
  const [init_tasks, setInitTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([
    { id: 1, description: '', amount: '', date: '' }
  ]);
  const [projectFiles, setProjectFiles] = useState<Array<{name: string, url: string}>>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch files when the component mounts or when project changes
  useEffect(() => {
    if (isOpen && project?.id) {
      fetchProjectFiles();
    }
  }, [isOpen, project?.id]);

  // Function to fetch files from the project's bucket
  const fetchProjectFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const bucketName = `project-${project.id}`;
      
      // List all files in the bucket
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list();
        
      if (error) {
        console.error('Error fetching files:', error);
        toast.error('Failed to load project files');
      } else if (data) {
        // Create URLs for each file
        const filesWithUrls = await Promise.all(
          data.map(async (file) => {
            const { data: urlData } = await supabase.storage
              .from(bucketName)
              .createSignedUrl(file.name, 3600); // URL valid for 1 hour
              
            return {
              name: file.name,
              url: urlData?.signedUrl || ''
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

  // Function to delete a file from the project's bucket
  const deleteFile = async (fileName: string) => {
    try {
      const bucketName = `project-${project.id}`;
      
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([fileName]);
        
      if (error) {
        console.error('Error deleting file:', error);
        toast.error(`Failed to delete ${fileName}: ${error.message}`);
      } else {
        toast.success(`${fileName} has been deleted successfully.`);
        // Refresh the file list after successful deletion
        fetchProjectFiles();
      }
    } catch (err) {
      console.error('Error in deleteFile:', err);
      toast.error('An error occurred while deleting the file');
    } finally {
      setFileToDelete(null);
    }
  };

  // Calculate progress based on completed tasks
  const progress = curr_tasks.length > 0 
    ? Math.round((curr_tasks.filter(task => task.completed).length / curr_tasks.length) * 100) 
    : 0;

  const addExpenseRow = () => {
    const newId = expenses.length + 1;
    setExpenses([...expenses, { id: newId, description: '', amount: '', date: '' }]);
  };

  const handleExpenseChange = (id: number, field: keyof ExpenseRow, value: string) => {
    setExpenses(expenses.map(expense => 
      expense.id === id ? { ...expense, [field]: value } : expense
    ));
  };

  const deleteExpenseRow = (id: number) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
  };

  const handleClose = () => {
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      // Create the bucket path using the project ID
      const bucketName = `project-${project.id}`;
      
      // Upload each file to the project's bucket
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = `${Date.now()}-${file.name}`;
        
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file);
          
        if (error) {
          console.error('Error uploading file:', error);
          toast.error(`Failed to upload ${file.name}: ${error.message}`);
        } else {
          console.log('File uploaded successfully:', data);
          toast.success(`${file.name} has been uploaded successfully.`);
          
          // Refresh the file list after successful upload
          fetchProjectFiles();
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error("An unexpected error occurred during upload.");
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);



  const loadTasks = async () => {
    const { data: tasks, error } = await supabase.from('tasks').select('*').eq('project_id', project.id);
    if (error) {
      console.error('Error loading tasks:', error);
    } else {
      setCurrTasks(tasks);
      setInitTasks(tasks);
    }
  };


  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl">{project.name}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pb-6">
            {/* Left column */}
            <div className="space-y-6">
              {/* Tasks section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <TaskList tasks={curr_tasks} onTasksChange={setCurrTasks} projectId={project.id} />
                </CardContent>
              </Card>

              {/* Files section */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
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
                  <div className="space-y-3">
                    <label className="block min-h-[100px] rounded-lg border-2 border-dashed border-primary/20 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-3 p-4 cursor-pointer bg-background">
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleFileChange}
                        multiple
                      />
                      <Upload className="h-6 w-6 text-primary/50" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-primary">Drop files here or click to upload</p>
                      </div>
                    </label>
                    
                    {/* File list */}
                    <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto">
                      {isLoadingFiles ? (
                        <div className="flex justify-center items-center py-4">
                          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : projectFiles.length > 0 ? (
                        projectFiles.map((file, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted"
                          >
                            <div className="flex items-center space-x-2 overflow-hidden">
                              <File className="h-4 w-4 flex-shrink-0 text-primary" />
                              <span className="text-sm truncate" title={file.name}>
                                {file.name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <a 
                                href={file.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                download
                                className="p-1 rounded-full hover:bg-background"
                              >
                                <Download className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                              </a>
                              <button
                                onClick={() => setFileToDelete(file.name)}
                                className="p-1 rounded-full hover:bg-background"
                                title="Delete file"
                              >
                                <Trash className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          No files uploaded yet
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Project Progress Wheel */}
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-primary">Project Progress</h3>
                <div className="flex justify-center items-center">
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
                        className="text-primary transition-all duration-300 ease-in-out"
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
                  </div>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-base text-primary">Budget</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">{project.budget}</div>
                    <p className="text-base text-muted-foreground">Under budget by 5%</p>
                  </CardContent>
                </Card>
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-base text-primary">Time Tracked</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">{project.time}</div>
                    <p className="text-base text-muted-foreground">Last 7 days: 32h</p>
                  </CardContent>
                </Card>
              </div>

              {/* Expenses Section */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-primary">Expenses</h3>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={addExpenseRow}
                    className="border-primary/20 hover:bg-primary/5"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Row
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-6 items-center">
                      <Input
                        placeholder="Description"
                        value={expense.description}
                        onChange={(e) => handleExpenseChange(expense.id, 'description', e.target.value)}
                        className="border-primary/20 h-11"
                      />
                      <Input
                        placeholder="Amount"
                        type="number"
                        value={expense.amount}
                        onChange={(e) => handleExpenseChange(expense.id, 'amount', e.target.value)}
                        className="border-primary/20 h-11"
                      />
                      <Input
                        type="date"
                        value={expense.date}
                        onChange={(e) => handleExpenseChange(expense.id, 'date', e.target.value)}
                        className="border-primary/20 h-11"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteExpenseRow(expense.id)}
                        className="text-muted-foreground hover:text-destructive h-11 w-11"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer - remove save button since we're saving immediately */}
          <div className="flex justify-end pt-6 mt-6 border-t border-primary/20">
            <Button 
              onClick={handleClose}
              className="bg-primary hover:bg-primary/90 h-11 px-6 text-base"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for File Deletion */}
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
    </>
  );
}