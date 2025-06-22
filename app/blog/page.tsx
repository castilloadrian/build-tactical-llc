'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Plus, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateBlogPostModal } from '@/components/create-blog-post-modal';
import { ViewBlogPostModal } from '@/components/view-blog-post-modal';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface BlogPost {
  id: number;
  title: string;
  details: string;
  created_at: string;
  image_url?: string | null;
}

interface SupabaseBlogPost {
  id: number;
  title: string;
  details: string;
  created_at: string;
  image_url?: string | null;
}

export default function Blog() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        setIsAdmin(userData?.role === 'Admin');
      }
    }
    
    checkRole();
  }, []);

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          id,
          title,
          details,
          created_at,
          image_url
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      setPosts(data as BlogPost[]);
    }

    fetchPosts();
  }, []);

  const handlePostCreated = async () => {
    // Refresh posts after creating a new one
    const { data: newPosts } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        details,
        created_at,
        image_url
      `)
      .order('created_at', { ascending: false });

    setPosts(newPosts as BlogPost[]);
  };

  const handlePostClick = (post: BlogPost, e?: React.MouseEvent) => {
    // Don't open modal if clicking on dropdown menu
    if (e && (e.target as HTMLElement).closest('[data-radix-popper-content-wrapper]')) {
      return;
    }
    setSelectedPost(post);
    setIsViewModalOpen(true);
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    
    setIsDeleting(true);
    try {
      // First, delete the image from storage if it exists
      if (postToDelete.image_url) {
        // Extract filename from the URL
        const filename = postToDelete.image_url.split('/').pop();
        if (filename) {
          const { error: storageError } = await supabase.storage
            .from('blog-images')
            .remove([filename]);
          
          if (storageError) {
            console.error('Error deleting image from storage:', storageError);
            // Continue with database deletion even if storage deletion fails
          }
        }
      }
      
      // Delete the blog post from database
      const { error: dbError } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postToDelete.id);
        
      if (dbError) {
        throw dbError;
      }
      
      // Update local state
      setPosts(posts.filter(post => post.id !== postToDelete.id));
      toast.success('Blog post deleted successfully');
      
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete blog post');
    } finally {
      setIsDeleting(false);
      setPostToDelete(null);
    }
  };

  const confirmDelete = (post: BlogPost, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the post modal
    setPostToDelete(post);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex justify-between items-start mb-16 border-b pb-8">
          <div className="flex-1 pr-8">
            <h1 className="text-4xl font-bold tracking-tight">Blog Posts</h1>
            <p className="text-muted-foreground mt-2">Stay up to date with our latest insights and updates</p>
          </div>
          {isAdmin && posts.length > 0 && (
            <div className="flex-shrink-0">
              <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 h-11 px-6">
                <Plus className="h-4 w-4" />
                Create Post
              </Button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No blog posts yet</h3>
            <p className="text-muted-foreground mb-8 max-w-md">
              {isAdmin 
                ? "Get started by creating your first blog post to share insights and updates with your audience."
                : "Check back soon for the latest insights and updates from our team."
              }
            </p>
            {isAdmin && (
              <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Post
              </Button>
            )}
          </div>
        ) : (
                     /* Blog Posts Grid */
           <div className="animate-fade-in-up [animation-delay:400ms] opacity-0 [animation-fill-mode:forwards]">
             <div className={`grid gap-8 max-w-6xl mx-auto ${
               posts.length === 1 
                 ? 'grid-cols-1 max-w-2xl' 
                 : posts.length === 2 
                 ? 'grid-cols-1 md:grid-cols-2 max-w-4xl' 
                 : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
             }`}>
               {posts.map((post) => (
                 <Card 
                   key={post.id} 
                   className="border-border hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer hover:border-accent/50 relative"
                   onClick={(e) => handlePostClick(post, e)}
                 >
                   {/* Admin Actions */}
                   {isAdmin && (
                     <div className="absolute top-3 right-3 z-10">
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button
                             variant="secondary"
                             size="sm"
                             className="h-8 w-8 p-0 bg-black/80 hover:bg-black/90 text-white border border-white/20 shadow-lg backdrop-blur-sm"
                             onClick={(e) => e.stopPropagation()}
                           >
                             <MoreVertical className="h-4 w-4" />
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                           <DropdownMenuItem
                             onClick={(e) => confirmDelete(post, e)}
                             className="text-red-600 hover:text-red-700 hover:bg-red-50"
                           >
                             <Trash2 className="h-4 w-4 mr-2" />
                             Delete Post
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                     </div>
                   )}
                   
                   <div className="relative w-full aspect-[16/9] bg-accent/5">
                     <Image
                       src={post.image_url || "/build-tactical-llc-logo.png"}
                       alt={post.image_url ? `${post.title} featured image` : "Build Tactical LLC Logo"}
                       fill
                       sizes="(max-width: 768px) 100vw, 50vw"
                       className={post.image_url ? "object-cover" : "object-contain p-8"}
                       priority
                     />
                   </div>
                   <CardHeader>
                     <CardTitle className="text-2xl line-clamp-2">{post.title}</CardTitle>
                     <div className="text-sm text-muted-foreground">
                       {new Date(post.created_at).toLocaleDateString()}
                     </div>
                   </CardHeader>
                   <CardContent>
                     <p className="text-lg text-muted-foreground leading-relaxed line-clamp-3">
                       {post.details}
                     </p>
                   </CardContent>
                 </Card>
               ))}
             </div>
           </div>
        )}
      </div>

      <CreateBlogPostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handlePostCreated}
      />

      <ViewBlogPostModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedPost(null);
        }}
        post={selectedPost}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{postToDelete?.title}"? This action cannot be undone.
              This will permanently delete the blog post and its associated image.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 