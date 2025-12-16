/**
 * TypeScript types for Onboarding Flow Builder
 */

export type OnboardingFlowStatus = 'draft' | 'published';

export type OnboardingNodeType = 
  | 'welcome' 
  | 'payment' 
  | 'contract' 
  | 'consent' 
  | 'upload' 
  | 'connect' 
  | 'call';

export type OnboardingProgressStatus = 'pending' | 'completed';

export interface OnboardingFlow {
  id: string;
  org_id: string;
  name: string;
  status: OnboardingFlowStatus;
  version: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentFile {
  name?: string;
  type?: string;
  url?: string;
  data?: string;
  filename?: string;
}

export interface NodeConfig {
  // Shared
  document_file?: DocumentFile;

  // Welcome node
  html_content?: string;
  attachments?: string[];
  
  // Payment node
  stripe_url?: string;
  amount_label?: string;
  
  // Contract node
  signature_required?: boolean;
  signer_role?: string;
  
  // Consent node
  privacy_url?: string;
  terms_url?: string;
  checkbox_text?: string;
  
  // Upload node
  allowed_types?: string[];
  max_size?: number;
  
  // Connect node
  service_type?: string;
  connection_url?: string;
  
  // Call node
  calendar_url?: string;
  duration?: number;
}

export interface OnboardingNode {
  id: string;
  flow_id: string;
  type: OnboardingNodeType;
  title: string;
  description: string | null;
  required: boolean;
  config: NodeConfig;
  position: { x: number; y: number };
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface OnboardingEdge {
  id: string;
  flow_id: string;
  source_node_id: string;
  target_node_id: string;
  condition: Record<string, unknown> | null;
  created_at: string;
}

export interface OnboardingProgress {
  id: string;
  org_id: string;
  user_id: string;
  node_id: string;
  status: OnboardingProgressStatus;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ContractSignature {
  id: string;
  org_id: string;
  user_id: string;
  node_id: string;
  signed_name: string;
  signature_image_url: string;
  contract_sha256: string | null;
  terms_version: string | null;
  privacy_version: string | null;
  ip: string | null;
  user_agent: string | null;
  signed_at: string;
}

export interface OnboardingFlowWithNodes extends OnboardingFlow {
  nodes: OnboardingNode[];
  edges: OnboardingEdge[];
}