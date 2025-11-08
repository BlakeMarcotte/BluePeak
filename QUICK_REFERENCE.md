# BluePeak Marketing - Quick Reference Guide

## Two-Role System at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                    DUAL-ROLE ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  INTERNAL TEAM              CLIENTS                             │
│  (team_member)              (client)                            │
│  ├─ /login                  ├─ /portal/[linkId]                 │
│  ├─ /dashboard              ├─ /client-portal/login             │
│  ├─ /clients                ├─ /client-portal/dashboard         │
│  └─ /client-onboarding      └─ /client-portal/marketing         │
│                                                                  │
│  Authentication: AuthContext              Firebase Auth         │
│  UI Protection: ProtectedRoute             onAuthStateChanged    │
│  Role Detection: users collection lookup   /api/client-auth     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Complete Client Journey

### Phase 1: Creation (Internal Team)
1. Team member: `/clients` → "Add Client" modal
2. Form: name, email, company, industry, phone
3. Server: Creates `clients` document with unique `discoveryLinkId`
4. Result: Client appears with "Created" status

### Phase 2: Discovery Sent (Internal Team)
1. Team member: Sees client in `/client-onboarding`
2. Action: Clicks "Send Discovery Link"
3. Server: Updates `onboardingStage` → `discovery_sent`
4. Link: `https://app/portal/{discoveryLinkId}`

### Phase 3: Discovery Completion (Client - Public)
1. Client: Opens discovery link (NO login required)
2. Interface: DiscoveryChat with Claude 3.5 Haiku
3. AI asks: ~7-10 questions about business
4. Server: On completion, saves `discoveryData` + `conversationHistory`
5. Result: Updates `onboardingStage` → `discovery_complete`

### Phase 4: Account Creation (Client - Public)
1. Form: Email (pre-filled), Password, Confirm Password
2. Server Flow:
   - Find client by `discoveryLinkId`
   - Validate email matches `clients.email`
   - Create Firebase Auth user
   - Create `users` record with `role='client'`
   - Link: `clients.firebaseAuthUid` = Firebase Auth UID
   - Update: `clients.hasAccount = true`
3. Result: Client account created

### Phase 5: Portal Login (Client - Protected)
1. Form: Email, Password
2. Firebase Auth: Validates credentials
3. Server: Checks if client exists via `firebaseAuthUid`
4. Route: Redirects to `/client-portal/dashboard`
5. Dashboard: Shows onboarding status, proposals, content

---

## Database Schema (Essential Fields)

### Collection: `clients`
```typescript
{
  // Identification
  id: string                    // Firestore doc ID
  name: string                  // Contact name
  email: string                 // Used for signup validation
  company: string
  
  // Onboarding Pipeline
  onboardingStage: string       // created|discovery_sent|discovery_complete|...
  discoveryLinkId: string       // Unique public link ID
  discoveryData?: object        // AI-extracted info
  conversationHistory?: array   // Full chat transcript
  proposal?: object             // Generated proposal
  
  // Authentication Linking
  hasAccount: boolean           // Can bypass account creation
  firebaseAuthUid?: string      // Links to Firebase Auth UID
  accountCreatedAt?: Date
  
  // Audit
  userId: string                // Team member who created
  createdAt: Date
  updatedAt: Date
}
```

### Collection: `users`
```typescript
{
  id: string                    // Firebase Auth UID
  email: string
  displayName: string
  role: 'team_member' | 'client'
  clientId?: string             // If client, links to clients.id
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}
```

### Key Linking
```
Firebase Auth UID (abc123)
    ↓ users.id = abc123
    ├─ role: 'client'
    └─ clientId: 'xyz789'
        ↓ clients.id = 'xyz789'
        └─ firebaseAuthUid: 'abc123'
```

---

## Critical API Routes

### Client Discovery (Public)
| Route | Purpose |
|-------|---------|
| `GET /api/clients/{linkId}?byLinkId=true` | Fetch client by discovery link |
| `POST /api/discovery-chat` | AI conversation (Claude 3.5 Haiku) |

### Account Creation (Public + Validation)
| Route | Purpose |
|-------|---------|
| `POST /api/client-auth/signup` | Create portal account |
| `GET /api/client-auth/profile?uid={uid}` | Fetch client by Auth UID |

### Client Management (Team Only)
| Route | Protection | Purpose |
|-------|-----------|---------|
| `GET /api/clients` | AuthContext | Fetch all clients |
| `POST /api/clients` | AuthContext | Create client |
| `PUT /api/clients` | AuthContext | Update client |
| `DELETE /api/clients` | AuthContext | Delete client |

### User Management
| Route | Purpose |
|-------|---------|
| `GET /api/users?uid={uid}` | Fetch user record |
| `POST /api/users` | Create user record |
| `PUT /api/users` | Update user |

---

## Critical Files by Function

### Authentication & Protection
- `src/contexts/AuthContext.tsx` → useAuth() hook for team
- `src/components/ProtectedRoute.tsx` → Wraps team pages
- `src/lib/firebase.ts` → Client-side Firebase config
- `src/lib/firebaseAdmin.ts` → Server-side Firebase Admin

