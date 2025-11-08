# BluePeak Marketing - Comprehensive Dual-Role Architecture Analysis

## Executive Summary

BluePeak Marketing implements a sophisticated dual-role system that seamlessly connects internal team members and external clients through a unified Firebase authentication and Firestore database infrastructure. The architecture creates two distinct user journeys while maintaining a single technological backbone, enabling agencies to manage client onboarding pipelines while clients independently access their portal.

---

## 1. DUAL-ROLE SYSTEM OVERVIEW

### 1.1 Role Definitions

**Role 1: Internal Team Members**
- Email/password authentication
- Access to internal dashboard, client management, proposal generation
- Protected routes requiring AuthContext authentication
- Can create clients, send discovery links, generate proposals
- Share Firebase Auth pool with clients but distinguished by role

**Role 2: Clients (External)**
- Self-service account creation post-discovery
- Email/password authentication (same Firebase Auth pool)
- Access to client portal with personalized dashboard
- View onboarding status, proposals, marketing materials
- Distinguished by client record in Firestore

### 1.2 Distinguishing Mechanism

The system uses a clever **role detection mechanism** based on Firestore collections:

```
Firebase Auth (Unified)
├── Internal Team: Auth user with role='team_member' in users collection
├── Clients: Auth user with role='client' in users collection
└── Cross-reference: Client record links to firebaseAuthUid
```

When logging in, the system:
1. Attempts Firebase Auth sign-in
2. Checks `/api/client-auth/profile?uid={firebaseAuthUid}` (returns 404 if not a client)
3. Routes based on response:
   - 404 → Internal team member → `/dashboard`
   - 200 → Client account → `/client-portal/dashboard`

---

## 2. DATA MODEL & DATABASE SCHEMA

### 2.1 Firestore Collections

#### Collection: `clients`
```typescript
{
  id: string                          // Firestore document ID
  name: string                        // Contact person name
  email: string                       // Primary email (pre-filled in signup)
  company: string                     // Company name
  industry?: string                   // Industry classification
  phone?: string                      // Formatted phone number
  
  // Onboarding Pipeline
  onboardingStage: OnboardingStage    // Current stage (created → discovery_sent → ... → proposal_accepted)
  discoveryLinkId?: string            // Unique 6-char ID for public portal link
  discoveryData?: DiscoveryData       // Extracted from AI conversation
  conversationHistory?: DiscoveryMessage[] // Full chat transcript
  logoUrl?: string                    // Company logo from discovery
  proposal?: ClientProposal           // Generated marketing proposal
  proposalId?: string                 // Reference to proposal document
  meetingDate?: Date                  // Scheduled proposal meeting
  
  // Customer Portal Auth Fields (v2.0)
  hasAccount: boolean                 // Has client created portal account?
  firebaseAuthUid?: string            // Links to Firebase Auth user (clientId in users collection)
  accountCreatedAt?: Date             // When they created account
  
  // Audit Trail
  createdAt: Date                     // When team member added client
  updatedAt: Date                     // Last update timestamp
  userId: string                      // Internal team member who created
}
```

#### Collection: `users`
```typescript
{
  id: string                          // Firebase Auth UID
  email: string                       // Email address
  displayName: string                 // User's display name
  role: 'admin' | 'team_member' | 'client'
  clientId?: string                   // If role='client', references clients collection ID
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date                  // Track login activity
}
```

### 2.2 Key Linking Mechanism

**The connection between roles:**
```
Firebase Auth User (UID: abc123)
        ↓
        └─→ users.id = abc123
            ├─ role: 'client'
            └─ clientId: 'xyz789'
                    ↓
                    └─→ clients.id = 'xyz789'
                        └─ firebaseAuthUid: 'abc123'
                        └─ email: 'john@company.com'
```

This bidirectional linking enables:
- Quick lookup: Auth UID → Client profile
- Reverse lookup: Client ID → Auth user
- Role-based routing: Check users collection before displaying UI

---

## 3. AUTHENTICATION ARCHITECTURE

### 3.1 Internal Team Authentication

**Location:** `/src/contexts/AuthContext.tsx`

```typescript
- Uses Firebase Auth (client-side: firebase/auth)
- Provider wraps entire app in layout.tsx
- Hook: useAuth() provides user state, loading, signup/login/logout
- Protected Route: ProtectedRoute component checks useAuth() context
- Redirects unauthenticated users to /login
```

**Flow:**
```
/login (InternalTeam)
    ↓
    1. Email/password sign-in (Firebase Auth)
    2. Check /api/client-auth/profile?uid={uid}
       - If 404: Not a client, proceed to /dashboard
       - If 200: Is a client, redirect to /client-portal/login
    3. Create/update users record with role='team_member'
    4. AuthContext updates user state
    5. ProtectedRoute allows access to /clients, /client-onboarding, etc.
```

