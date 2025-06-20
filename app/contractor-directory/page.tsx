'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Users, Mail, Briefcase, Building2, Filter, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// Create a single Supabase client instance
const supabase = createClient();

interface Contractor {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  proposed_org_proj: string | null;
  profile_picture_url: string | null;
  trades?: string[];
  certifications?: string[];
  client_types?: string[];
  cooperatives?: string[];
  projects?: {
    id: number;
    name: string | null;
    description: string | null;
    status: string | null;
    created_at: string;
  }[];
}

// Client type labels for display
const CLIENT_TYPE_LABELS = {
  is_joc: 'JOC',
  is_residential: 'Residential',
  is_commercial: 'Commercial',
  is_industrial: 'Industrial',
  is_local_government: 'Local Government',
  is_federal_government: 'Federal Government',
  is_hospitals: 'Hospitals',
  is_athletic_facilities: 'Athletic Facilities',
  is_military_facilities: 'Military Facilities'
} as const;

// Trade labels for display
const TRADE_LABELS = {
  is_ge: 'General Engineering',
  is_architect: 'Architect',
  is_engineer: 'Engineer',
  is_hvac: 'HVAC',
  is_electrical: 'Electrical',
  is_plumbing: 'Plumbing',
  is_drywall: 'Drywall',
  is_painting: 'Painting',
  is_flooring: 'Flooring',
  is_roofing: 'Roofing',
  is_concrete: 'Concrete',
  is_civil: 'Civil',
  is_paving: 'Paving',
  is_scoreboards: 'Scoreboards',
  is_gymfloor: 'Gym Floor',
  is_pool: 'Pool',
  is_security: 'Security',
  is_it: 'IT',
  is_fire: 'Fire Protection',
  is_masonry: 'Masonry',
  is_construction_management: 'Construction Management',
  is_sitework_civil: 'Sitework Civil',
  is_metals_welding: 'Metals & Welding',
  is_wood_carpentry: 'Wood & Carpentry',
  is_thermal_moisture_protection: 'Thermal & Moisture Protection',
  is_doors_windows_glazing: 'Doors, Windows & Glazing',
  is_finishes: 'Finishes',
  is_solar_energy: 'Solar Energy',
  is_generators_backup: 'Generators & Backup Power',
  is_environmental_specialty_services: 'Environmental Specialty Services'
} as const;

// Cooperative labels for display
const COOPERATIVE_LABELS = {
  is_buy_board: 'Buy Board',
  is_tips: 'TIPS',
  is_choice_partners: 'Choice Partners',
  is_omnia_partners: 'Omnia Partners',
  is_sourcewell: 'Sourcewell'
} as const;

// Filter categories with fixed options
const FILTER_CATEGORIES = {
  trades: [
    'IT', 'Security', 'Construction', 'Electrical', 'Plumbing', 'HVAC', 'Carpentry', 'Painting',
    'Landscaping', 'Roofing', 'Masonry', 'Concrete', 'Drywall', 'Flooring', 'Insulation',
    'Welding', 'Machining', 'Automotive', 'HVAC/R', 'Solar', 'Wind', 'Geothermal',
    'Water Treatment', 'Waste Management', 'Environmental', 'Renewable Energy'
  ],
  client_types: [
    'Commercial', 'Residential', 'Industrial', 'Government', 'Healthcare', 'Education',
    'Retail', 'Hospitality', 'Entertainment', 'Sports', 'Religious',
    'Non-Profit', 'Military', 'Transportation', 'Utilities',
    'Agriculture', 'Mining', 'Manufacturing', 'Technology',
    'Financial', 'Legal', 'Media', 'Real Estate'
  ]
};

