import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { TaskList } from "@/components/task-list";
import { User } from '@supabase/supabase-js';
import { createClient } from "@/utils/supabase/client";


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
  const [tasks, setTasks] = useState<Task[]>([
    { id: 0, title: '', description: '', completed: false }
  ]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([
    { id: 1, description: '', amount: '', date: '' }
  ]);

  const supabase = createClient();

  // Calculate progress based on completed tasks
  const progress = tasks.length > 0 
    ? Math.round((tasks.filter(task => task.completed).length / tasks.length) * 100) 
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

  const handleSave = async () => {
    for (const task of tasks) {
      const { data: taskData, error: taskError } = await supabase.from('tasks').update({
        project_id: project.id,
        title: task.title,
        description: task.description,
        completed: task.completed
      }).eq('id', task.id);
      if (taskError) {
        console.error('Error updating task:', taskError);
      } else {
        console.log('Task updated:', taskData);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // TODO: Handle file upload logic here
      console.log('Selected files:', files);
    }
  };



  const loadTasks = async () => {
    const { data: tasks, error } = await supabase.from('tasks').select('*').eq('project_id', project.id);
    if (error) {
      console.error('Error loading tasks:', error);
    } else {
      setTasks(tasks);
    }
  };




  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-primary">{project.name}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 space-y-8 overflow-y-auto pr-2">
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

          {/* Tasks Section */}
          <TaskList tasks={tasks} onTasksChange={setTasks}  />

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

          {/* Add File Upload Section */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-primary">Project Files</h3>
            <label className="block min-h-[160px] rounded-lg border-2 border-dashed border-primary/20 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-3 p-8 cursor-pointer bg-background">
              <input 
                type="file" 
                className="hidden" 
                onChange={handleFileChange}
                multiple
              />
              <Upload className="h-8 w-8 text-primary/50" />
              <div className="text-center">
                <p className="text-base font-medium text-primary">Drop files here or click to upload</p>
                <p className="text-sm text-muted-foreground mt-1">Upload any project-related documents</p>
              </div>
            </label>
            
            <div className="text-sm text-muted-foreground">
              Supported files: PDF, DOC, XLS, JPG, PNG
            </div>
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

        {/* Footer with Save Button */}
        <div className="flex justify-end pt-6 mt-6 border-t border-primary/20">
          <Button 
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90 h-11 px-6 text-base"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 