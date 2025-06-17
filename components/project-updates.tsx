"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Clock, User } from "lucide-react";
import { toast } from "sonner";

interface ProjectUpdate {
  id: number;
  content: string;
  created_at: string;
  user_id: string;
  project_id: number;
  user_name?: string;
  user_email?: string;
}

interface ProjectUpdatesProps {
  projectId: number;
}

export function ProjectUpdates({ projectId }: ProjectUpdatesProps) {
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [newUpdate, setNewUpdate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchUpdates();
  }, [projectId]);

  const fetchUpdates = async () => {
    setIsLoading(true);
    try {
      // Fetch updates without user join first (simpler and more reliable)
      const { data, error } = await supabase
        .from('project_updates')
        .select('id, content, created_at, user_id, project_id')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching updates:', error);
        toast.error('Failed to load project updates');
        return;
      }

      if (data) {
        // Get user emails separately to avoid complex joins
        const userIds = Array.from(new Set(data.map(update => update.user_id)));
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds);

        const userEmailMap = new Map(
          usersData?.map(user => [user.id, user.email]) || []
        );

        const formattedUpdates = data.map(update => ({
          id: update.id,
          content: update.content,
          created_at: update.created_at,
          user_id: update.user_id,
          project_id: update.project_id,
          user_email: userEmailMap.get(update.user_id) || 'Unknown User'
        }));
        
        setUpdates(formattedUpdates);
      }
    } catch (err) {
      console.error('Error in fetchUpdates:', err);
      toast.error('An error occurred while loading updates');
    } finally {
      setIsLoading(false);
    }
  };

  const addUpdate = async () => {
    if (!newUpdate.trim()) {
      toast.error('Please enter an update message');
      return;
    }

    setIsSubmitting(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to add updates');
        return;
      }

      // Insert the new update
      const { data: insertData, error: insertError } = await supabase
        .from('project_updates')
        .insert([
          {
            content: newUpdate.trim(),
            project_id: projectId,
            user_id: user.id
          }
        ])
        .select('id, content, created_at, user_id, project_id')
        .single();

      if (insertError) {
        console.error('Error adding update:', insertError);
        toast.error('Failed to add update');
        return;
      }

      if (insertData) {
        const newUpdateFormatted = {
          id: insertData.id,
          content: insertData.content,
          created_at: insertData.created_at,
          user_id: insertData.user_id,
          project_id: insertData.project_id,
          user_email: user.email || 'Unknown User'
        };

        // Add to the beginning of the list
        setUpdates([newUpdateFormatted, ...updates]);
        setNewUpdate("");
        toast.success('Update added successfully');
      }
    } catch (err) {
      console.error('Error in addUpdate:', err);
      toast.error('An error occurred while adding the update');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <CardTitle>Project Updates</CardTitle>
          <span className="text-sm text-muted-foreground">({updates.length})</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new update form */}
        <div className="space-y-3">
          <Textarea
            value={newUpdate}
            onChange={(e) => setNewUpdate(e.target.value)}
            placeholder="Share an update about this project..."
            className="border-primary/20 min-h-[80px] resize-none"
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {newUpdate.length}/500 characters
            </span>
            <Button 
              onClick={addUpdate} 
              disabled={isSubmitting || !newUpdate.trim()}
              className="flex items-center gap-2"
              size="sm"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Posting...' : 'Post Update'}
            </Button>
          </div>
        </div>

        {/* Updates list */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading updates...
            </div>
          ) : updates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No updates yet. Be the first to share an update!</p>
            </div>
          ) : (
            updates.map((update) => (
              <div 
                key={update.id} 
                className="p-4 rounded-lg border border-primary/10 bg-muted/20 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{update.user_email}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(update.created_at)}</span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {update.content}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 