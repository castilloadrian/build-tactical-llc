"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";

interface Contractor {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface Organization {
  id: number;
  name: string | null;
}

interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { 
    title: string; 
    description: string; 
    budget: string; 
    receiver: string;
    organization: string;
  }) => void;
  contractors: Contractor[];
  organizations: Organization[];
}

export function CreateProposalModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  contractors = [],
  organizations = []
}: CreateProposalModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [organizationId, setOrganizationId] = useState("");

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setBudget("");
      setReceiverId("");
      setOrganizationId("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    onSubmit({ 
      title, 
      description, 
      budget,
      receiver: receiverId,
      organization: organizationId
    });
    onClose();
  };

  const isFormValid = title.trim() && description.trim() && budget.trim() && receiverId && organizationId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary">Create Proposal</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter proposal title"
              className="border-primary/20"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter proposal description"
              className="border-primary/20 min-h-[100px]"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="budget">Budget</Label>
            <Input
              id="budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g., 10000"
              className="border-primary/20"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="organization">Organization</Label>
            <Select value={organizationId} onValueChange={setOrganizationId}>
              <SelectTrigger id="organization" className="border-primary/20">
                <SelectValue placeholder="Select an organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((organization) => (
                  <SelectItem key={organization.id} value={organization.id.toString()}>
                    {organization.name || 'Unnamed Organization'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="contractor">Contractor</Label>
            <Select value={receiverId} onValueChange={setReceiverId}>
              <SelectTrigger id="contractor" className="border-primary/20">
                <SelectValue placeholder="Select a contractor" />
              </SelectTrigger>
              <SelectContent>
                {contractors.map((contractor) => (
                  <SelectItem key={contractor.id} value={contractor.id}>
                    {contractor.full_name || contractor.email || 'Unnamed Contractor'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-primary/20">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isFormValid}
          >
            Create Proposal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 