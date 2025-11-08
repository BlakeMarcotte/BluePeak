# BluePeak Marketing - AI-Powered Client Onboarding System

## Project Overview
BluePeak Marketing is a hackathon project built for the Claude Hackathon Challenge. It's a full-stack Next.js application that helps marketing agencies automate client onboarding, proposal generation, and progress reporting using Claude AI.

**Hackathon Focus**: Problem Area 3 - Client Onboarding & Communication

## Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **AI**: Anthropic Claude API (Claude 3 Sonnet)
- **Database**: Firebase Firestore (via Firebase Admin SDK)
- **Authentication**: Firebase Auth

## Key Features

### 1. Client Management (`/clients`)
- Full CRUD operations for clients
- Search and filter by name, company, industry, stage
- Stats dashboard showing metrics
- Firebase persistence

### 2. Client Onboarding Pipeline (`/client-onboarding`)
- Visual progress tracker with 7 stages:
  1. Client Added → 2. Discovery Sent → 3. Discovery Complete → 4. Meeting Scheduled → 5. Proposal Generated → 6. Proposal Sent → 7. Accepted
- Contextual action buttons based on current stage
- Quick "Add Client" modal
- Progress Reports tab with AI report generator

### 3. Client Portal (`/portal/[linkId]`)
- Public-facing discovery questionnaire
- AI-powered conversation with Claude
- Unique link per client (no login required)
- Completion screen with next steps

### 4. Marketing Content Generator (`/marketing`)
- Multi-channel content creation
- Brand analysis from logos/screenshots
- AI-generated content for blog, social, email, ads

### 5. Progress Report Generator
- Transform raw data into professional narratives
- Three tone options: Formal, Casual, Detailed
- Copy to clipboard functionality

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── clients/          # Client CRUD endpoints
│   │   ├── discovery-chat/   # AI discovery conversation
│   │   ├── generate-proposal/ # Proposal generation
│   │   ├── generate-report/  # Progress report generation
│   │   ├── analyze-brand/    # Brand analysis
│   │   └── generate-content/ # Marketing content
│   ├── clients/              # Client management page
│   ├── client-onboarding/    # Pipeline management
│   ├── portal/[linkId]/      # Client-facing portal
│   ├── marketing/            # Content generation
│   ├── dashboard/            # Main dashboard
│   ├── login/                # Auth pages
│   └── signup/
├── components/
│   ├── AddClientModal.tsx    # Client creation modal
│   ├── DiscoveryChat.tsx     # AI chat interface
│   ├── OnboardingPipeline.tsx # Progress tracker
│   ├── ProposalDisplay.tsx   # Proposal viewer
│   ├── ProgressReportGenerator.tsx
│   ├── CampaignForm.tsx      # Marketing campaign form
│   ├── Navbar.tsx
│   └── ProtectedRoute.tsx
├── lib/
│   ├── firebase.ts           # Client-side Firebase
│   └── firebaseAdmin.ts      # Server-side Firebase Admin
├── types/
│   └── index.ts              # TypeScript definitions
└── contexts/
    └── AuthContext.tsx       # Authentication context
```

## Important Implementation Details

### Phone Number Formatting
Phone inputs auto-format to `(xxx) xxx-xxxx` as users type. The logic strips non-digits and formats in real-time.

### Date Handling
**Critical**: Firebase returns dates as strings in JSON. Always convert them back to Date objects:
```typescript
createdAt: new Date(client.createdAt)
updatedAt: new Date(client.updatedAt)
meetingDate: client.meetingDate ? new Date(client.meetingDate) : undefined
```

### Modal Styling
All modals use:
- Semi-transparent backdrop: `bg-black/50`
- Visible input text: `text-gray-900`
- Light placeholder text: `placeholder:text-gray-400`

### Discovery Chat
- Initial assistant message is filtered out before sending to API (Anthropic requires user-first)
- Uses Claude 3 Sonnet model: `claude-3-sonnet-20240229`
- System prompt guides conversation to gather client info

### Firebase Collections

**clients** collection:
```typescript
{
  id: string
  name: string
  email: string
  company: string
  industry?: string
  phone?: string
  onboardingStage: OnboardingStage
  discoveryLinkId: string (unique portal link)
  discoveryData?: DiscoveryData
  conversationHistory?: DiscoveryMessage[]
  proposalId?: string
  meetingDate?: Date
  createdAt: Date
  updatedAt: Date
  userId: string
}
```

## Environment Variables

Required in `.env.local`:
```bash
# Firebase Client Config
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Anthropic API
ANTHROPIC_API_KEY=

# Firebase Admin SDK
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

## Common Development Tasks

### Adding a New API Route
1. Create file in `src/app/api/[route-name]/route.ts`
2. Use `NextRequest` and `NextResponse`
3. Import Firebase Admin or Anthropic SDK as needed
4. Handle errors with try/catch and return appropriate status codes

### Adding a New Client Field
1. Update type in `src/types/index.ts`
2. Update API route in `src/app/api/clients/route.ts`
3. Update form in `AddClientModal.tsx`
4. Update display in client list/pipeline components

### Fixing Input Text Color Issues
Always include these Tailwind classes on inputs:
```
text-gray-900 placeholder:text-gray-400
```

## Known Issues & Workarounds

### Model Version Compatibility
If you get "model not found" errors:
- Try `claude-3-sonnet-20240229` (stable Claude 3 Sonnet)
- Check if API key has access to Claude 3.5 models
- Verify Anthropic SDK version: `@anthropic-ai/sdk@0.68.0`

### Date Serialization
Firebase Admin converts Dates to Firestore Timestamps, which serialize to strings in JSON. Always convert back to Date objects on the client.

## Testing the App

1. **Client Creation Flow**:
   - Go to `/clients` or `/client-onboarding`
   - Click "Add Client"
   - Fill form with auto-formatted phone
   - Client saves to Firebase
   - Appears on both pages

2. **Onboarding Pipeline**:
   - Create client → "Send Discovery Link"
   - Copy portal URL
   - Open in incognito: `/portal/[linkId]`
   - Complete AI chat
   - Return to onboarding page
   - Progress through stages

3. **Progress Reports**:
   - Go to "Progress Reports" tab
   - Fill in tasks, metrics, deliverables
   - Select tone
   - Generate report with Claude
   - Copy to clipboard

## Deployment Notes

- Firebase Admin requires service account credentials
- Keep `bluepeak-23105-firebase-adminsdk-*.json` file secure (in `.gitignore`)
- Anthropic API key should be server-side only (not `NEXT_PUBLIC_`)
- Build command: `npm run build`
- Dev server: `npm run dev`

## Hackathon Value Proposition

**Time Savings**:
- Discovery calls: Automated, consistent → 30 min saved per call
- Proposal creation: 3-5 hours → 2 minutes
- Progress reports: 2-3 hours/week → 5 minutes

**Scalability**:
- Account managers can handle 2x more clients
- Consistent quality across all proposals
- Never miss important client information

**Client Experience**:
- Faster response times
- More professional, polished materials
- More frequent, higher-quality communication
