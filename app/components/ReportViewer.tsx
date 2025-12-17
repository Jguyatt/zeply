'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Calendar, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ReportCharts from './reports/ReportCharts';
import { getMetrics } from '@/app/actions/metrics';
import jsPDF from 'jspdf';

interface ReportSection {
  id: string;
  section_type: 'summary' | 'metrics' | 'insights' | 'recommendations' | 'next_steps' | 'custom' | 'proof_of_work';
  block_type?: 'summary' | 'work' | 'insights' | 'next_steps' | 'performance' | 'custom';
  title?: string;
  content: string;
  order_index: number;
  is_auto_generated?: boolean;
}

interface Report {
  id: string;
  title: string;
  summary?: string;
  period_start?: string;
  period_end?: string;
  status: 'draft' | 'published';
  client_visible: boolean;
  created_at: string;
  published_at?: string;
  report_sections?: ReportSection[];
}

interface ReportViewerProps {
  report: Report;
  orgId: string;
  isAdmin?: boolean;
  onClose: () => void;
  onExportPDF?: () => void;
  onExportCSV?: () => void;
}

export default function ReportViewer({
  report,
  orgId,
  isAdmin = false,
  onClose,
  onExportPDF,
  onExportCSV,
}: ReportViewerProps) {
  const router = useRouter();
  const [metricsData, setMetricsData] = useState<any[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);

  useEffect(() => {
    if (report.period_start && report.period_end) {
      loadMetricsForPeriod();
    }
  }, [report.period_start, report.period_end]);

  const loadMetricsForPeriod = async () => {
    if (!report.period_start || !report.period_end) return;

    setLoadingMetrics(true);
    try {
      const result = await getMetrics(orgId, report.period_start, report.period_end);
      if (result.data && result.data.length > 0) {
        // Format metrics for charts
        const formatted = result.data.map((m: any) => ({
          period: new Date(m.period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          leads: m.leads || 0,
          spend: Number(m.spend) || 0,
          revenue: Number(m.revenue) || 0,
          roas: m.roas ? Number(m.roas) : undefined,
          conversions: m.conversions || 0,
        }));
        setMetricsData(formatted);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleExportPDF = async () => {
    if (onExportPDF) {
      onExportPDF();
      return;
    }

    setExportingPDF(true);
    try {
      const pdf = new jsPDF();
      let yPos = 20;

      // Title
      pdf.setFontSize(20);
      pdf.text(report.title, 20, yPos);
      yPos += 10;

      // Period
      if (report.period_start || report.period_end) {
        pdf.setFontSize(12);
        pdf.text(`Period: ${formatDateRange()}`, 20, yPos);
        yPos += 10;
      }

      // Summary
      if (report.summary) {
        yPos += 5;
        pdf.setFontSize(14);
        pdf.text('Summary', 20, yPos);
        yPos += 5;
        pdf.setFontSize(10);
        const summaryLines = pdf.splitTextToSize(report.summary, 170);
        pdf.text(summaryLines, 20, yPos);
        yPos += summaryLines.length * 5 + 5;
      }

      // Sections
      if (report.report_sections && report.report_sections.length > 0) {
        report.report_sections.forEach((section) => {
          if (yPos > 270) {
            pdf.addPage();
            yPos = 20;
          }

          yPos += 5;
          pdf.setFontSize(14);
          const sectionTitle = section.title || getSectionTypeLabel(section.section_type);
          pdf.text(sectionTitle, 20, yPos);
          yPos += 5;

          pdf.setFontSize(10);
          const contentLines = pdf.splitTextToSize(section.content, 170);
          pdf.text(contentLines, 20, yPos);
          yPos += contentLines.length * 5 + 5;
        });
      }

      pdf.save(`report-${report.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportCSV = async () => {
    if (onExportCSV) {
      onExportCSV();
      return;
    }

    setExportingCSV(true);
    try {
      const response = await fetch(`/api/orgs/${orgId}/reports/${report.id}/export/csv`);
      if (!response.ok) {
        throw new Error('Failed to export CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${report.id}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV');
    } finally {
      setExportingCSV(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateRange = () => {
    if (!report.period_start && !report.period_end) return 'No period specified';
    if (report.period_start && report.period_end) {
      const start = new Date(report.period_start);
      const end = new Date(report.period_end);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return report.period_start ? formatDate(report.period_start) : formatDate(report.period_end);
  };

  const getSectionTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const renderSectionContent = (section: ReportSection) => {
    const content = section.content;
    const lines = content.split('\n');
    
    // Special rendering for Proof of Work section with deliverable links
    if (section.section_type === 'proof_of_work') {
      const processedLines = lines.map((line, idx) => {
        // Check if line contains a deliverable link
        const linkMatch = line.match(/\[View Deliverable\]\(([^)]+)\)/);
        if (linkMatch) {
          const linkUrl = linkMatch[1];
          const linkText = line.replace(/\[View Deliverable\]\([^)]+\)/, '').trim();
          return (
            <div key={idx} className="mb-2 flex items-start gap-2">
              <span className="text-primary">{linkText}</span>
              <a
                href={linkUrl}
                className="text-accent hover:text-accent/80 underline text-sm whitespace-nowrap"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Deliverable
              </a>
            </div>
          );
        }
        // Handle structured headers
        if (line.match(/^(DELIVERABLES COMPLETED|CHANGES SHIPPED|TESTS LAUNCHED):/i)) {
          return <h4 key={idx} className="text-base font-semibold text-accent mt-4 mb-2">{line}</h4>;
        }
        // Handle bullet points
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return <li key={idx} className="text-primary ml-4 mb-1">{line.substring(2)}</li>;
        }
        // Regular paragraph
        if (line.trim()) {
          return <p key={idx} className="text-primary mb-2 leading-relaxed">{line}</p>;
        }
        return <br key={idx} />;
      });

      return <div className="prose prose-invert max-w-none">{processedLines}</div>;
    }
    
    // Special rendering for structured sections
    if (section.section_type === 'next_steps') {
      // Table format rendering
      const tableLines = lines.filter(l => l.trim() && l.includes('|'));
      if (tableLines.length > 0) {
        const headers = tableLines[0].split('|').map(h => h.trim());
        const rows = tableLines.slice(1);
        
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  {headers.map((header, idx) => (
                    <th key={idx} className="text-left py-2 px-3 text-sm font-semibold text-primary">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIdx) => {
                  const cells = row.split('|').map(c => c.trim());
                  return (
                    <tr key={rowIdx} className="border-b border-white/5 hover:bg-white/5">
                      {cells.map((cell, cellIdx) => (
                        <td key={cellIdx} className="py-2 px-3 text-sm text-primary">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }
    }
    
    if (section.section_type === 'insights') {
      // Structured insight rendering
      const insightBlocks: string[][] = [];
      let currentBlock: string[] = [];
      
      lines.forEach((line) => {
        if (line.match(/^INSIGHT \d+:/i) || line.match(/^TREND \d+:/i) || line.match(/^RECOMMENDATION \d+:/i)) {
          if (currentBlock.length > 0) {
            insightBlocks.push(currentBlock);
          }
          currentBlock = [line];
        } else if (line.trim()) {
          currentBlock.push(line);
        }
      });
      if (currentBlock.length > 0) {
        insightBlocks.push(currentBlock);
      }
      
      return (
        <div className="space-y-6">
          {insightBlocks.map((block, blockIdx) => (
            <div key={blockIdx} className="glass-subtle border border-white/10 rounded-lg p-4">
              {block.map((line, lineIdx) => {
                if (line.match(/^(INSIGHT|TREND|RECOMMENDATION) \d+:/i)) {
                  return <h4 key={lineIdx} className="text-base font-semibold text-primary mb-3">{line}</h4>;
                }
                if (line.match(/^(Observation|Cause|Action Taken|Expected Impact|Risk|What|Why|Impact|Timeline):/i)) {
                  const [label, ...valueParts] = line.split(':');
                  return (
                    <div key={lineIdx} className="mb-2">
                      <span className="font-semibold text-accent">{label}:</span>
                      <span className="text-primary ml-2">{valueParts.join(':').trim() || ' '}</span>
                    </div>
                  );
                }
                if (line.trim()) {
                  return <p key={lineIdx} className="text-primary mb-2 leading-relaxed">{line}</p>;
                }
                return <br key={lineIdx} />;
              })}
            </div>
          ))}
        </div>
      );
    }
    
    // Default rendering for other sections
    return (
      <div className="prose prose-invert max-w-none">
        {lines.map((line, idx) => {
          // Handle structured headers (GOAL, RESULT VS LAST PERIOD, etc.)
          if (line.match(/^(GOAL|RESULT VS LAST PERIOD|3 WINS|3 ISSUES|NEXT ACTIONS):/i)) {
            return <h4 key={idx} className="text-base font-semibold text-accent mt-4 mb-2">{line}</h4>;
          }
          // Handle headers
          if (line.startsWith('# ')) {
            return <h1 key={idx} className="text-2xl font-semibold text-primary mt-6 mb-4">{line.substring(2)}</h1>;
          }
          if (line.startsWith('## ')) {
            return <h2 key={idx} className="text-xl font-semibold text-primary mt-5 mb-3">{line.substring(3)}</h2>;
          }
          if (line.startsWith('### ')) {
            return <h3 key={idx} className="text-lg font-semibold text-primary mt-4 mb-2">{line.substring(4)}</h3>;
          }
          // Handle bullet points
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return <li key={idx} className="text-primary ml-4 mb-1">{line.substring(2)}</li>;
          }
          // Handle numbered lists
          if (/^\d+\.\s/.test(line)) {
            return <li key={idx} className="text-primary ml-4 mb-1 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>;
          }
          // Regular paragraph
          if (line.trim()) {
            return <p key={idx} className="text-primary mb-3 leading-relaxed">{line}</p>;
          }
          return <br key={idx} />;
        })}
      </div>
    );
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative glass-panel border border-white/10 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-primary mb-2">{report.title}</h2>
            <div className="flex items-center gap-4 text-sm text-secondary">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDateRange()}</span>
              </div>
              {report.published_at && (
                <div className="flex items-center gap-1">
                  <span>Published {formatDate(report.published_at)}</span>
                </div>
              )}
              {report.client_visible ? (
                <div className="flex items-center gap-1 text-green-400">
                  <Eye className="w-4 h-4" />
                  <span>Visible to client</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-secondary">
                  <EyeOff className="w-4 h-4" />
                  <span>Not visible to client</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button
                  onClick={handleExportPDF}
                  disabled={exportingPDF}
                  className="px-3 py-2 rounded-lg text-sm font-medium glass-subtle text-primary hover:bg-white/10 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {exportingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  PDF
                </button>
                <button
                  onClick={handleExportCSV}
                  disabled={exportingCSV}
                  className="px-3 py-2 rounded-lg text-sm font-medium glass-subtle text-primary hover:bg-white/10 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {exportingCSV ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  CSV
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-secondary hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Summary */}
          {report.summary && (
            <div className="glass-subtle border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-primary mb-3">Summary</h3>
              <p className="text-primary leading-relaxed whitespace-pre-wrap">{report.summary}</p>
            </div>
          )}

          {/* Sections */}
          {report.report_sections && report.report_sections.length > 0 ? (
            report.report_sections.map((section) => (
              <div
                key={section.id}
                className="glass-subtle border border-white/10 rounded-lg p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 text-xs font-medium rounded bg-[#4C8DFF]/20 text-[#4C8DFF] border border-[#4C8DFF]/30 capitalize">
                    {getSectionTypeLabel(section.section_type)}
                  </span>
                  {section.title && (
                    <h3 className="text-lg font-semibold text-primary">{section.title}</h3>
                  )}
                </div>
                {section.section_type === 'metrics' && metricsData.length > 0 ? (
                  <div className="space-y-6">
                    <ReportCharts 
                      metrics={metricsData} 
                      chartType="line"
                      metricsToShow={['leads', 'spend', 'revenue']}
                    />
                    <div className="text-primary leading-relaxed">
                      {renderSectionContent(section)}
                    </div>
                  </div>
                ) : (
                  <div className="text-primary leading-relaxed">
                    {renderSectionContent(section)}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-secondary">No sections in this report yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