### Team Pages
- `src/app/login/page.tsx` → Team login with role detection
- `src/app/clients/page.tsx` → Full client management
- `src/app/client-onboarding/page.tsx` → Pipeline + reports
- `src/components/AddClientModal.tsx` → Client creation form

### Client Portal
- `src/app/portal/[linkId]/page.tsx` → Public discovery + signup
- `src/app/client-portal/login/page.tsx` → Client login (wrapped in Suspense)
- `src/app/client-portal/dashboard/page.tsx` → Client dashboard
- `src/components/DiscoveryChat.tsx` → AI conversation interface

### Data Models
- `src/types/index.ts` → All TypeScript interfaces

---

## Login Flow Decision Tree

```
User enters email/password
        ↓
signInWithEmailAndPassword(auth, email, password)
        ↓ (returns UID)
GET /api/client-auth/profile?uid={UID}
        ↓
    ┌───┴────┐
    ↓        ↓
  200       404
  (OK)      (Not Found)
    ↓        ↓
  CLIENT   TEAM
    ↓        ↓
/client-  /dashboard
portal/
dashboard
```

---

## Date Handling: Critical!

**Firebase returns Timestamps that serialize to JSON strings**

```typescript
// ❌ WRONG - dates are strings, not Date objects
const client = response.json();
console.log(client.createdAt); // "2025-11-08T12:34:56.789Z" (string!)

// ✅ CORRECT - convert back to Date
const client = {
  ...response.json(),
  createdAt: new Date(response.createdAt),
  updatedAt: new Date(response.updatedAt),
  meetingDate: response.meetingDate ? new Date(response.meetingDate) : undefined,
};
```

**Where handled:**
- `/api/clients/route.ts` - convertToDate() helper
- `/clients/page.tsx` - Fetch clients
- `/client-onboarding/page.tsx` - Fetch clients
- `/client-portal/dashboard/page.tsx` - Fetch client

---

## Suspense Boundary for useSearchParams()

**Client portal login requires this pattern:**

```typescript
// page.tsx
export default function ClientLoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginForm />  // ← Uses useSearchParams()
    </Suspense>
  );
}
```

**Why:** Server-side rendering can't access query params. Suspense defers to client rendering.

---

## State Management Patterns

### Team Pages
- Fetch on mount: `useEffect(() => { fetchClients() }, [])`
- Local state: `useState<Client[]>`
- Optimistic updates: `setClients(clients.map(...))`

### Client Portal
- Auth listener: `useEffect(() => { onAuthStateChanged(auth, ...) }, [])`
- Discovery: Complex message state + isComplete flag
- Dashboard: Single client fetch on auth change

---

## Security Model

### Role Differentiation
1. Firebase Auth sign-in (both roles same pool)
2. Check `users` collection for role
3. If `role='client'`, also check `clients` collection
4. Route based on role + client existence

### Email Validation
- On signup: form email must match `clients.email`
- Prevents wrong person creating account

### Prevent Duplicate Signup
- Check `clients.hasAccount === false` before signup
- Set to `true` after successful account creation
- If already true, reject signup

### Discovery Gating
- Check `onboardingStage` before showing chat
- If `!== 'created' && !== 'discovery_sent'`, show completion screen
- Prevents re-filling questionnaire

---

## Common Tasks

### Add a new client field
1. Add to `Client` interface in `types/index.ts`
2. Update form in `AddClientModal.tsx`
3. Include in `POST /api/clients` endpoint
4. Update display in client list/pipeline

### Fetch client (any page)
```typescript
// By ID
GET /api/clients/{id}

// By discovery link
GET /api/clients/{linkId}?byLinkId=true

// All clients (team only)
GET /api/clients
```

### Update client (any page)
```typescript
PUT /api/clients
Body: { id, field1: value1, field2: value2, ... }
```

### Check if user is team member vs client
```typescript
// In login flow
const response = await fetch(`/api/client-auth/profile?uid=${uid}`);
if (response.ok) {
  // Is a client
} else {
  // Is team member
}
```

---

## Troubleshooting Checklist

- [ ] Client created with correct email? (Case-sensitive)
- [ ] `discoveryLinkId` generated? (6-7 char random string)
- [ ] Discovery chat completion detected? (Look for AI phrases)
- [ ] `onboardingStage` updated to `discovery_complete`?
- [ ] Signup email validation passing? (Must match `clients.email`)
- [ ] `firebaseAuthUid` set after signup? (Bidirectional link)
- [ ] `hasAccount` set to `true`?
- [ ] User record created with `role='client'`?
- [ ] `users.clientId` points to correct `clients.id`?
- [ ] Login redirects to correct portal? (Check `/api/client-auth/profile`)

---

## Architecture at Scale

**Current design supports:**
- Unlimited clients
- Multiple team members (userId field)
- Concurrent discovery/portal activity
- Proposal generation + storage
- Content library (placeholder)

**Future enhancements:**
- Multi-workspace support (add workspaceId)
- Team role hierarchy (admin, manager, agent)
- Client subaccounts (multiple contacts)
- Proposal versioning
- Content analytics

---

Generated: 2025-11-08
Last Updated: ARCHITECTURE_ANALYSIS.md
