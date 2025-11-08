# BluePeak Marketing - AI-Powered Client Onboarding System

## Project Overview
BluePeak Marketing is a hackathon project built for the Claude Hackathon Challenge. It's a full-stack Next.js application that helps marketing agencies automate client onboarding, proposal generation, and progress reporting using Claude AI.

**Hackathon Focus**: Problem Area 3 - Client Onboarding & Communication

**New in v2.0**: Full customer portal with authentication, allowing clients to create accounts, view proposals, and access their marketing materials after completing discovery.

## Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **AI**: Anthropic Claude API (Claude 3.5 Haiku for discovery, Claude 3 Sonnet for generation)
- **Database**: Firebase Firestore (via Firebase Admin SDK)
- **Authentication**: Firebase Auth (for both internal team and client portal)

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

### 3. Client Portal Discovery (`/portal/[linkId]`)
- **Smart Discovery Flow**:
  - First visit: AI-powered conversation with Claude 3.5 Haiku
  - Already completed: Shows account creation or login options
  - Prevents re-filling questionnaire
- **Account Creation**:
  - Post-discovery signup prompt
  - Email pre-filled from client record
  - Password validation (min 6 characters)
  - Creates Firebase Auth user linked to client
- **Status Detection**:
  - Checks if discovery already complete via linkId
  - Detects existing account to show appropriate UI
  - Loading state during status check

### 4. Customer Portal (`/client-portal/*`)
- **Login** (`/client-portal/login`):
  - Email/password authentication
  - Success message after account creation
  - Error handling for invalid credentials
- **Dashboard** (`/client-portal/dashboard`):
  - Protected route requiring authentication
  - Onboarding status card (discovery, proposal, kickoff)
  - Company information display
  - Quick actions (view proposal, content library, analytics)
  - Proposal section with "In Progress" placeholder
  - Content library placeholder for marketing materials
  - Logout functionality

### 5. Marketing Content Generator (`/marketing`)
- Multi-channel content creation
- Brand analysis from logos/screenshots
- AI-generated content for blog, social, email, ads

### 6. Progress Report Generator
- Transform raw data into professional narratives
- Three tone options: Formal, Casual, Detailed
- Copy to clipboard functionality

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── clients/            # Client CRUD endpoints
│   │   │   └── [id]/route.ts   # Fetch individual client (by ID or linkId)
│   │   ├── client-auth/        # Customer portal authentication
│   │   │   ├── signup/         # Account creation after discovery
│   │   │   └── profile/        # Fetch client by Firebase Auth UID
│   │   ├── discovery-chat/     # AI discovery conversation (Claude 3.5 Haiku)
│   │   ├── generate-proposal/  # Proposal generation
│   │   ├── generate-report/    # Progress report generation
│   │   ├── analyze-brand/      # Brand analysis
│   │   └── generate-content/   # Marketing content
│   ├── clients/                # Internal: Client management page
│   ├── client-onboarding/      # Internal: Pipeline management
│   ├── client-portal/          # Customer-facing portal (authenticated)
│   │   ├── login/              # Client login
│   │   └── dashboard/          # Client dashboard
│   ├── portal/[linkId]/        # Public discovery questionnaire
│   ├── marketing/              # Internal: Content generation
│   ├── dashboard/              # Internal: Main dashboard
│   ├── login/                  # Internal team auth
│   └── signup/                 # Internal team auth
├── components/
│   ├── AddClientModal.tsx      # Client creation modal
│   ├── DiscoveryChat.tsx       # AI chat interface
│   ├── OnboardingPipeline.tsx  # Progress tracker
│   ├── ProposalDisplay.tsx     # Proposal viewer
│   ├── ProgressReportGenerator.tsx
│   ├── CampaignForm.tsx        # Marketing campaign form
│   ├── Navbar.tsx
│   └── ProtectedRoute.tsx
├── lib/
│   ├── firebase.ts             # Client-side Firebase
│   └── firebaseAdmin.ts        # Server-side Firebase Admin
├── types/
│   └── index.ts                # TypeScript definitions
└── contexts/
    └── AuthContext.tsx         # Authentication context (internal team)
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

### Discovery Chat & Customer Portal Flow

