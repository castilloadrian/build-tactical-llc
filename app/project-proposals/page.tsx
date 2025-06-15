'use client';

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Clock, CheckCircle, XCircle, Send, Inbox, ChevronDown, ChevronUp } from "lucide-react";
import { CreateProposalModal } from "@/components/create-proposal-modal";

interface Proposal {
  id: number;
  title: string;
  description: string;
  status: 'Under Review' | 'Approved' | 'Denied';
  created_at: string;
  budget: number;
  sender: string;
  receiver: string;
  organization: number;
  sender_name?: string;
  receiver_name?: string;
  organization_name?: string;
  type: 'incoming' | 'outgoing';
}

interface Contractor {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface Organization {
  id: number;
  name: string | null;
}

export default function ProjectProposalsPage() {
  const [user, setUser] = useState<any>(null);
  const [publicUser, setPublicUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('outgoing');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const supabase = createClient();

  // Set default tab based on user role
  useEffect(() => {
    if (publicUser?.role === 'Org Owner') {
      setActiveTab('outgoing'); // Org Owners now send proposals, so default to outgoing
    }
  }, [publicUser]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        redirect("/sign-in");
        return;
      }
      
      setUser(user);

      const { data: publicUserData } = await supabase
        .from('users')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

      setPublicUser(publicUserData);

      // Fetch real proposals from database
      await fetchProposals(user.id);
    };

    fetchData();
  }, []);

  const fetchProposals = async (userId: string) => {
    try {
      let data, error;
      let orgUserIds: string[] = []; // Track org user IDs for type determination
      
      if (publicUser?.role === 'Admin') {
        // Admins see ALL proposals
        const result = await supabase
          .from('proposals')
          .select(`
            *,
            sender_user:users!proposals_sender_fkey(full_name),
            receiver_user:users!proposals_receiver_fkey(full_name),
            organization_data:organizations(name)
          `)
          .order('created_at', { ascending: false });
        
        data = result.data;
        error = result.error;
      } else if (publicUser?.role === 'Org Owner') {
        // Org Owners see ALL proposals sent by users from their organization AND contractor-to-contractor proposals tagged under their organization
        const { data: userOrgs, error: orgError } = await supabase
          .from('user-org')
          .select('org_id')
          .eq('user_id', userId);
        
        const orgIds = userOrgs?.map(uo => uo.org_id) || [];
        
        if (orgIds.length > 0) {
          // First, get all users who belong to the same organizations
          const { data: orgUsers, error: orgUsersError } = await supabase
            .from('user-org')
            .select('user_id')
            .in('org_id', orgIds);
          
          orgUserIds = orgUsers?.map(ou => ou.user_id) || [];
          
          if (orgUsersError) throw orgUsersError;
          
          const result = await supabase
            .from('proposals')
            .select(`
              *,
              sender_user:users!proposals_sender_fkey(full_name),
              receiver_user:users!proposals_receiver_fkey(full_name),
              organization_data:organizations(name)
            `)
            .or(`sender.in.(${orgUserIds.join(',')}),organization.in.(${orgIds.join(',')})`)
            .order('created_at', { ascending: false });
          
          data = result.data;
          error = result.error;
        } else {
          // No organizations, no proposals
          setProposals([]);
          return;
        }
      } else {
        // Contractors see proposals they sent or received
        const result = await supabase
          .from('proposals')
          .select(`
            *,
            sender_user:users!proposals_sender_fkey(full_name),
            receiver_user:users!proposals_receiver_fkey(full_name),
            organization_data:organizations(name)
          `)
          .or(`sender.eq.${userId},receiver.eq.${userId}`)
          .order('created_at', { ascending: false });
        
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      const formattedProposals: Proposal[] = data?.map((proposal: any) => {
        // Determine if proposal is outgoing or incoming based on user role
        let proposalType: 'outgoing' | 'incoming';
        
        if (publicUser?.role === 'Org Owner') {
          // For org owners, use a simpler and more reliable approach:
          // 1. If sender is from our organization → "Sent Proposals" 
          // 2. If sender is NOT from our organization but org is tagged → "Tagged Proposals"
          
          if (orgUserIds.includes(proposal.sender)) {
            // Proposal sent by someone from our organization
            proposalType = 'outgoing'; // Show in "Sent Proposals" tab
          } else {
            // Proposal sent by external party but our org is tagged
            proposalType = 'incoming'; // Show in "Tagged Proposals" tab
          }
        } else {
          // For contractors and admins, only proposals they personally sent are outgoing
          proposalType = proposal.sender === userId ? 'outgoing' : 'incoming';
        }
        
        return {
          id: proposal.id,
          title: proposal.title || '',
          description: proposal.description || '',
          status: proposal.status || 'Under Review',
          created_at: proposal.created_at,
          budget: proposal.budget || 0,
          sender: proposal.sender,
          receiver: proposal.receiver,
          organization: proposal.organization,
          sender_name: proposal.sender_user?.full_name || 'Unknown User',
          receiver_name: proposal.receiver_user?.full_name || 'Unknown User',
          organization_name: proposal.organization_data?.name || 'Unknown Organization',
          type: proposalType
        };
      }) || [];

      setProposals(formattedProposals);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    }
  };

  // Fetch contractors for the dropdown
  useEffect(() => {
    const fetchContractors = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, email')
          .eq('role', 'Contractor')
          .order('full_name');

        if (error) throw error;
        setContractors(data || []);
      } catch (error) {
        console.error('Error fetching contractors:', error);
      }
    };

    const fetchOrganizations = async () => {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name')
          .order('name');

        if (error) throw error;
        setOrganizations(data || []);
      } catch (error) {
        console.error('Error fetching organizations:', error);
      }
    };

    if (user) {
      fetchContractors();
      fetchOrganizations();
    }
  }, [user]);

  const handleCreateProposal = async (proposalData: {
    title: string;
    description: string;
    budget: string;
    receiver: string;
    organization: string;
  }) => {
    try {
      // Insert proposal into database
      const { data, error } = await supabase
        .from('proposals')
        .insert({
          title: proposalData.title,
          description: proposalData.description,
          budget: parseFloat(proposalData.budget),
          status: 'Under Review',
          sender: user.id,
          receiver: proposalData.receiver,
          organization: parseInt(proposalData.organization)
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Proposal created successfully:', data);
      
      // Refresh proposals list
      await fetchProposals(user.id);
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('Failed to create proposal. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Under Review': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Denied': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Under Review': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Denied': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredProposals = proposals.filter(proposal => {
    if (publicUser?.role === 'Admin') {
      // Admins see all proposals, filter by active tab
      return activeTab === 'outgoing' 
        ? true // Show all in "All Proposals" tab
        : true; // Show all in "All Received" tab (we'll adjust tab logic)
    } else if (publicUser?.role === 'Org Owner') {
      // Org Owners see proposals they sent AND contractor-to-contractor proposals for their org
      return activeTab === 'outgoing' ? proposal.type === 'outgoing' : proposal.type === 'incoming';
    } else {
      // Contractors see based on whether they sent or received
      return activeTab === 'outgoing' ? proposal.type === 'outgoing' : proposal.type === 'incoming';
    }
  });

  const toggleExpanded = (proposalId: string) => {
    setExpandedProposal(expandedProposal === proposalId ? null : proposalId);
  };

  const handleApprove = async (proposalId: string) => {
    try {
      const { error } = await supabase
        .from('proposals')
        .update({ status: 'Approved' })
        .eq('id', proposalId);

      if (error) throw error;

      console.log('Proposal approved:', proposalId);
      
      // Refresh proposals list
      await fetchProposals(user.id);
    } catch (error) {
      console.error('Error approving proposal:', error);
      alert('Failed to approve proposal. Please try again.');
    }
  };

  const handleDeny = async (proposalId: string) => {
    try {
      const { error } = await supabase
        .from('proposals')
        .update({ status: 'Denied' })
        .eq('id', proposalId);

      if (error) throw error;

      console.log('Proposal denied:', proposalId);
      
      // Refresh proposals list
      await fetchProposals(user.id);
    } catch (error) {
      console.error('Error denying proposal:', error);
      alert('Failed to deny proposal. Please try again.');
    }
  };

  const handleDelete = async (proposalId: string) => {
    if (!confirm('Are you sure you want to delete this proposal? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', proposalId);

      if (error) throw error;

      console.log('Proposal deleted:', proposalId);
      
      // Refresh proposals list
      await fetchProposals(user.id);
    } catch (error) {
      console.error('Error deleting proposal:', error);
      alert('Failed to delete proposal. Please try again.');
    }
  };

  if (!user || !publicUser) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  return (
    <div className="container max-w-7xl py-12 px-4">
      <div className="flex flex-col gap-6 mb-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-foreground mb-3">Project Proposals</h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            {publicUser?.role === 'Contractor' 
              ? 'Send proposals to other contractors and receive proposals from organizations' 
              : publicUser?.role === 'Org Owner'
              ? 'Send proposals to contractors and view contractor-to-contractor proposals for your organization'
              : 'View and manage all proposals across the platform'}
          </p>
        </div>
        
        {/* Show create button for Contractors, Org Owners, and Admins */}
        {(publicUser?.role === 'Contractor' || publicUser?.role === 'Org Owner' || publicUser?.role === 'Admin') && (
          <div className="flex-shrink-0">
            <Button 
              className="bg-accent hover:bg-accent/90 text-white flex items-center gap-2 px-6 py-3 text-sm font-medium"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create Proposal
            </Button>
          </div>
        )}
      </div>

      {/* Custom Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {/* Contractors and Org Owners see both tabs, Admins see only one tab */}
            {(publicUser?.role === 'Contractor' || publicUser?.role === 'Org Owner') && (
              <button
                onClick={() => setActiveTab('outgoing')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'outgoing'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Sent Proposals
                </div>
              </button>
            )}
            
            {publicUser?.role === 'Admin' ? (
              <button
                onClick={() => setActiveTab('outgoing')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors border-accent text-accent`}
              >
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  All Proposals
                </div>
              </button>
            ) : (
              /* Contractors and Org Owners see received/incoming proposals tab */
              <button
                onClick={() => setActiveTab('incoming')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'incoming'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Inbox className="h-4 w-4" />
                  {publicUser?.role === 'Contractor' 
                    ? 'Received Proposals'
                    : 'Tagged Proposals'}
                </div>
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        {filteredProposals.map((proposal) => (
          <Card key={proposal.id} className="border-border hover:bg-primary/5 transition-colors cursor-pointer min-h-[140px]" onClick={() => toggleExpanded(proposal.id.toString())}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg truncate pr-2 leading-tight">{proposal.title}</CardTitle>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={getStatusColor(proposal.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(proposal.status)}
                      {proposal.status}
                    </div>
                  </Badge>
                  {expandedProposal === proposal.id.toString() ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className={`grid gap-2 text-sm ${publicUser?.role === 'Admin' ? 'grid-cols-2' : 'grid-cols-2'}`}>
                {/* Show From/To for Admins */}
                {publicUser?.role === 'Admin' && (
                  <>
                    <div>
                      <span className="font-medium text-primary">From:</span>
                      <p className="text-muted-foreground truncate">{proposal.sender_name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-primary">To:</span>
                      <p className="text-muted-foreground truncate">{proposal.receiver_name}</p>
                    </div>
                  </>
                )}
                <div>
                  <span className="font-medium text-primary">Organization:</span>
                  <p className="text-muted-foreground truncate">{proposal.organization_name}</p>
                </div>
                <div>
                  <span className="font-medium text-primary">Amount:</span>
                  <p className="text-muted-foreground">${proposal.budget?.toLocaleString()}</p>
                </div>
                <div>
                  <span className="font-medium text-primary">Date:</span>
                  <p className="text-muted-foreground">{new Date(proposal.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              
              {/* Expanded content */}
              {expandedProposal === proposal.id.toString() && (
                <div className="mt-4 pt-4 border-t border-border space-y-4">
                  <div>
                    <h4 className="font-medium text-primary mb-2">Project Title</h4>
                    <p className="text-sm text-foreground font-medium mb-4">{proposal.title}</p>
                    <h4 className="font-medium text-primary mb-2">Project Details</h4>
                    <p className="text-sm text-muted-foreground">{proposal.description}</p>
                  </div>
                  
                  {/* Action buttons for proposals that can be acted upon */}
                  {((proposal.status === 'Under Review' && proposal.type === 'incoming') || publicUser?.role === 'Admin') && (
                    <div className="flex gap-2 pt-2">
                      {publicUser?.role === 'Admin' && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(proposal.id.toString());
                          }}
                        >
                          Delete
                        </Button>
                      )}
                      {(proposal.status === 'Under Review') && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeny(proposal.id.toString());
                            }}
                          >
                            Deny
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(proposal.id.toString());
                            }}
                          >
                            Approve
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop view */}
      <div className="hidden md:block space-y-3">
        {/* Header for Admin view */}
        {publicUser?.role === 'Admin' && filteredProposals.length > 0 && (
          <div className="grid grid-cols-7 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
            <div>Title</div>
            <div>From</div>
            <div>To</div>
            <div>Organization</div>
            <div>Amount</div>
            <div>Status</div>
            <div>Date</div>
          </div>
        )}
        
        {/* Header for non-Admin view */}
        {publicUser?.role !== 'Admin' && filteredProposals.length > 0 && (
          <div className="grid grid-cols-5 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
            <div>Title</div>
            <div>Organization</div>
            <div>Amount</div>
            <div>Status</div>
            <div>Date</div>
          </div>
        )}
        
        {filteredProposals.map((proposal) => (
          <Card key={proposal.id} className="border-border hover:bg-primary/5 transition-colors cursor-pointer min-h-[80px]" onClick={() => toggleExpanded(proposal.id.toString())}>
            <CardContent className="p-4">
              {/* Admin view with From/To columns */}
              {publicUser?.role === 'Admin' ? (
                <div className="grid grid-cols-7 gap-4 items-center h-12">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{proposal.title}</div>
                  </div>
                  <div className="text-sm text-foreground truncate">{proposal.sender_name}</div>
                  <div className="text-sm text-foreground truncate">{proposal.receiver_name}</div>
                  <div className="text-sm text-foreground truncate">{proposal.organization_name}</div>
                  <div className="text-sm text-foreground">${proposal.budget?.toLocaleString()}</div>
                  <div>
                    <Badge className={getStatusColor(proposal.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(proposal.status)}
                        {proposal.status}
                      </div>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {new Date(proposal.created_at).toLocaleDateString()}
                    </div>
                    {expandedProposal === proposal.id.toString() ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              ) : (
                /* Non-admin view */
                <div className="grid grid-cols-5 gap-4 items-center h-12">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{proposal.title}</div>
                  </div>
                  <div className="text-sm text-foreground truncate">{proposal.organization_name}</div>
                  <div className="text-sm text-foreground">${proposal.budget?.toLocaleString()}</div>
                  <div>
                    <Badge className={getStatusColor(proposal.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(proposal.status)}
                        {proposal.status}
                      </div>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {new Date(proposal.created_at).toLocaleDateString()}
                    </div>
                    {expandedProposal === proposal.id.toString() ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              )}
              
              {/* Expanded content */}
              {expandedProposal === proposal.id.toString() && (
                <div className="mt-4 pt-4 border-t border-border space-y-4">
                  {/* Show From/To info for Admins in expanded view */}
                  {publicUser?.role === 'Admin' && (
                    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-md">
                      <div>
                        <span className="text-xs font-medium text-primary uppercase tracking-wider">Initiated By</span>
                        <p className="text-sm text-foreground font-medium">{proposal.sender_name}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-primary uppercase tracking-wider">Intended For</span>
                        <p className="text-sm text-foreground font-medium">{proposal.receiver_name}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-primary mb-2">Project Title</h4>
                    <p className="text-sm text-foreground font-medium mb-4">{proposal.title}</p>
                    <h4 className="font-medium text-primary mb-2">Project Details</h4>
                    <p className="text-sm text-muted-foreground">{proposal.description}</p>
                  </div>
                  
                  {/* Action buttons for proposals that can be acted upon */}
                  {((proposal.status === 'Under Review' && proposal.type === 'incoming') || publicUser?.role === 'Admin') && (
                    <div className="flex gap-2 justify-end pt-2">
                      {publicUser?.role === 'Admin' && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(proposal.id.toString());
                          }}
                        >
                          Delete
                        </Button>
                      )}
                      {(proposal.status === 'Under Review') && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeny(proposal.id.toString());
                            }}
                          >
                            Deny
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(proposal.id.toString());
                            }}
                          >
                            Approve
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProposals.length === 0 && (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No proposals found</h3>
            <p className="text-muted-foreground">
              {activeTab === 'outgoing' 
                ? (publicUser?.role === 'Contractor' 
                    ? "You haven't sent any proposals yet." 
                    : publicUser?.role === 'Org Owner'
                    ? "You haven't sent any proposals yet."
                    : "No proposals have been sent yet.")
                                    : (publicUser?.role === 'Contractor'
                        ? "You haven't received any proposals yet."
                        : publicUser?.role === 'Org Owner'
                        ? "No contractor-to-contractor proposals have been tagged under your organization yet."
                        : "No proposals have been received yet.")}
            </p>
          </CardContent>
        </Card>
      )}

      <CreateProposalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProposal}
        contractors={contractors}
        organizations={organizations}
      />
    </div>
  );
} 