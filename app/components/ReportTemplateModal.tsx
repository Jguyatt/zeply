'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Calendar, TrendingUp, Target } from 'lucide-react';
import ReportEditor from './ReportEditor';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: Array<{
    section_type: 'summary' | 'metrics' | 'insights' | 'recommendations' | 'next_steps' | 'custom' | 'proof_of_work';
    title?: string;
    content: string;
  }>;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'monthly',
    name: 'Monthly Performance Report',
    description: 'Premium monthly report with executive summary, metrics, insights, and proof of work',
    sections: [
      {
        section_type: 'summary',
        title: 'Executive Summary',
        content: `GOAL: [What are we trying to move?]

RESULT VS LAST PERIOD:
- [Metric]: [Up/Down] [%] - [Why]

3 WINS:
1. [Win 1]
2. [Win 2]
3. [Win 3]

3 ISSUES:
1. [Issue 1]
2. [Issue 2]
3. [Issue 3]

NEXT ACTIONS:
- [Action 1] | Owner: [Name] | Due: [Date]
- [Action 2] | Owner: [Name] | Due: [Date]
- [Action 3] | Owner: [Name] | Due: [Date]`,
      },
      {
        section_type: 'metrics',
        title: 'Performance Metrics',
        content: 'Metrics will be auto-populated from your metrics table.',
      },
      {
        section_type: 'insights',
        title: 'Key Insights',
        content: `INSIGHT 1:
Observation: [What happened?]
Cause: [Why did it happen?]
Action Taken: [What we did]
Expected Impact: [What we expect]
Risk/Watch-outs: [What to monitor]

INSIGHT 2:
Observation: [What happened?]
Cause: [Why did it happen?]
Action Taken: [What we did]
Expected Impact: [What we expect]
Risk/Watch-outs: [What to monitor]

INSIGHT 3:
Observation: [What happened?]
Cause: [Why did it happen?]
Action Taken: [What we did]
Expected Impact: [What we expect]
Risk/Watch-outs: [What to monitor]`,
      },
      {
        section_type: 'proof_of_work',
        title: 'Proof of Work',
        content: `DELIVERABLES COMPLETED:
- [Deliverable 1]
- [Deliverable 2]
- [Deliverable 3]

CHANGES SHIPPED:
- [Change 1]
- [Change 2]
- [Change 3]

TESTS LAUNCHED:
- [Test 1]
- [Test 2]`,
      },
      {
        section_type: 'next_steps',
        title: 'Next Period Plan',
        content: `Action | Why | Owner | ETA | Status
[Action 1] | [Reason] | [Name] | [Date] | Planned
[Action 2] | [Reason] | [Name] | [Date] | Planned
[Action 3] | [Reason] | [Name] | [Date] | Planned`,
      },
    ],
  },
  {
    id: 'quarterly',
    name: 'Quarterly Review',
    description: 'Comprehensive quarterly review with strategic insights and recommendations',
    sections: [
      {
        section_type: 'summary',
        title: 'Executive Summary',
        content: `GOAL: [Quarterly objective]

RESULT VS LAST QUARTER:
- [Metric]: [Up/Down] [%] - [Why]

3 WINS:
1. [Win 1]
2. [Win 2]
3. [Win 3]

3 ISSUES:
1. [Issue 1]
2. [Issue 2]
3. [Issue 3]

NEXT ACTIONS:
- [Action 1] | Owner: [Name] | Due: [Date]
- [Action 2] | Owner: [Name] | Due: [Date]`,
      },
      {
        section_type: 'metrics',
        title: 'Quarterly Metrics',
        content: 'Metrics will be auto-populated from your metrics table.',
      },
      {
        section_type: 'insights',
        title: 'Quarterly Trends & Insights',
        content: `TREND 1:
Observation: [What trend did we observe?]
Cause: [Why did this trend occur?]
Action Taken: [What we did]
Expected Impact: [What we expect]
Risk/Watch-outs: [What to monitor]`,
      },
      {
        section_type: 'recommendations',
        title: 'Strategic Recommendations',
        content: `RECOMMENDATION 1:
What: [Recommendation]
Why: [Reason]
Impact: [Expected outcome]
Timeline: [When]

RECOMMENDATION 2:
What: [Recommendation]
Why: [Reason]
Impact: [Expected outcome]
Timeline: [When]`,
      },
    ],
  },
  {
    id: 'campaign',
    name: 'Campaign Analysis',
    description: 'Deep dive into a specific campaign with performance analysis and learnings',
    sections: [
      {
        section_type: 'summary',
        title: 'Campaign Overview',
        content: `CAMPAIGN: [Campaign Name]
PERIOD: [Start] - [End]
OBJECTIVE: [Campaign goal]

RESULT:
- [Metric]: [Result] vs [Target]
- [Metric]: [Result] vs [Target]

KEY WINS:
1. [Win 1]
2. [Win 2]

KEY ISSUES:
1. [Issue 1]
2. [Issue 2]`,
      },
      {
        section_type: 'metrics',
        title: 'Campaign Performance',
        content: 'Metrics will be auto-populated from your metrics table.',
      },
      {
        section_type: 'insights',
        title: 'Campaign Insights',
        content: `INSIGHT 1:
Observation: [What happened in this campaign?]
Cause: [Why did it happen?]
Action Taken: [What we did]
Expected Impact: [What we expect]
Risk/Watch-outs: [What to monitor]`,
      },
      {
        section_type: 'recommendations',
        title: 'Optimization Recommendations',
        content: `RECOMMENDATION 1:
What: [Optimization]
Why: [Reason]
Impact: [Expected outcome]
Timeline: [When]`,
      },
    ],
  },
];

interface ReportTemplateModalProps {
  orgId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReportTemplateModal({
  orgId,
  onClose,
  onSuccess,
}: ReportTemplateModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleSelectTemplate = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setShowEditor(true);
  };

  const handleCreateFromScratch = () => {
    setSelectedTemplate(null);
    setShowEditor(true);
  };

  const getTemplateIcon = (templateId: string) => {
    switch (templateId) {
      case 'monthly':
        return <Calendar className="w-6 h-6" />;
      case 'quarterly':
        return <TrendingUp className="w-6 h-6" />;
      case 'campaign':
        return <Target className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  if (showEditor) {
    return (
      <ReportEditor
        report={null}
        orgId={orgId}
        initialSections={selectedTemplate?.sections}
        onClose={() => {
          setShowEditor(false);
          setSelectedTemplate(null);
          onClose();
        }}
        onSuccess={() => {
          setShowEditor(false);
          setSelectedTemplate(null);
          onSuccess();
        }}
      />
    );
  }

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative glass-panel border border-white/10 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-primary">Create New Report</h2>
            <p className="text-sm text-secondary mt-1">Choose a premium template or start from scratch</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-secondary hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {REPORT_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="glass-subtle border border-white/10 rounded-lg p-6 hover:bg-white/5 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-[#4C8DFF]/20 text-[#4C8DFF] group-hover:bg-[#4C8DFF]/30 transition-colors">
                    {getTemplateIcon(template.id)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-primary mb-1">{template.name}</h3>
                    <p className="text-sm text-secondary line-clamp-2">{template.description}</p>
                    <div className="mt-3 text-xs text-secondary">
                      {template.sections.length} sections
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Start from Scratch */}
          <button
            onClick={handleCreateFromScratch}
            className="w-full glass-subtle border border-white/10 rounded-lg p-6 hover:bg-white/5 transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-white/10 text-primary group-hover:bg-white/20 transition-colors">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-primary mb-1">Start from Scratch</h3>
                <p className="text-sm text-secondary">Create a custom report with your own sections</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
