'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { OnboardingNode } from '@/app/types/onboarding';
import ContractSigning from './ContractSigning';
import { AlertCircle } from 'lucide-react';
import { getDefaultInvoiceHTML } from '@/app/lib/onboarding-templates';

interface OnboardingStepRendererProps {
  node: OnboardingNode;
  orgId: string;
  clerkOrgId: string;
  userId: string;
  allNodes: OnboardingNode[];
  completedNodeIds: Set<string>;
  hideButton?: boolean;
}

export default function OnboardingStepRenderer({
  node,
  orgId,
  clerkOrgId,
  userId,
  allNodes,
  completedNodeIds,
  hideButton = false,
}: OnboardingStepRendererProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [invoiceOrgName, setInvoiceOrgName] = useState('Elevance');
  const [invoiceNumber] = useState(() => `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`);
  const [adminEmail, setAdminEmail] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  
  // Fetch org name, admin email, and member email for invoice (if invoice node)
  useEffect(() => {
    if (node.type === 'invoice') {
      const fetchInvoiceData = async () => {
        try {
          // Fetch org name
          const orgResponse = await fetch(`/api/orgs/${clerkOrgId}`);
          if (orgResponse.ok) {
            const orgData = await orgResponse.json();
            if (orgData.name) {
              setInvoiceOrgName(orgData.name);
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
          console.error('Error fetching invoice data:', error);
        }
      };
      fetchInvoiceData();
    }
  }, [clerkOrgId, node.type]);
  
  // All hooks must be declared at the top level, before any conditional returns
  // These hooks are used by different node types, so we declare them all upfront
  const [welcomeImageError, setWelcomeImageError] = useState(false);
  const [scopeImageError, setScopeImageError] = useState(false);
  const [termsImageError, setTermsImageError] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nodeId: node.id,
          status: 'completed',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete step');
      }

      // Refresh to show next step or redirect if all complete
      router.refresh();
    } catch (error) {
      console.error('Error completing step:', error);
      alert('Failed to complete step. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get document file for welcome node (before switch to use hooks)
  const welcomeDocumentFile = node.type === 'welcome' ? node.config?.document_file : null;
  const welcomeDocumentUrl = welcomeDocumentFile?.url || welcomeDocumentFile?.data;
  
  // Check if URL is incomplete (using useMemo to avoid re-computation on every render)
  // Only compute for welcome node type
  const urlIsIncomplete = useMemo(() => {
    if (node.type !== 'welcome') return false;
    if (!welcomeDocumentUrl || typeof welcomeDocumentUrl !== 'string') return false;
        if (welcomeDocumentUrl.startsWith('data:')) return false;
        if (!welcomeDocumentUrl.startsWith('http')) return false;
        
        try {
          const url = new URL(welcomeDocumentUrl);
          const pathname = url.pathname;
          const pathParts = pathname.split('/').filter(p => p);
          const lastPart = pathParts[pathParts.length - 1];
          
          // If last part is a UUID (36 chars with dashes) and no file extension, it's likely incomplete
          const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const hasFileExtension = lastPart.includes('.') && /\.(pdf|png|jpg|jpeg|gif|webp)$/i.test(lastPart);
          
          if (uuidPattern.test(lastPart) && !hasFileExtension) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OnboardingStepRenderer.tsx:incomplete-url-check',message:'Detected incomplete URL - missing filename',data:{url:welcomeDocumentUrl,lastPart,nodeId:node.id,pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            console.warn('Incomplete URL detected - ends with nodeId instead of filename:', welcomeDocumentUrl);
            return true;
          }
          return false;
        } catch (e) {
          console.error('Invalid URL format:', welcomeDocumentUrl, e);
          return false;
        }
      }, [welcomeDocumentUrl, node.id, node.type]);
      
      // Set error state only once when URL is detected as incomplete (useEffect to avoid render loop)
      useEffect(() => {
        if (urlIsIncomplete && node.type === 'welcome') {
          setWelcomeImageError(true);
        }
      }, [urlIsIncomplete, node.type]);
      
  // Render based on node type
  switch (node.type) {
    case 'welcome':
      // Normalize URL - ensure it's a valid Supabase storage URL
      const documentFile = welcomeDocumentFile;
      let documentUrl: string | undefined = welcomeDocumentUrl;

      if (documentUrl && typeof documentUrl === 'string' && !urlIsIncomplete) {
        // If it's a base64 data URL, use it as-is
        if (documentUrl.startsWith('data:')) {
          // Keep as-is
        }
        // If it's a relative path or just a filename, we need to construct the full URL
        else if (!documentUrl.startsWith('http')) {
          // This shouldn't happen if upload worked correctly, but handle it
          console.warn('Document URL is not a full URL:', documentUrl);
        }
        // If it's already a full URL, normalize it
        else {
          try {
            const url = new URL(documentUrl);
            documentUrl = url.toString();
          } catch (e) {
            console.error('Invalid URL format:', documentUrl, e);
          }
        }
      } else if (urlIsIncomplete) {
        documentUrl = undefined; // Prevent loading incomplete URL
      }
      
      if (documentUrl && documentFile) {
        const fileType = documentFile.type;
        const isPDF = fileType === 'application/pdf';
        const isImage = fileType?.startsWith('image/');
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OnboardingStepRenderer.tsx:84',message:'Document URL analysis',data:{fullUrl:documentUrl,urlLength:documentUrl?.length,fileType,isPDF,isImage,fileName:documentFile?.name,nodeId:node.id,orgId,clerkOrgId,urlStartsWithHttp:documentUrl?.startsWith('http'),urlStartsWithData:documentUrl?.startsWith('data:'),urlParsed:documentUrl ? (()=>{try{const u=new URL(documentUrl);return{protocol:u.protocol,hostname:u.hostname,pathname:u.pathname,search:u.search,hash:u.hash}}catch(e){return{error:e instanceof Error ? e.message : String(e)}}})():null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          console.log('Loading document:', {
            url: documentUrl,
            type: fileType,
            isImage,
            isPDF,
            fileName: documentFile?.name
          });
        }
        
        return (
          <div className="w-full h-full flex flex-col">
            {/* Document Content - Fills frame */}
            <div className="w-full h-full flex items-center justify-center bg-neutral-800/30">
              {isPDF ? (
                <iframe
                  src={documentUrl}
                  className="w-full h-full bg-white"
                  title="Document"
                  onError={(e) => {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OnboardingStepRenderer.tsx:iframe-onError',message:'PDF iframe load error',data:{url:documentUrl,fileName:documentFile?.name,nodeId:node.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                    // #endregion
                  }}
                  onLoad={() => {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OnboardingStepRenderer.tsx:iframe-onLoad',message:'PDF iframe loaded successfully',data:{url:documentUrl,fileName:documentFile?.name,nodeId:node.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                    // #endregion
                  }}
                />
              ) : isImage ? (
                welcomeImageError ? (
                  <div className="p-8 text-center text-neutral-400">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500/50" />
                    <p style={{ fontFamily: "'Inter', sans-serif" }} className="mb-2">
                      Unable to load image
                    </p>
                    <p style={{ fontFamily: "'Inter', sans-serif" }} className="text-sm text-neutral-500 mb-2">
                      The image file may have been moved or deleted.
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                      <p style={{ fontFamily: "'Inter', sans-serif" }} className="text-xs text-neutral-600 mt-2">
                        URL: {documentUrl}
                      </p>
                    )}
                  </div>
                ) : (
                  <img
                    src={documentUrl}
                    alt={documentFile?.name || 'Document'}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/a36c351a-7774-4d29-9aab-9ad077a31f48',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OnboardingStepRenderer.tsx:onError',message:'Image load error',data:{url:documentUrl,fileName:documentFile?.name,nodeId:node.id,errorType:e?.type,errorTarget:e?.target?.src},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                      // #endregion
                      console.error('Image load error:', {
                        url: documentUrl,
                        error: e,
                        fileName: documentFile?.name
                      });
                      setWelcomeImageError(true);
                    }}
                    crossOrigin="anonymous"
                  />
                )
              ) : (
                <div className="p-8 text-center text-neutral-400">
                  <p style={{ fontFamily: "'Inter', sans-serif" }}>Unsupported file type</p>
                </div>
              )}
            </div>
          </div>
        );
      }
      
      // Fallback if no document or incomplete URL
      return (
        <div className="space-y-6">
          <div>
            <h2 
              className="text-3xl md:text-4xl font-light text-white mb-3 leading-tight tracking-tight"
              style={{ fontFamily: "'canela-text', serif" }}
            >
              {node.title}
            </h2>
            {node.description && (
              <p 
                className="text-base md:text-lg text-neutral-400 leading-relaxed"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {node.description}
              </p>
            )}
          </div>
          {urlIsIncomplete || welcomeImageError || (documentFile && !documentUrl) ? (
            <div className="bg-neutral-800/50 rounded-xl border border-yellow-500/20 p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500/50" />
              <p 
                className="text-neutral-300 mb-2 font-medium"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Document URL is incomplete or invalid
              </p>
              <p 
                className="text-sm text-neutral-500"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                The document file reference is missing or corrupted. Please re-upload the document in the onboarding flow settings.
              </p>
            </div>
          ) : (
            <p 
              className="text-neutral-400"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              No document available.
            </p>
          )}
        </div>
      );

    case 'scope':
      // If document file is uploaded, show it (support both URL and base64 for backwards compatibility)
      const scopeDocFile = node.config?.document_file;
      const scopeDocUrl = scopeDocFile?.url || scopeDocFile?.data;
      
      if (scopeDocUrl) {
        const fileType = scopeDocFile.type;
        const isPDF = fileType === 'application/pdf';
        const isImage = fileType?.startsWith('image/');
        
        return (
          <div className="w-full h-full flex flex-col">
            {/* Document Content - Fills frame */}
            <div className="w-full h-full flex items-center justify-center bg-neutral-800/30">
              {isPDF ? (
                <iframe
                  src={scopeDocUrl}
                  className="w-full h-full bg-white"
                  title="Scope of Services"
                />
              ) : isImage ? (
                scopeImageError ? (
                  <div className="p-8 text-center text-neutral-400">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500/50" />
                    <p style={{ fontFamily: "'Inter', sans-serif" }} className="mb-2">
                      Unable to load image
                    </p>
                    <p style={{ fontFamily: "'Inter', sans-serif" }} className="text-sm text-neutral-500">
                      The image file may have been moved or deleted. Please contact support.
                    </p>
                  </div>
                ) : (
                  <img
                    src={scopeDocUrl}
                    alt={scopeDocFile.name || 'Scope of Services'}
                    className="w-full h-full object-contain"
                    onError={() => setScopeImageError(true)}
                  />
                )
              ) : (
                <div className="p-8 text-center text-neutral-400">
                  <p style={{ fontFamily: "'Inter', sans-serif" }}>Unsupported file type</p>
                </div>
              )}
            </div>
          </div>
        );
      }
      
      // Fallback if no document
      return (
        <div className="space-y-6">
          <div>
            <h2 
              className="text-3xl md:text-4xl font-light text-white mb-3 leading-tight tracking-tight"
              style={{ fontFamily: "'canela-text', serif" }}
            >
              {node.title}
            </h2>
            {node.description && (
              <p 
                className="text-base md:text-lg text-neutral-400 leading-relaxed"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {node.description}
              </p>
            )}
          </div>
          <p 
            className="text-neutral-400"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            No document available.
          </p>
        </div>
      );

    case 'invoice':
      const paymentStatus = node.config?.payment_status || 'pending';
      const isPaid = paymentStatus === 'paid' || paymentStatus === 'confirmed';
      
      // Generate invoice HTML
      const invoiceHTML = node.config.html_content || getDefaultInvoiceHTML(
        invoiceOrgName || 'Elevance',
        memberEmail,
        adminEmail,
        new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        node.config.amount_label,
        invoiceNumber
      );
      
      return (
        <div className="w-full h-full flex flex-col">
          {/* Invoice Display - Fills frame */}
          <div className="flex-1 w-full overflow-y-auto bg-neutral-800/30">
            {isPaid ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="p-8 bg-[#D6B36A]/10 rounded-xl border border-[#D6B36A]/30 max-w-md text-center">
                  <p 
                    className="text-[#D6B36A] font-medium mb-2 text-xl"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    ✓ Payment Received
                  </p>
                  <p 
                    className="text-neutral-400 text-sm"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Thank you for your payment. Your invoice has been marked as paid.
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full overflow-y-auto bg-white p-8">
                <div
                  className="max-w-4xl mx-auto"
                  dangerouslySetInnerHTML={{ __html: invoiceHTML }}
                />
              </div>
            )}
          </div>
        </div>
      );

    case 'contract':
      // Import and use ContractSigningWrapper which manages contract state
      const ContractSigningWrapper = require('./ContractSigningWrapper').default;
      return (
        <ContractSigningWrapper
          node={node}
          orgId={orgId}
          clerkOrgId={clerkOrgId}
          userId={userId}
          onComplete={handleComplete}
          loading={loading}
          completedNodeIds={completedNodeIds}
          allNodes={allNodes}
        />
      );

    case 'terms':
      const handleTermsComplete = async () => {
        if (!termsAccepted || !privacyAccepted) {
          alert('Please accept both Terms of Service and Privacy Policy');
          return;
        }

        setLoading(true);
        try {
          const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nodeId: node.id,
              metadata: {
                terms_version: node.config.terms_url || 'v1.0',
                privacy_version: node.config.privacy_url || 'v1.0',
                accepted_at: new Date().toISOString(),
              },
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to complete step');
          }

          router.refresh();
        } catch (error) {
          console.error('Error completing terms:', error);
          alert('Failed to complete step. Please try again.');
        } finally {
          setLoading(false);
        }
      };

      // If document file is uploaded, show it
      const termsDocFile = node.config?.document_file;
      const termsDocUrl = termsDocFile?.url || termsDocFile?.data;

      return (
        <div className="w-full h-full flex flex-col relative">
          {/* Document Display - Fills frame */}
          {termsDocUrl ? (
            <div className="flex-1 w-full flex items-center justify-center bg-neutral-800/30 min-h-0">
              {termsDocFile.type === 'application/pdf' ? (
                <iframe
                  src={termsDocUrl}
                  className="w-full h-full bg-white"
                  title="Terms & Privacy"
                />
              ) : termsDocFile.type?.startsWith('image/') ? (
                termsImageError ? (
                  <div className="p-8 text-center text-neutral-400">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500/50" />
                    <p style={{ fontFamily: "'Inter', sans-serif" }} className="mb-2">
                      Unable to load image
                    </p>
                    <p style={{ fontFamily: "'Inter', sans-serif" }} className="text-sm text-neutral-500">
                      The image file may have been moved or deleted. Please contact support.
                    </p>
                  </div>
                ) : (
                  <img
                    src={termsDocUrl}
                    alt={termsDocFile.name || 'Terms & Privacy'}
                    className="w-full h-full object-contain"
                    onError={() => setTermsImageError(true)}
                  />
                )
              ) : (
                <div className="p-8 text-center text-neutral-400">
                  <p style={{ fontFamily: "'Inter', sans-serif" }}>Unsupported file type</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-neutral-400" style={{ fontFamily: "'Inter', sans-serif" }}>
                No document available.
              </p>
            </div>
          )}
        </div>
      );

    default:
      return (
        <div className="space-y-6">
          <div>
            <h2 
              className="text-3xl md:text-4xl font-light text-white mb-3 leading-tight tracking-tight"
              style={{ fontFamily: "'canela-text', serif" }}
            >
              {node.title}
            </h2>
            {node.description && (
              <p 
                className="text-base md:text-lg text-neutral-400 leading-relaxed"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {node.description}
              </p>
            )}
          </div>
          <p 
            className="text-neutral-400"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            This step type is not yet implemented.
          </p>
        </div>
      );
  }
}

