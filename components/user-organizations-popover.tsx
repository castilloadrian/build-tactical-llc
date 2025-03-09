import { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from '@/utils/supabase/client';
import { Building2, Check } from 'lucide-react';

interface Organization {
  id: number;
  name: string | null;
  description: string | null;
  created_at: string;
}

interface UserOrganizationsPopoverProps {
  userId: string;
  userOrganizations: Organization[];
  allOrganizations: Organization[];
  onUpdate: () => void;
}

export function UserOrganizationsPopover({
  userId,
  userOrganizations,
  allOrganizations,
  onUpdate
}: UserOrganizationsPopoverProps) {
  const [selectedOrgs, setSelectedOrgs] = useState<Set<number>>(
    new Set(userOrganizations.map(org => org.id))
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  const handleToggleOrg = async (orgId: number) => {
    const newSelected = new Set(selectedOrgs);
    if (newSelected.has(orgId)) {
      newSelected.delete(orgId);
    } else {
      newSelected.add(orgId);
    }
    setSelectedOrgs(newSelected);
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const selectedOrgsArray = Array.from(selectedOrgs);
      const existingOrgsIds = userOrganizations.map(org => org.id);
      
      // Find organizations to add and remove
      const orgsToAdd = selectedOrgsArray.filter(id => !existingOrgsIds.includes(id));
      const orgsToRemove = existingOrgsIds.filter(id => !selectedOrgsArray.includes(id));

      // Start a transaction for both operations
      const { error } = await supabase.rpc('manage_user_organizations', {
        p_user_id: userId,
        p_orgs_to_add: orgsToAdd,
        p_orgs_to_remove: orgsToRemove
      });

      if (error) throw error;
      
      onUpdate();
      setOpen(false);
    } catch (error) {
      console.error('Error updating user organizations:', error);
      alert('Failed to update organization memberships. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-sm w-full md:w-[180px] justify-start hover:bg-primary/10"
        >
          <Building2 className="h-4 w-4 flex-shrink-0" />
          <span className="hidden md:inline truncate">Manage Organizations</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 border-b">
          <h4 className="font-medium">Organization Memberships</h4>
          <p className="text-sm text-muted-foreground">
            Select the organizations this user belongs to
          </p>
        </div>
        <ScrollArea className="h-72">
          <div className="p-4 space-y-4">
            {allOrganizations.map((org) => (
              <div
                key={org.id}
                className="flex items-center space-x-3"
              >
                <Checkbox
                  id={`org-${org.id}`}
                  checked={selectedOrgs.has(org.id)}
                  onCheckedChange={() => handleToggleOrg(org.id)}
                />
                <label
                  htmlFor={`org-${org.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {org.name}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={isUpdating}
          >
            {isUpdating ? (
              "Saving..."
            ) : (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4" /> Save Changes
              </span>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
} 