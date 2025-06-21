'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Building2, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';

interface Organization {
  id: number;
  name: string | null;
  description: string | null;
  created_at: string;
  organization_picture_url: string | null;
}

export default function OrganizationDirectory() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [expandedOrg, setExpandedOrg] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('is_private', false)
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
    setExpandedOrg(prevExpanded => prevExpanded === orgId ? null : orgId);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-accent animate-pulse" />
          </div>
          <p className="text-lg text-muted-foreground">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      {/* Hero Section */}
      <div className="text-center mb-16 animate-fade-in-up">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
          Organization <span className="text-accent">Directory</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Explore our network of organizations. Each profile includes detailed information about their services, expertise, and project opportunities.
        </p>
      </div>

      {/* Organizations Grid */}
      <div className="animate-fade-in-up [animation-delay:400ms] opacity-0 [animation-fill-mode:forwards]">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
          {organizations.map((org) => (
            <Card
              key={org.id}
              className="border-border hover:shadow-lg transition-all duration-300 hover:border-accent/20 overflow-hidden"
            >
              {/* Full-width profile image */}
              <div className="relative h-48 bg-muted">
                {org.organization_picture_url ? (
                  <img
                    src={org.organization_picture_url}
                    alt={`${org.name || 'Organization'} picture`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-accent/10 flex items-center justify-center">
                    <div className="text-center">
                      <Building2 className="h-12 w-12 text-accent mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No organization picture</p>
                    </div>
                  </div>
                )}
              </div>

              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-tight mb-2">
                      {org.name || 'Unnamed Organization'}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>Established: {new Date(org.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleExpand(org.id)}
                    className="h-8 w-8 flex-shrink-0"
                  >
                    {expandedOrg === org.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              {expandedOrg === org.id && (
                <CardContent className="pt-0">
                  <div className="space-y-4 border-t border-border pt-4">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-accent" />
                        <h4 className="text-sm font-medium text-foreground">Description</h4>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-md">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {org.description || 'No description available. This organization has not yet provided detailed information about their services and expertise.'}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-accent" />
                        <h4 className="text-sm font-medium text-foreground">Organization Details</h4>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-md space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Established:</span>
                          <span className="text-foreground font-medium">
                            {new Date(org.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {organizations.length === 0 && (
          <Card className="border-border">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No Organizations Found</h3>
              <p className="text-muted-foreground">
                No organizations are currently available in the directory.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 