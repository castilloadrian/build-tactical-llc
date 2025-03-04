import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface ProjectDetailCardProps {
  project: {
    name: string;
    progress: number;
    tasks: string;
    budget: string;
    time: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

interface ExpenseRow {
  id: number;
  description: string;
  amount: string;
  date: string;
}

export function ProjectDetailCard({ project, isOpen, onClose }: ProjectDetailCardProps) {
  const [progress, setProgress] = useState(project.progress);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([
    { id: 1, description: '', amount: '', date: '' }
  ]);

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

  const handleSave = () => {
    console.log('Saving expenses:', expenses);
    // TODO: Implement save functionality
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // TODO: Handle file upload logic here
      console.log('Selected files:', files);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-primary">{project.name}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 space-y-8 overflow-y-auto pr-2">
          {/* Project Overview */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-primary">Project Progress</h3>
            <Slider 
              value={[progress]} 
              onValueChange={(value) => setProgress(value[0])}
              max={100} 
              step={1}
              className="py-6"
            />
            <div className="flex justify-between text-base text-muted-foreground">
              <span>Progress: <span className="text-primary">{progress}%</span></span>
              <span>Target: <span className="text-primary">100%</span></span>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-base text-primary">Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{project.tasks}</div>
                <p className="text-base text-muted-foreground">Completion rate: 85%</p>
              </CardContent>
            </Card>
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
            <label className="
              block
              min-h-[160px] 
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
              gap-3
              p-8
              cursor-pointer
              bg-background
            ">
              <input 
                type="file" 
                className="hidden" 
                onChange={handleFileChange}
                multiple // Allow multiple file selection
              />
              <Upload className="h-8 w-8 text-primary/50" />
              <div className="text-center">
                <p className="text-base font-medium text-primary">Drop files here or click to upload</p>
                <p className="text-sm text-muted-foreground mt-1">Upload any project-related documents</p>
              </div>
            </label>
            
            {/* TODO: Add file list here */}
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