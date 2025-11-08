// Content Types
export type ContentType = 'blog' | 'linkedin' | 'twitter' | 'email' | 'ad-copy';

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
  contentTypes: ContentType[];
}

export interface GeneratedContent {
  type: ContentType;
  content: string;
  wordCount?: number;
  characterCount?: number;
  generatedAt: Date;
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
