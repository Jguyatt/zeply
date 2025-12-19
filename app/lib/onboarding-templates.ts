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

export function getDefaultContractHTML(orgName: string, clientEmail?: string, adminEmail?: string, signatureDate?: string): string {
  const currentDate = signatureDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const serviceProviderName = orgName || 'Elevance';
  const serviceProviderEmail = adminEmail || '';
  const clientEmailDisplay = clientEmail || '';
  
  return `
    <div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.8; color: #1a1a1a;">
      <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 30px; text-align: center; text-transform: uppercase; letter-spacing: 1px;">Service Agreement</h1>
      
      <p style="margin-bottom: 25px; text-align: justify;">
        This Service Agreement ("Agreement") is entered into on <strong>${currentDate}</strong> ("Effective Date"), 
        between <strong>${serviceProviderName}</strong>${serviceProviderEmail ? ` (${serviceProviderEmail})` : ''}, a business entity ("Service Provider"), and ${clientEmailDisplay ? `<strong>${clientEmailDisplay}</strong>` : 'the Client'} ("Client").
      </p>
      
      <p style="margin-bottom: 25px; text-align: justify;">
        WHEREAS, Service Provider is engaged in the business of providing marketing, automation, and related services; and
      </p>
      
      <p style="margin-bottom: 25px; text-align: justify;">
        WHEREAS, Client desires to engage Service Provider to provide certain services as described herein;
      </p>
      
      <p style="margin-bottom: 25px; text-align: justify;">
        NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, the parties agree as follows:
      </p>
      
      <h2 style="font-size: 18px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; text-transform: uppercase;">1. Services</h2>
      <p style="margin-bottom: 20px; text-align: justify;">
        Service Provider agrees to provide the services as outlined in the Scope of Services document attached hereto 
        and incorporated by reference as Exhibit A. The services may include, but are not limited to, marketing strategy, 
        automation services, website optimization, performance reporting, and related consulting services. Service Provider 
        shall perform all services in a professional and workmanlike manner consistent with industry standards.
      </p>
      
      <h2 style="font-size: 18px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; text-transform: uppercase;">2. Compensation and Payment Terms</h2>
      <p style="margin-bottom: 20px; text-align: justify;">
        Client agrees to pay Service Provider the fees as specified in the invoice(s) provided separately. All fees are 
        due and payable in advance on a recurring basis as set forth in the applicable invoice. One-time setup fees, if any, 
        shall be due upon execution of this Agreement. All payments are non-refundable except as expressly provided herein. 
        Failure to process payment may result in suspension or termination of services. Late payments shall accrue interest 
        at the rate of 1.5% per month or the maximum rate allowed by law, whichever is less.
      </p>
      
      <h2 style="font-size: 18px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; text-transform: uppercase;">3. Term and Termination</h2>
      <p style="margin-bottom: 20px; text-align: justify;">
        This Agreement shall commence on the Effective Date and continue until terminated by either party in accordance 
        with the terms herein. Services are provided on a recurring or fixed-term basis and will renew automatically unless 
        either party provides written notice of termination at least thirty (30) days prior to the renewal date. Either 
        party may terminate this Agreement immediately upon written notice if the other party breaches any material term 
        of this Agreement and fails to cure such breach within ten (10) days after written notice thereof.
      </p>
      
      <h2 style="font-size: 18px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; text-transform: uppercase;">4. Confidentiality</h2>
      <p style="margin-bottom: 20px; text-align: justify;">
        Both parties agree to keep all non-public business, technical, and customer information confidential. Each party 
        acknowledges that it may receive confidential information from the other party. Each party agrees to hold such 
        confidential information in strict confidence and not to disclose it to any third party without the prior written 
        consent of the disclosing party, except as required by law. Client data shall be protected in accordance with 
        applicable data protection laws. Confidentiality obligations shall survive termination of this Agreement.
      </p>
      
      <h2 style="font-size: 18px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; text-transform: uppercase;">5. Intellectual Property</h2>
      <p style="margin-bottom: 20px; text-align: justify;">
        All work product, materials, and deliverables created by Service Provider in the course of providing services 
        hereunder shall be owned by Client upon full payment of all fees. Service Provider retains the right to use 
        general knowledge, skills, and experience gained in performing the services. Any pre-existing intellectual property 
        of either party shall remain the property of that party.
      </p>
      
      <h2 style="font-size: 18px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; text-transform: uppercase;">6. Warranties and Disclaimers</h2>
      <p style="margin-bottom: 20px; text-align: justify;">
        Service Provider warrants that services will be performed in a professional manner. EXCEPT AS EXPRESSLY SET FORTH 
        HEREIN, SERVICE PROVIDER MAKES NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION THE IMPLIED WARRANTIES 
        OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. Service Provider does not guarantee specific results or outcomes. 
        Client acknowledges that results may vary and that Client is responsible for providing accurate information, timely 
        approvals, and required system access.
      </p>
      
      <h2 style="font-size: 18px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; text-transform: uppercase;">7. Limitation of Liability</h2>
      <p style="margin-bottom: 20px; text-align: justify;">
        IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, 
        INCLUDING WITHOUT LIMITATION LOSS OF PROFITS, DATA, OR USE, ARISING OUT OF OR RELATING TO THIS AGREEMENT, REGARDLESS 
        OF THE THEORY OF LIABILITY. Each party's total liability under this Agreement shall not exceed the total fees paid 
        by Client to Service Provider in the twelve (12) months preceding the claim.
      </p>
      
      <h2 style="font-size: 18px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; text-transform: uppercase;">8. Indemnification</h2>
      <p style="margin-bottom: 20px; text-align: justify;">
        Client agrees to indemnify, defend, and hold harmless Service Provider from and against any claims, damages, losses, 
        liabilities, and expenses (including reasonable attorneys' fees) arising out of or relating to Client's use of the 
        services, Client's breach of this Agreement, or Client's violation of any law or third-party rights.
      </p>
      
      <h2 style="font-size: 18px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; text-transform: uppercase;">9. General Provisions</h2>
      <p style="margin-bottom: 20px; text-align: justify;">
        This Agreement constitutes the entire agreement between the parties and supersedes all prior agreements and understandings. 
        This Agreement may only be modified in writing signed by both parties. If any provision is found to be unenforceable, 
        the remaining provisions shall remain in full force and effect. This Agreement shall be governed by the laws of the 
        jurisdiction in which Service Provider is located, without regard to conflict of law principles. Any disputes shall 
        be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
      </p>
      
      <div style="margin-top: 50px; padding-top: 30px; border-top: 2px solid #1a1a1a;">
        <p style="margin-bottom: 30px; text-align: justify; font-weight: bold;">
          IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date set forth above.
        </p>
        
        <div style="display: flex; justify-content: space-between; margin-top: 60px;">
          <div style="flex: 1; margin-right: 40px;">
            <p style="margin-bottom: 5px; font-weight: bold;">${serviceProviderName}</p>
            ${serviceProviderEmail ? `<p style="margin-bottom: 5px; font-size: 14px; color: #666;">${serviceProviderEmail}</p>` : ''}
            <p style="margin-bottom: 20px; border-bottom: 1px solid #1a1a1a; padding-bottom: 5px;">Date: ${currentDate}</p>
            <p style="margin-bottom: 20px; border-bottom: 1px solid #1a1a1a; padding-bottom: 5px;">Signature: </p>
            <p style="margin-bottom: 5px; border-bottom: 1px solid #1a1a1a; padding-bottom: 5px;">Printed Name: </p>
          </div>
          
          <div style="flex: 1; margin-left: 40px;">
            ${clientEmailDisplay ? `<p style="margin-bottom: 5px; font-weight: bold;">${clientEmailDisplay}</p>` : '<p style="margin-bottom: 5px; font-weight: bold;">Client</p>'}
            <p style="margin-bottom: 20px; border-bottom: 1px solid #1a1a1a; padding-bottom: 5px;">Date: <span id="client-date">${currentDate}</span></p>
            <p style="margin-bottom: 20px; border-bottom: 1px solid #1a1a1a; padding-bottom: 5px;">Signature: <span id="client-signature"></span></p>
            <p style="margin-bottom: 5px; border-bottom: 1px solid #1a1a1a; padding-bottom: 5px;">Printed Name: <span id="client-name"></span></p>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function getDefaultInvoiceHTML(
  orgName: string,
  clientEmail?: string,
  adminEmail?: string,
  invoiceDate?: string,
  amount?: string,
  invoiceNumber?: string
): string {
  const currentDate = invoiceDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const serviceProviderName = orgName || 'Elevance';
  const serviceProviderEmail = adminEmail || '';
  const clientEmailDisplay = clientEmail || '';
  
  // Parse amount - extract numeric value from amount_label (e.g., "$1,000" -> 1000)
  let numericAmount = 0;
  let currencySymbol = '$';
  if (amount) {
    const cleaned = amount.replace(/[^0-9.]/g, '');
    numericAmount = parseFloat(cleaned) || 0;
    if (amount.includes('$')) currencySymbol = '$';
    else if (amount.includes('€')) currencySymbol = '€';
    else if (amount.includes('£')) currencySymbol = '£';
  }
  
  // Generate invoice number if not provided
  const invNumber = invoiceNumber || `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  
  // Calculate due date (30 days from invoice date)
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);
  const dueDateFormatted = dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  // Calculate tax (assuming 0% or can be configured)
  const taxRate = 0;
  const subtotal = numericAmount;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  
  const formatCurrency = (value: number) => {
    return `${currencySymbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  return `
    <div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; color: #1a1a1a;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 3px solid #1a1a1a; padding-bottom: 20px;">
        <div>
          <h1 style="font-size: 32px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px;">INVOICE</h1>
          <p style="font-size: 14px; color: #666; margin: 0;">Invoice Number: <strong>${invNumber}</strong></p>
          <p style="font-size: 14px; color: #666; margin: 5px 0 0 0;">Date: <strong>${currentDate}</strong></p>
        </div>
        <div style="text-align: right;">
          <p style="font-size: 14px; color: #666; margin: 0;">Due Date:</p>
          <p style="font-size: 16px; font-weight: bold; margin: 5px 0 0 0;">${dueDateFormatted}</p>
        </div>
      </div>
      
      <!-- From/To Section -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div style="flex: 1;">
          <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; color: #666;">From:</h2>
          <p style="font-size: 16px; font-weight: bold; margin: 0 0 5px 0;">${serviceProviderName}</p>
          ${serviceProviderEmail ? `<p style="font-size: 14px; color: #666; margin: 5px 0 0 0;">${serviceProviderEmail}</p>` : ''}
        </div>
        <div style="flex: 1; margin-left: 40px;">
          <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; color: #666;">Bill To:</h2>
          ${clientEmailDisplay ? `<p style="font-size: 16px; font-weight: bold; margin: 0 0 5px 0;">${clientEmailDisplay}</p>` : ''}
        </div>
      </div>
      
      <!-- Line Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #f5f5f5; border-bottom: 2px solid #1a1a1a;">
            <th style="text-align: left; padding: 12px; font-weight: bold; text-transform: uppercase; font-size: 12px; color: #666;">Description</th>
            <th style="text-align: right; padding: 12px; font-weight: bold; text-transform: uppercase; font-size: 12px; color: #666; width: 100px;">Quantity</th>
            <th style="text-align: right; padding: 12px; font-weight: bold; text-transform: uppercase; font-size: 12px; color: #666; width: 120px;">Unit Price</th>
            <th style="text-align: right; padding: 12px; font-weight: bold; text-transform: uppercase; font-size: 12px; color: #666; width: 120px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #e0e0e0;">
            <td style="padding: 15px 12px; font-size: 14px;">
              <strong>Marketing & Automation Services</strong><br>
              <span style="color: #666; font-size: 13px;">Comprehensive marketing strategy, automation setup, and ongoing management services as outlined in the Service Agreement.</span>
            </td>
            <td style="padding: 15px 12px; text-align: right; font-size: 14px;">1</td>
            <td style="padding: 15px 12px; text-align: right; font-size: 14px;">${formatCurrency(numericAmount)}</td>
            <td style="padding: 15px 12px; text-align: right; font-size: 14px; font-weight: bold;">${formatCurrency(numericAmount)}</td>
          </tr>
        </tbody>
      </table>
      
      <!-- Totals Section -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
        <div style="width: 300px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
            <span style="font-size: 14px; color: #666;">Subtotal:</span>
            <span style="font-size: 14px; font-weight: bold;">${formatCurrency(subtotal)}</span>
          </div>
          ${taxRate > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
            <span style="font-size: 14px; color: #666;">Tax (${(taxRate * 100).toFixed(1)}%):</span>
            <span style="font-size: 14px; font-weight: bold;">${formatCurrency(tax)}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding: 12px 0; margin-top: 10px; border-top: 2px solid #1a1a1a; border-bottom: 2px solid #1a1a1a;">
            <span style="font-size: 18px; font-weight: bold; text-transform: uppercase;">Total Due:</span>
            <span style="font-size: 20px; font-weight: bold;">${formatCurrency(total)}</span>
          </div>
        </div>
      </div>
      
      <!-- Payment Terms -->
      <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e0e0e0;">
        <h3 style="font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; color: #666;">Payment Terms</h3>
        <p style="font-size: 13px; color: #666; line-height: 1.6; margin: 0;">
          Payment is due within 30 days of the invoice date. Please remit payment via the payment link provided below or by bank transfer 
          to the account details specified in your Service Agreement. Late payments may be subject to a 1.5% monthly interest charge.
        </p>
        <p style="font-size: 13px; color: #666; line-height: 1.6; margin: 10px 0 0 0;">
          <strong>Payment Method:</strong> Credit Card, Bank Transfer, or as specified in your Service Agreement.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
        <p style="font-size: 12px; color: #999; margin: 0;">
          Thank you for your business. If you have any questions regarding this invoice, please contact us.
        </p>
      </div>
    </div>
  `;
}
