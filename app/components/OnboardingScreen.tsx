'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Circle,
  FileText,
  Link as LinkIcon,
  CreditCard,
  Calendar,
  Plug,
  ExternalLink,
  Upload,
} from 'lucide-react';
import {
  getOnboardingItems,
  getOnboardingProgress,
  completeOnboardingItem,
} from '@/app/actions/client-portal';

interface OnboardingScreenProps {
  orgId: string;
  orgName: string;
  userId: string;
}

const TYPE_ICONS: Record<string, any> = {
  doc: FileText,
  form: FileText,
  contract: FileText,
  connect: Plug,
  payment: CreditCard,
  call: Calendar,
};

export default function OnboardingScreen({ orgId, orgName, userId }: OnboardingScreenProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<string, any>>({});

  useEffect(() => {
    loadData();
  }, [orgId, userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsResult, progressResult] = await Promise.all([
        getOnboardingItems(orgId),
        getOnboardingProgress(orgId, userId),
      ]);

      if (itemsResult.data) {
        setItems(itemsResult.data);
      }

      if (progressResult.data) {
        const progressMap: Record<string, any> = {};
        progressResult.data.forEach((p: any) => {
          progressMap[p.item_id] = p;
        });
        setProgress(progressMap);
      }
    } catch (error) {
      console.error('Error loading onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (itemId: string) => {
    try {
      const result = await completeOnboardingItem(orgId, itemId);
      if (result.data) {
        setProgress({
          ...progress,
          [itemId]: result.data,
        });
        // Reload to check if all required items are complete
        await loadData();
        // If all required items are complete, redirect to dashboard
        const requiredItems = items.filter(item => item.required);
        const completedRequired = requiredItems.filter(item => 
          progress[item.id]?.status === 'completed' || (item.id === itemId)
        );
        if (completedRequired.length === requiredItems.length) {
          router.refresh();
        }
      }
    } catch (error) {
      console.error('Error completing item:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-secondary">Loading...</div>
      </div>
    );
  }

  const requiredItems = items.filter(item => item.required);
  const optionalItems = items.filter(item => !item.required);
  const completedCount = items.filter(item => progress[item.id]?.status === 'completed').length;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-light text-primary mb-2">Welcome to {orgName}</h1>
        <p className="text-secondary">
          Complete these steps to get started ({completedCount} of {items.length} completed)
        </p>
      </div>

      {/* Required Items */}
      {requiredItems.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-primary">Required Steps</h2>
          <div className="space-y-3">
            {requiredItems.map((item) => {
              const Icon = TYPE_ICONS[item.type] || FileText;
              const isCompleted = progress[item.id]?.status === 'completed';
              
              return (
                <div
                  key={item.id}
                  className={`glass-surface rounded-lg p-6 ${
                    isCompleted ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                      ) : (
                        <Circle className="w-6 h-6 text-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-5 h-5 text-accent" />
                        <h3 className="text-lg font-medium text-primary">{item.title}</h3>
                        {isCompleted && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-500/20 text-green-400 border border-green-500/30">
                            Completed
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-secondary mb-4">{item.description}</p>
                      )}
                      <div className="flex items-center gap-3">
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 glass-surface text-primary rounded-lg hover:bg-white/10 transition-all text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open Link
                          </a>
                        )}
                        {item.file_url && (
                          <a
                            href={item.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 glass-surface text-primary rounded-lg hover:bg-white/10 transition-all text-sm"
                          >
                            <Upload className="w-4 h-4" />
                            View File
                          </a>
                        )}
                        {!isCompleted && (
                          <button
                            onClick={() => handleComplete(item.id)}
                            className="px-4 py-2 glass-surface text-accent rounded-lg hover:bg-accent/20 transition-all text-sm border border-accent/30"
                          >
                            Mark as Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Optional Items */}
      {optionalItems.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-primary">Optional Steps</h2>
          <div className="space-y-3">
            {optionalItems.map((item) => {
              const Icon = TYPE_ICONS[item.type] || FileText;
              const isCompleted = progress[item.id]?.status === 'completed';
              
              return (
                <div
                  key={item.id}
                  className={`glass-surface rounded-lg p-6 ${
                    isCompleted ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                      ) : (
                        <Circle className="w-6 h-6 text-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-5 h-5 text-accent" />
                        <h3 className="text-lg font-medium text-primary">{item.title}</h3>
                        {isCompleted && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-500/20 text-green-400 border border-green-500/30">
                            Completed
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-secondary mb-4">{item.description}</p>
                      )}
                      <div className="flex items-center gap-3">
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 glass-surface text-primary rounded-lg hover:bg-white/10 transition-all text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open Link
                          </a>
                        )}
                        {item.file_url && (
                          <a
                            href={item.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 glass-surface text-primary rounded-lg hover:bg-white/10 transition-all text-sm"
                          >
                            <Upload className="w-4 h-4" />
                            View File
                          </a>
                        )}
                        {!isCompleted && (
                          <button
                            onClick={() => handleComplete(item.id)}
                            className="px-4 py-2 glass-surface text-primary rounded-lg hover:bg-white/10 transition-all text-sm"
                          >
                            Mark as Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completion Message */}
      {completedCount === requiredItems.length && requiredItems.length > 0 && (
        <div className="glass-surface rounded-lg p-6 text-center border border-green-500/30">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-primary mb-2">All Required Steps Complete!</h3>
          <p className="text-sm text-secondary mb-4">
            You can now access your dashboard. Optional steps can be completed later.
          </p>
          <button
            onClick={() => router.refresh()}
            className="px-6 py-3 glass-surface text-accent rounded-lg hover:bg-accent/20 transition-all border border-accent/30"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}

