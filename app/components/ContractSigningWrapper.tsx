'use client';

import { useState, useEffect } from 'react';
import ContractSigning, { ContractSigningFormWrapper } from './ContractSigning';
import type { OnboardingNode } from '@/app/types/onboarding';
import { getDefaultContractHTML } from '@/app/lib/onboarding-templates';

interface ContractSigningWrapperProps {
  node: OnboardingNode;
  orgId: string;
  clerkOrgId: string;
  userId: string;
  onComplete: () => void;
  loading: boolean;
  completedNodeIds?: Set<string>;
  allNodes?: OnboardingNode[];
  orgName?: string;
}

export default function ContractSigningWrapper({
  node,
  orgId,
  clerkOrgId,
  userId,
  onComplete,
  loading,
  completedNodeIds,
  allNodes,
  orgName: propOrgName,
}: ContractSigningWrapperProps) {
  // Store signature data URL in state so it can be passed to contract updates
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [signatureDate] = useState(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
  const [orgName, setOrgName] = useState(propOrgName || 'Elevance');
  const [contractHTML, setContractHTML] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [memberEmail, setMemberEmail] = useState('');

  // Get org name, admin email, and member email
  useEffect(() => {
    const fetchContractData = async () => {
      try {
        // Fetch org name
        if (propOrgName) {
          setOrgName(propOrgName);
        } else {
          const orgResponse = await fetch(`/api/orgs/${clerkOrgId}`);
          if (orgResponse.ok) {
            const orgData = await orgResponse.json();
            if (orgData.name) {
              setOrgName(orgData.name);
            }
          }
        }
        
        // Fetch admin and member emails
        const emailsResponse = await fetch(`/api/orgs/${clerkOrgId}/onboarding/invoice-emails`);
        if (emailsResponse.ok) {
          const emailsData = await emailsResponse.json();
          if (emailsData.adminEmail) {
            setAdminEmail(emailsData.adminEmail);
          }
          if (emailsData.memberEmail) {
            setMemberEmail(emailsData.memberEmail);
          }
        }
      } catch (error) {
        console.error('Error fetching contract data:', error);
      }
    };
    fetchContractData();
  }, [clerkOrgId, propOrgName]);

  // Helper function to generate contract HTML
  const generateContractHTML = (clientName: string, signatureDataUrl?: string) => {
    const baseHTML = node.config.html_content || getDefaultContractHTML(orgName || 'Elevance', memberEmail, adminEmail, signatureDate);
    
    if (!node.config.html_content) {
      let updatedHTML = baseHTML;
      
      // Replace client name with email if available, otherwise use provided name
      const clientDisplay = memberEmail || clientName || '';
      updatedHTML = updatedHTML.replace(/\[Client Name\]/g, clientDisplay);
      
      if (signatureDataUrl) {
        updatedHTML = updatedHTML.replace(
          /<span id="client-signature"><\/span>/g,
          `<img src="${signatureDataUrl}" style="max-width: 200px; max-height: 60px; display: inline-block; vertical-align: middle;" alt="Signature" />`
        );
      }
      
      if (clientName) {
        updatedHTML = updatedHTML.replace(
          /<span id="client-name"><\/span>/g,
          clientName
        );
      }
      
      return updatedHTML;
    }
    
    let updatedHTML = baseHTML;
    const clientDisplay = memberEmail || clientName || '';
    updatedHTML = updatedHTML.replace(/\[Client Name\]/g, clientDisplay);
    
    if (signatureDataUrl) {
      updatedHTML = updatedHTML.replace(
        /<span id="client-signature"><\/span>/g,
        `<img src="${signatureDataUrl}" style="max-width: 200px; max-height: 60px; display: inline-block; vertical-align: middle;" alt="Signature" />`
      );
    }
    
    if (clientName) {
      updatedHTML = updatedHTML.replace(
        /<span id="client-name"><\/span>/g,
        clientName
      );
    }
    
    updatedHTML = updatedHTML.replace(
      /<span id="client-date">.*?<\/span>/g,
      `<span id="client-date">${signatureDate}</span>`
    );
    
    return updatedHTML;
  };

  // Initialize contract HTML
  useEffect(() => {
    const initialHTML = node.config.html_content || getDefaultContractHTML(orgName || 'Elevance', memberEmail, adminEmail, signatureDate);
    setContractHTML(initialHTML);
  }, [node.config.html_content, orgName, memberEmail, adminEmail, signatureDate]);

  // Update contract HTML when signature changes
  useEffect(() => {
    if (signatureDataUrl) {
      // Get current legal name from global state if available
      const state = typeof window !== 'undefined' && (window as any).__contractSigningState?.[node.id];
      const currentName = state?.legalName || '';
      const updatedHTML = generateContractHTML(currentName, signatureDataUrl);
      setContractHTML(updatedHTML);
    }
  }, [signatureDataUrl, orgName, memberEmail, adminEmail, signatureDate, node.config.html_content]);

  // Store state in a global object keyed by node ID so form can access it
  if (typeof window !== 'undefined') {
    (window as any).__contractSigningState = (window as any).__contractSigningState || {};
    (window as any).__contractSigningState[node.id] = {
      contractHTML,
      setContractHTML,
      orgName,
      setOrgName,
      signatureDataUrl,
      setSignatureDataUrl,
    };
  }

  // Only render the contract viewer - form will be rendered by parent outside frame
  return (
    <ContractSigning
      node={node}
      orgId={orgId}
      clerkOrgId={clerkOrgId}
      userId={userId}
      onComplete={onComplete}
      loading={loading}
      completedNodeIds={completedNodeIds}
      allNodes={allNodes}
      contractHTML={contractHTML}
      onContractUpdate={setContractHTML}
    />
  );
}

// Export form component for parent to render outside frame
export function ContractSigningForm({
  node,
  clerkOrgId,
  loading,
  completedNodeIds,
  allNodes,
}: {
  node: OnboardingNode;
  clerkOrgId: string;
  loading: boolean;
  completedNodeIds?: Set<string>;
  allNodes?: OnboardingNode[];
}) {
  // Access state from global object
  const getState = () => {
    if (typeof window !== 'undefined' && (window as any).__contractSigningState?.[node.id]) {
      return (window as any).__contractSigningState[node.id];
    }
    return null;
  };

  const state = getState();
  const orgName = state?.orgName || 'Elevance';
  const onContractUpdate = state?.setContractHTML;
  const setSignatureDataUrl = state?.setSignatureDataUrl;

  // Handle completion internally - router.refresh() is called inside ContractSigningFormWrapper
  const handleComplete = () => {
    // The router.refresh() is already handled in ContractSigningFormWrapper
  };

  return (
    <ContractSigningFormWrapper
      node={node}
      clerkOrgId={clerkOrgId}
      onComplete={handleComplete}
      loading={loading}
      completedNodeIds={completedNodeIds}
      allNodes={allNodes}
      orgName={orgName}
      onContractUpdate={onContractUpdate}
      onSignatureChange={setSignatureDataUrl}
    />
  );
}
