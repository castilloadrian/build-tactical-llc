'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Organization {
  id: number;
  name: string | null;
  description: string | null;
  created_at: string;
}

export default function GovernmentDirectory() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [expandedOrg, setExpandedOrg] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .order('name');

        if (error) throw error;
        setOrganizations(data || []);
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  const toggleExpand = (orgId: number) => {
    setExpandedOrg(expandedOrg === orgId ? null : orgId);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">Loading organizations...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-foreground text-center animate-fade-in-up">
        Government <span className="text-accent">Directory</span>
      </h1>
      
      <div className="grid gap-8 animate-fade-in-up [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards] max-w-4xl mx-auto">
        <section className="space-y-4 text-center">
          <h2 className="text-2xl font-semibold text-foreground">Government Organizations</h2>
          <p className="text-lg text-muted-foreground">
            Browse our network of government organizations. Each profile includes
            detailed information about their services and expertise.
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {org.name || 'Unnamed Organization'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(org.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleExpand(org.id)}
                  className="h-8 w-8"
                >
                  {expandedOrg === org.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {expandedOrg === org.id && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-1">Description</h4>
                      <p className="text-sm text-muted-foreground">
                        {org.description || 'No description available'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {organizations.length === 0 && (
          <div className="text-center text-muted-foreground">
            No organizations found in the directory.
          </div>
        )}
      </div>
    </div>
  );
} 