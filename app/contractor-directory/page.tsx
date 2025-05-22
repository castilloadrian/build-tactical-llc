'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Contractor {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  proposed_org_proj: string | null;
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
  const supabase = createClient();

  useEffect(() => {
    const fetchContractors = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select(`
            *,
            projects:"user-project"(
              project:projects(*)
            )
          `)
          .eq('role', 'Contractor')
          .order('full_name');

        if (error) throw error;

        // Transform the data to match our interface
        const transformedContractors = data?.map((contractor: any) => ({
          id: contractor.id,
          full_name: contractor.full_name,
          email: contractor.email,
          role: contractor.role,
          proposed_org_proj: contractor.proposed_org_proj,
          projects: contractor.projects?.map((proj: any) => ({
            id: proj.project.id,
            name: proj.project.name,
            description: proj.project.description,
            status: proj.project.status,
            created_at: proj.project.created_at
          }))
        })) || [];

        setContractors(transformedContractors);
      } catch (error) {
        console.error('Error fetching contractors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContractors();
  }, []);

  const toggleExpand = (contractorId: string) => {
    setExpandedContractor(expandedContractor === contractorId ? null : contractorId);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="text-center">Loading contractors...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-24">
      <h1 className="text-4xl font-bold mb-8 text-foreground text-center animate-fade-in-up">
        Contractor <span className="text-accent">Directory</span>
      </h1>
      
      <div className="grid gap-8 animate-fade-in-up [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards] max-w-4xl mx-auto">
        <section className="space-y-4 text-center">
          <h2 className="text-2xl font-semibold text-foreground">Verified Contractors</h2>
          <p className="text-lg text-muted-foreground">
            Browse our network of verified contractors. Each profile includes
            their expertise and current project assignments.
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          {contractors.map((contractor) => (
            <div
              key={contractor.id}
              className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {contractor.full_name || 'Unnamed Contractor'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {contractor.email || 'No email available'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleExpand(contractor.id)}
                  className="h-8 w-8"
                >
                  {expandedContractor === contractor.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {expandedContractor === contractor.id && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Current Projects</h4>
                      {contractor.projects && contractor.projects.length > 0 ? (
                        <div className="space-y-3">
                          {contractor.projects.map((project) => (
                            <div key={project.id} className="bg-muted/50 p-3 rounded-md">
                              <p className="font-medium">{project.name}</p>
                              <p className="text-sm text-muted-foreground">{project.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Status: {project.status || 'Not specified'}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No current projects</p>
                      )}
                    </div>
                    {contractor.proposed_org_proj && (
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-1">Proposed Organization/Project</h4>
                        <p className="text-sm text-muted-foreground">{contractor.proposed_org_proj}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {contractors.length === 0 && (
          <div className="text-center text-muted-foreground">
            No contractors found in the directory.
          </div>
        )}
      </div>
    </div>
  );
} 