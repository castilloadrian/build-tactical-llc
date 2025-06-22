'use client';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Building2, Edit2, Save, X, Upload, User, Trash2, Search, Plus, CreditCard, Calendar, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Organization {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  organization_picture_url: string | null;
  is_private: boolean;
}

interface ContractorTrades {
  is_ge: boolean;
  is_architect: boolean;
  is_engineer: boolean;
  is_hvac: boolean;
  is_electrical: boolean;
  is_plumbing: boolean;
  is_drywall: boolean;
  is_painting: boolean;
  is_flooring: boolean;
  is_roofing: boolean;
  is_concrete: boolean;
  is_civil: boolean;
  is_paving: boolean;
  is_scoreboards: boolean;
  is_gymfloor: boolean;
  is_pool: boolean;
  is_it: boolean;
  is_security: boolean;
  is_fire: boolean;
  is_masonry: boolean;
  is_construction_management: boolean;
  is_sitework_civil: boolean;
  is_metals_welding: boolean;
  is_wood_carpentry: boolean;
  is_thermal_moisture_protection: boolean;
  is_doors_windows_glazing: boolean;
  is_finishes: boolean;
  is_solar_energy: boolean;
  is_generators_backup: boolean;
  is_environmental_specialty_services: boolean;
}

interface ContractorClientTypes {
  is_joc: boolean;
  is_residential: boolean;
  is_commercial: boolean;
  is_industrial: boolean;
  is_local_government: boolean;
  is_federal_government: boolean;
  is_hospitals: boolean;
  is_athletic_facilities: boolean;
  is_military_facilities: boolean;
}

interface ContractorCooperatives {
  is_buy_board: boolean;
  is_tips: boolean;
  is_choice_partners: boolean;
  is_omnia_partners: boolean;
  is_sourcewell: boolean;
}

interface UserOrg {
  organization: Organization;
}

interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string | null;
  organization_id: number | null;
  created_at: string;
}

interface UserProject {
  project: Project;
}

interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'free-trial' | 'monthly' | 'six-month';
  status: 'active' | 'canceled' | 'expired';
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  trial_expires_at: string | null;
  subscription_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// Add phone number formatting function
const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle 10-digit numbers (standard US format)
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)})-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Handle 11-digit numbers (with country code)
  if (cleaned.length === 11) {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)})-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // Handle partial numbers
  if (cleaned.length > 0) {
    if (cleaned.length <= 3) {
      return `(${cleaned}`;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)})-${cleaned.slice(3)}`;
    } else if (cleaned.length <= 10) {
      return `(${cleaned.slice(0, 3)})-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11) {
      return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)})-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
  }
  
  // Return original if no digits
  return phone;
};

// Add phone number cleaning function for database storage
const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

// Add function to handle phone number input
const handlePhoneInput = (value: string, setter: (value: string) => void) => {
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, '');
  
  // Only allow up to 11 digits
  if (cleaned.length <= 11) {
    // Format the number as the user types
    const formatted = formatPhoneNumber(cleaned);
    setter(formatted);
  }
};

// Add function to handle phone number keydown
const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  // Allow: backspace, delete, tab, escape, enter, arrows
  if ([8, 9, 13, 27, 46, 37, 38, 39, 40].includes(e.keyCode)) {
    return;
  }
  
  // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
  if ((e.ctrlKey || e.metaKey) && [65, 67, 86, 88].includes(e.keyCode)) {
    return;
  }
  
  // Allow: home, end
  if ([35, 36].includes(e.keyCode)) {
    return;
  }
  
  // Allow only digits
  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
  }
};