### 3.2 Client Portal Authentication

**Two-Phase Flow:**

#### Phase 1: Discovery Completion → Account Creation

**Location:** `/src/app/portal/[linkId]/page.tsx`

```
1. Client clicks discovery link (unique linkId)
2. System checks if discovery already complete via /api/clients/{linkId}?byLinkId=true
   
   If NEW client:
   ├─ Show DiscoveryChat component (Claude 3.5 Haiku)
   ├─ Save conversation & data on completion
   ├─ Update client.onboardingStage → 'discovery_complete'
   └─ Show "Create Free Account" CTA
   
   If RETURNING client:
   ├─ Check if client.hasAccount === true
   │  ├─ Yes: Show "Go to Login" button
   │  └─ No: Show "Create Account" button
   └─ Never show discovery chat again
```

**Account Creation:** `/src/app/api/client-auth/signup/route.ts`

```
POST /api/client-auth/signup
Body: { email, password, linkId }

1. Find client by discoveryLinkId
2. Validate email matches client.email
3. Check client.hasAccount !== true (prevent duplicates)
4. Create Firebase Auth user (adminAuth.createUser)
5. Create users record with role='client', clientId=client.id
6. Update client record:
   ├─ hasAccount: true
   ├─ firebaseAuthUid: userRecord.uid
   ├─ accountCreatedAt: now()
   └─ updatedAt: now()
7. Return uid for frontend redirect
```

#### Phase 2: Portal Login

**Location:** `/src/app/client-portal/login/page.tsx`

```
1. Client enters email/password
2. signInWithEmailAndPassword (Firebase Auth)
3. Check /api/client-auth/profile?uid={uid}
   - If 200: Valid client, proceed to dashboard
   - If 404: Not a client (internal team), redirect to /login
4. Create/update users record and lastLoginAt
5. Redirect to /client-portal/dashboard
```

---

## 4. JOURNEY MAPPING: CLIENT CREATION TO PORTAL ACCESS

### 4.1 Complete End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: INTERNAL TEAM CREATES CLIENT                                │
└─────────────────────────────────────────────────────────────────────┘