export default function ContractorDirectory() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [expandedContractor, setExpandedContractor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
    trades: [],
    certifications: [],
    client_types: [],
    cooperatives: []
  });
  const [searchQuery, setSearchQuery] = useState<Record<string, string>>({
    certifications: '',
    cooperatives: ''
  });
  const [availableFilters, setAvailableFilters] = useState<Record<string, string[]>>({
    certifications: [],
    cooperatives: [],
    trades: [],
    client_types: []
  });
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
          is_private,
          ${isAuthed ? `
            email,
            proposed_org_proj,
            con_certs,
            cooperatives:contractor_cooperatives(
              is_buy_board,
              is_tips,
              is_choice_partners,
              is_omnia_partners,
              is_sourcewell
            ),
            trades:contractor_trades(
              is_ge,
              is_architect,
              is_engineer,
              is_hvac,
              is_electrical,
              is_plumbing,
              is_drywall,
              is_painting,
              is_flooring,
              is_roofing,
              is_concrete,
              is_civil,
              is_paving,
              is_scoreboards,
              is_gymfloor,
              is_pool,
              is_security,
              is_it,
              is_fire,
              is_masonry,
              is_construction_management,
              is_sitework_civil,
              is_metals_welding,
              is_wood_carpentry,
              is_thermal_moisture_protection,
              is_doors_windows_glazing,
              is_finishes,
              is_solar_energy,
              is_generators_backup,
              is_environmental_specialty_services
            ),
            client_types:contractor_client_types(
              is_joc,
              is_residential,
              is_commercial,
              is_industrial,
              is_local_government,
              is_federal_government,
              is_hospitals,
              is_athletic_facilities,
              is_military_facilities,
              other
            ),
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
        .eq('is_private', false)
        .order('full_name');

      if (error) {
        console.error('Error fetching contractors:', error);
        throw error;
      }

      // Get unique certifications and cooperatives
      const uniqueCerts = new Set<string>();
      const uniqueCoops = new Set<string>();
      const uniqueTrades = new Set<string>();
      const uniqueClientTypes = new Set<string>();
      
      data?.forEach((contractor: any) => {
        if (isAuthed) {
          if (contractor.con_certs) {
            contractor.con_certs.forEach((cert: string) => uniqueCerts.add(cert));
          }
          if (contractor.cooperatives) {
            // Add boolean cooperatives
            Object.entries(contractor.cooperatives).forEach(([key, value]) => {
              if (key.startsWith('is_') && value === true) {
                uniqueCoops.add(COOPERATIVE_LABELS[key as keyof typeof COOPERATIVE_LABELS]);
              }
            });
          }
          if (contractor.trades) {
            // Add boolean trades
            Object.entries(contractor.trades).forEach(([key, value]) => {
              if (key.startsWith('is_') && value === true) {
                uniqueTrades.add(TRADE_LABELS[key as keyof typeof TRADE_LABELS]);
              }
            });
            // Add other trades
            if (contractor.trades.other) {
              contractor.trades.other.forEach((trade: string) => uniqueTrades.add(trade));
            }
          }
          if (contractor.client_types) {
            // Add boolean client types
            Object.entries(contractor.client_types).forEach(([key, value]) => {
              if (key.startsWith('is_') && value === true) {
                uniqueClientTypes.add(CLIENT_TYPE_LABELS[key as keyof typeof CLIENT_TYPE_LABELS]);
              }
            });
            // Add other client types
            if (contractor.client_types.other) {
              contractor.client_types.other.forEach((type: string) => uniqueClientTypes.add(type));
            }
          }
        }
      });

      setAvailableFilters({
        certifications: isAuthed ? Array.from(uniqueCerts).sort() : [],
        cooperatives: isAuthed ? Array.from(uniqueCoops).sort() : [],
        trades: isAuthed ? Array.from(uniqueTrades).sort() : [],
        client_types: isAuthed ? Array.from(uniqueClientTypes).sort() : []
      });

      // Transform the data to match our interface
      const transformedContractors = data?.map((contractor: any) => {
        // Get active trades
        const activeTrades: string[] = [];
        if (isAuthed && contractor.trades) {
          // Add boolean trades
          Object.entries(contractor.trades).forEach(([key, value]) => {
            if (key.startsWith('is_') && value === true) {
              activeTrades.push(TRADE_LABELS[key as keyof typeof TRADE_LABELS]);
            }
          });
          // Add other trades
          if (contractor.trades.other) {
            activeTrades.push(...contractor.trades.other);
          }
        }

        // Get active client types
        const activeClientTypes: string[] = [];
        if (isAuthed && contractor.client_types) {
          // Add boolean client types
          Object.entries(contractor.client_types).forEach(([key, value]) => {
            if (key.startsWith('is_') && value === true) {
              activeClientTypes.push(CLIENT_TYPE_LABELS[key as keyof typeof CLIENT_TYPE_LABELS]);
            }
          });
          // Add other client types
          if (contractor.client_types.other) {
            activeClientTypes.push(...contractor.client_types.other);
          }
        }

        // Get active cooperatives
        const activeCooperatives: string[] = [];
        if (isAuthed && contractor.cooperatives) {
          // Add boolean cooperatives
          Object.entries(contractor.cooperatives).forEach(([key, value]) => {
            if (key.startsWith('is_') && value === true) {
              activeCooperatives.push(COOPERATIVE_LABELS[key as keyof typeof COOPERATIVE_LABELS]);
            }
          });
        }

        return {
          id: contractor.id,
          full_name: contractor.full_name,
          email: isAuthed ? contractor.email : null,
          role: contractor.role,
          proposed_org_proj: isAuthed ? contractor.proposed_org_proj : null,
          profile_picture_url: contractor.profile_picture_url,
          trades: isAuthed ? activeTrades : [],
          certifications: isAuthed ? (contractor.con_certs || []) : [],
          client_types: isAuthed ? activeClientTypes : [],
          cooperatives: isAuthed ? activeCooperatives : [],
          projects: contractor.projects?.map((proj: any) => ({
            id: proj.project.id,
            name: proj.project.name,
            description: isAuthed ? proj.project.description : null,
            status: isAuthed ? proj.project.status : null,
            created_at: isAuthed ? proj.project.created_at : null
          }))
        };
      }) || [];

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

  // Filter contractors based on active filters
  const filteredContractors = contractors.filter(contractor => {
    return Object.entries(activeFilters).every(([category, selectedFilters]) => {
      if (selectedFilters.length === 0) return true;
      
      const contractorValues = contractor[category as keyof Contractor] as string[] | undefined;
      if (!contractorValues) return false;
      
      return selectedFilters.some(filter => contractorValues.includes(filter));
    });
  });

  const toggleExpand = (contractorId: string) => {
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }
    setExpandedContractor(prevExpanded => prevExpanded === contractorId ? null : contractorId);
  };

  const toggleFilter = (category: string, value: string) => {
    setActiveFilters(prev => {
      const currentFilters = prev[category] || [];
      const newFilters = currentFilters.includes(value)
        ? currentFilters.filter(f => f !== value)
        : [...currentFilters, value];
      
      return {
        ...prev,
        [category]: newFilters
      };
    });
  };

  // Filter options based on search query
  const getFilteredOptions = (category: string, options: string[]) => {
    const searchTerm = searchQuery[category]?.toLowerCase() || '';
    return options.filter(option => 
      option.toLowerCase().includes(searchTerm)
    );
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

      {/* Filter Section */}
      <div className="mb-8 animate-fade-in-up [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards]">
        <div className="flex flex-wrap gap-2 items-center">
          {/* All Filters */}
          {['trades', 'certifications', 'client_types', 'cooperatives'].map((category) => (
            <DropdownMenu key={category}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-dashed"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {category.replace('_', ' ')}
                  {activeFilters[category]?.length > 0 && (
                    <>
                      <span className="mx-2 h-4 w-px bg-border" />
                      <Badge
                        variant="secondary"
                        className="rounded-sm px-1 font-normal lg:hidden"
                      >
                        {activeFilters[category].length}
                      </Badge>
                      <div className="hidden space-x-1 lg:flex">
                        {activeFilters[category].length > 2 ? (
                          <Badge
                            variant="secondary"
                            className="rounded-sm px-1 font-normal"
                          >
                            {activeFilters[category].length} selected
                          </Badge>
                        ) : (
                          availableFilters[category]
                            ?.filter((value) => activeFilters[category].includes(value))
                            .map((value) => (
                              <Badge
                                variant="secondary"
                                key={value}
                                className="rounded-sm px-1 font-normal"
                              >
                                {value}
                              </Badge>
                            ))
                        )}
                      </div>
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-64"
                onInteractOutside={(e) => {
                  // Prevent closing when clicking the input
                  if (e.target instanceof HTMLElement && e.target.closest('input')) {
                    e.preventDefault();
                  }
                }}
              >
                <DropdownMenuSeparator />
                
                {/* Search input for all categories */}
                <div className="px-2 py-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery[category] || ''}
                      onChange={(e) => {
                        e.stopPropagation();
                        setSearchQuery(prev => ({
                          ...prev,
                          [category]: e.target.value
                        }));
                      }}
                      className="pl-8"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        // Prevent dropdown from closing on Escape
                        if (e.key === 'Escape') {
                          e.preventDefault();
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto">
                  {getFilteredOptions(category, availableFilters[category]).map((value) => (
                    <DropdownMenuCheckboxItem
                      key={value}
                      checked={activeFilters[category]?.includes(value)}
                      onCheckedChange={() => toggleFilter(category, value)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {value}
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>

                {activeFilters[category].length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600 cursor-pointer"
                      onClick={() => {
                        setActiveFilters(prev => ({
                          ...prev,
                          [category]: []
                        }));
                        setSearchQuery(prev => ({
                          ...prev,
                          [category]: ''
                        }));
                      }}
                    >
                      Clear all
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </div>

        {/* Active Filters Display */}
        {Object.entries(activeFilters).some(([_, filters]) => filters.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(activeFilters).map(([category, filters]) =>
              filters.map((filter) => (
                <Badge
                  key={`${category}-${filter}`}
                  variant="secondary"
                  className="px-2 py-1"
                >
                  {filter}
                  <button
                    onClick={() => toggleFilter(category, filter)}
                    className="ml-2 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))
            )}
          </div>
        )}
      </div>

      {/* Clear All Filters Button */}
      {Object.values(activeFilters).some(filters => filters.length > 0) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setActiveFilters({
              trades: [],
              certifications: [],
              client_types: [],
              cooperatives: []
            });
            setSearchQuery({
              trades: '',
              certifications: '',
              client_types: '',
              cooperatives: ''
            });
          }}
          className="h-8"
        >
          Clear all
        </Button>
      )}

      {/* Contractors Grid */}
      <div className="animate-fade-in-up [animation-delay:400ms] opacity-0 [animation-fill-mode:forwards]">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
          {filteredContractors.map((contractor) => (
            <Card
              key={contractor.id}
              className="border-border hover:shadow-lg transition-all duration-300 hover:border-accent/20 overflow-hidden"
            >
              {/* Full-width profile image */}
              <div className="relative h-48 bg-muted">
                {contractor.profile_picture_url ? (
                  <img
                    src={contractor.profile_picture_url}
                    alt={`${contractor.full_name || 'Contractor'} profile picture`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-accent/10 flex items-center justify-center">
                    <div className="text-center">
                      <Users className="h-12 w-12 text-accent mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No profile picture</p>
                    </div>
                  </div>
                )}
              </div>

              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-tight mb-2">
                      {contractor.full_name || 'Unnamed Contractor'}
                    </CardTitle>
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
                        <h4 className="text-sm font-medium text-foreground">Trades</h4>
                      </div>
                      <div className="space-y-2">
                        {contractor.trades && contractor.trades.length > 0 ? (
                          contractor.trades.map((trade, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">• {trade}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No trades specified</p>
                        )}
                      </div>
                    </div>

                    {isAuthenticated && (
                      <>
                        {contractor.certifications && contractor.certifications.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Briefcase className="h-4 w-4 text-accent" />
                              <h4 className="text-sm font-medium text-foreground">Certifications</h4>
                            </div>
                            <div className="space-y-2">
                              {contractor.certifications.map((cert, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">• {cert}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {contractor.client_types && contractor.client_types.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Building2 className="h-4 w-4 text-accent" />
                              <h4 className="text-sm font-medium text-foreground">Client Types</h4>
                            </div>
                            <div className="space-y-2">
                              {contractor.client_types.map((type, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">• {type}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {contractor.cooperatives && contractor.cooperatives.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Users className="h-4 w-4 text-accent" />
                              <h4 className="text-sm font-medium text-foreground">Cooperatives</h4>
                            </div>
                            <div className="space-y-2">
                              {contractor.cooperatives.map((coop, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">• {coop}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

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

        {filteredContractors.length === 0 && (
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