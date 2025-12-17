/**
 * TypeScript types for Onboarding Flow Builder
 */

export type OnboardingFlowStatus = 'draft' | 'published';

export type OnboardingNodeType = 
  | 'welcome' 
  | 'scope'
  | 'terms' 
  | 'contract' 
  | 'invoice';

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
  // Shared - document file stored in Supabase Storage
  document_file?: DocumentFile;

  // Shared - HTML content (used by welcome, scope, contract)
  html_content?: string;
  
  // Terms node
  terms_url?: string;
  privacy_url?: string;
  checkbox_text?: string;
  
  // Contract node
  signature_required?: boolean;
  signer_role?: string;
  
  // Invoice node
  stripe_url?: string;
  amount_label?: string;
  payment_status?: 'pending' | 'paid' | 'confirmed';
  webhook_secret?: string;
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