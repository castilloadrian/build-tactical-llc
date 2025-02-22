import { createClient } from '@/utils/supabase/server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function ProfilePage() {
  const supabase = await createClient();
  
  // Get auth user data
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get public.users data with disabled RLS policy
  const { data: publicUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="container max-w-xl py-8">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      
      <div className="space-y-4 mb-8">
        <div className="grid grid-cols-2 gap-2">
          <div className="font-medium text-blue-600">Email</div>
          <div>{user.email}</div>
          
          <div className="font-medium text-blue-600">Full Name</div>
          <div>{publicUser?.full_name || user.user_metadata.full_name}</div>
          
          <div className="font-medium text-blue-600">Organization</div>
          <div>{publicUser?.organization || 'Not specified'}</div>
          
          <div className="font-medium text-blue-600">Role</div>
          <div>{publicUser?.role || 'Not specified'}</div>
          
          <div className="font-medium text-blue-600">Last Sign In</div>
          <div>{new Date(user.last_sign_in_at || '').toLocaleString()}</div>
          
          <div className="font-medium text-blue-600">Account Created</div>
          <div>{new Date(user.created_at).toLocaleString()}</div>
        </div>
      </div>

      <div className="space-y-4">
        <Link href="/reset-password">
          <Button
            variant="outline"
            className="w-full hover:text-blue-600 hover:border-blue-600"
          >
            Reset Password
          </Button>
        </Link>
      </div>
    </div>
  );
} 