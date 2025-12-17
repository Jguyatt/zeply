import { NodeConfig } from '@/app/types/onboarding';

export interface NodeCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
}

/**
 * Check if a node is complete based on its type and config
 */
export function checkNodeCompletion(
  nodeType: string,
  config: NodeConfig,
  title?: string
): NodeCompletionStatus {
  const missingFields: string[] = [];

  // Title is always required
  if (!title || title.trim() === '') {
    missingFields.push('Title');
  }

  switch (nodeType) {
    case 'welcome':
      // Welcome page needs HTML content
      if (!config.html_content || config.html_content.trim() === '') {
        missingFields.push('Welcome content');
      }
      break;

    case 'scope':
      // Scope of Services needs HTML content
      if (!config.html_content || config.html_content.trim() === '') {
        missingFields.push('Scope content');
      }
      break;

    case 'terms':
      // Terms & Privacy needs both URLs and checkbox text
      if (!config.terms_url || config.terms_url.trim() === '') {
        missingFields.push('Terms URL');
      }
      if (!config.privacy_url || config.privacy_url.trim() === '') {
        missingFields.push('Privacy URL');
      }
      if (!config.checkbox_text || config.checkbox_text.trim() === '') {
        missingFields.push('Checkbox text');
      }
      break;

    case 'contract':
      // Contract needs HTML content that's been customized
      // Check if html_content exists and is not just whitespace
      const htmlContent = config.html_content || '';
      const trimmedContent = htmlContent.trim();
      
      if (!trimmedContent) {
        missingFields.push('Contract content');
      } else {
        // Check if it's just the default template
        // Default template contains specific placeholder text patterns
        const hasDefaultTemplatePatterns = 
          trimmedContent.includes('Service Provider') && 
          trimmedContent.includes('This Service Agreement') &&
          trimmedContent.includes('as outlined in the Scope of Services document') &&
          trimmedContent.includes('Payment terms and amounts will be as specified');
        
        // If it matches the default template exactly, require customization
        if (hasDefaultTemplatePatterns) {
          missingFields.push('Customize contract content');
        }
      }
      break;

    case 'invoice':
      // Invoice needs Stripe URL and amount label
      if (!config.stripe_url || config.stripe_url.trim() === '') {
        missingFields.push('Stripe payment URL');
      }
      if (!config.amount_label || config.amount_label.trim() === '') {
        missingFields.push('Amount label');
      }
      break;

    default:
      // Unknown node type - consider incomplete
      missingFields.push('Unknown node type');
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Get a user-friendly message about what's missing
 */
export function getCompletionMessage(status: NodeCompletionStatus): string {
  if (status.isComplete) {
    return 'Complete';
  }
  return `Missing: ${status.missingFields.join(', ')}`;
}

