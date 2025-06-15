'use client';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Building2, Edit2, Save, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Organization {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
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
  other: string[];
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

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [publicUser, setPublicUser] = useState<any>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    other: [],
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

  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [editedCompany, setEditedCompany] = useState({
    companyName: '',
    city: '',
    state: '',
    website: '',
  });

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editedDetails, setEditedDetails] = useState({
    cooperatives: [] as string[],
    certifications: [] as string[],
  });

  const [newCoop, setNewCoop] = useState('');
  const [newCert, setNewCert] = useState('');
  const [newOtherTrade, setNewOtherTrade] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      // Get auth user data
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) return;

      // Get public.users data with organization and project details
      const { data: publicUser, error } = await supabase
        .from('users')
        .select(`
          *,
          con_company_name,
          con_city,
          con_state,
          website,
          con_coops,
          con_certs,
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
            other
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
          user_orgs:"user-org"(
            organization:organizations(
              id,
              name,
              description,
              created_at
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
        
        // Initialize edit states with current values
        setEditedCompany({
          companyName: publicUser.con_company_name || '',
          city: publicUser.con_city || '',
          state: publicUser.con_state || '',
          website: publicUser.website || '',
        });
        
        setEditedDetails({
          cooperatives: publicUser.con_coops || [],
          certifications: publicUser.con_certs || [],
        });

        // Set trades from contractor_trades
        if (publicUser.contractor_trades) {
          setTrades({
            ...publicUser.contractor_trades,
            other: publicUser.contractor_trades.other || []
          });
        }

        // Set client types from contractor_client_types
        if (publicUser.contractor_client_types) {
          setClientTypes(publicUser.contractor_client_types);
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
          other: trades.other || []
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

      // Then update user details
      const { error: userError } = await supabase
        .from('users')
        .update({
          con_coops: editedDetails.cooperatives,
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
        con_coops: editedDetails.cooperatives,
        con_certs: editedDetails.certifications,
        contractor_trades: {
          ...trades,
          other: trades.other || []
        },
        contractor_client_types: clientTypes
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
        cooperatives: publicUser?.con_coops || [],
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
      });
    }
  }, [isEditingCompany, publicUser]);

  // Add error boundary for the trades section
  const renderTrades = () => {
    try {
      const formatTradeName = (key: string) => {
        if (key === 'is_ge') return 'General Contractor';
        return key.replace('is_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      };

      return (
        <div>
          <div className="text-base font-bold text-primary mb-2 pb-1 border-b border-primary/10">Trades</div>
          {isEditingDetails ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(trades)
                  .filter(([key]) => key !== 'other')
                  .map(([key, value]) => (
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
              <div>
                <div className="text-sm font-medium text-primary mb-2">Other Trades</div>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {trades.other.map((trade, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm"
                      >
                        <span>{trade}</span>
                        <button
                          onClick={() => handleRemoveOtherTrade(trade)}
                          className="text-primary hover:text-primary/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={newOtherTrade}
                    onChange={(e) => setNewOtherTrade(e.target.value)}
                    onKeyDown={handleAddOtherTrade}
                    placeholder="Type and press Enter to add another trade"
                    className="w-full p-2 border rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm break-words">
              {Object.entries(trades).some(([key, value]) => key !== 'other' && value) ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(trades)
                      .filter(([key, value]) => key !== 'other' && value)
                      .map(([key]) => (
                        <div key={key} className="flex items-center">
                          <span className="mr-2">•</span>
                          {formatTradeName(key)}
                        </div>
                      ))}
                  </div>
                  {trades.other.length > 0 && (
                    <div className="mt-2">
                      <div className="text-sm font-medium text-primary mb-1">Other:</div>
                      <div className="grid grid-cols-2 gap-2">
                        {trades.other.map((trade, index) => (
                          <div key={index} className="flex items-center">
                            <span className="mr-2">•</span>
                            {trade}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

  const handleAddCoop = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newCoop.trim()) {
      e.preventDefault();
      if (!editedDetails.cooperatives.includes(newCoop.trim())) {
        setEditedDetails(prev => ({
          ...prev,
          cooperatives: [...prev.cooperatives, newCoop.trim()]
        }));
      }
      setNewCoop('');
    }
  };

  const handleRemoveCoop = (coopToRemove: string) => {
    setEditedDetails(prev => ({
      ...prev,
      cooperatives: prev.cooperatives.filter(coop => coop !== coopToRemove)
    }));
  };

  const handleAddCert = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newCert.trim()) {
      e.preventDefault();
      if (!editedDetails.certifications.includes(newCert.trim())) {
        setEditedDetails(prev => ({
          ...prev,
          certifications: [...prev.certifications, newCert.trim()]
        }));
      }
      setNewCert('');
    }
  };

  const handleRemoveCert = (certToRemove: string) => {
    setEditedDetails(prev => ({
      ...prev,
      certifications: prev.certifications.filter(cert => cert !== certToRemove)
    }));
  };

  const handleAddOtherTrade = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newOtherTrade.trim()) {
      e.preventDefault();
      if (!trades.other.includes(newOtherTrade.trim())) {
        setTrades(prev => ({
          ...prev,
          other: [...prev.other, newOtherTrade.trim()]
        }));
      }
      setNewOtherTrade('');
    }
  };

  const handleRemoveOtherTrade = (tradeToRemove: string) => {
    setTrades(prev => ({
      ...prev,
      other: prev.other.filter(trade => trade !== tradeToRemove)
    }));
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

      {/* Company Information Card */}
      {userRole === 'Contractor' && (
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
                <div className="text-base font-bold text-primary mb-2 pb-1 border-b border-primary/10">Cooperatives</div>
                {isEditingDetails ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {editedDetails.cooperatives.map((coop, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm"
                        >
                          <span>{coop}</span>
                          <button
                            onClick={() => handleRemoveCoop(coop)}
                            className="text-primary hover:text-primary/80"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={newCoop}
                      onChange={(e) => setNewCoop(e.target.value)}
                      onKeyDown={handleAddCoop}
                      placeholder="Type and press Enter to add a cooperative"
                      className="w-full p-2 border rounded-md text-sm"
                    />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {publicUser?.con_coops?.length ? (
                      publicUser.con_coops.map((coop: string, index: number) => (
                        <div
                          key={index}
                          className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm"
                        >
                          {coop}
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No cooperatives added</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <div className="text-base font-bold text-primary mb-2 pb-1 border-b border-primary/10">Certifications</div>
                {isEditingDetails ? (
                  <div className="space-y-2">
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
                    <input
                      type="text"
                      value={newCert}
                      onChange={(e) => setNewCert(e.target.value)}
                      onKeyDown={handleAddCert}
                      placeholder="Type and press Enter to add a certification"
                      className="w-full p-2 border rounded-md text-sm"
                    />
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
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{org.name}</h3>
                  </div>
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