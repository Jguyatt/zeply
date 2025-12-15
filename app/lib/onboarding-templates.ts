/**
 * Default onboarding templates
 * Contains the beautiful default contract HTML template
 */

/**
 * Generate a beautiful, professional HTML contract template
 */
export function getDefaultContractHTML(orgName?: string, clientName?: string): string {
  const org = orgName || 'Service Provider';
  const client = clientName || '[Client Name]';
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Service Agreement</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      color: #e5e5e5;
      line-height: 1.8;
      padding: 2rem;
      min-height: 100vh;
    }
    
    .contract-container {
      max-width: 900px;
      margin: 0 auto;
      background: rgba(30, 30, 30, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 3rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }
    
    .contract-header {
      text-align: center;
      border-bottom: 2px solid rgba(139, 92, 246, 0.3);
      padding-bottom: 2rem;
      margin-bottom: 2rem;
    }
    
    .contract-header h1 {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 2.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
      letter-spacing: -0.02em;
    }
    
    .contract-header .org-name {
      font-size: 1.25rem;
      color: #a0a0a0;
      font-weight: 500;
    }
    
    .contract-section {
      margin-bottom: 2.5rem;
    }
    
    .contract-section h2 {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 1.5rem;
      color: #8b5cf6;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(139, 92, 246, 0.2);
      font-weight: 600;
    }
    
    .contract-section h3 {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 1.2rem;
      color: #d4d4d4;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      font-weight: 600;
    }
    
    .contract-section p {
      margin-bottom: 1rem;
      color: #c0c0c0;
      text-align: justify;
    }
    
    .contract-section ul, .contract-section ol {
      margin-left: 2rem;
      margin-bottom: 1rem;
      color: #c0c0c0;
    }
    
    .contract-section li {
      margin-bottom: 0.5rem;
    }
    
    .highlight-box {
      background: rgba(139, 92, 246, 0.1);
      border-left: 4px solid #8b5cf6;
      padding: 1.5rem;
      margin: 1.5rem 0;
      border-radius: 8px;
    }
    
    .signature-section {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 2px solid rgba(255, 255, 255, 0.1);
    }
    
    .signature-line {
      margin-top: 3rem;
      display: flex;
      justify-content: space-between;
    }
    
    .signature-block {
      width: 45%;
    }
    
    .signature-line-element {
      border-bottom: 2px solid rgba(255, 255, 255, 0.3);
      padding-bottom: 0.5rem;
      margin-bottom: 0.5rem;
    }
    
    .date {
      color: #888;
      font-size: 0.9rem;
    }
    
    @media print {
      body {
        background: white;
        color: black;
      }
      
      .contract-container {
        background: white;
        border: none;
        box-shadow: none;
      }
      
      .contract-header h1 {
        -webkit-text-fill-color: black;
      }
      
      .contract-section h2 {
        color: black;
      }
    }
  </style>
</head>
<body>
  <div class="contract-container">
    <div class="contract-header">
      <h1>SERVICE AGREEMENT</h1>
      <div class="org-name">${org}</div>
    </div>
    
    <div class="contract-section">
      <p><strong>Effective Date:</strong> ${date}</p>
    </div>
    
    <div class="contract-section">
      <h2>1. Parties</h2>
      <p>
        This Service Agreement ("Agreement") is entered into between <strong>${org}</strong> 
        ("Service Provider") and <strong>${client}</strong> ("Client") on the Effective Date set forth above.
      </p>
    </div>
    
    <div class="contract-section">
      <h2>2. Services</h2>
      <p>
        Service Provider agrees to provide the following services ("Services") to Client:
      </p>
      <ul>
        <li>Professional marketing and advertising services</li>
        <li>Strategic consultation and planning</li>
        <li>Content creation and campaign management</li>
        <li>Performance reporting and analysis</li>
      </ul>
      <p>
        The specific scope of Services will be detailed in separate statements of work 
        or project briefs, which shall be incorporated into this Agreement by reference.
      </p>
    </div>
    
    <div class="contract-section">
      <h2>3. Term and Termination</h2>
      <p>
        This Agreement shall commence on the Effective Date and shall continue until 
        terminated by either party in accordance with the terms herein.
      </p>
      <p>
        Either party may terminate this Agreement with thirty (30) days written notice. 
        Upon termination, Service Provider shall complete all work in progress and 
        deliver all completed work product to Client.
      </p>
    </div>
    
    <div class="contract-section">
      <h2>4. Payment Terms</h2>
      <div class="highlight-box">
        <p>
          Client agrees to pay Service Provider in accordance with the payment schedule 
          set forth in the applicable statement of work. Payments are due within thirty (30) 
          days of invoice date unless otherwise specified.
        </p>
      </div>
      <p>
        Late payments may incur a service charge of 1.5% per month on the outstanding balance. 
        Service Provider reserves the right to suspend Services for non-payment.
      </p>
    </div>
    
    <div class="contract-section">
      <h2>5. Obligations of the Parties</h2>
      
      <h3>5.1 Service Provider Obligations</h3>
      <ul>
        <li>Perform Services with professional skill and care</li>
        <li>Provide regular updates and reports as agreed</li>
        <li>Maintain confidentiality of Client information</li>
        <li>Comply with all applicable laws and regulations</li>
      </ul>
      
      <h3>5.2 Client Obligations</h3>
      <ul>
        <li>Provide timely feedback and approvals</li>
        <li>Supply necessary information and materials</li>
        <li>Make payments in accordance with payment terms</li>
        <li>Cooperate in good faith with Service Provider</li>
      </ul>
    </div>
    
    <div class="contract-section">
      <h2>6. Intellectual Property</h2>
      <p>
        Upon full payment, Client shall own all final work product created specifically 
        for Client under this Agreement. Service Provider retains the right to use 
        methodologies, processes, and general knowledge gained in performance of Services.
      </p>
    </div>
    
    <div class="contract-section">
      <h2>7. Confidentiality</h2>
      <p>
        Both parties agree to maintain the confidentiality of all proprietary and 
        confidential information disclosed during the course of this Agreement. 
        This obligation shall survive termination of this Agreement.
      </p>
    </div>
    
    <div class="contract-section">
      <h2>8. Limitation of Liability</h2>
      <p>
        Service Provider's liability for any claims arising out of this Agreement 
        shall not exceed the total fees paid by Client under this Agreement in the 
        twelve (12) months preceding the claim.
      </p>
    </div>
    
    <div class="contract-section">
      <h2>9. Governing Law</h2>
      <p>
        This Agreement shall be governed by and construed in accordance with the laws 
        of the jurisdiction in which Service Provider is located, without regard to 
        conflict of law principles.
      </p>
    </div>
    
    <div class="contract-section">
      <h2>10. Entire Agreement</h2>
      <p>
        This Agreement constitutes the entire agreement between the parties and 
        supersedes all prior negotiations, representations, or agreements relating 
        to the subject matter herein.
      </p>
    </div>
    
    <div class="signature-section">
      <h2>Signatures</h2>
      <p>
        By signing below, both parties acknowledge that they have read, understood, 
        and agree to be bound by the terms and conditions of this Agreement.
      </p>
      
      <div class="signature-line">
        <div class="signature-block">
          <div class="signature-line-element">
            <strong>${org}</strong>
          </div>
          <div class="signature-line-element date">Date: _______________</div>
          <div class="signature-line-element">Signature: _______________</div>
          <div class="signature-line-element">Printed Name: _______________</div>
        </div>
        
        <div class="signature-block">
          <div class="signature-line-element">
            <strong>${client}</strong>
          </div>
          <div class="signature-line-element date">Date: _______________</div>
          <div class="signature-line-element">Signature: _______________</div>
          <div class="signature-line-element">Printed Name: _______________</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

