'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Users, Mail, Briefcase, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';

// Create a single Supabase client instance
const supabase = createClient();

interface Contractor {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  proposed_org_proj: string | null;
  profile_picture_url: string | null;
  projects?: {
    id: number;
    name: string | null;
    description: string | null;
    status: string | null;
    created_at: string;
  }[];
}

export default function ContractorDirectory() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [expandedContractor, setExpandedContractor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          // Only log unexpected auth errors, not the normal "missing session" error
          if (error.name !== 'AuthSessionMissingError') {
            console.error('Auth error:', error);
          }
          setIsAuthenticated(false);
          setAuthChecked(true);
          return;
        }
        const isAuthed = !!user;
        setIsAuthenticated(isAuthed);
        setAuthChecked(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setAuthChecked(true);
      }
    };

    // Initial check
    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const isAuthed = !!session?.user;
      setIsAuthenticated(isAuthed);
      
      // If we just logged in, fetch the data again
      if (event === 'SIGNED_IN') {
        await fetchContractors(isAuthed);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch contractors data
  const fetchContractors = async (isAuthed: boolean) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          role,
          profile_picture_url,
          ${isAuthed ? `
            email,
            proposed_org_proj,
            projects:"user-project"(
              project:projects(*)
            )
          ` : `
            projects:"user-project"(
              project:projects(
                id,
                name
              )
            )
          `}
        `)
        .eq('role', 'Contractor')
        .order('full_name');

      if (error) {
        console.error('Error fetching contractors:', error);
        throw error;
      }

      // Transform the data to match our interface
      const transformedContractors = data?.map((contractor: any) => ({
        id: contractor.id,
        full_name: contractor.full_name,
        email: isAuthed ? contractor.email : null,
        role: contractor.role,
        proposed_org_proj: isAuthed ? contractor.proposed_org_proj : null,
        profile_picture_url: contractor.profile_picture_url,
        projects: contractor.projects?.map((proj: any) => ({
          id: proj.project.id,
          name: proj.project.name,
          description: isAuthed ? proj.project.description : null,
          status: isAuthed ? proj.project.status : null,
          created_at: isAuthed ? proj.project.created_at : null
        }))
      })) || [];

      setContractors(transformedContractors);
    } catch (error) {
      console.error('Error in fetchContractors:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch and refetch on auth change
  useEffect(() => {
    if (authChecked) {
      fetchContractors(isAuthenticated);
    }
  }, [isAuthenticated, authChecked]);

  const toggleExpand = (contractorId: string) => {
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }
    setExpandedContractor(prevExpanded => prevExpanded === contractorId ? null : contractorId);
  };

  if (loading || !authChecked) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-accent animate-pulse" />
          </div>
          <p className="text-lg text-muted-foreground">Loading contractors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      {/* Hero Section */}
      <div className="text-center mb-16 animate-fade-in-up">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
          Contractor <span className="text-accent">Directory</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Browse our network of verified contractors. Each profile includes their expertise, current project assignments, and contact information.
        </p>
        {!isAuthenticated && (
          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-4">
              Sign in to view contact details and project information
            </p>
            <Button onClick={() => router.push('/sign-in')} className="bg-accent hover:bg-accent/90">
              Sign In
            </Button>
          </div>
        )}
      </div>

      {/* Contractors Grid */}
      <div className="animate-fade-in-up [animation-delay:400ms] opacity-0 [animation-fill-mode:forwards]">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
          {contractors.map((contractor) => (
            <Card
              key={contractor.id}
              className="border-border hover:shadow-lg transition-all duration-300 hover:border-accent/20"
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage 
                          src={contractor.profile_picture_url || undefined} 
                          alt={`${contractor.full_name || 'Contractor'} profile picture`} 
                        />
                        <AvatarFallback className="bg-accent/10 text-accent">
                          {contractor.full_name?.charAt(0) || <Users className="h-6 w-6" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <CardTitle className="text-lg leading-tight">
                          {contractor.full_name || 'Unnamed Contractor'}
                        </CardTitle>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 text-sm text-muted-foreground ${!isAuthenticated ? 'blur-sm' : ''}`}>
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {isAuthenticated ? (contractor.email || 'No email provided') : '••••••••@••••••••'}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleExpand(contractor.id)}
                    className="h-8 w-8 flex-shrink-0"
                  >
                    {expandedContractor === contractor.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              {expandedContractor === contractor.id && (
                <CardContent className="pt-0">
                  <div className="space-y-4 border-t border-border pt-4">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Briefcase className="h-4 w-4 text-accent" />
                        <h4 className="text-sm font-medium text-foreground">Current Projects</h4>
                      </div>
                      {contractor.projects && contractor.projects.length > 0 ? (
                        <div className="space-y-3">
                          {contractor.projects.map((project) => (
                            <Card key={project.id} className="border-muted">
                              <CardContent className="p-3">
                                <p className="font-medium text-sm mb-1">{project.name}</p>
                                {isAuthenticated && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-2">{project.description}</p>
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-muted-foreground">Status:</span>
                                      <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">
                                        {project.status || 'Not specified'}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                          No current projects
                        </p>
                      )}
                    </div>
                    
                    {isAuthenticated && contractor.proposed_org_proj && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4 text-accent" />
                          <h4 className="text-sm font-medium text-foreground">Organization</h4>
                        </div>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                          {contractor.proposed_org_proj}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {contractors.length === 0 && (
          <Card className="border-border">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No Contractors Found</h3>
              <p className="text-muted-foreground">
                No contractors are currently available in the directory.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 