import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';

interface ViewBlogPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    title: string;
    details: string;
    created_at: string;
  } | null;
}

export function ViewBlogPostModal({ isOpen, onClose, post }: ViewBlogPostModalProps) {
  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl">{post.title}</DialogTitle>
          <div className="text-sm text-muted-foreground">
            {new Date(post.created_at).toLocaleDateString()}
          </div>
        </DialogHeader>
        <div className="relative w-full aspect-[16/9] bg-accent/5 mb-6">
          <Image
            src="/build-tactical-llc-logo.png"
            alt="Build Tactical LLC Logo"
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-contain p-8"
            priority
          />
        </div>
        <div className="prose prose-lg max-w-none">
          {post.details.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
} 