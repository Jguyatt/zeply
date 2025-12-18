'use client';

import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Type, List, Minus, AlertCircle, Video, FileText } from 'lucide-react';

interface StepEditorModalProps {
  node: any;
  onClose: () => void;
  onSave: (updatedNode: any) => Promise<void>;
  clerkOrgId: string;
}

type BlockType = 'heading' | 'paragraph' | 'list' | 'divider' | 'callout' | 'video' | 'file';

interface ContentBlock {
  id: string;
  type: BlockType;
  content: any;
}

export default function StepEditorModal({ node, onClose, onSave, clerkOrgId }: StepEditorModalProps) {
  const [saving, setSaving] = useState(false);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [title, setTitle] = useState(node.title || '');
  const [description, setDescription] = useState(node.description || '');
  
  // Type-specific state
  const [stripeUrl, setStripeUrl] = useState(node.config?.stripe_url || '');
  const [afterPaymentText, setAfterPaymentText] = useState(node.config?.after_payment_text || '');
  const [termsUrl, setTermsUrl] = useState(node.config?.terms_url || '');
  const [privacyUrl, setPrivacyUrl] = useState(node.config?.privacy_url || '');

  useEffect(() => {
    // Load blocks from config
    if (node.config?.blocks && Array.isArray(node.config.blocks)) {
      setBlocks(node.config.blocks);
    } else if (node.type === 'welcome') {
      // Initialize with empty blocks for welcome
      setBlocks([]);
    }
  }, [node]);

  const addBlock = (type: BlockType) => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}-${Math.random()}`,
      type,
      content: type === 'heading' ? { text: '', level: 2 } :
                type === 'paragraph' ? { text: '' } :
                type === 'list' ? { items: [''] } :
                type === 'callout' ? { text: '', variant: 'info' } :
                type === 'video' ? { url: '', platform: 'loom' } :
                type === 'file' ? { url: '', name: '' } :
                {},
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const config: any = {};
      
      if (node.type === 'welcome') {
        config.blocks = blocks;
      } else if (node.type === 'payment') {
        config.stripe_url = stripeUrl;
        config.after_payment_text = afterPaymentText;
      } else if (node.type === 'consent') {
        config.terms_url = termsUrl;
        config.privacy_url = privacyUrl;
      }

      const response = await fetch(`/api/orgs/${clerkOrgId}/onboarding/nodes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: node.id,
          title,
          description,
          config,
        }),
      });

      if (response.ok) {
        await onSave({ ...node, title, description, config });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-surface rounded-lg shadow-prestige-soft w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <h2 className="text-xl font-light text-primary">Edit Step: {title || node.title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all disabled:opacity-50 flex items-center gap-2 text-sm border border-accent/30"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onClose}
              className="p-2 glass-surface rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-secondary" />
            </button>
          </div>
        </div>

        {/* Split View: Editor + Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Editor */}
          <div className="w-1/2 border-r border-white/10 overflow-y-auto p-6 space-y-6">
            {/* Basic Fields */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 glass-surface rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 border border-white/5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 glass-surface rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 border border-white/5"
              />
            </div>

            {/* Type-specific editors */}
            {node.type === 'welcome' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-primary">Content Blocks</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addBlock('heading')}
                      className="px-3 py-1.5 glass-surface rounded text-xs hover:bg-white/10 transition-all flex items-center gap-1 border border-white/5"
                    >
                      <Type className="w-3 h-3" />
                      Heading
                    </button>
                    <button
                      onClick={() => addBlock('paragraph')}
                      className="px-3 py-1.5 glass-surface rounded text-xs hover:bg-white/10 transition-all flex items-center gap-1 border border-white/5"
                    >
                      <FileText className="w-3 h-3" />
                      Paragraph
                    </button>
                    <button
                      onClick={() => addBlock('list')}
                      className="px-3 py-1.5 glass-surface rounded text-xs hover:bg-white/10 transition-all flex items-center gap-1 border border-white/5"
                    >
                      <List className="w-3 h-3" />
                      List
                    </button>
                    <button
                      onClick={() => addBlock('callout')}
                      className="px-3 py-1.5 glass-surface rounded text-xs hover:bg-white/10 transition-all flex items-center gap-1 border border-white/5"
                    >
                      <AlertCircle className="w-3 h-3" />
                      Callout
                    </button>
                    <button
                      onClick={() => addBlock('divider')}
                      className="px-3 py-1.5 glass-surface rounded text-xs hover:bg-white/10 transition-all flex items-center gap-1 border border-white/5"
                    >
                      <Minus className="w-3 h-3" />
                      Divider
                    </button>
                  </div>
                </div>

                {blocks.map((block, index) => (
                  <BlockEditor
                    key={block.id}
                    block={block}
                    onUpdate={(updates) => updateBlock(block.id, updates)}
                    onDelete={() => deleteBlock(block.id)}
                    onMoveUp={index > 0 ? () => moveBlock(block.id, 'up') : undefined}
                    onMoveDown={index < blocks.length - 1 ? () => moveBlock(block.id, 'down') : undefined}
                  />
                ))}
              </div>
            )}

            {node.type === 'payment' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Stripe Payment Link</label>
                  <input
                    type="url"
                    value={stripeUrl}
                    onChange={(e) => setStripeUrl(e.target.value)}
                    placeholder="https://buy.stripe.com/..."
                    className="w-full px-3 py-2 glass-surface rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 border border-white/5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">What happens after payment</label>
                  <textarea
                    value={afterPaymentText}
                    onChange={(e) => setAfterPaymentText(e.target.value)}
                    rows={3}
                    placeholder="e.g., Your payment will be processed and you'll receive a confirmation email..."
                    className="w-full px-3 py-2 glass-surface rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 border border-white/5"
                  />
                </div>
              </div>
            )}

            {node.type === 'consent' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Terms of Service URL</label>
                  <input
                    type="url"
                    value={termsUrl}
                    onChange={(e) => setTermsUrl(e.target.value)}
                    className="w-full px-3 py-2 glass-surface rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 border border-white/5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Privacy Policy URL</label>
                  <input
                    type="url"
                    value={privacyUrl}
                    onChange={(e) => setPrivacyUrl(e.target.value)}
                    className="w-full px-3 py-2 glass-surface rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 border border-white/5"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <div className="w-1/2 overflow-y-auto p-8 bg-charcoal">
            <div className="max-w-2xl mx-auto">
              <StepPreview
                node={{ ...node, title, description, config: node.type === 'welcome' ? { blocks } : node.type === 'payment' ? { stripe_url: stripeUrl, after_payment_text: afterPaymentText } : node.type === 'consent' ? { terms_url: termsUrl, privacy_url: privacyUrl } : node.config }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Block Editor Component
function BlockEditor({ block, onUpdate, onDelete, onMoveUp, onMoveDown }: {
  block: ContentBlock;
  onUpdate: (updates: Partial<ContentBlock>) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  return (
    <div className="glass-surface rounded-lg p-4 border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-secondary uppercase font-medium">{block.type}</span>
        <div className="flex items-center gap-1">
          {onMoveUp && (
            <button
              onClick={onMoveUp}
              className="p-1 hover:bg-white/10 rounded text-secondary"
              title="Move up"
            >
              ↑
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={onMoveDown}
              className="p-1 hover:bg-white/10 rounded text-secondary"
              title="Move down"
            >
              ↓
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-1 hover:bg-red-500/10 rounded text-red-400"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {block.type === 'heading' && (
        <div className="space-y-2">
          <select
            value={block.content.level || 2}
            onChange={(e) => onUpdate({ content: { ...block.content, level: parseInt(e.target.value) } })}
            className="w-full px-2 py-1 glass-surface rounded text-sm border border-white/5"
          >
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </select>
          <input
            type="text"
            value={block.content.text || ''}
            onChange={(e) => onUpdate({ content: { ...block.content, text: e.target.value } })}
            placeholder="Heading text"
            className="w-full px-3 py-2 glass-surface rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 border border-white/5"
          />
        </div>
      )}

      {block.type === 'paragraph' && (
        <textarea
          value={block.content.text || ''}
          onChange={(e) => onUpdate({ content: { ...block.content, text: e.target.value } })}
          placeholder="Paragraph text"
          rows={3}
          className="w-full px-3 py-2 glass-surface rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 border border-white/5"
        />
      )}

      {block.type === 'list' && (
        <div className="space-y-2">
          {(block.content.items || ['']).map((item: string, idx: number) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const newItems = [...(block.content.items || [])];
                  newItems[idx] = e.target.value;
                  onUpdate({ content: { ...block.content, items: newItems } });
                }}
                placeholder={`Item ${idx + 1}`}
                className="flex-1 px-3 py-2 glass-surface rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 border border-white/5"
              />
              {(block.content.items || []).length > 1 && (
                <button
                  onClick={() => {
                    const newItems = (block.content.items || []).filter((_: string, i: number) => i !== idx);
                    onUpdate({ content: { ...block.content, items: newItems } });
                  }}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => {
              onUpdate({ content: { ...block.content, items: [...(block.content.items || []), ''] } });
            }}
            className="text-xs text-accent hover:text-accent/80"
          >
            + Add item
          </button>
        </div>
      )}

      {block.type === 'callout' && (
        <div className="space-y-2">
          <select
            value={block.content.variant || 'info'}
            onChange={(e) => onUpdate({ content: { ...block.content, variant: e.target.value } })}
            className="w-full px-2 py-1 glass-surface rounded text-sm border border-white/5"
          >
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="success">Success</option>
          </select>
          <textarea
            value={block.content.text || ''}
            onChange={(e) => onUpdate({ content: { ...block.content, text: e.target.value } })}
            placeholder="Callout text"
            rows={2}
            className="w-full px-3 py-2 glass-surface rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 border border-white/5"
          />
        </div>
      )}

      {block.type === 'divider' && (
        <div className="py-2 text-xs text-secondary">Divider - no configuration needed</div>
      )}
    </div>
  );
}

// Step Preview Component
function StepPreview({ node }: { node: any }) {
  const renderBlocks = () => {
    if (!node.config?.blocks || !Array.isArray(node.config.blocks)) return null;

    return node.config.blocks.map((block: ContentBlock) => {
      switch (block.type) {
        case 'heading':
          const HeadingTag = `h${block.content.level || 2}` as keyof JSX.IntrinsicElements;
          return (
            <HeadingTag key={block.id} className="text-primary font-bold mb-4 mt-6 first:mt-0">
              {block.content.text}
            </HeadingTag>
          );
        case 'paragraph':
          return (
            <p key={block.id} className="text-secondary mb-4 leading-relaxed">
              {block.content.text}
            </p>
          );
        case 'list':
          return (
            <ul key={block.id} className="list-disc list-inside text-secondary mb-4 space-y-2 ml-4">
              {(block.content.items || []).map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          );
        case 'divider':
          return <hr key={block.id} className="my-6 border-white/10" />;
        case 'callout':
          const variantClasses = {
            info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
            warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
            success: 'bg-green-500/10 border-green-500/30 text-green-400',
          };
          return (
            <div key={block.id} className={`p-4 rounded-lg border mb-4 ${variantClasses[block.content.variant as keyof typeof variantClasses] || variantClasses.info}`}>
              {block.content.text}
            </div>
          );
        default:
          return null;
      }
    });
  };

  switch (node.type) {
    case 'welcome':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-2">{node.title || 'Welcome'}</h2>
            {node.description && <p className="text-secondary mb-6">{node.description}</p>}
          </div>
          <div>{renderBlocks()}</div>
          <button className="px-6 py-3 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all border border-accent/30">
            I've read this
          </button>
        </div>
      );

    case 'payment':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-2">{node.title || 'Invoice Payment'}</h2>
            {node.description && <p className="text-secondary mb-4">{node.description}</p>}
          </div>
          {node.config?.stripe_url && (
            <div className="p-6 glass-surface rounded-lg border border-white/10">
              <div className="mb-4">
                <div className="text-sm text-secondary mb-2">Payment Amount</div>
                <div className="text-2xl font-bold text-primary">Invoice Payment</div>
              </div>
              <a
                href={node.config.stripe_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-6 py-3 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all border border-accent/30 text-center"
              >
                Pay Invoice
              </a>
            </div>
          )}
          {node.config?.after_payment_text && (
            <p className="text-sm text-secondary">{node.config.after_payment_text}</p>
          )}
        </div>
      );

    case 'consent':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-2">{node.title || 'Terms & Privacy'}</h2>
            {node.description && <p className="text-secondary mb-4">{node.description}</p>}
          </div>
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1 w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent" />
              <div>
                <span className="text-primary font-medium">Terms of Service</span>
                {node.config?.terms_url && (
                  <a href={node.config.terms_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-accent hover:text-accent/80">
                    (View Terms)
                  </a>
                )}
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1 w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent" />
              <div>
                <span className="text-primary font-medium">Privacy Policy</span>
                {node.config?.privacy_url && (
                  <a href={node.config.privacy_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-accent hover:text-accent/80">
                    (View Policy)
                  </a>
                )}
              </div>
            </label>
          </div>
          <button className="px-6 py-3 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-all border border-accent/30">
            Continue
          </button>
        </div>
      );

    default:
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-primary">{node.title || 'Step'}</h2>
          {node.description && <p className="text-secondary">{node.description}</p>}
        </div>
      );
  }
}



