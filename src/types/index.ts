// Content Types
export type ContentType = 'blog' | 'linkedin' | 'twitter' | 'email' | 'ad-copy' | 'pdf-onepager';

export interface BrandProfile {
  colors: string[];
  style: string;
  personality: string[];
  tone: string;
}

export interface CampaignFormData {
  clientName: string;
  industry: string;
  topic: string;
  targetAudience: string;
  brandVoice?: string;
}

export interface GeneratedContent {
  id?: string;
  type: ContentType;
  content: string;
  wordCount?: number;
  characterCount?: number;
  generatedAt: Date;
  pdfData?: PDFOnePagerData; // For pdf-onepager content type
}

export interface PDFOnePagerData {
  headline: string;
  subheadline: string;
  keyBenefits: string[];
  stats: {
    value: string;
    label: string;
  }[];
  callToAction: string;
  contactInfo: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

export interface Campaign {
  id?: string;
  clientName: string;
  industry: string;
  topic: string;
  targetAudience: string;
  brandVoice?: string;
  logoUrl?: string;
  screenshotUrl?: string;
  brandProfile?: BrandProfile;
  contents: GeneratedContent[];
  userId: string;
  createdAt: Date;
}

// User Types
export interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

// Client Management Types
export type OnboardingStage =
  | 'created'           // Step 1: Client just added
  | 'discovery_sent'    // Step 2: Discovery questionnaire sent
  | 'discovery_complete' // Step 3: Client completed discovery
  | 'meeting_scheduled' // Step 4: Proposal meeting scheduled
  | 'proposal_generated' // Step 5: Proposal created
  | 'proposal_sent'     // Step 6: Proposal sent to client
  | 'proposal_accepted' // Step 7: Client accepted
  | 'completed';        // Onboarding complete

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  industry?: string;
  phone?: string;
  onboardingStage: OnboardingStage;
  discoveryLinkId?: string; // Unique ID for client portal access
  discoveryData?: DiscoveryData;
  conversationHistory?: DiscoveryMessage[];
  proposalId?: string;
  proposal?: ClientProposal;
  meetingDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string; // BluePeak team member who added them

  // Client Portal Auth Fields
  hasAccount: boolean; // Has the client created a portal account?
  firebaseAuthUid?: string; // Firebase Auth UID when client creates account
  accountCreatedAt?: Date; // When they created their portal account
}

// Client Onboarding Types
export interface DiscoveryMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

export interface DiscoveryData {
  companyName?: string;
  industry?: string;
  businessGoals?: string;
  targetAudience?: string;
  currentChallenges?: string;
  budget?: string;
  timeline?: string;
  servicesNeeded?: string[];
  additionalInfo?: string;
}

export interface ClientProposal {
  id?: string;
  clientId?: string;
  clientName: string;
  discoveryData: DiscoveryData;
  executiveSummary: string;
  scopeOfWork: string;
  timeline: string;
  pricing: string;
  deliverables: string[];
  generatedAt: Date;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
}

export interface ProgressReportData {
  clientId: string;
  clientName: string;
  reportPeriod: string;
  completedTasks: string[];
  metrics: {
    label: string;
    value: string;
  }[];
  upcomingDeliverables: string[];
  blockers?: string;
  highlights?: string;
}

export interface GeneratedReport {
  id?: string;
  clientId: string;
  reportData: ProgressReportData;
  generatedContent: string;
  tone: 'formal' | 'casual' | 'detailed';
  generatedAt: Date;
}
