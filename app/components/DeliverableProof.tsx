'use client';

import { useState } from 'react';
import { Link, File, Image as ImageIcon, Video, ExternalLink, X, Trash2 } from 'lucide-react';
import { removeProofItem } from '@/app/actions/deliverables';
import { useRouter } from 'next/navigation';

interface ProofAsset {
  id: string;
  name: string;
  url: string;
  kind: 'file' | 'link' | 'loom' | 'gdrive';
  is_required_proof?: boolean;
  proof_type?: 'url' | 'file' | 'screenshot' | 'loom' | 'gdrive';
}

interface DeliverableProofProps {
  deliverableId: string;
  assets: ProofAsset[];
  requiredProofTypes: string[];
  isAdmin: boolean;
  isComplete: boolean;
}

export default function DeliverableProof({
  deliverableId,
  assets,
  requiredProofTypes,
  isAdmin,
  isComplete,
}: DeliverableProofProps) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (assetId: string) => {
    if (!confirm('Are you sure you want to remove this proof item?')) return;
    
    setRemovingId(assetId);
    try {
      const result = await removeProofItem(assetId);
      if (result.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    } catch (error) {
      console.error('Error removing proof item:', error);
      alert('Failed to remove proof item');
    } finally {
      setRemovingId(null);
    }
  };
  const getProofIcon = (kind: string, proofType?: string) => {
    if (proofType === 'loom' || kind === 'loom') return <Video className="w-4 h-4" />;
    if (proofType === 'gdrive' || kind === 'gdrive') return <ExternalLink className="w-4 h-4" />;
    if (proofType === 'screenshot' || kind === 'file') {
      // Check if it's an image
      const isImage = assets.find((a) => a.id === assets.find((a) => a.id === assets[0]?.id)?.id)?.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
      return isImage ? <ImageIcon className="w-4 h-4" /> : <File className="w-4 h-4" />;
    }
    return <Link className="w-4 h-4" />;
  };

  const getProofBadge = (proofType?: string, kind?: string) => {
    const type = proofType || kind;
    switch (type) {
      case 'url':
        return <span className="px-2 py-0.5 text-xs rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">URL</span>;
      case 'file':
        return <span className="px-2 py-0.5 text-xs rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">File</span>;
      case 'screenshot':
        return <span className="px-2 py-0.5 text-xs rounded bg-green-500/20 text-green-400 border border-green-500/30">Screenshot</span>;
      case 'loom':
        return <span className="px-2 py-0.5 text-xs rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">Loom</span>;
      case 'gdrive':
        return <span className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400 border border-red-500/30">Drive</span>;
      default:
        return null;
    }
  };

  const requiredProofs = assets.filter((asset) => asset.is_required_proof);
  const optionalProofs = assets.filter((asset) => !asset.is_required_proof);

  return (
    <div className="space-y-6">
      {/* Required Proofs */}
      {requiredProofTypes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-primary mb-3">
            Required Proof
            <span className="ml-2 text-xs text-secondary">
              ({requiredProofs.length}/{requiredProofTypes.length})
            </span>
          </h3>
          {requiredProofs.length > 0 ? (
            <div className="space-y-2">
              {requiredProofs.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#4C8DFF]/30 bg-[#4C8DFF]/5"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#4C8DFF]/20 flex items-center justify-center text-[#4C8DFF] flex-shrink-0">
                    {getProofIcon(asset.kind, asset.proof_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{asset.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getProofBadge(asset.proof_type, asset.kind)}
                      {isComplete && (
                        <span className="text-xs text-green-400">Locked</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-secondary hover:text-primary"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    {isAdmin && !isComplete && (
                      <button
                        onClick={() => handleRemove(asset.id)}
                        disabled={removingId === asset.id}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors text-red-400 disabled:opacity-50"
                        title="Remove proof item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
              <p className="text-sm text-yellow-400">
                Required proof not yet attached. Add proof items to proceed.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Optional Proofs */}
      {optionalProofs.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-primary mb-3">
            Additional Proof
            <span className="ml-2 text-xs text-secondary">({optionalProofs.length})</span>
          </h3>
          <div className="space-y-2">
            {optionalProofs.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/2"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-secondary flex-shrink-0">
                  {getProofIcon(asset.kind, asset.proof_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary truncate">{asset.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getProofBadge(asset.proof_type, asset.kind)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-secondary hover:text-primary"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  {isAdmin && !isComplete && (
                    <button
                      onClick={() => handleRemove(asset.id)}
                      disabled={removingId === asset.id}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors text-red-400 disabled:opacity-50"
                      title="Remove proof item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {assets.length === 0 && (
        <div className="p-8 rounded-lg border border-white/10 bg-white/2 text-center">
          <File className="w-8 h-8 text-muted mx-auto mb-3 opacity-50" />
          <p className="text-sm text-secondary">No proof items attached yet</p>
        </div>
      )}
    </div>
  );
}

