import { Plus, Trash2, Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Task } from "@/components/task";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface TaskItem {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

interface TaskListProps {
  tasks: TaskItem[];
  onTasksChange: (tasks: TaskItem[]) => void;
  projectId: number;
}

export function TaskList({ tasks, onTasksChange, projectId }: TaskListProps) {
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<TaskItem | null>(null);
  const supabase = createClient();

  const addTask = async () => {
    if (!newTask.title.trim()) return;

    const { data: taskData, error: taskError } = await supabase.from('tasks').insert({
      project_id: projectId,
      title: newTask.title,
      description: newTask.description,
      is_complete: false
    }).select();

    if (taskError) {
      console.error('Error adding task:', taskError);
      return;
    }

    const addedTask = {
      id: taskData[0].id,
      title: taskData[0].title,
      description: taskData[0].description,
      completed: taskData[0].is_complete
    };

    onTasksChange([...tasks, addedTask]);
    setNewTask({ title: '', description: '' });
  };

  const startEditing = (task: TaskItem) => {
    setEditingTask(task.id);
    setEditForm({ ...task });
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setEditForm(null);
  };

  const saveTask = async (id: number) => {
    if (!editForm) return;

    try {
      const { error: taskError } = await supabase
        .from('tasks')
        .update({
          title: editForm.title,
          description: editForm.description,
          is_complete: editForm.completed
        })
        .eq('id', id);

      if (taskError) throw taskError;

      const updatedTasks = tasks.map(task =>
        task.id === id ? { ...editForm } : task
      );
      onTasksChange(updatedTasks);
      setEditingTask(null);
      setEditForm(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const toggleComplete = async (task: TaskItem) => {
    try {
      console.log('Toggling task completion for task ID:', task.id);
      console.log('Current completion status:', task.completed);
      console.log('New completion status:', !task.completed);
      
      // Update in the database
      const { data, error: taskError } = await supabase
        .from('tasks')
        .update({
          is_complete: !task.completed // Make sure this field name matches your database schema
        })
        .eq('id', task.id)
        .select();

      if (taskError) {
        console.error('Error updating task completion:', taskError);
        throw taskError;
      }
      
      console.log('Database update response:', data);

      // Update in the local state
      const updatedTasks = tasks.map(t =>
        t.id === task.id ? { ...t, completed: !t.completed } : t
      );
      onTasksChange(updatedTasks);
    } catch (error) {
      console.error('Error updating task completion:', error);
    }
  };

  const deleteTask = async (id: number) => {
    try {
      const { error: taskError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (taskError) throw taskError;

      onTasksChange(tasks.filter(task => task.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Function to load tasks from the database
  const loadTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId);
      
    if (error) {
      console.error('Error loading tasks:', error);
    } else if (data) {
      // Transform database tasks to match our UI structure
      const formattedTasks = data.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        completed: task.is_complete // Make sure this matches the database field name
      }));
      
      onTasksChange(formattedTasks);
    }
  };

  // Make sure to call loadTasks when the component mounts
  useEffect(() => {
    loadTasks();
  }, [projectId]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-primary">Tasks</h3>
        
        {/* New Task Input Section */}
        <div className="grid grid-cols-[1fr_auto] gap-4 items-start bg-muted/10 p-4 rounded-lg">
          <div className="space-y-2 w-full">
            <Input
              placeholder="New task title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="border-primary/20 h-11 font-medium"
            />
            <Input
              placeholder="New task description"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="border-primary/20 h-11 text-sm"
            />
          </div>
          <Button
            variant="outline"
            onClick={addTask}
            className="border-primary/20 hover:bg-primary/5 h-11"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Existing Tasks */}
        {tasks.map((task) => (
          <div key={task.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-4 items-start bg-muted/10 p-4 rounded-lg">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleComplete(task)}
              className="w-5 h-5 mt-3"
            />
            {editingTask === task.id ? (
              <>
                <div className="space-y-2 w-full">
                  <Input
                    placeholder="Task title"
                    value={editForm?.title}
                    onChange={(e) => setEditForm(prev => prev ? { ...prev, title: e.target.value } : null)}
                    className="border-primary/20 h-11 font-medium"
                  />
                  <Input
                    placeholder="Task description"
                    value={editForm?.description}
                    onChange={(e) => setEditForm(prev => prev ? { ...prev, description: e.target.value } : null)}
                    className="border-primary/20 h-11 text-sm"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => saveTask(task.id)}
                  className="text-green-600 hover:text-green-700 h-11 w-11 mt-2"
                >
                  <Save className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={cancelEditing}
                  className="text-muted-foreground hover:text-destructive h-11 w-11 mt-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-1 py-2">
                  <div className="font-medium">{task.title}</div>
                  <div className="text-sm text-muted-foreground">{task.description}</div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => startEditing(task)}
                  className="text-muted-foreground hover:text-primary h-11 w-11 mt-2"
                >
                  <Pencil className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTask(task.id)}
                  className="text-muted-foreground hover:text-destructive h-11 w-11 mt-2"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}