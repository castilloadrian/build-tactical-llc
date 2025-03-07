import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Task } from "@/components/task";
import { useState } from "react";

interface TaskItem {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

interface TaskListProps {
  tasks: TaskItem[];
  onTasksChange: (tasks: TaskItem[]) => void;
}

export function TaskList({ tasks, onTasksChange }: TaskListProps) {
  const [nextId, setNextId] = useState(() => {
    // Initialize nextId to be one more than the highest existing task id
    const maxId = tasks.reduce((max, task) => Math.max(max, task.id), 0);
    return maxId + 1;
  });

  const addTask = () => {
    onTasksChange([...tasks, { 
      id: nextId, 
      title: '', 
      description: '', 
      completed: false 
    }]);
    setNextId(nextId + 1);
  };

  const handleTaskChange = (id: number, field: keyof TaskItem, value: any) => {
    onTasksChange(tasks.map(task => 
      task.id === id ? { ...task, [field]: value } : task
    ));
  };

  const deleteTask = (id: number) => {
    onTasksChange(tasks.filter(task => task.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-primary">Tasks</h3>
        <Button
          variant="outline"
          size="default"
          onClick={addTask}
          className="border-primary/20 hover:bg-primary/5"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Task
        </Button>
      </div>
      
      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="grid grid-cols-[auto_1fr_auto] gap-4 items-start bg-muted/10 p-4 rounded-lg">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={(e) => handleTaskChange(task.id, 'completed', e.target.checked)}
              className="w-5 h-5 mt-3"
            />
            <div className="space-y-2 w-full">
              <Input
                placeholder="Task title"
                value={task.title}
                onChange={(e) => handleTaskChange(task.id, 'title', e.target.value)}
                className="border-primary/20 h-11 font-medium"
              />
              <Input
                placeholder="Task description"
                value={task.description}
                onChange={(e) => handleTaskChange(task.id, 'description', e.target.value)}
                className="border-primary/20 h-11 text-sm"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteTask(task.id)}
              className="text-muted-foreground hover:text-destructive h-11 w-11 mt-2"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}