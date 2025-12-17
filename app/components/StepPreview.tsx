'use client';


interface StepPreviewProps {
  node: any;
  orgName?: string;
  onEdit?: () => void;
}

// Prebuilt templates for different node types
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

export default function StepPreview({ node, orgName = 'Your Company', onEdit }: StepPreviewProps) {
  
  // Get template if node has no content
  const hasContent = node.config?.blocks && Array.isArray(node.config.blocks) && node.config.blocks.length > 0;
  const blocks = hasContent ? node.config.blocks : (node.type === 'welcome' ? getWelcomeTemplate(orgName).blocks : []);

  const renderBlocks = () => {
    if (!blocks || !Array.isArray(blocks)) return null;

    return blocks.map((block: any) => {
      switch (block.type) {
        case 'heading':
          const HeadingTag = `h${block.content?.level || 2}` as keyof JSX.IntrinsicElements;
          const headingClasses = {
            1: 'text-3xl font-bold mb-4 mt-8 first:mt-0 text-primary',
            2: 'text-2xl font-semibold mb-3 mt-6 first:mt-0 text-primary',
            3: 'text-xl font-medium mb-2 mt-4 first:mt-0 text-primary',
          };
          return (
            <HeadingTag
              key={block.id}
              className={`${headingClasses[block.content?.level as keyof typeof headingClasses] || headingClasses[2]}`}
            >
              {block.content?.text || ''}
            </HeadingTag>
          );
        case 'paragraph':
          return (
            <p key={block.id} className="text-secondary mb-4 leading-relaxed text-base">
              {block.content?.text || ''}
            </p>
          );
        case 'list':
          return (
            <ul key={block.id} className="list-disc list-inside text-secondary mb-6 space-y-2 ml-4">
              {(block.content?.items || []).map((item: string, idx: number) => {
                // Support markdown-style bold
                const parts = item.split(/(\*\*.*?\*\*)/g);
                return (
                  <li key={idx} className="text-base">
                    {parts.map((part, i) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} className="font-semibold text-primary">{part.slice(2, -2)}</strong>;
                      }
                      return <span key={i}>{part}</span>;
                    })}
                  </li>
                );
              })}
            </ul>
          );
        case 'divider':
          return <hr key={block.id} className="my-8 border-white/10" />;
        case 'callout':
          return (
            <div
              key={block.id}
              className="p-4 rounded-lg border border-white/10 mb-4 glass-surface text-secondary"
            >
              {block.content?.text || ''}
            </div>
          );
        default:
          return null;
      }
    });
  };

  // Dark gradient background
  const gradientBg = 'bg-gradient-to-br from-charcoal via-gray-900 to-charcoal';

  switch (node.type) {
    case 'welcome':
      // If document file is uploaded, show it (support both URL and base64)
      console.log('StepPreview - welcome node:', node);
      console.log('StepPreview - node.config:', node.config);
      const welcomeDocFile = node.config?.document_file;
      console.log('StepPreview - welcomeDocFile:', welcomeDocFile);
      const welcomeDocUrl = welcomeDocFile?.url || welcomeDocFile?.data;
      console.log('StepPreview - welcomeDocUrl:', welcomeDocUrl);
      if (welcomeDocUrl) {
        const fileType = welcomeDocFile.type;
        const isPDF = fileType === 'application/pdf';
        const isImage = fileType?.startsWith('image/');
        
        return (
          <div className={`${gradientBg} min-h-full p-8 rounded-lg overflow-y-auto`}>
            <div className="max-w-4xl mx-auto">
              {/* Document Display */}
              <div className="glass-surface rounded-lg border border-white/10 overflow-hidden">
                {isPDF ? (
                  <iframe
                    src={welcomeDocUrl}
                    className="w-full h-[800px] bg-white"
                    title="Document Preview"
                  />
                ) : isImage ? (
                  <img
                    src={welcomeDocUrl}
                    alt={welcomeDocFile.name || 'Document'}
                    className="w-full h-auto"
                  />
                ) : (
                  <div className="p-8 text-center text-secondary">
                    <p>Unsupported file type</p>
                  </div>
                )}
              </div>
              
              {/* Action Button */}
              <div className="mt-6 flex justify-center">
                <button className="px-8 py-3 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all border border-accent/30 font-medium">
                  I confirm I have read this page
                </button>
              </div>
            </div>
          </div>
        );
      }
      
      // No document uploaded - show message
      return (
        <div className={`${gradientBg} min-h-full p-8 rounded-lg overflow-y-auto flex items-center justify-center`}>
          <div className="text-center">
            <p className="text-secondary mb-4">No document uploaded yet</p>
            <p className="text-sm text-secondary">Upload a document in Settings to preview</p>
          </div>
        </div>
      );

    case 'scope':
      // If document file is uploaded, show it (support both URL and base64)
      const scopeDocFile = node.config?.document_file;
      const scopeDocUrl = scopeDocFile?.url || scopeDocFile?.data;
      if (scopeDocUrl) {
        const fileType = scopeDocFile.type;
        const isPDF = fileType === 'application/pdf';
        const isImage = fileType?.startsWith('image/');
        
        return (
          <div className={`${gradientBg} min-h-full p-8 rounded-lg overflow-y-auto`}>
            <div className="max-w-4xl mx-auto">
              {/* Document Display */}
              <div className="glass-surface rounded-lg border border-white/10 overflow-hidden">
                {isPDF ? (
                  <iframe
                    src={scopeDocUrl}
                    className="w-full h-[800px] bg-white"
                    title="Scope of Services Preview"
                  />
                ) : isImage ? (
                  <img
                    src={scopeDocUrl}
                    alt={scopeDocFile.name || 'Scope of Services'}
                    className="w-full h-auto"
                  />
                ) : (
                  <div className="p-8 text-center text-secondary">
                    <p>Unsupported file type</p>
                  </div>
                )}
              </div>
              
              {/* Action Button */}
              <div className="mt-6 flex justify-center">
                <button className="px-8 py-3 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all border border-accent/30 font-medium">
                  I confirm I have read this
                </button>
              </div>
            </div>
          </div>
        );
      }
      
      // No document uploaded - show message
      return (
        <div className={`${gradientBg} min-h-full p-8 rounded-lg overflow-y-auto flex items-center justify-center`}>
          <div className="text-center">
            <p className="text-secondary mb-4">No document uploaded yet</p>
            <p className="text-sm text-secondary">Upload a document in Settings to preview</p>
          </div>
        </div>
      );

    case 'terms':
      // If document file is uploaded, show it
      const termsDocFile = node.config?.document_file;
      const termsDocUrl = termsDocFile?.url || termsDocFile?.data;
      
      return (
        <div className={`${gradientBg} min-h-full p-8 rounded-lg overflow-y-auto`}>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-primary mb-3 font-serif">{node.title || 'Terms & Privacy'}</h2>
                {node.description && (
                  <p className="text-secondary mb-6 leading-relaxed text-base font-sans">{node.description}</p>
                )}
              </div>
              
              {/* Document Display if uploaded */}
              {termsDocUrl && (
                <div className="glass-surface rounded-lg border border-white/10 overflow-hidden mb-6">
                  {termsDocFile.type === 'application/pdf' ? (
                    <iframe
                      src={termsDocUrl}
                      className="w-full h-[600px] bg-white"
                      title="Terms & Privacy Preview"
                    />
                  ) : termsDocFile.type?.startsWith('image/') ? (
                    <img
                      src={termsDocUrl}
                      alt={termsDocFile.name || 'Terms & Privacy'}
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="p-8 text-center text-secondary">
                      <p>Unsupported file type</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Checkboxes */}
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer p-4 glass-surface rounded-lg border border-white/5 hover:border-white/10 transition-all">
                  <input
                    type="checkbox"
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <div className="flex-1">
                    <span className="text-primary font-medium font-sans">I accept the Terms of Service</span>
                    {node.config?.terms_url && (
                      <a
                        href={node.config.terms_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-accent hover:text-accent/80 text-sm"
                      >
                        (View Terms)
                      </a>
                    )}
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer p-4 glass-surface rounded-lg border border-white/5 hover:border-white/10 transition-all">
                  <input
                    type="checkbox"
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <div className="flex-1">
                    <span className="text-primary font-medium font-sans">I accept the Privacy Policy</span>
                    {node.config?.privacy_url && (
                      <a
                        href={node.config.privacy_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-accent hover:text-accent/80 text-sm"
                      >
                        (View Policy)
                      </a>
                    )}
                  </div>
                </label>
              </div>
              
              <div className="flex justify-center">
                <button className="px-6 py-3 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all border border-accent/30 font-medium">
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      );

    case 'invoice':
      const paymentStatus = node.config?.payment_status || 'pending';
      const isPaid = paymentStatus === 'paid' || paymentStatus === 'confirmed';
      
      return (
        <div className={`${gradientBg} min-h-full p-8 rounded-lg`}>
          <div className="max-w-2xl mx-auto">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-primary mb-3 font-serif">{node.title || 'Invoice'}</h2>
                {node.description && (
                  <p className="text-secondary mb-6 leading-relaxed text-base font-sans">{node.description}</p>
                )}
              </div>
              
              {!isPaid ? (
                <>
              {node.config?.stripe_url ? (
                <div className="p-6 glass-surface rounded-lg border border-white/10">
                  <div className="mb-4">
                    <div className="text-sm text-secondary mb-2 font-sans">Payment Amount</div>
                    <div className="text-2xl font-bold text-primary font-serif">
                      {node.config?.amount_label || 'Invoice Payment'}
                    </div>
                  </div>
                  <a
                    href={node.config.stripe_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-6 py-3 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all border border-accent/30 text-center font-medium"
                  >
                        Pay Now
                  </a>
                </div>
              ) : (
                <div className="p-6 glass-surface rounded-lg border border-white/10 text-center">
                  <p className="text-secondary mb-4">No invoice link configured</p>
                  <p className="text-sm text-secondary">Configure invoice in Settings</p>
                </div>
              )}
                </>
              ) : (
                <div className="p-6 glass-surface rounded-lg border border-white/10">
                  <div className="mb-4 text-center">
                    <div className="text-sm text-green-400 mb-2 font-sans">Payment Status</div>
                    <div className="text-xl font-bold text-green-400 font-serif">
                      Payment Received
                    </div>
                  </div>
                  <button className="w-full px-6 py-3 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all border border-accent/30 text-center font-medium">
                    I confirm I have paid
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );

    case 'contract':
      // If document file is uploaded, show it (support both URL and base64)
      const contractDocFile = node.config?.document_file;
      const contractDocUrl = contractDocFile?.url || contractDocFile?.data;
      if (contractDocUrl) {
        const fileType = contractDocFile.type;
        const isPDF = fileType === 'application/pdf';
        const isImage = fileType?.startsWith('image/');
        
        return (
          <div className={`${gradientBg} min-h-full p-8 rounded-lg overflow-y-auto`}>
            <div className="max-w-4xl mx-auto">
              {/* Document Display */}
              <div className="glass-surface rounded-lg border border-white/10 overflow-hidden">
                {isPDF ? (
                  <iframe
                    src={contractDocUrl}
                    className="w-full h-[800px] bg-white"
                    title="Contract Preview"
                  />
                ) : isImage ? (
                  <img
                    src={contractDocUrl}
                    alt={contractDocFile.name || 'Contract'}
                    className="w-full h-auto"
                  />
                ) : (
                  <div className="p-8 text-center text-secondary">
                    <p>Unsupported file type</p>
                  </div>
                )}
              </div>
              
              {/* Action Button */}
              <div className="mt-6 flex justify-center">
                <button className="px-8 py-3 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all border border-accent/30 font-medium">
                  Sign and Continue
                </button>
              </div>
            </div>
          </div>
        );
      }
      
      // No document uploaded
      return (
        <div className={`${gradientBg} min-h-full p-8 rounded-lg overflow-y-auto flex items-center justify-center`}>
          <div className="text-center">
            <p className="text-secondary mb-4">No contract document uploaded yet</p>
            <p className="text-sm text-secondary">Upload a document in Settings to preview</p>
          </div>
        </div>
      );


    default:
      return (
        <div className={`${gradientBg} min-h-full p-8 rounded-lg`}>
          <div className="max-w-2xl mx-auto">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-primary font-serif">{node.title || 'Step'}</h2>
              {node.description && (
                <p className="text-secondary leading-relaxed text-base font-sans">{node.description}</p>
              )}
              <button className="px-6 py-3 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all border border-accent/30 font-medium">
                Complete Step
              </button>
            </div>
          </div>
        </div>
      );
  }
}


