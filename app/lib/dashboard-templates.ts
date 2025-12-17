/**
 * Dashboard Templates
 * Pre-built dashboard configurations for different service types
 */

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  kpis: string[];
  services: string[]; // Service IDs that this template is optimized for
}

export const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    id: 'local_seo',
    name: 'Local SEO',
    description: 'Optimized for local SEO services with rankings, traffic, and lead tracking',
    sections: ['kpis', 'deliverables', 'roadmap', 'updates'],
    kpis: ['leads', 'work_completed'],
    services: ['seo'],
  },
  {
    id: 'paid_ads',
    name: 'Paid Ads',
    description: 'Performance-focused dashboard for paid advertising campaigns',
    sections: ['kpis', 'deliverables', 'reports', 'updates'],
    kpis: ['leads', 'spend', 'cpl', 'roas'],
    services: ['ads'],
  },
  {
    id: 'ai_automation',
    name: 'AI Automation',
    description: 'Dashboard for AI-powered services (chatbot, lead gen, follow-up)',
    sections: ['kpis', 'deliverables', 'roadmap', 'updates'],
    kpis: ['leads', 'work_completed'],
    services: ['ai_receptionist', 'ai_chatbot', 'ai_lead_gen', 'ai_followup', 'ai_ad_creative'],
  },
  {
    id: 'retainer',
    name: 'Retainer / Deliverables Only',
    description: 'Simple dashboard focused on deliverables and progress tracking',
    sections: ['kpis', 'deliverables', 'roadmap', 'updates'],
    kpis: ['work_completed'],
    services: [], // Works for any service type
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): DashboardTemplate | undefined {
  return DASHBOARD_TEMPLATES.find(t => t.id === id);
}

/**
 * Get recommended template based on enabled services
 */
export function getRecommendedTemplate(enabledServices: Record<string, boolean>): DashboardTemplate {
  const serviceIds = Object.keys(enabledServices).filter(id => enabledServices[id]);
  
  // Check for AI services first
  const hasAIService = serviceIds.some(id => 
    id.startsWith('ai_') || ['ai_receptionist', 'ai_chatbot', 'ai_lead_gen', 'ai_followup', 'ai_ad_creative'].includes(id)
  );
  if (hasAIService) {
    return DASHBOARD_TEMPLATES.find(t => t.id === 'ai_automation')!;
  }
  
  // Check for paid ads
  if (serviceIds.includes('ads')) {
    return DASHBOARD_TEMPLATES.find(t => t.id === 'paid_ads')!;
  }
  
  // Check for SEO
  if (serviceIds.includes('seo')) {
    return DASHBOARD_TEMPLATES.find(t => t.id === 'local_seo')!;
  }
  
  // Default to retainer template
  return DASHBOARD_TEMPLATES.find(t => t.id === 'retainer')!;
}

/**
 * Intelligently build dashboard configuration based on enabled services
 * Automatically selects relevant sections and KPIs based on service types
 */
export function buildDefaultDashboard(
  enabledServices: Record<string, boolean> = {},
  hasDeliverables: boolean = false,
  templateId?: string
): { sections: string[]; kpis: string[] } {
  // If template is specified, use it (for backward compatibility)
  if (templateId) {
    const template = getTemplateById(templateId);
    if (template) {
      return {
        sections: template.sections,
        kpis: template.kpis,
      };
    }
  }
  
  // Start with core sections that everyone needs
  const sections: string[] = ['kpis', 'deliverables', 'roadmap', 'updates'];
  const kpis: string[] = [];
  
  const serviceIds = Object.keys(enabledServices).filter(id => enabledServices[id]);
  
  // Build KPIs based on services
  if (serviceIds.includes('ads')) {
    // Paid ads services need ad metrics
    kpis.push('leads', 'spend', 'cpl', 'roas');
    sections.push('reports'); // Add reports for ad performance
  }
  
  if (serviceIds.includes('seo')) {
    // SEO services need traffic/lead metrics
    if (!kpis.includes('leads')) kpis.push('leads');
    // Could add organic_traffic, rankings if we track those
  }
  
  if (serviceIds.some(id => id.startsWith('ai_'))) {
    // AI services typically track leads and engagement
    if (!kpis.includes('leads')) kpis.push('leads');
  }
  
  if (serviceIds.includes('crm') || serviceIds.includes('web')) {
    // CRM and web services track leads/conversions
    if (!kpis.includes('leads')) kpis.push('leads');
  }
  
  // Always include work_completed for deliverables tracking
  kpis.push('work_completed');
  
  // If no specific services, use minimal setup
  if (serviceIds.length === 0) {
    return {
      sections: ['kpis', 'deliverables', 'updates'],
      kpis: ['work_completed'],
    };
  }
  
  // Remove duplicates
  const uniqueSections = Array.from(new Set(sections));
  const uniqueKpis = Array.from(new Set(kpis));
  
  return { sections: uniqueSections, kpis: uniqueKpis };
}