Internal Team Member:
  1. Logs in: /login (AuthContext)
  2. Navigates to /clients or /client-onboarding
  3. Clicks "Add Client" → AddClientModal
  4. Fills: name, email, company, industry, phone
  5. Submits → POST /api/clients
     
     Server:
     └─ Creates clients document with:
        ├─ onboardingStage: 'created'
        ├─ discoveryLinkId: random 7-char ID (e.g., 'abc1234')
        ├─ hasAccount: false
        ├─ userId: demo-user (should be team member's UID)
        └─ createdAt: now()

  Result:
  └─ Client appears in list with "Created" stage badge


┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: INTERNAL TEAM SENDS DISCOVERY LINK                          │
└─────────────────────────────────────────────────────────────────────┘

Internal Team:
  1. Sees client in onboarding pipeline
  2. Clicks "Send Discovery Link"
     └─ Copies: https://bluepeak.app/portal/abc1234
     └─ Updates onboardingStage → 'discovery_sent'
  3. Shares link with client (email, Slack, etc.)

  Result:
  └─ Client stage changes to "Discovery Sent"
  └─ Orange badge shows "Waiting for client response..."


┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: CLIENT COMPLETES DISCOVERY (FIRST VISIT TO LINK)            │
└─────────────────────────────────────────────────────────────────────┘

Client (Incognito Browser):
  1. Opens discovery link: /portal/abc1234
  2. System checks: GET /api/clients/abc1234?byLinkId=true
     └─ Returns client doc with onboardingStage='discovery_sent'
     └─ Sets checkingStatus=false
  3. Shows DiscoveryChat interface (Claude 3.5 Haiku)
  4. AI asks ~7-10 questions about business, goals, challenges
  5. Client converses naturally (~5-10 minutes)
  6. Claude detects completion (phrases like "we have everything")
     └─ isComplete=true
  7. UI shows "Thank you!" screen with next steps
  8. User clicks "Create Free Account"

  Backend (During Chat):
  └─ Each message: POST /api/discovery-chat
     └─ Claude 3.5 Haiku processes conversational AI
  └─ On completion: PUT /api/clients
     ├─ discoveryData: extracted structured data
     ├─ conversationHistory: full transcript
     ├─ logoUrl: if client uploaded logo
     └─ onboardingStage: 'discovery_complete'

  Result:
  └─ Client data saved in Firestore
  └─ Ready for account creation


┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: CLIENT CREATES ACCOUNT                                      │
└─────────────────────────────────────────────────────────────────────┘

Client (On Signup Form):
  1. Email: john@company.com (pre-filled, disabled, from client record)
  2. Enters password: "securepass123" (min 6 chars)
  3. Confirms password
  4. Clicks "Create Account"
     └─ Calls: POST /api/client-auth/signup
        └─ Body: { email: 'john@company.com', password, linkId: 'abc1234' }

  Server (/api/client-auth/signup):
  1. Finds client: clients.where('discoveryLinkId', '==', 'abc1234')
  2. Validates: client.email === 'john@company.com' ✓
  3. Checks: client.hasAccount === false ✓
  4. Creates Firebase Auth user: abc123uid
  5. Creates users record:
     ├─ id: 'abc123uid'
     ├─ email: 'john@company.com'
     ├─ displayName: 'John Smith' (from client.name)
     ├─ role: 'client'
     ├─ clientId: 'xyz789' (clients doc ID)
     └─ createdAt: now()
  6. Updates client record:
     ├─ hasAccount: true
     ├─ firebaseAuthUid: 'abc123uid'
     ├─ accountCreatedAt: now()
     └─ updatedAt: now()
  7. Returns: { success: true, uid: 'abc123uid' }

  Frontend:
  └─ Redirects: /client-portal/login?accountCreated=true

  Result:
  └─ Firebase Auth user created (role: client)
  └─ users collection record created
  └─ client record linked via firebaseAuthUid
  └─ client.hasAccount = true prevents re-signup


┌─────────────────────────────────────────────────────────────────────┐
│ STEP 5: CLIENT LOGS INTO PORTAL (SUBSEQUENT VISITS)                 │
└─────────────────────────────────────────────────────────────────────┘

Client (Login Page):
  1. Enters email: john@company.com
  2. Enters password: securepass123
  3. Clicks "Log In"
     └─ signInWithEmailAndPassword(auth, email, password)
        └─ Firebase Auth validates credentials
        └─ Returns auth UID: abc123uid
  4. Checks: GET /api/client-auth/profile?uid=abc123uid
     └─ Finds: clients.where('firebaseAuthUid', '==', 'abc123uid')
     └─ Returns: client doc (200 OK)
  5. Creates/updates users record with role='client'
  6. Redirects: /client-portal/dashboard

  Frontend Dashboard:
  1. useEffect checks onAuthStateChanged (client is logged in)
  2. Fetches: GET /api/client-auth/profile?uid=abc123uid
  3. Renders personalized dashboard with:
     ├─ "Welcome back, John Smith!"
     ├─ Onboarding Status (Discovery: Complete, Proposal: In Progress)
     ├─ Company Info (Company, Industry, Email)
     ├─ Quick Actions (View Proposal, Content Library)
     └─ Proposal section + Marketing Content library

  Result:
  └─ Client sees full dashboard
  └─ Can access proposals, marketing materials
  └─ Logout available via ClientPortalNav


┌─────────────────────────────────────────────────────────────────────┐
│ STEP 6: INTERNAL TEAM MANAGES PROPOSAL (CONCURRENT ACTIVITY)        │
└─────────────────────────────────────────────────────────────────────┘

Internal Team (Meanwhile):
  1. Sees client in /client-onboarding pipeline
  2. Client has progressed to "Discovery Complete" stage
  3. Options appear:
     ├─ "Schedule Meeting" (updates onboardingStage)
     ├─ "Generate Proposal" (Claude 3 Sonnet)
     └─ "Send Proposal" (updates onboardingStage → 'proposal_sent')
  4. Proposal gets saved to clients.proposal
  5. Client gets notified (email, portal notification)

  Client Portal:
  └─ Dashboard automatically shows proposal when available
  └─ Can view, download, accept/reject


┌─────────────────────────────────────────────────────────────────────┐
│ STEP 7: CLIENT REVISITS DISCOVERY LINK (ALREADY COMPLETE)           │
└─────────────────────────────────────────────────────────────────────┘

Client (Opens link again): /portal/abc1234

  System detects:
  1. GET /api/clients/abc1234?byLinkId=true
  2. client.onboardingStage === 'discovery_complete' (not 'created' or 'discovery_sent')
  3. client.hasAccount === true

  Result:
  └─ Shows: "Discovery Complete!" screen
  └─ Options: "Go to Login" or "Create Account" (if didn't have account yet)
  └─ Never shows discovery chat again (prevents duplicate submission)
```

---

## 5. API ROUTES BY ROLE

### 5.1 Public Routes (No Auth Required)

| Route | Method | Purpose | Used By |
|-------|--------|---------|---------|
| `/portal/[linkId]` | GET | Discovery questionnaire | Unauthenticated client |

### 5.2 Client Management (Internal Team Only)

| Route | Method | Protected | Purpose |
|-------|--------|-----------|---------|
| `/api/clients` | GET | Yes (AuthContext) | Fetch all/filtered clients |
| `/api/clients` | POST | Yes (AuthContext) | Create new client |
| `/api/clients` | PUT | Yes (AuthContext) | Update client record |
| `/api/clients` | DELETE | Yes (AuthContext) | Delete client |
| `/api/clients/[id]` | GET | No | Fetch client by ID or linkId (used by portal) |

### 5.3 Client Authentication (Clients + Fallback for Team)

| Route | Method | Protected | Purpose |
|-------|--------|-----------|---------|
| `/api/client-auth/signup` | POST | No | Create portal account post-discovery |
| `/api/client-auth/profile` | GET | No | Fetch client by Firebase Auth UID |

### 5.4 User Management (Both Roles)

| Route | Method | Protected | Purpose |
|-------|--------|-----------|---------|
| `/api/users` | GET | Yes | Fetch all/single user |
| `/api/users` | POST | Yes | Create user record (called by login flow) |
| `/api/users` | PUT | Yes | Update user (lastLoginAt) |
| `/api/users` | DELETE | Yes | Delete user |

### 5.5 AI & Generation (Internal Team)

| Route | Purpose | Models |
|-------|---------|--------|
| `/api/discovery-chat` | AI-powered questionnaire | Claude 3.5 Haiku |
| `/api/generate-proposal` | Create marketing proposal | Claude 3 Sonnet |
| `/api/generate-report` | Create progress reports | Claude 3 Sonnet |
| `/api/generate-content` | Multi-channel content | Claude 3 Sonnet |

---

## 6. KEY FILES & COMPONENTS BY ROLE

### 6.1 Shared Foundation

```
src/lib/firebase.ts
├─ Client-side Firebase initialization
├─ Exports: auth, db, storage
└─ Used by both internal team & clients

src/lib/firebaseAdmin.ts
├─ Server-side Firebase Admin SDK
├─ Exports: adminDb, adminAuth, adminStorage
└─ Used by all API routes for Firestore/Auth operations

src/types/index.ts
├─ Client interface (with authentication fields)
├─ User interface (with role field)
├─ OnboardingStage type
├─ DiscoveryData, DiscoveryMessage types
└─ Shared across all components
```

### 6.2 Internal Team Routes

```
src/app/login/page.tsx
├─ Team member login with role detection
├─ Checks /api/client-auth/profile to differentiate roles
└─ Creates users record with role='team_member'

src/app/signup/page.tsx
├─ Team member account creation

src/app/dashboard/page.tsx
├─ Main team dashboard

src/app/clients/page.tsx
├─ Full client list with search/filter
├─ Copy discovery link functionality
├─ Protected by ProtectedRoute (requires AuthContext)

src/app/client-onboarding/page.tsx
├─ Visual onboarding pipeline
├─ Progress reports tab
├─ Contextual action buttons per stage
└─ Protected by ProtectedRoute

src/contexts/AuthContext.tsx
├─ useAuth() hook for internal team
├─ Manages signup/login/logout
├─ AuthProvider wraps app in layout.tsx
```

### 6.3 Client Portal Routes

```
src/app/portal/[linkId]/page.tsx
├─ Public discovery questionnaire
├─ Smart status detection (new vs. returning)
├─ Shows DiscoveryChat on first visit
├─ Shows "Discovery Complete" screen on return
├─ Account creation form (post-discovery)
├─ NO authentication required
└─ Uses unique discoveryLinkId as access mechanism

src/app/client-portal/login/page.tsx
├─ Client login with role detection
├─ Uses signInWithEmailAndPassword (Firebase Auth)
├─ Checks /api/client-auth/profile to verify client
├─ Wrapped in Suspense for useSearchParams
└─ Shows success message after signup

src/app/client-portal/dashboard/page.tsx
├─ Protected client dashboard
├─ Uses onAuthStateChanged (Firebase Auth)
├─ Fetches client via /api/client-auth/profile?uid={uid}
├─ Shows onboarding status, company info, proposal
├─ Quick actions for proposal/content library
└─ Logout functionality via ClientPortalNav

src/app/client-portal/marketing/page.tsx
├─ Content library access
└─ Placeholder for marketing materials
```

### 6.4 Components

```
src/components/AddClientModal.tsx
├─ Form for adding new clients (internal only)
├─ Auto-formatting phone numbers
├─ POST /api/clients
└─ onClientAdded callback

src/components/ProtectedRoute.tsx
├─ Wrapper for internal team pages
├─ Checks useAuth() context
├─ Redirects to /login if not authenticated
├─ Shows loading state during auth check

src/components/DiscoveryChat.tsx
├─ Client-facing AI conversation
├─ Manages message state and scrolling
├─ Posts to /api/discovery-chat for Claude responses
├─ Detects completion, shows logo upload
├─ Calls onComplete with DiscoveryData

src/components/OnboardingPipeline.tsx
├─ Visual progress tracker (7 stages)
├─ Contextual action buttons per stage
├─ Copy portal link functionality
├─ Used in /client-onboarding page

src/components/Navbar.tsx
├─ Internal team navigation

src/components/ClientPortalNav.tsx
├─ Client portal navigation with logout
```

---

## 7. AUTHENTICATION FLOW DIAGRAMS

### 7.1 Login Branching Logic

```
User enters email/password
        ↓
signInWithEmailAndPassword(auth, email, password)
        ↓
        Auth returns UID
        ↓
GET /api/client-auth/profile?uid={UID}
        ↓
        ┌─────────────────┬──────────────────┐
        ↓                 ↓                  ↓
     Response OK    Response 404        Error
        ↓                ↓                  ↓
   Client found    Not a client       (Rare)
   Role=client     Role=team_member   
        ↓                ↓                  ↓
  /client-portal   /dashboard          /login
  /dashboard       (internal)          (retry)
     (portal)
```

### 7.2 Client Creation → Portal Access (Data Flow)

```
                    INTERNAL TEAM SIDE
┌──────────────────────────────────────────────────┐
│ AddClientModal                                    │
│ ├─ Input: name, email, company, phone            │
│ └─ POST /api/clients                             │
└────────────────┬─────────────────────────────────┘
                 │
                 ↓
        ┌────────────────────┐
        │ Firestore: clients │
        │ ├─ id: xyz789      │
        │ ├─ name: John      │
        │ ├─ email: john@... │
        │ ├─ discoveryLinkId │
        │ ├─ userId: team-1  │
        │ └─ hasAccount: F   │
        └────────┬───────────┘
                 │
         Team copies link
         /portal/abc1234
                 │
                 ↓
    ┌────────────────────────────────┐
    │  CLIENT SIDE: Discovery        │
    │  /portal/[linkId]              │
    │  └─ POST /api/discovery-chat   │
    │  └─ PUT /api/clients           │
    │     ├─ discoveryData: {...}    │
    │     ├─ conversationHistory: []│
    │     └─ onboardingStage: done   │
    └────────┬─────────────────────┘
             │
             ↓
    POST /api/client-auth/signup
    ├─ Finds client by linkId
    ├─ Validates email
    ├─ Creates Firebase Auth user
    └─ Updates client.firebaseAuthUid
       & client.hasAccount = true
             │
             ↓
    ┌────────────────────────┐
    │ Firebase Auth (UID)    │
    │ └─ email: john@...     │
    │ └─ password: (hash)    │
    └─────────┬──────────────┘
              │
              ↓
    ┌────────────────────────┐
    │ Firestore: users       │
    │ ├─ id: UID             │
    │ ├─ role: 'client'      │
    │ ├─ clientId: 'xyz789'  │
    │ └─ email: john@...     │
    └─────────┬──────────────┘
              │
              ↓
    ┌────────────────────────┐
    │ Firestore: clients     │
    │ ├─ id: xyz789          │
    │ ├─ firebaseAuthUid: UID│
    │ ├─ hasAccount: true    │
    │ └─ accountCreatedAt    │
    └────────┬───────────────┘
             │
    Portal login page
    /client-portal/login
             │
             ↓
    /client-portal/dashboard
    (protected, auto-fetches client data)
```

---

## 8. DATE HANDLING & FIREBASE TIMESTAMP CONVERSION

### Critical Issue: Date Serialization

Firebase Admin returns Firestore Timestamps that serialize to **strings** in JSON:

```typescript
// From Firebase → JSON Response
Timestamp.now() → "2025-11-08T12:34:56.789Z"

// Frontend receives string, must convert back
const client: Client = {
  ...data,
  createdAt: new Date(client.createdAt),  // ← REQUIRED
  updatedAt: new Date(client.updatedAt),  // ← REQUIRED
  meetingDate: client.meetingDate ? new Date(client.meetingDate) : undefined,
};
```

**Where this is handled:**
- `src/app/api/clients/route.ts` (GET) - convertToDate helper
- `src/app/clients/page.tsx` - Client data fetch
- `src/app/client-onboarding/page.tsx` - Client data fetch
- `src/app/client-portal/dashboard/page.tsx` - Client fetch

---

## 9. SECURITY MODEL

### 9.1 Authentication Security

**Internal Team:**
- Requires AuthContext (stored in client-side Auth provider)
- ProtectedRoute wraps all team pages
- Firebase Auth UID is the source of truth
- Invalid credentials show appropriate error messages

**Clients:**
- Discoverylink is a public URL but access is gated by:
  1. linkId must exist in clients collection
  2. Email validation on signup (must match client.email)
  3. hasAccount flag prevents duplicate signup
  4. Firebase Auth UID linking prevents impersonation

### 9.2 Role Differentiation

Critical distinction happens in login flow:
```
1. Auth sign-in (both roles same Firebase Auth)
2. Check clients collection by firebaseAuthUid
   └─ If found: route to /client-portal/dashboard
   └─ If not found: route to /dashboard (internal)
```

This prevents:
- Clients accessing internal team pages
- Team members using client portal
- Cross-role impersonation

### 9.3 API Protection

| Endpoint | Protection | Method |
|----------|-----------|--------|
| `/api/clients/*` | AuthContext | Internal pages wrapped in ProtectedRoute |
| `/api/client-auth/signup` | linkId validation + email match | Public endpoint with business logic validation |
| `/api/client-auth/profile` | firebaseAuthUid lookup | Public but returns 404 if not a client |
| `/api/users/*` | Some endpoints called during auth flow | Server-side validation |

---

## 10. STATE MANAGEMENT & DATA FLOW

### 10.1 Internal Team State Management

**Location:** Client components with fetch calls

```typescript
// Page level state
const [clients, setClients] = useState<Client[]>([]);
const [selectedClient, setSelectedClient] = useState<Client | null>(null);

// Fetch on mount
useEffect(() => {
  const response = await fetch('/api/clients');
  const data = await response.json();
  // Convert dates from JSON strings
  setClients(data.clients.map(c => ({
    ...c,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
  })));
}, []);

// Updates
const updateClient = async (clientId, updates) => {
  await fetch('/api/clients', {
    method: 'PUT',
    body: JSON.stringify({ id: clientId, ...updates })
  });
  // Update local state optimistically
  setClients(clients.map(c => 
    c.id === clientId ? { ...c, ...updates } : c
  ));
};
```

### 10.2 Client Portal State Management

**Location:** Client portal pages

```typescript
// Dashboard - fetch once on auth state change
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      router.push('/client-portal/login');
      return;
    }
    
    const response = await fetch(`/api/client-auth/profile?uid=${firebaseUser.uid}`);
    const { client } = await response.json();
    setClient(client);
  });
  
  return unsubscribe;
}, []);

// Discovery - manage complex conversation state
const [messages, setMessages] = useState<DiscoveryMessage[]>([]);
const [isComplete, setIsComplete] = useState(false);

// On completion, save to server
const handleDiscoveryComplete = async (data, messages) => {
  await fetch('/api/clients', {
    method: 'PUT',
    body: JSON.stringify({
      id: clientId,
      discoveryData: data,
      conversationHistory: messages,
      onboardingStage: 'discovery_complete'
    })
  });
};
```

---

## 11. CRITICAL IMPLEMENTATION DETAILS

### 11.1 Next.js 16 Suspense Boundary

Client portal login uses `useSearchParams()` which requires Suspense:

```typescript
// page.tsx
export default function ClientLoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginForm />  // ← This uses useSearchParams()
    </Suspense>
  );
}
```

**Why:** Server-side rendering doesn't have access to query params. Suspense defers to client rendering.

### 11.2 AuthContext for Internal Team

```typescript
// layout.tsx
<AuthProvider>  // ← Wraps entire app
  {children}
</AuthProvider>

// ProtectedRoute.tsx
const { user, loading } = useAuth();
// If no user, redirect to /login
```

**Note:** Clients do NOT use AuthContext. They use Firebase Auth directly via `onAuthStateChanged()`.

### 11.3 Modal Styling Convention

All modals follow this pattern:

```typescript
<div className="fixed inset-0 z-50">
  <div className="fixed inset-0 bg-black/50" onClick={onClose} />  // Backdrop
  <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 z-10">
    // Modal content
  </div>
</div>
```

With text input colors:
```typescript
className="... text-gray-900 placeholder:text-gray-400"
```

### 11.4 Phone Number Auto-Formatting

```typescript
const formatPhoneNumber = (value: string) => {
  const phoneNumber = value.replace(/\D/g, ''); // Remove non-digits
  if (phoneNumber.length <= 3) return `(${phoneNumber}`;
  if (phoneNumber.length <= 6) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};
```

Output: `(555) 123-4567`

---

## 12. INTEGRATION POINTS & DATA DEPENDENCIES

### 12.1 Client Creation → Portal Access Dependencies

```
1. Client created
   └─ Generates random discoveryLinkId
   └─ Creates clients.id (Firestore document ID)

2. Discovery link sent
   └─ Uses clients.discoveryLinkId for /portal/[linkId]
   └─ GET /api/clients/{linkId}?byLinkId=true lookup

3. Client completes discovery
   └─ Saves conversationHistory, discoveryData to clients
   └─ Updates onboardingStage → 'discovery_complete'

4. Account creation
   └─ POST /api/client-auth/signup with linkId
   └─ Creates Firebase Auth user
   └─ Creates users record with clientId
   └─ Updates clients.firebaseAuthUid

5. Portal login
   └─ Firebase Auth returns UID
   └─ GET /api/client-auth/profile?uid={UID}
   └─ Finds client by firebaseAuthUid
   └─ Returns full client object for dashboard
```

### 12.2 Data Consistency Requirements

```
CONSTRAINT 1: Email Consistency
- clients.email = signup email = Firebase Auth email
- SignUp validates: client.email === form email

CONSTRAINT 2: UID Linking
- Firebase Auth UID = users.id = clients.firebaseAuthUid
- Bidirectional: can lookup either direction

CONSTRAINT 3: Account Status
- clients.hasAccount = true only after successful signup
- clients.firebaseAuthUid set only when hasAccount = true
- Prevents duplicate account creation

CONSTRAINT 4: Onboarding Stage Progression
- created → discovery_sent → discovery_complete → ... → proposal_accepted
- Shouldn't regress (enforced in UI, not DB)
- Discovery can't be re-filled once complete (checked via onboardingStage)
```

---

## 13. COMMON WORKFLOWS & PATTERNS

### 13.1 Workflow: Add Client → Send Link → Client Completes

**1. Team member creates client**
```typescript
// Components/AddClientModal.tsx
POST /api/clients
├─ Body: { name, email, company, industry, phone, onboardingStage: 'created' }
└─ Response: { client: Client } with id & discoveryLinkId
```

**2. Team member sends link**
```typescript
// Components/OnboardingPipeline.tsx
handleSendDiscovery():
├─ const link = `${origin}/portal/${client.discoveryLinkId}`
├─ navigator.clipboard.writeText(link)
├─ updateClient(client.id, { onboardingStage: 'discovery_sent' })
└─ Alert with link URL
```

**3. Client fills discovery**
```typescript
// App/portal/[linkId]/page.tsx
GET /api/clients/{linkId}?byLinkId=true
├─ Check if onboardingStage !== 'created|discovery_sent'
├─ Show DiscoveryChat if not complete
├─ POST /api/discovery-chat (each message)
├─ On completion: PUT /api/clients with discoveryData
└─ Show signup form
```

### 13.2 Workflow: Client Creates Account → Logs In

**1. Client signs up**
```typescript
// App/portal/[linkId]/page.tsx (signup form)
POST /api/client-auth/signup
├─ Body: { email, password, linkId }
├─ Server finds client by linkId
├─ Creates Firebase Auth user
├─ Creates users record
├─ Updates client.firebaseAuthUid & hasAccount
└─ Response: { uid: firebaseAuthUid }
```

**2. Client logs in**
```typescript
// App/client-portal/login/page.tsx
signInWithEmailAndPassword(auth, email, password)
├─ Firebase returns uid
├─ GET /api/client-auth/profile?uid={uid}
├─ Server finds client by firebaseAuthUid
├─ Creates/updates users record
└─ Response: { client: Client }
```

**3. Client views dashboard**
```typescript
// App/client-portal/dashboard/page.tsx
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const response = await fetch(`/api/client-auth/profile?uid=${user.uid}`)
    const { client } = await response.json()
    setClient(client)
  }
})
```

---

## 14. ENUM & TYPE REFERENCE

### 14.1 OnboardingStage Values

```typescript
type OnboardingStage = 
  | 'created'              // 1. Client just added
  | 'discovery_sent'       // 2. Link sent to client
  | 'discovery_complete'   // 3. Client completed discovery
  | 'meeting_scheduled'    // 4. Proposal meeting scheduled
  | 'proposal_generated'   // 5. Proposal created
  | 'proposal_sent'        // 6. Proposal sent to client
  | 'proposal_accepted'    // 7. Client accepted
  | 'completed'            // Final state
```

### 14.2 User Roles

```typescript
type UserRole = 'admin' | 'team_member' | 'client'

// admin: Full access (future)
// team_member: BluePeak staff, can manage clients
// client: External client, access own portal
```

### 14.3 Discovery Data

```typescript
interface DiscoveryData {
  companyName?: string
  industry?: string
  businessGoals?: string
  targetAudience?: string
  currentChallenges?: string
  budget?: string
  timeline?: string
  servicesNeeded?: string[]
  additionalInfo?: string
}
```

---

## 15. TROUBLESHOOTING GUIDE

### Issue: Client Can't Create Account (Email Mismatch)

**Cause:** Email entered doesn't match clients.email

**Fix:** 
- Verify client was created with correct email
- Email must be identical (case-insensitive might be issue)
- Re-create client with correct email if needed

### Issue: Login Routes User to Wrong Portal

**Cause:** Role detection failure

**Check:**
- After Firebase Auth sign-in, is /api/client-auth/profile being called?
- Does users collection have correct role ('client' vs 'team_member')?
- Is response 200 (found) or 404 (not found)?

### Issue: Discovery Data Not Saved

**Cause:** PUT /api/clients call failing

**Check:**
- Are messages being sent to /api/discovery-chat correctly?
- Is isComplete flag set when Claude response contains completion phrase?
- Is PUT /api/clients call including id, discoveryData, conversationHistory?

### Issue: Client Can Revisit Discovery Link and Re-fill Form

**Cause:** onboardingStage check missing or incorrect

**Fix:**
- System checks: `onboardingStage !== 'created' && onboardingStage !== 'discovery_sent'`
- If either true, show "Discovery Complete" screen instead of chat
- Verify PUT call is successfully updating onboardingStage

---

## 16. ARCHITECTURE SUMMARY DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                         BLUEPEAK MARKETING                       │
│                        Dual-Role Architecture                    │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐                  ┌──────────────────────┐
│  INTERNAL TEAM       │                  │   EXTERNAL CLIENT    │
│  (team_member role)  │                  │   (client role)      │
├──────────────────────┤                  ├──────────────────────┤
│ /login               │                  │ /portal/[linkId]     │
│   → /dashboard       │                  │   → Discovery        │
│                      │                  │   → Account Creation │
│ /clients             │                  │ /client-portal/login │
│   → Manage clients   │                  │   → /dashboard       │
│   → Search, filter   │                  │   → View proposal    │
│                      │                  │   → Content library  │
│ /client-onboarding   │                  │                      │
│   → Pipeline view    │                  │                      │
│   → Send links       │                  │                      │
│   → Generate proposal│                  │                      │
│   → Progress reports │                  │                      │
└──────────────────────┘                  └──────────────────────┘

Both authenticated via Firebase Auth, distinguished by role in users collection

┌─────────────────────────────────────────────────────────────────┐
│                    SHARED FIRESTORE STRUCTURE                    │
├─────────────────────────────────────────────────────────────────┤
│ Collection: clients                                              │
│ ├─ Stores: Client info + onboarding state                       │
│ ├─ Key link: firebaseAuthUid → users.id                         │
│ └─ Accessible by: Internal team (read all) + Client (own via UID)
│                                                                  │
│ Collection: users                                                │
│ ├─ Stores: Auth user metadata + role                            │
│ ├─ Key link: clientId → clients.id (if client)                  │
│ └─ Distinguishes: team_member vs client role                    │
│                                                                  │
│ Firebase Auth                                                    │
│ ├─ Single pool for both roles                                   │
│ ├─ UID is source of truth                                       │
│ └─ Role determined by users collection lookup                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    KEY DATA DEPENDENCIES                          │
├─────────────────────────────────────────────────────────────────┤
│ Client Creation         clients.discoveryLinkId (random 7-char) │
│ Discovery Sharing       /portal/{discoveryLinkId}              │
│ Data Persistence        discoveryData + conversationHistory     │
│ Account Creation        clients.email + firebaseAuthUid         │
│ Portal Login            firebaseAuthUid → clients lookup        │
│ Status Detection        clients.onboardingStage + hasAccount    │
│ Role Routing            users.role → /dashboard vs /client-...  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 17. CONCLUSION

BluePeak's dual-role architecture achieves:

1. **Separation of Concerns**: Internal team and clients have completely separate UIs and workflows
2. **Single Source of Truth**: Firebase Auth + Firestore provides unified data model
3. **Seamless Linking**: Bidirectional references (users ↔ clients) enable role-based routing
4. **Smart State Detection**: System automatically detects role and discovery status
5. **Scalability**: Pattern supports adding new roles (admin, manager, etc.) without major refactoring

The system elegantly handles the complex requirement of managing a two-sided marketplace (agency ↔ client) within a single authentication system, using role-based access control and clever state machines (OnboardingStage) to coordinate activities across both sides.
