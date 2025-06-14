# Support Messaging System Strategy

## Overview

This document outlines the strategy for implementing a dedicated support messaging channel between admins and users in the Bonfire application. The system is designed to be separate from the existing event-based messaging while leveraging the same robust infrastructure.

## Architecture Decision

**Separate but Leveraging Existing Infrastructure**

The support messaging system:
- Uses the same **Triplit real-time infrastructure** 
- Leverages the existing **notification system**
- Has its own **database tables** to keep support conversations separate from event messaging
- Reuses **UI components** but simplified (no reactions, threading, etc.)

## Database Schema (New Triplit Collections)

```typescript
support_conversations: {
  id: string;
  user_id: string;           // The user seeking support
  status: 'open' | 'closed'; // Conversation status
  created_at: Date;
  updated_at: Date;
  last_message_at: Date;
}

support_messages: {
  id: string;
  conversation_id: string;
  user_id: string;          // Could be user or admin
  content: string;
  is_admin_message: boolean; // True if sent by admin
  created_at: Date;
  updated_at: Date;
}

support_message_seen: {
  id: string;
  message_id: string;
  user_id: string;
  seen_at: Date;
}
```

## Permission Model

- **Users**: Can only see their own conversations and messages
- **Admins**: Can see all conversations and respond to any
- **Auto-conversation creation**: First message from user creates conversation
- **Simple access control**: Much simpler than event-based permissions

## UI/UX Design

### User Interface
- **Support button/link** in main nav or user menu
- **Simple chat interface** - no reactions, no threading
- **Conversation list** for admins (like inbox)
- **Single conversation view** for regular users
- **Clear admin/user message distinction** (different styling)

### Admin Interface
- **Support dashboard** showing all open conversations
- **Conversation list** with user info and last message preview
- **Unread indicators** for admin responses needed
- **Quick actions**: Mark resolved, assign (future)

## Implementation Plan

### Phase 1: Core Infrastructure
1. **Database schema** - Add new Triplit collections
2. **Permissions** - Set up support-specific access rules
3. **Basic server functions** - Send/receive support messages
4. **Simple components** - Minimal chat interface

### Phase 2: User Experience  
5. **User support page** - `/support` route with chat interface
6. **Message components** - Simplified versions of existing components
7. **Real-time updates** - Live messaging for both users and admins
8. **Notifications** - Email/SMS when admins respond

### Phase 3: Admin Tools
9. **Admin dashboard** - `/admin/support` with conversation list
10. **Conversation management** - Mark resolved, search, filter
11. **Admin notifications** - Alert admins to new support requests
12. **Analytics** - Response times, resolution metrics

## Key Components to Build

```
src/lib/components/support/
├── SupportChat.svelte          # Main chat interface
├── SupportMessage.svelte       # Individual message component  
├── SupportInput.svelte         # Message input (simplified)
├── ConversationList.svelte     # Admin conversation list
└── ConversationPreview.svelte  # Conversation summary card
```

## Routes to Add

```
src/routes/
├── support/
│   └── +page.svelte           # User support chat
└── admin/
    └── support/
        ├── +page.svelte       # Admin dashboard
        └── [id]/
            └── +page.svelte   # Specific conversation
```

## Existing Infrastructure Analysis

### Current Messaging Architecture

The existing bonfire messaging system uses:

#### Database Schema (Triplit)
- **`event_threads`** - Message threads within events
- **`event_messages`** - Individual messages with soft deletion
- **`event_message_seen`** - Message read status tracking
- **`emoji_reactions`** - Message reactions (not needed for support)

#### Real-time Architecture
- **Frontend**: `TriplitClient` or `WorkerClient` for real-time subscriptions
- **Server**: `triplitHttpClient` with service token for backend operations
- **Permissions**: Role-based permissions (admin, user, temp, anon)

#### Key Components
- **`ImThreadView.svelte`** - Main messaging interface
- **`Message.svelte`** - Individual message component
- **`ImInput.svelte`** - Message composition
- **`MessageContextMenu.svelte`** - Message actions

#### Notification System
- Queue-based notifications with multi-channel delivery
- Smart filtering (excludes sender, respects preferences)
- Integration with email, SMS, and push notifications

### Patterns to Leverage

1. **Triplit collections** for real-time data
2. **Permission-based filtering** at database level
3. **Queue-based notifications** for reliable delivery
4. **Component composition** with clear prop interfaces
5. **Server-side validation** with client-side optimistic updates
6. **Intersection Observer** patterns for read status tracking

## Benefits of This Approach

✅ **Leverages existing infrastructure** - Uses proven Triplit setup
✅ **Keeps systems separate** - No mixing with event messaging  
✅ **Simple and focused** - No unnecessary features
✅ **Scalable** - Easy to add admin tools and analytics later
✅ **Consistent UX** - Familiar patterns for users
✅ **Admin-friendly** - Clear dashboard for support management

## Next Steps

1. Begin with Phase 1 implementation
2. Add new Triplit collections to schema
3. Set up basic permissions and server functions
4. Create minimal UI components
5. Test real-time functionality
6. Iterate based on user feedback

## Future Enhancements

- **Assignment system** - Route conversations to specific admins
- **Categories/tags** - Organize support requests by type
- **File attachments** - Allow users to send screenshots
- **Canned responses** - Quick admin response templates
- **Analytics dashboard** - Support metrics and reporting
- **Integration with external tools** - Slack notifications, ticketing systems