import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface CreateBlogPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateBlogPostModal({ isOpen, onClose, onSuccess }: CreateBlogPostModalProps) {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size must be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to create a post');
      }

      let imageUrl = null;

      // Upload image if selected
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(fileName, selectedImage);

        if (uploadError) {
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }

        // Get the public URL for the uploaded image
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(fileName);
        
        imageUrl = urlData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from('blog_posts')
        .insert([
          {
            title,
            details,
            image_url: imageUrl,
          }
        ]);

      if (insertError) {
        throw insertError;
      }

      // Clear form and close modal
      setTitle('');
      setDetails('');
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onSuccess();
      onClose();
      router.refresh(); // Refresh the page to show new post
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Blog Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="details">Details</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Write your post details here..."
              className="min-h-[200px]"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image">Featured Image (Optional)</Label>
            <div className="space-y-4">
              {/* Image Upload Area */}
              <div className="flex flex-col gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={isSubmitting}
                />
                
                {imagePreview ? (
                  <div className="relative">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-dashed border-gray-200">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeImage}
                      className="absolute top-2 right-2 h-8 w-8 p-0"
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2 text-gray-500">
                      <ImageIcon className="h-6 w-6" />
                      <Upload className="h-4 w-4" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">Upload an image</p>
                      <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                    </div>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-500">
                If no image is uploaded, the default Build Tactical logo will be used.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Post'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 