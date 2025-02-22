'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { User, Settings, LogOut, LayoutDashboard } from "lucide-react";
import { signOutAction } from "@/app/actions";
import Link from "next/link";
import { User as SupabaseUser } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useState, useEffect } from 'react';

interface NavigationProps {
  user: SupabaseUser | null;
}

export function Navigation({ user }: NavigationProps) {
  const [isOwner, setIsOwner] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function checkRole() {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user?.id)
        .single();
      
      setIsOwner(userData?.role === 'Owner');
    }
    
    if (user) checkRole();
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/sign-in">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </Link>
        <Link href="/sign-up">
          <Button size="sm">Sign Up</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-74" align="end" forceMount>
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user.user_metadata.full_name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="border-t" />
            <div className="space-y-1">
              {isOwner && (
                <Link href="/admin">
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}
              <Link href="/profile">
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button> 
              </Link>
            </div>
            <div className="border-t" />
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-100" 
              size="sm"
              onClick={signOutAction}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 