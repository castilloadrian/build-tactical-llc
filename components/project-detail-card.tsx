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
import { Plus, Trash2, Upload, Download, RefreshCw, File, Trash, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { TaskList } from "@/components/task-list";
import { User } from '@supabase/supabase-js';
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { ExpensesChart } from "@/components/expenses-chart";


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
  isEditing?: boolean;
  dbId?: number; // To track if this expense exists in the database
}

interface ProjectDetailCardProps {
  project: {
    id: number;
    name: string;
    tasks: string;
    budget: number;
    time: string;
    status?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectDetailCard({ project, isOpen, onClose }: ProjectDetailCardProps) {
  const [curr_tasks, setCurrTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [projectFiles, setProjectFiles] = useState<Array<{name: string, url: string}>>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [projectBudget, setProjectBudget] = useState<number>(project.budget);
  const [budgetUsage, setBudgetUsage] = useState<number>(0);
  const [isLoadingBudget, setIsLoadingBudget] = useState(false);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState<string>(project.budget.toString());
  const [projectStatus, setProjectStatus] = useState<string | undefined>(project.status);
  const supabase = createClient();
  const [isExpensesChartOpen, setIsExpensesChartOpen] = useState(false);

  // Fetch files when the component mounts or when project changes
  useEffect(() => {
    if (isOpen && project?.id) {
      fetchProjectFiles();
      fetchProjectBudget();
      fetchExpenses();
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

  // Function to fetch project data from Supabase
  const fetchProjectBudget = async () => {
    setIsLoadingBudget(true);
    try {
      // Fetch the project budget and status from the projects table
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('budget, status')  // Add status to the select query
        .eq('id', project.id)
        .single();
        
      if (projectError) {
        console.error('Error fetching project data:', projectError);
        toast.error('Failed to load project data');
        return;
      } else if (projectData) {
        setProjectBudget(projectData.budget);
        setNewBudget(projectData.budget.toString());
        
        // Update the project status state
        if (projectData.status) {
          setProjectStatus(projectData.status);
        }
      }
      
      // Fetch expenses from the expenses table
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('cost')
        .eq('project_id', project.id);
        
      if (expensesError) {
        console.error('Error fetching expenses:', expensesError);
        toast.error('Failed to load expense data');
        return;
      }
      
      // Calculate total expenses
      const totalExpenses = expensesData.reduce((sum, expense) => {
        // Convert string amount to number and add to sum
        const expenseAmount = parseFloat(expense.cost) || 0;
        return sum + expenseAmount;
      }, 0);
      
      // Calculate budget usage percentage
      if (projectData.budget > 0) {
        const usagePercentage = Math.round((totalExpenses / projectData.budget) * 100);
        setBudgetUsage(usagePercentage);
      } else if (totalExpenses > 0) {
        // If budget is 0 but there are expenses, set to over budget (100%+)
        setBudgetUsage(101); // Just over 100% to trigger the "over budget" display
      } else {
        setBudgetUsage(0);
      }
      
    } catch (err) {
      console.error('Error in fetchProjectBudget:', err);
      toast.error('An error occurred while loading budget information');
    } finally {
      setIsLoadingBudget(false);
    }
  };

  // Function to fetch expenses from the database
  const fetchExpenses = async () => {
    setIsLoadingExpenses(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching expenses:', error);
        toast.error('Failed to load expenses');
      } else if (data) {
        // Transform database expenses to ExpenseRow format
        const formattedExpenses = data.map(expense => ({
          id: expense.id, // Use the database ID for existing expenses
          dbId: expense.id,
          description: expense.description || '',
          amount: expense.cost ? expense.cost.toString() : '',
          date: expense.created_at || '',
          isEditing: false
        }));
        
        setExpenses(formattedExpenses);
      }
    } catch (err) {
      console.error('Error in fetchExpenses:', err);
      toast.error('An error occurred while loading expenses');
    } finally {
      setIsLoadingExpenses(false);
    }
  };

  // Calculate progress based on completed tasks
  const progress = curr_tasks.length > 0 
    ? Math.round((curr_tasks.filter(task => task.completed).length / curr_tasks.length) * 100) 
    : 0;

  // Add a new expense row
  const addExpenseRow = () => {
    const newId = Date.now(); // Use timestamp as temporary ID
    setExpenses([
      {
        id: newId,
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0], // Today's date
        isEditing: true
      },
      ...expenses
    ]);
  };

  // Handle expense field changes
  const handleExpenseChange = (id: number, field: keyof ExpenseRow, value: string) => {
    setExpenses(expenses.map(expense => 
      expense.id === id ? { ...expense, [field]: value } : expense
    ));
  };

  // Toggle editing mode for an expense
  const toggleExpenseEdit = (id: number) => {
    setExpenses(expenses.map(expense => 
      expense.id === id ? { ...expense, isEditing: !expense.isEditing } : expense
    ));
  };

  // Save an individual expense
  const saveExpense = async (expense: ExpenseRow) => {
    try {
      // Validate expense data
      if (!expense.description.trim() || !expense.amount.trim()) {
        toast.error('Description and amount are required');
        return;
      }

      const expenseData = {
        project_id: project.id,
        description: expense.description,
        cost: parseFloat(expense.amount),
        created_at: expense.date
      };

      let result;
      
      if (expense.dbId) {
        // Update existing expense
        result = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', expense.dbId);
      } else {
        // Insert new expense
        result = await supabase
          .from('expenses')
          .insert(expenseData)
          .select();
      }

      if (result.error) {
        console.error('Error saving expense:', result.error);
        toast.error('Failed to save expense');
      } else {
        toast.success('Expense saved successfully');
        
        // Update the expense in state with the database ID and turn off editing mode
        if (!expense.dbId && result.data && result.data[0]) {
          setExpenses(expenses.map(e => 
            e.id === expense.id 
              ? { ...e, dbId: result.data[0].id, isEditing: false } 
              : e
          ));
        } else {
          setExpenses(expenses.map(e => 
            e.id === expense.id ? { ...e, isEditing: false } : e
          ));
        }
        
        // Refresh budget data to reflect the new expense
        fetchProjectBudget();
      }
    } catch (err) {
      console.error('Error in saveExpense:', err);
      toast.error('An error occurred while saving the expense');
    }
  };

  // Delete an expense
  const deleteExpense = async (expense: ExpenseRow) => {
    try {
      if (expense.dbId) {
        // Delete from database if it exists there
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', expense.dbId);
          
        if (error) {
          console.error('Error deleting expense:', error);
          toast.error('Failed to delete expense');
          return;
        }
      }
      
      // Remove from state
      setExpenses(expenses.filter(e => e.id !== expense.id));
      toast.success('Expense deleted successfully');
      
      // Refresh budget data
      fetchProjectBudget();
    } catch (err) {
      console.error('Error in deleteExpense:', err);
      toast.error('An error occurred while deleting the expense');
    }
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

  const loadTasks = async () => {
    const { data: tasks, error } = await supabase.from('tasks').select('*').eq('project_id', project.id);
    if (error) {
      console.error('Error loading tasks:', error);
    } else {
      // Make sure to map the database field 'is_complete' to the UI field 'completed'
      const formattedTasks = tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        completed: task.is_complete // This mapping is crucial
      }));
      setCurrTasks(formattedTasks);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Function to update the project budget in the database
  const updateProjectBudget = async () => {
    try {
      // Validate the budget input
      const budgetValue = parseFloat(newBudget);
      if (isNaN(budgetValue) || budgetValue < 0) {
        toast.error('Please enter a valid budget amount');
        return;
      }

      // Update the budget in the database
      const { error } = await supabase
        .from('projects')
        .update({ budget: budgetValue })
        .eq('id', project.id);
        
      if (error) {
        console.error('Error updating budget:', error);
        toast.error('Failed to update budget');
      } else {
        setProjectBudget(budgetValue);
        setIsEditingBudget(false);
        toast.success('Budget updated successfully');
        
        // Refresh budget data to update the usage percentage
        fetchProjectBudget();
      }
    } catch (err) {
      console.error('Error in updateProjectBudget:', err);
      toast.error('An error occurred while updating the budget');
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <DialogTitle className="text-2xl">{project.name}</DialogTitle>
              <span 
                data-project-status
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  projectStatus === 'Completed' ? 'bg-green-100 text-green-800' :
                  projectStatus === 'Active' ? 'bg-blue-100 text-blue-800' :
                  projectStatus === 'On Hold' ? 'bg-amber-100 text-amber-800' :
                  projectStatus === 'Cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {projectStatus || 'No Status'}
              </span>
            </div>
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
              <div className="grid grid-cols-1 gap-6">
                <Card className="border-primary/20">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base text-primary">Budget</CardTitle>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setIsExpensesChartOpen(true)}
                          className="h-8 px-2"
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Chart
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsEditingBudget(!isEditingBudget)}
                          className="h-8 px-2"
                        >
                          {isEditingBudget ? 'Cancel' : 'Edit'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingBudget ? (
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Loading...</span>
                      </div>
                    ) : isEditingBudget ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-bold">$</span>
                          <Input
                            type="number"
                            value={newBudget}
                            onChange={(e) => setNewBudget(e.target.value)}
                            className="border-primary/20"
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
                      <>
                        <div className="text-3xl font-bold text-primary">${projectBudget.toLocaleString()}</div>
                        <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${budgetUsage > 100 ? 'bg-destructive' : 'bg-primary'}`}
                            style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-base text-muted-foreground mt-1">
                          {budgetUsage > 100 
                            ? `Over budget by ${projectBudget === 0 ? '∞' : `${budgetUsage - 100}%`}` 
                            : `${budgetUsage}% used`}
                        </p>
                      </>
                    )}
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
                    Add Expense
                  </Button>
                </div>
                
                {isLoadingExpenses ? (
                  <div className="flex justify-center items-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {expenses.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        No expenses recorded yet
                      </p>
                    ) : (
                      expenses.map((expense) => (
                        <Card key={expense.id} className="border-primary/10">
                          <CardContent className="p-4">
                            {expense.isEditing ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 gap-3">
                                  <Input
                                    placeholder="Description"
                                    value={expense.description}
                                    onChange={(e) => handleExpenseChange(expense.id, 'description', e.target.value)}
                                    className="border-primary/20"
                                  />
                                  <div className="grid grid-cols-2 gap-3">
                                    <Input
                                      placeholder="Amount"
                                      type="number"
                                      value={expense.amount}
                                      onChange={(e) => handleExpenseChange(expense.id, 'amount', e.target.value)}
                                      className="border-primary/20"
                                    />
                                    <Input
                                      type="date"
                                      value={expense.date}
                                      onChange={(e) => handleExpenseChange(expense.id, 'date', e.target.value)}
                                      className="border-primary/20"
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleExpenseEdit(expense.id)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => saveExpense(expense)}
                                    className="bg-primary hover:bg-primary/90"
                                  >
                                    Save
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
                                <div className="flex justify-end space-x-2 mt-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleExpenseEdit(expense.id)}
                                    className="h-8 px-2"
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteExpense(expense)}
                                    className="h-8 px-2 text-destructive hover:text-destructive"
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}
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

      {/* Add a Dialog for the expenses chart */}
      <Dialog open={isExpensesChartOpen} onOpenChange={setIsExpensesChartOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Expense Analysis</DialogTitle>
          </DialogHeader>
          <ExpensesChart 
            projectId={project.id} 
            expenses={expenses} 
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
    </>
  );
}