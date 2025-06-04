'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateBlogPostModal } from '@/components/create-blog-post-modal';
import { ViewBlogPostModal } from '@/components/view-blog-post-modal';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';

interface BlogPost {
  id: number;
  title: string;
  details: string;
  created_at: string;
}

interface SupabaseBlogPost {
  id: number;
  title: string;
  details: string;
  created_at: string;
}

export default function Blog() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
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
          created_at
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
        created_at
      `)
      .order('created_at', { ascending: false });

    setPosts(newPosts as BlogPost[]);
  };

  const handlePostClick = (post: BlogPost) => {
    setSelectedPost(post);
    setIsViewModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-12 border-b pb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-muted-foreground mt-2">Stay up to date with our latest insights and updates</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 h-11 px-6">
            <Plus className="h-4 w-4" />
            Create Post
          </Button>
        )}
      </div>

      {/* Blog Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {posts.map((post) => (
          <Card 
            key={post.id} 
            className="border-border hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer hover:border-accent/50"
            onClick={() => handlePostClick(post)}
          >
            <div className="relative w-full aspect-[16/9] bg-accent/5">
              <Image
                src="/build-tactical-llc-logo.png"
                alt="Build Tactical LLC Logo"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain p-8"
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
    </div>
  );
} 