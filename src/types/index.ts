// Content Types
export interface ContentRequest {
  id?: string;
  topic: string;
  targetIndustry: string;
  brandVoice?: string;
  campaignType: 'blog' | 'social' | 'email' | 'ads' | 'full-campaign';
  createdAt?: Date;
  userId?: string;
}

export interface GeneratedContent {
  id?: string;
  requestId: string;
  contentType: 'blog' | 'linkedin' | 'twitter' | 'email' | 'ad-copy';
  title?: string;
  content: string;
  createdAt?: Date;
  userId?: string;
}

export interface Campaign {
  id?: string;
  title: string;
  topic: string;
  targetIndustry: string;
  contents: GeneratedContent[];
  createdAt?: Date;
  userId?: string;
}

// User Types
export interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}