**Discovery Chat**:
- Uses Claude 3.5 Haiku model: `claude-3-5-haiku-20241022`
- Initial assistant message is filtered out before sending to API (Anthropic requires user-first)
- System prompt guides conversation to gather 8 key pieces of information
- Completion detected via specific phrases in Claude's response:
  - "that's everything we need"
  - "get back to you shortly"
  - "our team at bluepeak will review"

**Smart Portal Flow**:
```
1. Client receives discovery link: /portal/[linkId]
2. On first visit:
   - Shows discovery chat interface
   - Completes questionnaire
   - Data saved to Firebase (discoveryData, conversationHistory)
   - onboardingStage → 'discovery_complete'
3. On revisit (same link):
   - Checks client.onboardingStage via linkId
   - If discovery complete: Shows account creation prompt
   - If has account: Shows login redirect
4. Account creation:
   - Email pre-filled from client record
   - Creates Firebase Auth user
   - Links via firebaseAuthUid
   - Sets hasAccount = true
5. Login & Dashboard:
   - Authenticates with Firebase Auth
   - Fetches client data via UID
   - Shows personalized dashboard
```

**Authentication Architecture**:
- Internal team: `/login`, `/signup` → Uses AuthContext
- Clients: `/client-portal/login` → Uses Firebase Auth directly
- Client record links: `firebaseAuthUid` field connects Auth user to Client document

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
  discoveryLinkId: string            // Unique portal link (e.g., "anm66g")
  discoveryData?: DiscoveryData      // Extracted structured data
  conversationHistory?: DiscoveryMessage[]  // Full chat transcript
  proposal?: ClientProposal          // Generated proposal
  proposalId?: string
  meetingDate?: Date
  createdAt: Date
  updatedAt: Date
  userId: string                     // BluePeak team member who created

  // Customer Portal Auth Fields (v2.0)
  hasAccount: boolean                // Has client created portal account?
  firebaseAuthUid?: string           // Firebase Auth UID (links to Auth user)
  accountCreatedAt?: Date            // When portal account was created
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
Current models in use:
- **Discovery Chat**: `claude-3-5-haiku-20241022` (Claude 3.5 Haiku - fast, cost-effective)
- **Proposal/Report Generation**: `claude-3-sonnet-20240229` (Claude 3 Sonnet - more capable)

If you get "model not found" errors:
- Haiku alternative: `claude-3-haiku-20240307`
- Sonnet alternative: `claude-3-5-sonnet-20240620`
- Check API key has access to desired models
- Verify Anthropic SDK version: `@anthropic-ai/sdk@0.68.0`

### Next.js 16 - useSearchParams Requirement
Components using `useSearchParams()` must be wrapped in `<Suspense>`:
```typescript
export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ComponentUsingSearchParams />
    </Suspense>
  );
}
```
See: `/client-portal/login/page.tsx` for implementation example

### Date Serialization
Firebase Admin converts Dates to Firestore Timestamps, which serialize to strings in JSON. Always convert back to Date objects on the client.

### Account Creation Errors
If client sees "Email already exists" but hasn't created account:
- Check if email is already registered in Firebase Auth console
- Client may have started signup but not completed
- Admin can delete the Firebase Auth user to allow re-registration

## Testing the App

1. **Client Creation Flow**:
   - Go to `/clients` or `/client-onboarding`
   - Click "Add Client"
   - Fill form with auto-formatted phone
   - Client saves to Firebase with `hasAccount: false`
   - Appears on both pages

2. **Full Onboarding Pipeline with Customer Portal**:
   ```
   Step 1: Create Client
   - `/client-onboarding` → "Add Client"
   - Fill: name, email, company, industry
   - Client created with unique discoveryLinkId

   Step 2: Send Discovery Link
   - Click "Send Discovery Link" button
   - Copy URL: /portal/[linkId]
   - Link copied to clipboard
   - Client stage: 'created' → 'discovery_sent'

   Step 3: Client Completes Discovery
   - Open link in incognito window
   - AI chat interface appears (Claude 3.5 Haiku)
   - Answer ~7-10 questions
   - Chat detects completion automatically
   - Data saved to Firebase
   - Client stage: 'discovery_sent' → 'discovery_complete'

   Step 4: Client Creates Account
   - After discovery: "Create Free Account" button appears
   - Click button → Signup form
   - Email pre-filled (from client record)
   - Enter password (min 6 chars)
   - Account created in Firebase Auth
   - Client record updated: hasAccount = true, firebaseAuthUid set
   - Redirect to /client-portal/login

   Step 5: Client Logs In
   - Enter email/password
   - Success: Redirect to /client-portal/dashboard
   - See onboarding status, company info, proposal placeholder

   Step 6: Revisit Discovery Link
   - Open /portal/[linkId] again
   - Shows "Discovery Complete!" screen
   - Options: "Go to Login" (if has account) or "Create Account"
   - Never shows chat interface again
   ```

