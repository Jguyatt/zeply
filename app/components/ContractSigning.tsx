'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { OnboardingNode } from '@/app/types/onboarding';
import { getDefaultContractHTML } from '@/app/lib/onboarding-templates';
import ContractSigningForm from './ContractSigningForm';

// Helper function to calculate SHA256 hash
async function calculateSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface ContractSigningProps {
  node: OnboardingNode;
  orgId: string;
  clerkOrgId: string;
  userId: string;
  onComplete: () => void;
  loading: boolean;
  completedNodeIds?: Set<string>;
  allNodes?: OnboardingNode[];
  contractHTML?: string;
  onContractUpdate?: (html: string) => void;
}

export default function ContractSigning({
  node,
  orgId,
  clerkOrgId,
  userId,
  onComplete,
  loading,
  completedNodeIds,
  allNodes,
  contractHTML: externalContractHTML,
  onContractUpdate,
}: ContractSigningProps) {
  const [signatureDate] = useState(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
  const [orgName, setOrgName] = useState('Service Provider');
  
  // Get org name
  useEffect(() => {
    const fetchOrgName = async () => {
      try {
        const response = await fetch(`/api/orgs/${clerkOrgId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.name) {
            setOrgName(data.name);
          }
        }
      } catch (error) {
        console.error('Error fetching org name:', error);
      }
    };
    fetchOrgName();
  }, [clerkOrgId]);
  
  // Use external HTML if provided, otherwise generate default
  const contractHTML = externalContractHTML || (node.config.html_content || getDefaultContractHTML(orgName || 'Elevance', undefined, undefined, signatureDate));

  // Only return the contract viewer - form will be rendered by parent outside frame
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 w-full overflow-y-auto bg-neutral-800/30">
        {(() => {
          const contractFile = node.config?.document_file;
          const contractUrl = contractFile?.url || contractFile?.data;
          
          if (contractUrl) {
            const fileType = contractFile.type;
            const isPDF = fileType === 'application/pdf';
            const isImage = fileType?.startsWith('image/');
            
            return (
              <div className="w-full h-full flex items-center justify-center">
                {isPDF ? (
                  <iframe
                    src={contractUrl}
                    className="w-full h-full bg-white"
                    title="Contract"
                  />
                ) : isImage ? (
                  <img
                    src={contractUrl}
                    alt={contractFile.name || 'Contract'}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="p-8 text-center text-neutral-400">
                    <p style={{ fontFamily: "'Inter', sans-serif" }}>Unsupported file type</p>
                  </div>
                )}
              </div>
            );
          }
          
          // Show HTML contract with dynamic updates
          return (
            <div className="w-full h-full overflow-y-auto bg-white p-8">
              <div
                className="max-w-4xl mx-auto"
                dangerouslySetInnerHTML={{ __html: contractHTML }}
              />
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// Export form component separately for parent to render outside frame
export function ContractSigningFormWrapper({
  node,
  clerkOrgId,
  onComplete,
  loading,
  completedNodeIds,
  allNodes,
  orgName: propOrgName,
  onContractUpdate,
  onSignatureChange,
}: {
  node: OnboardingNode;
  clerkOrgId: string;
  onComplete: () => void;
  loading: boolean;
  completedNodeIds?: Set<string>;
  allNodes?: OnboardingNode[];
  orgName?: string;
  onContractUpdate?: (html: string) => void;
  onSignatureChange?: (signatureDataUrl: string) => void;
}) {
  const router = useRouter();
  const [legalName, setLegalName] = useState('');
  const [signatureDate] = useState(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
  const [orgName, setOrgName] = useState(propOrgName || 'Service Provider');
  
  // Check if terms step was already completed
  const termsNode = allNodes?.find(n => n.type === 'terms');
  const termsAlreadyAccepted = termsNode && completedNodeIds?.has(termsNode.id);
  
  // Get org name if not provided
  useEffect(() => {
    if (propOrgName) {
      setOrgName(propOrgName);
      return;
    }
    const fetchOrgName = async () => {
      try {
        const response = await fetch(`/api/orgs/${clerkOrgId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.name) {
            setOrgName(data.name);
          }
        }
      } catch (error) {
        console.error('Error fetching org name:', error);
      }
    };
    fetchOrgName();
  }, [clerkOrgId, propOrgName]);
  
  // Generate contract HTML with dynamic fields
  const generateContractHTML = (clientName: string, signatureDataUrl?: string) => {
    const baseHTML = node.config.html_content || getDefaultContractHTML(orgName || 'Elevance', undefined, undefined, signatureDate);
    
    if (!node.config.html_content) {
      let updatedHTML = baseHTML;
      updatedHTML = updatedHTML.replace(/\[Client Name\]/g, clientName || '[Client Name]');
      
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
    updatedHTML = updatedHTML.replace(/\[Client Name\]/g, clientName || '[Client Name]');
    
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

  // Update contract HTML when name changes
  useEffect(() => {
    if (onContractUpdate) {
      const updatedHTML = generateContractHTML(legalName);
      onContractUpdate(updatedHTML);
    }
  }, [legalName, orgName, signatureDate, node.config.html_content, onContractUpdate]);

  const handleSign = async (signedName: string, signatureDataUrl: string) => {
    try {
      const finalContractHTML = generateContractHTML(signedName, signatureDataUrl);
      const contractHash = await calculateSHA256(finalContractHTML);

      const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: node.id,
          signed_name: signedName,
          signature_data_url: signatureDataUrl,
          contract_sha256: contractHash,
          contract_html: finalContractHTML,
          terms_version: node.config.terms_url || 'v1.0',
          privacy_version: node.config.privacy_url || 'v1.0',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sign contract');
      }

      router.refresh();
      onComplete();
    } catch (error) {
      console.error('Error signing contract:', error);
      throw error;
    }
  };

  return (
    <ContractSigningForm
      node={node}
      clerkOrgId={clerkOrgId}
      onSign={handleSign}
      loading={loading}
      termsAlreadyAccepted={termsAlreadyAccepted || false}
      onNameChange={(name) => {
        setLegalName(name);
        // Store legal name in global state
        if (typeof window !== 'undefined') {
          (window as any).__contractSigningState = (window as any).__contractSigningState || {};
          (window as any).__contractSigningState[node.id] = {
            ...(window as any).__contractSigningState[node.id],
            legalName: name,
          };
        }
        // Also update contract HTML
        if (onContractUpdate) {
          const updatedHTML = generateContractHTML(name);
          onContractUpdate(updatedHTML);
        }
      }}
      onSignatureChange={(signatureDataUrl) => {
        // Update contract HTML when signature changes
        if (onContractUpdate) {
          const updatedHTML = generateContractHTML(legalName, signatureDataUrl);
          onContractUpdate(updatedHTML);
        }
        // Also notify parent wrapper to update signature state
        if (onSignatureChange) {
          onSignatureChange(signatureDataUrl);
        }
      }}
    />
  );
}
