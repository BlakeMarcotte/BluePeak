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
  name: string; // Custom name for the content piece (required)
  type: ContentType;
  content: string;
  wordCount?: number;
  characterCount?: number;
  generatedAt: Date;
  pdfData?: PDFOnePagerData; // For pdf-onepager content type
  published?: boolean; // Whether content is visible to client
  variantOfId?: string; // ID of the original content this is a variant of
  variantLabel?: string; // Label like "Original", "Variant A", "Variant B"
  publicVoteId?: string; // Unique ID for public voting link
  votes?: number; // Number of votes this variant received
}

export type PDFTemplate = 'modern-minimal' | 'bold-impact' | 'corporate-professional' | 'creative-geometric';

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
    email: string;
    phone: string;
  };
  template?: PDFTemplate; // Selected template style
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
export type UserRole = 'admin' | 'team_member' | 'client';

export interface User {
  id: string; // Firebase Auth UID
  email: string;
  displayName: string;
  role: UserRole;
  clientId?: string; // Link to Client record if role='client'
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

// Auth Context User (for Firebase Auth)
export interface AuthUser {
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
  logoUrl?: string; // Company logo uploaded during discovery
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

  // Marketing Content
  brandProfile?: BrandProfile; // Analyzed from uploaded logo
  marketingContent?: GeneratedContent[]; // AI-generated marketing materials
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

  // Generated content from Claude
  executiveSummary: string;
  scopeOfWork: string;
  timeline: string;
  pricing: string;
  deliverables: string[];

  // PDF storage
  pdfUrl?: string; // Firebase Storage URL for the generated PDF

  generatedAt: Date;
  proposalMeetingDate?: Date; // When client scheduled the meeting to discuss
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
