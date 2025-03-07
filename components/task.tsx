import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TaskProps {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  onTaskChange: (id: number, field: 'title' | 'description' | 'completed', value: any) => void;
  onDelete: (id: number) => void;
}

export function Task({ id, title, description, completed, onTaskChange, onDelete }: TaskProps) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-start bg-muted/10 p-4 rounded-lg">
      <input
        type="checkbox"
        checked={completed}
        onChange={(e) => onTaskChange(id, 'completed', e.target.checked)}
        className="w-5 h-5 mt-3"
      />
      <div className="space-y-2 w-full">
        <Input
          placeholder="Task title"
          value={title}
          onChange={(e) => onTaskChange(id, 'title', e.target.value)}
          className="border-primary/20 h-11 font-medium"
        />
        <Input
          placeholder="Task description"
          value={description}
          onChange={(e) => onTaskChange(id, 'description', e.target.value)}
          className="border-primary/20 h-11 text-sm"
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(id)}
        className="text-muted-foreground hover:text-destructive h-11 w-11 mt-2"
      >
        <Trash2 className="h-5 w-5" />
      </Button>
    </div>
  );
} 