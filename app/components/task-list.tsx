interface TaskListProps {
  projectId: number;
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  isReadOnly?: boolean;  // Add this prop
}

export function TaskList({ projectId, tasks, onTasksChange, isReadOnly = false }: TaskListProps) {
  // Modify your add/edit/delete buttons to be conditionally rendered or disabled
  return (
    <div>
      {/* Only show add button if not read-only */}
      {!isReadOnly && (
        <Button onClick={handleAddTask}>
          Add Task
        </Button>
      )}

      {tasks.map(task => (
        <div key={task.id}>
          {/* Disable edit/delete buttons if read-only */}
          <Button
            onClick={() => handleEditTask(task)}
            disabled={isReadOnly}
          >
            Edit
          </Button>
          <Button
            onClick={() => handleDeleteTask(task)}
            disabled={isReadOnly}
          >
            Delete
          </Button>
        </div>
      ))}
    </div>
  );
} 