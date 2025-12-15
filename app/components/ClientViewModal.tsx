'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

interface ClientViewModalProps {
  node: any;
  orgName?: string;
  onClose: () => void;
}

// Convert blocks to HTML content for welcome nodes (matching OnboardingStepRenderer)
const blocksToHTML = (blocks: any[]): string => {
  if (!blocks || !Array.isArray(blocks)) return '';
  
  return blocks.map((block) => {
    switch (block.type) {
      case 'heading':
        const level = block.content?.level || 2;
        const text = block.content?.text || '';
        return `<h${level}>${text}</h${level}>`;
      case 'paragraph':
        return `<p>${block.content?.text || ''}</p>`;
      case 'list':
        const items = (block.content?.items || []).map((item: string) => {
          // Support markdown-style bold
          const processed = item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          return `<li>${processed}</li>`;
        }).join('');
        return `<ul>${items}</ul>`;
      case 'divider':
        return '<hr />';
      case 'callout':
        const variant = block.content?.variant || 'info';
        const calloutText = block.content?.text || '';
        return `<div class="callout callout-${variant}">${calloutText}</div>`;
      default:
        return '';
    }
  }).join('');
};

export default function ClientViewModal({ node, orgName = 'Your Company', onClose }: ClientViewModalProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Prebuilt welcome template
  const getWelcomeTemplate = (orgName: string) => ({
    blocks: [
      {
        id: 'heading-1',
        type: 'heading',
        content: { text: `Welcome to ${orgName}!`, level: 1 },
      },
      {
        id: 'paragraph-1',
        type: 'paragraph',
        content: { text: `We are delighted to have you with us and are committed to delivering the highest service and support. Your decision to choose us is greatly appreciated, and we're excited to help you achieve your goals.` },
      },
      {
        id: 'heading-2',
        type: 'heading',
        content: { text: 'What to Expect', level: 2 },
      },
      {
        id: 'list-1',
        type: 'list',
        content: {
          items: [
            '**Dedicated Support:** Our team of experts is always here to assist you with any questions or concerns.',
            '**Innovative Solutions:** We continuously strive to offer the industry\'s most advanced and effective solutions.',
            '**Personalized Service:** We take the time to understand your unique requirements and tailor our services to meet them.',
          ],
        },
      },
    ],
  });

  // Get template if node has no content
  const hasContent = node.config?.blocks && Array.isArray(node.config.blocks) && node.config.blocks.length > 0;
  const blocks = hasContent ? node.config.blocks : (node.type === 'welcome' ? getWelcomeTemplate(orgName).blocks : []);
  
  // Convert blocks to HTML for welcome nodes
  const htmlContent = node.type === 'welcome' && blocks.length > 0 
    ? blocksToHTML(blocks) 
    : node.config?.html_content || '';

  const renderContent = () => {
    switch (node.type) {
      case 'welcome':
        // If document file is uploaded, show it
        const welcomeFile = node.config?.document_file;
        const welcomeFileUrl = welcomeFile?.url || welcomeFile?.data;
        if (welcomeFileUrl) {
          const fileType = welcomeFile.type;
          const isPDF = fileType === 'application/pdf';
          const isImage = fileType?.startsWith('image/');
          
          return (
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-5xl mx-auto">
              {isPDF ? (
                <iframe
                  src={welcomeFileUrl}
                  className="w-full h-[800px] bg-white"
                  title="Document Preview"
                />
              ) : isImage ? (
                <img
                  src={welcomeFileUrl}
                  alt={welcomeFile.name || 'Document'}
                  className="w-full h-auto rounded-lg"
                />
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p>Unsupported file type</p>
                </div>
              )}
              <div className="mt-6 flex justify-center">
                <button
                  disabled
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg opacity-50 cursor-not-allowed font-medium"
                >
                  I've read this
                </button>
              </div>
            </div>
          );
        }
        
        // No document uploaded
        return (
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto text-center">
            <p className="text-gray-500">No document uploaded yet</p>
          </div>
        );
        
        // Otherwise show dark document-style preview
        return (
          <div className="bg-gray-900 rounded-lg shadow-lg p-12 max-w-4xl mx-auto border border-white/10">
            {/* Professional Document Header */}
            <div className="mb-8 pb-6 border-b border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center border-2 border-blue-500/30">
                    <span className="text-blue-400 text-xs font-bold">LOGO</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">{orgName}</h1>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-400">
                  <div className="bg-white/5 px-4 py-2 rounded border border-white/10">
                    <div className="text-white font-medium">Contact Information</div>
                    <div className="text-gray-400 text-xs mt-1">Your contact details here</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-white mb-2">New Client Welcome Letter</h2>
              <div className="h-px bg-white/20 w-32 mx-auto mt-2"></div>
            </div>

            {/* Date */}
            <div className="mb-6">
              <p className="text-sm text-gray-400">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>

            {/* Recipient Info Placeholder */}
            <div className="mb-8 text-gray-300">
              <div className="font-bold text-white">[Client Name]</div>
              <div className="font-bold text-white">[Company Name]</div>
              <div>[Address Line 1]</div>
              <div>[City, State ZIP]</div>
            </div>

            {/* Salutation */}
            <div className="mb-6">
              <p className="text-gray-300">Dear [Client Name],</p>
            </div>

            {/* Content Blocks */}
            <div className="space-y-4 text-gray-300">
              {htmlContent ? (
                <div
                  className="prose prose-invert prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              ) : blocks.length > 0 ? (
                blocks.map((block: any) => {
                  switch (block.type) {
                    case 'heading':
                      const HeadingTag = `h${block.content?.level || 2}` as keyof JSX.IntrinsicElements;
                      return (
                        <HeadingTag key={block.id} className="text-white font-bold">
                          {block.content?.text || ''}
                        </HeadingTag>
                      );
                    case 'paragraph':
                      return (
                        <p key={block.id} className="text-gray-300">
                          {block.content?.text || ''}
                        </p>
                      );
                    case 'list':
                      return (
                        <ul key={block.id} className="list-disc list-inside text-gray-300 ml-4">
                          {(block.content?.items || []).map((item: string, idx: number) => (
                            <li key={idx}>{item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>
                          ))}
                        </ul>
                      );
                    default:
                      return null;
                  }
                })
              ) : (
                <p className="text-gray-400">No content configured yet.</p>
              )}
            </div>

            {/* Action Button */}
            <div className="mt-12 pt-6 border-t border-white/10">
              <button
                disabled
                className="px-8 py-3 bg-blue-600 text-white rounded-lg opacity-50 cursor-not-allowed font-medium"
              >
                I've read this
              </button>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-2">{node.title || 'Invoice Payment'}</h2>
              {node.description && (
                <p className="text-secondary mb-4">{node.description}</p>
              )}
            </div>
            {node.config?.stripe_url ? (
              <div className="space-y-4">
                {node.config?.amount_label && (
                  <p className="text-lg text-primary font-medium">
                    Amount: {node.config.amount_label}
                  </p>
                )}
                <a
                  href={node.config.stripe_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all border border-accent/30"
                >
                  Pay Invoice
                </a>
              </div>
            ) : (
              <div className="text-secondary">
                <p>No payment link configured yet.</p>
              </div>
            )}
            <button
              disabled
              className="px-6 py-3 bg-accent/20 text-accent rounded-lg opacity-50 cursor-not-allowed border border-accent/30"
            >
              I've paid
            </button>
          </div>
        );

      case 'contract':
        // If document file is uploaded, show it
        const contractFile = node.config?.document_file;
        const contractFileUrl = contractFile?.url || contractFile?.data;
        if (contractFileUrl) {
          const fileType = contractFile.type;
          const isPDF = fileType === 'application/pdf';
          const isImage = fileType?.startsWith('image/');
          
          return (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-2">{node.title || 'Agreement'}</h2>
                {node.description && (
                  <p className="text-secondary mb-4">{node.description}</p>
                )}
              </div>
              <div className="glass-surface rounded-lg border border-white/10 overflow-hidden">
                {isPDF ? (
                  <iframe
                    src={contractFileUrl}
                    className="w-full h-[600px] bg-white"
                    title="Contract"
                  />
                ) : isImage ? (
                  <img
                    src={contractFileUrl}
                    alt={contractFile.name || 'Contract'}
                    className="w-full h-auto"
                  />
                ) : (
                  <div className="p-8 text-center text-secondary">
                    <p>Unsupported file type</p>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Legal Name"
                  disabled
                  className="w-full px-4 py-2 glass-surface rounded-lg border border-white/10 opacity-50 cursor-not-allowed text-primary placeholder:text-muted"
                />
                <div className="h-32 glass-surface rounded-lg border border-white/10 flex items-center justify-center text-secondary text-sm opacity-50">
                  Signature Canvas
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 opacity-50">
                    <input type="checkbox" disabled className="rounded border-gray-300" />
                    <span className="text-primary text-sm">I agree to the Terms of Service</span>
                  </label>
                  <label className="flex items-center gap-2 opacity-50">
                    <input type="checkbox" disabled className="rounded border-gray-300" />
                    <span className="text-primary text-sm">I agree to the Privacy Policy</span>
                  </label>
                </div>
              </div>
              <button
                disabled
                className="px-6 py-3 bg-accent/20 text-accent rounded-lg opacity-50 cursor-not-allowed border border-accent/30"
              >
                Sign and Continue
              </button>
            </div>
          );
        }
        
        // No document uploaded
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-2">{node.title || 'Agreement'}</h2>
              {node.description && (
                <p className="text-secondary mb-4">{node.description}</p>
              )}
            </div>
            <p className="text-secondary">No contract document uploaded yet.</p>
          </div>
        );

      case 'consent':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-2">{node.title || 'Terms & Privacy'}</h2>
              {node.description && (
                <p className="text-secondary mb-4">{node.description}</p>
              )}
            </div>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent"
                />
                <div>
                  <span className="text-primary font-medium">Terms of Service</span>
                  {node.config?.terms_url && (
                    <a
                      href={node.config.terms_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-accent hover:text-accent/80"
                    >
                      (View Terms)
                    </a>
                  )}
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent"
                />
                <div>
                  <span className="text-primary font-medium">Privacy Policy</span>
                  {node.config?.privacy_url && (
                    <a
                      href={node.config.privacy_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-accent hover:text-accent/80"
                    >
                      (View Privacy Policy)
                    </a>
                  )}
                </div>
              </label>
            </div>
            <button
              disabled={!termsAccepted || !privacyAccepted}
              className="px-6 py-3 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-accent/30"
            >
              Continue
            </button>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-2">{node.title || 'Step'}</h2>
              {node.description && (
                <p className="text-secondary">{node.description}</p>
              )}
            </div>
            <p className="text-secondary">This step type is not yet implemented.</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-surface rounded-lg shadow-prestige-soft w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col border border-white/10 bg-charcoal">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <div>
            <h2 className="text-xl font-light text-primary">Client View: {node.title || 'Step'}</h2>
            <p className="text-sm text-secondary mt-1">This is how clients will see this step</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 glass-surface rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
          <div className="max-w-5xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

