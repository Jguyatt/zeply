export interface OnboardingTemplate {
  id: string;
  name: string;
  description: string;
  nodes: Array<{
    type: string;
    title: string;
    order_index: number;
    position: { x: number; y: number };
    config: Record<string, any>;
  }>;
}

export const ONBOARDING_TEMPLATES: OnboardingTemplate[] = [
  {
    id: 'full-onboarding',
    name: 'Full Onboarding',
    description: 'Complete onboarding flow with welcome, scope, terms, contract, and invoice',
    nodes: [
      { 
        type: 'welcome', 
        title: 'Welcome Page', 
        order_index: 1, 
        position: { x: 100, y: 200 }, 
        config: { html_content: '' } 
      },
      { 
        type: 'scope', 
        title: 'Scope of Services', 
        order_index: 2, 
        position: { x: 600, y: 200 }, 
        config: { html_content: '' } 
      },
      { 
        type: 'terms', 
        title: 'Terms & Privacy', 
        order_index: 3, 
        position: { x: 1100, y: 200 }, 
        config: { 
          privacy_url: '', 
          terms_url: '', 
          checkbox_text: 'I accept the Terms of Service and Privacy Policy' 
        } 
      },
      { 
        type: 'contract', 
        title: 'Contract', 
        order_index: 4, 
        position: { x: 1600, y: 200 }, 
        config: { html_content: '', signature_required: true } 
      },
      { 
        type: 'invoice', 
        title: 'Invoice', 
        order_index: 5, 
        position: { x: 2100, y: 200 }, 
        config: { stripe_url: '', amount_label: '', payment_status: 'pending' } 
      },
    ],
  },
  {
    id: 'simple-onboarding',
    name: 'Simple Onboarding',
    description: 'Streamlined flow with welcome, terms, and contract only',
    nodes: [
      { 
        type: 'welcome', 
        title: 'Welcome Page', 
        order_index: 1, 
        position: { x: 100, y: 200 }, 
        config: { html_content: '' } 
      },
      { 
        type: 'terms', 
        title: 'Terms & Privacy', 
        order_index: 2, 
        position: { x: 600, y: 200 }, 
        config: { 
          privacy_url: '', 
          terms_url: '', 
          checkbox_text: 'I accept the Terms of Service and Privacy Policy' 
        } 
      },
      { 
        type: 'contract', 
        title: 'Contract', 
        order_index: 3, 
        position: { x: 1100, y: 200 }, 
        config: { html_content: '', signature_required: true } 
      },
    ],
  },
];

export function getTemplateById(id: string): OnboardingTemplate | undefined {
  return ONBOARDING_TEMPLATES.find(t => t.id === id);
}

export function getDefaultContractHTML(orgName: string): string {
  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="font-size: 28px; font-weight: 600; margin-bottom: 30px; color: #1a1a1a;">Service Agreement</h1>
      
      <p style="margin-bottom: 20px; color: #4a4a4a; line-height: 1.6;">
        This Service Agreement ("Agreement") is entered into between <strong>${orgName}</strong> ("Service Provider") 
        and the client ("Client") effective as of the date of signature below.
      </p>
      
      <h2 style="font-size: 20px; font-weight: 600; margin-top: 30px; margin-bottom: 15px; color: #1a1a1a;">1. Services</h2>
      <p style="margin-bottom: 20px; color: #4a4a4a; line-height: 1.6;">
        The Service Provider agrees to provide the services as outlined in the Scope of Services document 
        attached hereto and incorporated by reference.
      </p>
      
      <h2 style="font-size: 20px; font-weight: 600; margin-top: 30px; margin-bottom: 15px; color: #1a1a1a;">2. Payment Terms</h2>
      <p style="margin-bottom: 20px; color: #4a4a4a; line-height: 1.6;">
        Payment terms and amounts will be as specified in the invoice provided separately.
      </p>
      
      <h2 style="font-size: 20px; font-weight: 600; margin-top: 30px; margin-bottom: 15px; color: #1a1a1a;">3. Term</h2>
      <p style="margin-bottom: 20px; color: #4a4a4a; line-height: 1.6;">
        This Agreement shall commence on the date of signature and continue until terminated by either party 
        in accordance with the terms herein.
      </p>
      
      <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e0e0e0;">
        <p style="margin-bottom: 10px; color: #4a4a4a;">By signing below, both parties agree to the terms of this Agreement.</p>
      </div>
    </div>
  `;
}
