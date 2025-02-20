import { createClient } from '@/utils/supabase/server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <div className="container max-w-xl py-8">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      
      <div className="space-y-4 mb-8">
        <div className="grid grid-cols-2 gap-2">
          <div className="font-medium">Email</div>
          <div>{user.email}</div>
          
          <div className="font-medium">Full Name</div>
          <div>{user.user_metadata.full_name}</div>
          
          <div className="font-medium">Last Sign In</div>
          <div>{new Date(user.last_sign_in_at || '').toLocaleString()}</div>
          
          <div className="font-medium">Account Created</div>
          <div>{new Date(user.created_at).toLocaleString()}</div>
        </div>
      </div>

      <div className="space-y-4">
        <Link href="/reset-password">
          <Button
            variant="outline"
            className="w-full"
          >
            Reset Password
          </Button>
        </Link>
      </div>
    </div>
  );
} 