3. **Progress Reports**:
   - Go to "Progress Reports" tab
   - Fill in tasks, metrics, deliverables
   - Select tone
   - Generate report with Claude
   - Copy to clipboard

## API Routes Reference

### Client Management
- `GET /api/clients` - Fetch all clients (optional userId filter)
- `POST /api/clients` - Create new client
- `PUT /api/clients` - Update existing client
- `DELETE /api/clients` - Delete client
- `GET /api/clients/[id]` - Fetch individual client
  - By ID: `/api/clients/abc123`
  - By linkId: `/api/clients/anm66g?byLinkId=true`

### Customer Portal Authentication
- `POST /api/client-auth/signup`
  - Creates Firebase Auth user
  - Links to Client record via firebaseAuthUid
  - Validates email matches client record
  - Prevents duplicate accounts
  - **Body**: `{ email, password, linkId }`
  - **Returns**: `{ success, uid }`

- `GET /api/client-auth/profile?uid=[firebaseAuthUid]`
  - Fetches client data by Firebase Auth UID
  - Used by client dashboard after login
  - Converts Firebase Timestamps to Date objects
  - **Returns**: `{ client: Client }`

### AI Endpoints
- `POST /api/discovery-chat`
  - AI-powered discovery conversation
  - Model: Claude 3.5 Haiku
  - **Body**: `{ messages: Array<{role, content}> }`
  - **Returns**: `{ message: string, isComplete: boolean }`

- `POST /api/generate-proposal`
  - Generate proposal from discovery data
  - Model: Claude 3 Sonnet
  - **Body**: `{ clientName, discoveryData }`

- `POST /api/generate-report`
  - Generate progress report
  - Model: Claude 3 Sonnet
  - **Body**: `{ reportData, tone }`

### Marketing Content
- `POST /api/analyze-brand` - Extract brand info from images
- `POST /api/generate-content` - Create multi-channel content

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

**Client Experience** (v2.0 Enhancement):
- **Self-service portal**: 24/7 access to proposals and marketing materials
- **Faster response times**: Discovery → Account → Proposal in hours, not days
- **Transparency**: Real-time onboarding status visibility
- **Professional experience**: Modern, branded portal interface
- **Ownership**: Clients have their own dashboard with all materials in one place

## v2.0 Updates - Customer Portal

**What's New**:
1. ✅ **Customer Authentication System**
   - Post-discovery account creation
   - Firebase Auth integration
   - Secure password-based login
   - Email validation against client records

2. ✅ **Smart Discovery Link Behavior**
   - Detects if questionnaire already completed
   - Shows account creation prompt for completed discoveries
   - Prevents duplicate submissions
   - Seamless account creation flow

3. ✅ **Client Dashboard**
   - Onboarding progress tracking
   - Company information display
   - Proposal viewing (ready for generation)
   - Content library placeholder
   - Analytics access (coming soon)

4. ✅ **Enhanced Discovery Chat**
   - Upgraded to Claude 3.5 Haiku (faster, more cost-effective)
   - Improved completion detection
   - Better messaging about next steps
   - Full conversation history saved

**Technical Achievements**:
- Next.js 16 compatibility (Suspense boundaries)
- Firebase Auth + Firestore integration
- Secure authentication flow
- Smart state detection and conditional rendering
- Responsive, modern UI with Tailwind CSS 4

**What's Next** (Pending):
- [ ] Proposal generation from discovery data
- [ ] Content library population
- [ ] Analytics dashboard
- [ ] Email notifications for status changes
