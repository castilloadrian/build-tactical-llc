import { Plus, Trash2, Pencil, Save, X, AlertCircle } from "lucide-react";
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
  created_at?: string;
  due_at?: string;
}

interface TaskListProps {
  tasks: TaskItem[];
  onTasksChange: (tasks: TaskItem[]) => void;
  projectId: number;
}

export function TaskList({ tasks, onTasksChange, projectId }: TaskListProps) {
  const [newTask, setNewTask] = useState({ title: '', description: '', due_at: '' });
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<TaskItem | null>(null);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const supabase = createClient();

  // Helper function to format dates consistently
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Helper function to format dates for input fields (YYYY-MM-DD)
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Add CSS for the pulse animation
  useEffect(() => {
    // Create a style element
    const style = document.createElement('style');
    // Define the keyframes and animation
    style.textContent = `
      @keyframes pulse-border {
        0% {
          border-color: rgba(239, 68, 68, 0.7);
        }
        50% {
          border-color: rgba(239, 68, 68, 1);
        }
        100% {
          border-color: rgba(239, 68, 68, 0.7);
        }
      }
      .overdue-task {
        animation: pulse-border 2s infinite;
      }
    `;
    // Append the style to the document head
    document.head.appendChild(style);
    
    // Clean up
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const addTask = async () => {
    if (!newTask.title.trim()) return;

    const { data: taskData, error: taskError } = await supabase.from('tasks').insert({
      project_id: projectId,
      title: newTask.title,
      description: newTask.description,
      is_complete: false,
      due_at: newTask.due_at || null
    }).select();

    if (taskError) {
      console.error('Error adding task:', taskError);
      return;
    }

    const addedTask = {
      id: taskData[0].id,
      title: taskData[0].title,
      description: taskData[0].description,
      completed: taskData[0].is_complete,
      created_at: taskData[0].created_at,
      due_at: taskData[0].due_at
    };

    onTasksChange([...tasks, addedTask]);
    setNewTask({ title: '', description: '', due_at: '' });
    setShowNewTaskForm(false);
  };

  const startEditing = (task: TaskItem) => {
    // Format the due_at date for the date input (YYYY-MM-DD)
    let formattedTask = { ...task };
    if (task.due_at) {
      formattedTask.due_at = formatDateForInput(task.due_at);
    }
    
    setEditingTask(task.id);
    setEditForm(formattedTask);
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setEditForm(null);
  };

  const saveTask = async (id: number) => {
    if (!editForm) return;

    try {
      const { data, error: taskError } = await supabase
        .from('tasks')
        .update({
          title: editForm.title,
          description: editForm.description,
          is_complete: editForm.completed,
          due_at: editForm.due_at || null
        })
        .eq('id', id)
        .select();

      if (taskError) throw taskError;

      if (data && data.length > 0) {
        const updatedTask = {
          id: data[0].id,
          title: data[0].title,
          description: data[0].description,
          completed: data[0].is_complete,
          created_at: data[0].created_at,
          due_at: data[0].due_at
        };
        
        const updatedTasks = tasks.map(task =>
          task.id === id ? updatedTask : task
        );
        onTasksChange(updatedTasks);
      } else {
        const updatedTasks = tasks.map(task =>
          task.id === id ? { ...editForm } : task
        );
        onTasksChange(updatedTasks);
      }
      
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
        completed: task.is_complete, // Make sure this matches the database field name
        created_at: task.created_at, // Include the created_at timestamp
        due_at: task.due_at
      }));
      
      onTasksChange(formattedTasks);
    }
  };

  // Make sure to call loadTasks when the component mounts
  useEffect(() => {
    loadTasks();
  }, [projectId]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNewTaskForm(!showNewTaskForm)}
          className="border-primary/20 hover:bg-primary/5"
        >
          <Plus className="h-4 w-4 mr-2" />
          {showNewTaskForm ? 'Cancel' : 'Add Task'}
        </Button>
      </div>
      
      {/* New Task Input Section - Conditionally rendered */}
      {showNewTaskForm && (
        <div className="grid grid-cols-1 gap-4 items-start bg-muted/10 p-4 rounded-lg border border-primary/20">
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
            <div className="flex items-center">
              <label className="text-sm text-muted-foreground mr-2">Due Date:</label>
              <Input
                type="date"
                value={newTask.due_at}
                onChange={(e) => setNewTask({ ...newTask, due_at: e.target.value })}
                className="border-primary/20 h-11 text-sm"
              />
            </div>
            <Button
              variant="default"
              onClick={addTask}
              className="w-full mt-2 bg-primary hover:bg-primary/90"
            >
              Add Task
            </Button>
          </div>
        </div>
      )}

      {/* Existing Tasks */}
      <div className="space-y-3">
        {tasks.length > 0 ? (
          tasks.map((task) => {
            const isOverdue = task.due_at && new Date(task.due_at) < new Date() && !task.completed;
            return (
            <div 
              key={task.id} 
              className={`grid grid-cols-[auto_1fr_auto_auto] gap-4 items-start bg-muted/10 p-4 rounded-lg
                ${isOverdue ? 'border-2 border-red-500 bg-red-50/10 overdue-task' : ''}
              `}
            >
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
                    <div className="flex items-center">
                      <label className="text-sm text-muted-foreground mr-2">Due Date:</label>
                      <Input
                        type="date"
                        value={editForm?.due_at || ''}
                        onChange={(e) => setEditForm(prev => prev ? { ...prev, due_at: e.target.value } : null)}
                        className="border-primary/20 h-11 text-sm"
                      />
                    </div>
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
                    <div className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>{task.title}</div>
                    <div className="text-sm text-muted-foreground">{task.description}</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {task.created_at && (
                        <div className="text-xs text-muted-foreground">
                          Created: {formatDate(task.created_at)}
                        </div>
                      )}
                      {task.due_at && (
                        <div className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                          {isOverdue && <AlertCircle className="h-3 w-3" />}
                          Due: {formatDate(task.due_at)}
                        </div>
                      )}
                    </div>
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
            );
          })
        ) : (
          <div className="text-center py-6 text-muted-foreground bg-muted/10 rounded-lg">
            <p>No tasks yet.</p>
            <p className="text-sm mt-1">Click "Add Task" to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
}