// Add function to handle phone number paste
const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>, setter: (value: string) => void) => {
  e.preventDefault();
  const pastedData = e.clipboardData.getData('text');
  const cleaned = pastedData.replace(/\D/g, '');
  
  if (cleaned.length <= 11) {
    const formatted = formatPhoneNumber(cleaned);
    setter(formatted);
  }
};

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [publicUser, setPublicUser] = useState<any>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [trades, setTrades] = useState<ContractorTrades>({
    is_ge: false,
    is_architect: false,
    is_engineer: false,
    is_hvac: false,
    is_electrical: false,
    is_plumbing: false,
    is_drywall: false,
    is_painting: false,
    is_flooring: false,
    is_roofing: false,
    is_concrete: false,
    is_civil: false,
    is_paving: false,
    is_scoreboards: false,
    is_gymfloor: false,
    is_pool: false,
    is_it: false,
    is_security: false,
    is_fire: false,
    is_masonry: false,
    is_construction_management: false,
    is_sitework_civil: false,
    is_metals_welding: false,
    is_wood_carpentry: false,
    is_thermal_moisture_protection: false,
    is_doors_windows_glazing: false,
    is_finishes: false,
    is_solar_energy: false,
    is_generators_backup: false,
    is_environmental_specialty_services: false,
  });
  const [clientTypes, setClientTypes] = useState<ContractorClientTypes>({
    is_joc: false,
    is_residential: false,
    is_commercial: false,
    is_industrial: false,
    is_local_government: false,
    is_federal_government: false,
    is_hospitals: false,
    is_athletic_facilities: false,
    is_military_facilities: false,
  });

  const [cooperatives, setCooperatives] = useState<ContractorCooperatives>({
    is_buy_board: false,
    is_tips: false,
    is_choice_partners: false,
    is_omnia_partners: false,
    is_sourcewell: false,
  });

  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [editedCompany, setEditedCompany] = useState({
    companyName: '',
    city: '',
    state: '',
    website: '',
    phone: '',
  });

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editedDetails, setEditedDetails] = useState({
    certifications: [] as string[],
  });

  const [newCert, setNewCert] = useState('');
  
  // Profile picture states
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Organization picture states
  const [selectedOrgForPicture, setSelectedOrgForPicture] = useState<Organization | null>(null);
  const [isUploadingOrgPicture, setIsUploadingOrgPicture] = useState(false);
  const [orgPreviewUrl, setOrgPreviewUrl] = useState<string | null>(null);

  // Privacy settings state
  const [isPrivate, setIsPrivate] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);

  // Certifications dropdown states
  const [availableCertifications, setAvailableCertifications] = useState<string[]>([]);
  const [certificationSearchQuery, setCertificationSearchQuery] = useState('');
  const [isCertificationDropdownOpen, setIsCertificationDropdownOpen] = useState(false);

  // Function to fetch available certifications
  const fetchAvailableCertifications = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('users')
        .select('con_certs')
        .eq('role', 'Contractor')
        .not('con_certs', 'is', null);
      
      if (error) {
        console.error('Error fetching certifications:', error);
        return;
      }

      // Extract unique certifications
      const uniqueCerts = new Set<string>();
      data?.forEach((user: any) => {
        if (user.con_certs && Array.isArray(user.con_certs)) {
          user.con_certs.forEach((cert: string) => {
            if (cert && cert.trim()) {
              uniqueCerts.add(cert.trim());
            }
          });
        }
      });

      setAvailableCertifications(Array.from(uniqueCerts).sort());
    } catch (error) {
      console.error('Error in fetchAvailableCertifications:', error);
    }
  };

  const fetchSubscription = async () => {
    if (!user) return;
    
    try {
      const supabase = createClient();
      
      // First, let's see all subscriptions for this user
      const { data: allSubscriptions, error: allError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id);
      
      // Now let's check for active subscriptions specifically
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching subscription:', error);
        return;
      }
      
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  // Fetch subscription when user is available
  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      // Get auth user data
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) return;

      // Fetch available certifications
      await fetchAvailableCertifications();
      
      // Fetch subscription data
      await fetchSubscription();
      
      // Get public.users data with organization and project details
      const { data: publicUser, error } = await supabase
        .from('users')
        .select(`
          *,
          con_company_name,
          con_city,
          con_state,
          website,
          con_certs,
          profile_picture_url,
          is_private,
          contractor_trades (
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
            is_it,
            is_security,
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
          contractor_client_types (
            is_joc,
            is_residential,
            is_commercial,
            is_industrial,
            is_local_government,
            is_federal_government,
            is_hospitals,
            is_athletic_facilities,
            is_military_facilities
          ),
          contractor_cooperatives (
            is_buy_board,
            is_tips,
            is_choice_partners,
            is_omnia_partners,
            is_sourcewell
          ),
          user_orgs:"user-org"(
            organization:organizations(
              id,
              name,
              description,
              created_at,
              organization_picture_url,
              is_private
            )
          ),
          user_projects:"user-project"(
            project:projects(
              id,
              name,
              description,
              status,
              organization_id,
              created_at
            )
          )
        `)
        .eq('id', user.id)
        .single();

      if (publicUser) {
        setPublicUser(publicUser);
        setOrganizations(publicUser.user_orgs?.map((uo: UserOrg) => uo.organization) || []);
        setProjects(publicUser.user_projects?.map((up: UserProject) => up.project) || []);
        setProfilePictureUrl(publicUser.profile_picture_url);
        
        // Initialize privacy state based on user role
        if (publicUser.role === 'Contractor') {
          setIsPrivate(publicUser.is_private || false);
        } else if (publicUser.role === 'Org Owner' && publicUser.user_orgs?.length > 0) {
          // For Org Owners, use the first organization's privacy setting
          setIsPrivate(publicUser.user_orgs[0]?.organization?.is_private || false);
        }
        
        // Initialize edit states with current values
        setEditedCompany({
          companyName: publicUser.con_company_name || '',
          city: publicUser.con_city || '',
          state: publicUser.con_state || '',
          website: publicUser.website || '',
          phone: publicUser.company_phone || '',
        });
        
        setEditedDetails({
          certifications: publicUser.con_certs || [],
        });

        // Set trades from contractor_trades
        if (publicUser.contractor_trades) {
          setTrades({
            ...publicUser.contractor_trades,
          });
        }

        // Set client types from contractor_client_types
        if (publicUser.contractor_client_types) {
          setClientTypes(publicUser.contractor_client_types);
        }

        // Set cooperatives from contractor_cooperatives
        if (publicUser.contractor_cooperatives) {
          setCooperatives(publicUser.contractor_cooperatives);
        }
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  const handleSaveDetails = async () => {
    if (!user) return;
    
    try {
      const supabase = createClient();
      
      // First update contractor_trades
      const { error: tradesError } = await supabase
        .from('contractor_trades')
        .upsert({
          id: user.id,
          ...trades,
        });

      if (tradesError) {
        console.error('Error saving contractor trades:', tradesError);
        return;
      }

      // Update contractor_client_types
      const { error: clientTypesError } = await supabase
        .from('contractor_client_types')
        .upsert({
          id: user.id,
          ...clientTypes
        });

      if (clientTypesError) {
        console.error('Error saving client types:', clientTypesError);
        return;
      }

      // Update contractor_cooperatives
      const { error: cooperativesError } = await supabase
        .from('contractor_cooperatives')
        .upsert({
          id: user.id,
          ...cooperatives
        });

      if (cooperativesError) {
        console.error('Error saving cooperatives:', cooperativesError);
        return;
      }

      // Then update user details
      const { error: userError } = await supabase
        .from('users')
        .update({
          con_certs: editedDetails.certifications,
        })
        .eq('id', user.id);

      if (userError) {
        console.error('Error saving user details:', userError);
        return;
      }

      // Update local state
      setPublicUser((prev: any) => ({
        ...prev,
        con_certs: editedDetails.certifications,
        contractor_trades: trades,
        contractor_client_types: clientTypes,
        contractor_cooperatives: cooperatives
      }));

      // Close edit mode
      setIsEditingDetails(false);
    } catch (err) {
      console.error('Exception while saving contractor details:', err);
    }
  };

  const handleSaveCompany = async () => {
    if (!user) return;
    
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('users')
        .update({
          con_company_name: editedCompany.companyName,
          con_city: editedCompany.city,
          con_state: editedCompany.state,
          website: editedCompany.website,
          company_phone: cleanPhoneNumber(editedCompany.phone),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving company info:', error);
        return;
      }

      // Update local state
      setPublicUser((prev: any) => ({
        ...prev,
        con_company_name: editedCompany.companyName,
        con_city: editedCompany.city,
        con_state: editedCompany.state,
        website: editedCompany.website,
        company_phone: cleanPhoneNumber(editedCompany.phone),
      }));

      // Close edit mode
      setIsEditingCompany(false);
    } catch (err) {
      console.error('Exception while saving company info:', err);
    }
  };

  // Add a function to handle edit mode changes
  const handleEditModeChange = (isEditing: boolean, type: 'details' | 'company') => {
    if (type === 'details') {
      setIsEditingDetails(isEditing);
    } else {
      setIsEditingCompany(isEditing);
    }
  };

  // Add a useEffect to handle edit mode changes
  useEffect(() => {
    if (!isEditingDetails) {
      // Reset edited details when edit mode is closed
      setEditedDetails({
        certifications: publicUser?.con_certs || [],
      });
    }
  }, [isEditingDetails, publicUser]);

  useEffect(() => {
    if (!isEditingCompany) {
      // Reset edited company when edit mode is closed
      setEditedCompany({
        companyName: publicUser?.con_company_name || '',
        city: publicUser?.con_city || '',
        state: publicUser?.con_state || '',
        website: publicUser?.website || '',
        phone: publicUser?.company_phone || '',
      });
    }
  }, [isEditingCompany, publicUser]);

  // Add error boundary for the trades section
  const renderTrades = () => {
    try {
      const formatTradeName = (key: string) => {
        if (key === 'is_ge') return 'General Contractor';
        if (key === 'is_it') return 'IT';
        if (key === 'is_security') return 'Safety & Security';
        if (key === 'is_fire') return 'Fire';
        if (key === 'is_masonry') return 'Masonry';
        if (key === 'is_construction_management') return 'Construction Management';
        if (key === 'is_sitework_civil') return 'Sitework & Civil';
        if (key === 'is_metals_welding') return 'Metals & Welding';
        if (key === 'is_wood_carpentry') return 'Wood & Carpentry';
        if (key === 'is_thermal_moisture_protection') return 'Thermal & Moisture Protection';
        if (key === 'is_doors_windows_glazing') return 'Doors, Windows, Glazing';
        if (key === 'is_finishes') return 'Finishes';
        if (key === 'is_solar_energy') return 'Solar Energy';
        if (key === 'is_generators_backup') return 'Generators & Backup';
        if (key === 'is_environmental_specialty_services') return 'Environmental & Specialty Services';
        return key.replace('is_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      };

      return (
        <div>
          <div className="text-base font-bold text-primary mb-2 pb-1 border-b border-primary/10">Trades</div>
          {isEditingDetails ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(trades).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => {
                        try {
                          setTrades(prev => ({
                            ...prev,
                            [key]: e.target.checked
                          }));
                        } catch (err) {
                          console.error('Error updating trade state:', err);
                        }
                      }}
                      className="rounded border-primary/20"
                    />
                    <span className="text-sm">
                      {formatTradeName(key)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm break-words">
              {Object.entries(trades).some(([key, value]) => value) ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(trades)
                      .filter(([key, value]) => value)
                      .map(([key]) => (
                        <div key={key} className="flex items-center">
                          <span className="mr-2">•</span>
                          {formatTradeName(key)}
                        </div>
                      ))}
                  </div>
                </div>
              ) : 'No trades selected'}
            </div>
          )}
        </div>
      );
    } catch (err) {
      console.error('Error rendering trades:', err);
      return <div className="text-sm text-red-500">Error loading trades</div>;
    }
  };

  // Function to format client type names with special cases
  const formatClientTypeName = (key: string) => {
    const specialCases: Record<string, string> = {
      'is_joc': 'Job Order Contracting',
      'is_local_government': 'Local Government',
      'is_federal_government': 'Federal Government',
      'is_athletic_facilities': 'Athletic Facilities',
      'is_military_facilities': 'Military Facilities'
    };
    
    return specialCases[key] || key.replace('is_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Add a function to render client types
  const renderClientTypes = () => {
    try {
      return (
        <div>
          <div className="text-base font-bold text-primary mb-2 pb-1 border-b border-primary/10">Client Types</div>
          {isEditingDetails ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(clientTypes).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => {
                      try {
                        setClientTypes(prev => ({
                          ...prev,
                          [key]: e.target.checked
                        }));
                      } catch (err) {
                        console.error('Error updating client type state:', err);
                      }
                    }}
                    className="rounded border-primary/20"
                  />
                  <span className="text-sm">
                    {formatClientTypeName(key)}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-sm break-words">
              {Object.entries(clientTypes).some(([_, value]) => value) ? (
                <ul className="list-disc list-inside">
                  {Object.entries(clientTypes)
                    .filter(([_, value]) => value)
                    .map(([key]) => (
                      <li key={key}>
                        {formatClientTypeName(key)}
                      </li>
                    ))}
                </ul>
              ) : 'No client types selected'}
            </div>
          )}
        </div>
      );
    } catch (err) {
      console.error('Error rendering client types:', err);
      return <div className="text-sm text-red-500">Error loading client types</div>;
    }
  };

  // Add a function to render cooperatives
  const renderCooperatives = () => {
    try {
      const formatCooperativeName = (key: string) => {
        const specialCases: Record<string, string> = {
          'is_buy_board': 'Buy Board',
          'is_tips': 'TIPS',
          'is_choice_partners': 'Choice Partners',
          'is_omnia_partners': 'Omnia Partners',
          'is_sourcewell': 'Sourcewell'
        };
        
        return specialCases[key] || key.replace('is_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      };

      return (
        <div>
          <div className="text-base font-bold text-primary mb-2 pb-1 border-b border-primary/10">Cooperatives</div>
          {isEditingDetails ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(cooperatives).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => {
                      try {
                        setCooperatives(prev => ({
                          ...prev,
                          [key]: e.target.checked
                        }));
                      } catch (err) {
                        console.error('Error updating cooperative state:', err);
                      }
                    }}
                    className="rounded border-primary/20"
                  />
                  <span className="text-sm">
                    {formatCooperativeName(key)}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-sm break-words">
              {Object.entries(cooperatives).some(([_, value]) => value) ? (
                <ul className="list-disc list-inside">
                  {Object.entries(cooperatives)
                    .filter(([_, value]) => value)
                    .map(([key]) => (
                      <li key={key}>
                        {formatCooperativeName(key)}
                      </li>
                    ))}
                </ul>
              ) : 'No cooperatives selected'}
            </div>
          )}
        </div>
      );
    } catch (err) {
      console.error('Error rendering cooperatives:', err);
      return <div className="text-sm text-red-500">Error loading cooperatives</div>;
    }
  };

  const handleRemoveCert = (certToRemove: string) => {
    setEditedDetails(prev => ({
      ...prev,
      certifications: prev.certifications.filter(cert => cert !== certToRemove)
    }));
  };

  // Helper functions for certifications dropdown
  const getFilteredCertifications = () => {
    const searchTerm = certificationSearchQuery.toLowerCase();
    return availableCertifications.filter(cert => 
      cert.toLowerCase().includes(searchTerm)
    );
  };

  const handleAddCertification = (certification: string) => {
    if (certification.trim() && !editedDetails.certifications.includes(certification.trim())) {
      setEditedDetails(prev => ({
        ...prev,
        certifications: [...prev.certifications, certification.trim()]
      }));
    }
    setCertificationSearchQuery('');
  };

  const handleAddCustomCertification = () => {
    if (newCert.trim() && !editedDetails.certifications.includes(newCert.trim())) {
      setEditedDetails(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCert.trim()]
      }));
      setNewCert('');
    }
  };

  const handleCertificationToggle = (certification: string) => {
    if (editedDetails.certifications.includes(certification)) {
      handleRemoveCert(certification);
    } else {
      handleAddCertification(certification);
    }
  };

  // Profile picture functions
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploadingPicture(true);
    const supabase = createClient();

    try {
      // Create preview URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Delete old profile picture if it exists
      if (profilePictureUrl) {
        const oldFilename = profilePictureUrl.split('/').pop();
        if (oldFilename) {
          await supabase.storage
            .from('profile-pictures')
            .remove([`${user.id}/${oldFilename}`]);
        }
      }

      // Upload new profile picture
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      // Update user record
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_picture_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfilePictureUrl(publicUrl);
      setPreviewUrl(null);
      toast.success('Profile picture updated successfully');

    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error('Failed to upload profile picture');
      setPreviewUrl(null);
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!profilePictureUrl || !user) return;

    setIsUploadingPicture(true);
    const supabase = createClient();

    try {
      // Delete from storage
      const filename = profilePictureUrl.split('/').pop();
      if (filename) {
        await supabase.storage
          .from('profile-pictures')
          .remove([`${user.id}/${filename}`]);
      }

      // Update user record
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_picture_url: null })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfilePictureUrl(null);
      toast.success('Profile picture removed successfully');

    } catch (error) {
      console.error('Error removing profile picture:', error);
      toast.error('Failed to remove profile picture');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  // Organization picture functions
  const handleOrganizationPictureUpload = async (event: React.ChangeEvent<HTMLInputElement>, organization: Organization) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploadingOrgPicture(true);
    setSelectedOrgForPicture(organization);
    const supabase = createClient();

    try {
      // Create preview URL
      const preview = URL.createObjectURL(file);
      setOrgPreviewUrl(preview);

      // Delete old organization picture if it exists
      if (organization.organization_picture_url) {
        const oldFilename = organization.organization_picture_url.split('/').pop();
        if (oldFilename) {
          await supabase.storage
            .from('organization-pictures')
            .remove([`${organization.id}/${oldFilename}`]);
        }
      }

      // Upload new organization picture
      const fileExt = file.name.split('.').pop();
      const fileName = `${organization.id}/org-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('organization-pictures')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('organization-pictures')
        .getPublicUrl(fileName);

      // Update organization record
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ organization_picture_url: publicUrl })
        .eq('id', organization.id);

      if (updateError) throw updateError;

      // Update local state
      setOrganizations(prev => 
        prev.map(org => 
          org.id === organization.id 
            ? { ...org, organization_picture_url: publicUrl }
            : org
        )
      );

      setOrgPreviewUrl(null);
      setSelectedOrgForPicture(null);
      toast.success('Organization picture updated successfully');

    } catch (error) {
      console.error('Error uploading organization picture:', error);
      toast.error('Failed to upload organization picture');
      setOrgPreviewUrl(null);
      setSelectedOrgForPicture(null);
    } finally {
      setIsUploadingOrgPicture(false);
    }
  };

  const handleRemoveOrganizationPicture = async (organization: Organization) => {
    if (!organization.organization_picture_url || !user) return;

    setIsUploadingOrgPicture(true);
    setSelectedOrgForPicture(organization);
    const supabase = createClient();

    try {
      // Delete from storage
      const filename = organization.organization_picture_url.split('/').pop();
      if (filename) {
        await supabase.storage
          .from('organization-pictures')
          .remove([`${organization.id}/${filename}`]);
      }

      // Update organization record
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ organization_picture_url: null })
        .eq('id', organization.id);

      if (updateError) throw updateError;

      // Update local state
      setOrganizations(prev => 
        prev.map(org => 
          org.id === organization.id 
            ? { ...org, organization_picture_url: null }
            : org
        )
      );

      setSelectedOrgForPicture(null);
      toast.success('Organization picture removed successfully');

    } catch (error) {
      console.error('Error removing organization picture:', error);
      toast.error('Failed to remove organization picture');
      setSelectedOrgForPicture(null);
    } finally {
      setIsUploadingOrgPicture(false);
    }
  };

  // Privacy settings function
  const handlePrivacyToggle = async () => {
    if (!user) return;
    
    setIsUpdatingPrivacy(true);
    const supabase = createClient();

    try {
      if (publicUser?.role === 'Contractor') {
        // Update user's privacy setting
        const { error } = await supabase
          .from('users')
          .update({ is_private: !isPrivate })
          .eq('id', user.id);

        if (error) throw error;

        // Update local state
        setPublicUser((prev: any) => ({
          ...prev,
          is_private: !isPrivate
        }));
        
        toast.success(`Profile ${!isPrivate ? 'hidden' : 'made public'} successfully`);
      } else if (publicUser?.role === 'Org Owner' && organizations.length > 0) {
        // Update organization's privacy setting
        const { error } = await supabase
          .from('organizations')
          .update({ is_private: !isPrivate })
          .eq('id', organizations[0].id);

        if (error) throw error;

        // Update local state
        setOrganizations(prev => 
          prev.map(org => 
            org.id === organizations[0].id 
              ? { ...org, is_private: !isPrivate }
              : org
          )
        );
        
        toast.success(`Organization ${!isPrivate ? 'hidden' : 'made public'} successfully`);
      }

      setIsPrivate(!isPrivate);
    } catch (error) {
      console.error('Error updating privacy setting:', error);
      toast.error('Failed to update privacy setting');
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  if (isLoading) {
    return <div className="container max-w-7xl py-12 px-4">Loading...</div>;
  }

  if (!user) return null;

  const userRole = publicUser?.role;

  return (
    <div className="container max-w-7xl py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      
      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        <div className="bg-background p-4 rounded-lg border border-primary/20 hover:bg-primary/5">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium text-primary">Name</div>
            <div className="text-sm break-words">{publicUser?.full_name || user.user_metadata.full_name}</div>
            
            <div className="text-sm font-medium text-primary">Email</div>
            <div className="text-sm break-all">{user.email}</div>
            
            <div className="text-sm font-medium text-primary">Role</div>
            <div className="text-sm break-words">{publicUser?.role || 'Not specified'}</div>
            
            <div className="text-sm font-medium text-primary">Last Sign In</div>
            <div className="text-sm break-words">{new Date(user.last_sign_in_at || '').toLocaleString()}</div>
            
            <div className="text-sm font-medium text-primary">Account Created</div>
            <div className="text-sm break-words">{new Date(user.created_at).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-primary/20 mb-8">
        <table className="min-w-full table-fixed divide-y divide-primary/10">
          <thead className="bg-primary/5">
            <tr>
              <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Name</th>
              <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Email</th>
              <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Role</th>
              <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Last Sign In</th>
              <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Account Created</th>
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-primary/10">
            <tr className="hover:bg-primary/5">
              <td className="px-4 py-4 text-sm truncate">{publicUser?.full_name || user.user_metadata.full_name}</td>
              <td className="px-4 py-4 text-sm truncate">{user.email}</td>
              <td className="px-4 py-4 text-sm truncate">{publicUser?.role || 'Not specified'}</td>
              <td className="px-4 py-4 text-sm truncate">{new Date(user.last_sign_in_at || '').toLocaleString()}</td>
              <td className="px-4 py-4 text-sm truncate">{new Date(user.created_at).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Profile Picture Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Profile Picture</h2>
        <div className="bg-background p-6 rounded-lg border border-primary/20 hover:bg-primary/5">
          <div className="flex items-center gap-6">
            {/* Current Profile Picture */}
            <div className="flex-shrink-0">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={previewUrl || profilePictureUrl || undefined} 
                  alt="Profile Picture" 
                />
                <AvatarFallback className="text-2xl">
                  {user.user_metadata.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Upload Controls */}
            <div className="flex-1">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload a profile picture to personalize your account. This will be displayed in the navigation bar.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supported formats: JPEG, PNG, WebP, GIF. Maximum size: 5MB.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Upload Button */}
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      disabled={isUploadingPicture}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUploadingPicture}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {isUploadingPicture ? 'Uploading...' : 'Upload Picture'}
                    </Button>
                  </div>

                  {/* Remove Button */}
                  {profilePictureUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveProfilePicture}
                      disabled={isUploadingPicture}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Company Information Card */}
      {(userRole === 'Contractor' || userRole === 'Org Owner') && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Company Information</h2>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => handleEditModeChange(true, 'company')}
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
          </div>
          <div className="bg-background p-6 rounded-lg border border-primary/20 hover:bg-primary/5">
            <div className="grid grid-cols-1 gap-4">
              {userRole === 'Contractor' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-base font-bold text-primary mb-2 pb-1 border-b border-primary/10">Company Name</div>
                      {isEditingCompany ? (
                        <input
                          type="text"
                          className="w-full p-2 border rounded-md"
                          value={editedCompany.companyName}
                          onChange={(e) => setEditedCompany(prev => ({ ...prev, companyName: e.target.value }))}
                        />
                      ) : (
                        <div className="text-sm break-words">{publicUser?.con_company_name || 'Not specified'}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-base font-bold text-primary mb-2 pb-1 border-b border-primary/10">Company Website</div>
                      {isEditingCompany ? (
                        <input
                          type="url"
                          className="w-full p-2 border rounded-md"
                          value={editedCompany.website}
                          onChange={(e) => setEditedCompany(prev => ({ ...prev, website: e.target.value }))}
                          placeholder="https://example.com"
                        />
                      ) : (
                        <div className="text-sm break-words">
                          {publicUser?.website ? (
                            <a 
                              href={publicUser.website.startsWith('http') ? publicUser.website : `https://${publicUser.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {publicUser.website}
                            </a>
                          ) : (
                            'Not specified'
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-base font-bold text-primary mb-2 pb-1 border-b border-primary/10">City</div>
                      {isEditingCompany ? (
                        <input
                          type="text"
                          className="w-full p-2 border rounded-md"
                          value={editedCompany.city}
                          onChange={(e) => setEditedCompany(prev => ({ ...prev, city: e.target.value }))}
                        />
                      ) : (
                        <div className="text-sm break-words">{publicUser?.con_city || 'Not specified'}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-base font-bold text-primary mb-2 pb-1 border-b border-primary/10">State</div>
                      {isEditingCompany ? (
                        <input
                          type="text"
                          className="w-full p-2 border rounded-md"
                          value={editedCompany.state}
                          onChange={(e) => setEditedCompany(prev => ({ ...prev, state: e.target.value }))}
                        />
                      ) : (
                        <div className="text-sm break-words">{publicUser?.con_state || 'Not specified'}</div>
                      )}
                    </div>
                  </div>
                </>
              )}
              {userRole === 'Org Owner' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-base font-bold text-primary mb-2 pb-1 border-b border-primary/10">Company Website</div>
                    {isEditingCompany ? (
                      <input
                        type="url"
                        className="w-full p-2 border rounded-md"
                        value={editedCompany.website}
                        onChange={(e) => setEditedCompany(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://example.com"
                      />
                    ) : (
                      <div className="text-sm break-words">
                        {publicUser?.website ? (
                          <a 
                            href={publicUser.website.startsWith('http') ? publicUser.website : `https://${publicUser.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {publicUser.website}
                          </a>
                        ) : (
                          'Not specified'
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-base font-bold text-primary mb-2 pb-1 border-b border-primary/10">Phone Number</div>
                  {isEditingCompany ? (
                    <input
                      type="tel"
                      className="w-full p-2 border rounded-md"
                      value={editedCompany.phone}
                      onChange={(e) => handlePhoneInput(e.target.value, (value) => 
                        setEditedCompany(prev => ({ ...prev, phone: value }))
                      )}
                      onKeyDown={handlePhoneKeyDown}
                      onPaste={(e) => handlePhonePaste(e, (value) => 
                        setEditedCompany(prev => ({ ...prev, phone: value }))
                      )}
                      placeholder="(123) 456-7890"
                      maxLength={16} // Maximum length including formatting characters
                      pattern="^(\+\d{1})?[ ]?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}$"
                      title="Please enter a valid phone number"
                    />
                  ) : (
                    <div className="text-sm break-words">
                      {publicUser?.company_phone ? (
                        <a 
                          href={`tel:${publicUser.company_phone}`}
                          className="text-primary hover:underline"
                        >
                          {formatPhoneNumber(publicUser.company_phone)}
                        </a>
                      ) : (
                        'Not specified'
                      )}
                    </div>
                  )}
                </div>
              </div>
              {isEditingCompany && (
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleEditModeChange(false, 'company')}
                  >
                    <X className="h-4 w-4" />
                    Discard
                  </Button>
                  <Button
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={handleSaveCompany}
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contractor Details Card */}
      {userRole === 'Contractor' && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Contractor Details</h2>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => handleEditModeChange(true, 'details')}
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
          </div>
          <div className="bg-background p-6 rounded-lg border border-primary/20 hover:bg-primary/5">
            <div className="grid grid-cols-1 gap-4">
              <div>
                {renderTrades()}
              </div>
              <div>
                {renderClientTypes()}
              </div>
              <div>
                {renderCooperatives()}
              </div>
              <div>
                <div className="text-base font-bold text-primary mb-2 pb-1 border-b border-primary/10">Certifications</div>
                {isEditingDetails ? (
                  <div className="space-y-4">
                    {/* Selected Certifications Display */}
                    <div className="flex flex-wrap gap-2">
                      {editedDetails.certifications.map((cert, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm"
                        >
                          <span>{cert}</span>
                          <button
                            onClick={() => handleRemoveCert(cert)}
                            className="text-primary hover:text-primary/80"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Certifications Dropdown */}
                    <DropdownMenu open={isCertificationDropdownOpen} onOpenChange={setIsCertificationDropdownOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-dashed w-full justify-start"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Certifications
                          {editedDetails.certifications.length > 0 && (
                            <>
                              <span className="mx-2 h-4 w-px bg-border" />
                              <Badge
                                variant="secondary"
                                className="rounded-sm px-1 font-normal"
                              >
                                {editedDetails.certifications.length} selected
                              </Badge>
                            </>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        className="w-80"
                        onInteractOutside={(e) => {
                          // Prevent closing when clicking the input
                          if (e.target instanceof HTMLElement && e.target.closest('input')) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <DropdownMenuSeparator />
                        
                        {/* Search input */}
                        <div className="px-2 py-2">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search certifications..."
                              value={certificationSearchQuery}
                              onChange={(e) => {
                                e.stopPropagation();
                                setCertificationSearchQuery(e.target.value);
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

                        {/* Available certifications list */}
                        <div className="max-h-[300px] overflow-y-auto">
                          {getFilteredCertifications().map((certification) => (
                            <DropdownMenuCheckboxItem
                              key={certification}
                              checked={editedDetails.certifications.includes(certification)}
                              onCheckedChange={() => handleCertificationToggle(certification)}
                              onSelect={(e) => e.preventDefault()}
                            >
                              {certification}
                            </DropdownMenuCheckboxItem>
                          ))}
                        </div>

                        {/* Custom certification input */}
                        <DropdownMenuSeparator />
                        <div className="px-2 py-2">
                          <div className="text-xs text-muted-foreground mb-2">Add custom certification:</div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter custom certification..."
                              value={newCert}
                              onChange={(e) => {
                                e.stopPropagation();
                                setNewCert(e.target.value);
                              }}
                              onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCustomCertification();
                                }
                                // Prevent dropdown from closing on Escape
                                if (e.key === 'Escape') {
                                  e.preventDefault();
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddCustomCertification();
                              }}
                              disabled={!newCert.trim()}
                            >
                              Add
                            </Button>
                          </div>
                        </div>

                        {/* Clear all button */}
                        {editedDetails.certifications.length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 cursor-pointer"
                              onClick={() => {
                                setEditedDetails(prev => ({
                                  ...prev,
                                  certifications: []
                                }));
                                setCertificationSearchQuery('');
                                setNewCert('');
                              }}
                            >
                              Clear all
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {publicUser?.con_certs?.length ? (
                      publicUser.con_certs.map((cert: string, index: number) => (
                        <div
                          key={index}
                          className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm"
                        >
                          {cert}
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No certifications added</span>
                    )}
                  </div>
                )}
              </div>
              {isEditingDetails && (
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setIsEditingDetails(false)}
                  >
                    <X className="h-4 w-4" />
                    Discard
                  </Button>
                  <Button
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={handleSaveDetails}
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conditional Organizations/Projects Section */}
      <div className="mb-8 mt-8 md:mt-0">
        {userRole === 'Contractor' ? (
          // Projects Section for Contractors
          <>
            <h2 className="text-xl font-bold mb-4">My Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project: Project) => (
                <div key={project.id} className="bg-background p-6 rounded-lg border border-primary/20 hover:bg-primary/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{project.name}</h3>
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
                  )}
                  <div className="flex flex-col gap-2">
                    <div className="text-xs text-muted-foreground">
                      Status: <span className="font-medium">{project.status || 'Not specified'}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Added on {new Date(project.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  You are not assigned to any projects yet.
                </div>
              )}
            </div>
          </>
        ) : (
          // Original Organizations Section for non-Contractors
          <>
            <h2 className="text-xl font-bold mb-4">My Organizations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {organizations.map((org: Organization) => (
                <div key={org.id} className="bg-background p-6 rounded-lg border border-primary/20 hover:bg-primary/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarImage 
                        src={
                          selectedOrgForPicture?.id === org.id && orgPreviewUrl 
                            ? orgPreviewUrl 
                            : org.organization_picture_url || undefined
                        } 
                        alt={`${org.name} organization picture`} 
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {org.name?.charAt(0) || <Building2 className="h-6 w-6" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold">{org.name}</h3>
                    </div>
                  </div>
                  
                  {/* Organization Picture Upload (Admin/Org Owner only) */}
                  {(publicUser?.role === 'Admin' || publicUser?.role === 'Org Owner') && (
                    <div className="mb-4 p-3 bg-muted/30 rounded-md">
                      <p className="text-xs text-muted-foreground mb-2">Organization Picture</p>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleOrganizationPictureUpload(e, org)}
                            disabled={isUploadingOrgPicture && selectedOrgForPicture?.id === org.id}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isUploadingOrgPicture && selectedOrgForPicture?.id === org.id}
                            className="text-xs h-7 px-2"
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            {isUploadingOrgPicture && selectedOrgForPicture?.id === org.id ? 'Uploading...' : 'Upload'}
                          </Button>
                        </div>
                        
                        {org.organization_picture_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveOrganizationPicture(org)}
                            disabled={isUploadingOrgPicture && selectedOrgForPicture?.id === org.id}
                            className="text-xs h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {org.description && (
                    <p className="text-sm text-muted-foreground mb-4">{org.description}</p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Member since {new Date(org.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {organizations.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  You are not a member of any organizations yet.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Subscription Status Section - Only show for non-Org Owners */}
      {userRole !== 'Org Owner' && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Subscription Status</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Subscription
              </CardTitle>
              <CardDescription>
                View your current subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-4">
                  {/* Active Subscription Info */}
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-800">
                          {subscription.plan_type === 'free-trial' ? 'Free Trial Active' : 'Active Subscription'}
                        </h3>
                        <p className="text-sm text-green-700">
                          {subscription.plan_type === 'free-trial' && 'One Day Free Access'}
                          {subscription.plan_type === 'monthly' && 'Monthly Plan ($125/month)'}
                          {subscription.plan_type === 'six-month' && '6-Month Prepaid Plan ($600)'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {subscription.status}
                    </Badge>
                  </div>

                  {/* Expiration Info */}
                  {(subscription.trial_expires_at || subscription.subscription_expires_at) && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800">
                          {subscription.plan_type === 'free-trial' ? 'Trial Expires' : 'Next Billing Date'}
                        </p>
                        <p className="text-sm text-blue-700">
                          {new Date(subscription.trial_expires_at || subscription.subscription_expires_at!).toLocaleDateString()} at{' '}
                          {new Date(subscription.trial_expires_at || subscription.subscription_expires_at!).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Trial Warning */}
                  {subscription.plan_type === 'free-trial' && subscription.trial_expires_at && (
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-800">
                          Trial Expires Soon
                        </p>
                        <p className="text-sm text-yellow-700">
                          Your free trial will expire soon. Upgrade to a paid plan to continue enjoying full access.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    {subscription.plan_type === 'free-trial' ? (
                      <Link href="/pricing">
                        <Button className="w-full sm:w-auto">
                          Upgrade to Paid Plan
                        </Button>
                      </Link>
                    ) : (
                      <>
                        <Button variant="outline" className="w-full sm:w-auto">
                          Manage Billing
                        </Button>
                        <Button variant="outline" className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50">
                          Cancel Subscription
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* No Active Subscription */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">No Active Subscription</h3>
                        <p className="text-sm text-gray-700">
                          You don't have an active subscription. Choose a plan to get started.
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                      Inactive
                    </Badge>
                  </div>

                  {/* Action Button */}
                  <div className="pt-4">
                    <Link href="/pricing">
                      <Button className="w-full sm:w-auto">
                        View Plans
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Privacy Settings Section */}
      {(userRole === 'Contractor' || userRole === 'Org Owner') && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Privacy Settings</h2>
          <div className="bg-background p-6 rounded-lg border border-primary/20 hover:bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  {userRole === 'Contractor' ? 'Profile Visibility' : 'Organization Visibility'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {userRole === 'Contractor' 
                    ? 'Control whether your profile is visible to other users in the contractor directory.'
                    : 'Control whether your organization is visible to other users in the organization directory.'
                  }
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  {isPrivate 
                    ? 'Your profile is currently hidden from public directories.'
                    : 'Your profile is currently visible in public directories.'
                  }
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="privacy-toggle"
                    checked={!isPrivate}
                    onChange={handlePrivacyToggle}
                    disabled={isUpdatingPrivacy}
                    className="rounded border-primary/20"
                  />
                  <label htmlFor="privacy-toggle" className="text-sm font-medium">
                    {isPrivate ? 'Hidden' : 'Public'}
                  </label>
                </div>
                {isUpdatingPrivacy && (
                  <div className="text-xs text-muted-foreground">
                    Updating...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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