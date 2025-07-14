# Recurring Events with Complete Payment Flexibility

## Core Architecture

### 1. Event Series Model
- `event_series` table for recurring event groups
- Each occurrence is a separate `events` record (preserves existing infrastructure)
- Support **three payment models simultaneously**:
  1. Series-level payment (buy entire series)
  2. Individual event payment (buy single occurrence from series)
  3. Standalone event payment (current system unchanged)

### 2. Database Schema Changes

**New `event_series` table:**
```sql
- id: string (primary key)
- title: string
- description: string
- recurrence_pattern: JSON (days, frequency, end_date)
- user_id: string (creator)
- group_id: string (optional)
- is_active: boolean
- created_at: timestamp
- series_pricing: JSON (price, currency, max_attendees) - optional
- allow_individual_purchases: boolean (default: true)
- allow_series_purchases: boolean (default: true)
```

**Update `events` table:**
```sql
+ event_series_id: string (optional)
+ series_occurrence_number: integer (optional)
+ is_series_template: boolean (default: false)
# Keep all existing ticketing fields for individual event pricing
```

**New `series_attendees` table:**
```sql
- id: string (primary key)
- event_series_id: string
- user_id: string
- status: string (GOING)
- guest_count: integer
- payment_status: string
- created_at: timestamp
```

### 3. Complete Payment Matrix

#### Scenario 1: Series + Individual Pricing (Dance Class Example)
- **Series**: $200 for 8 Wednesday classes
- **Individual**: $30 per Wednesday class
- **User Options**:
  - Buy series → Auto-RSVP'd GOING to all 8 classes
  - Buy individual class → RSVP'd GOING to just that Wednesday
  - Mix and match (buy series, then buy additional individual classes)

#### Scenario 2: Series-Only Pricing (Corporate Training)
- **Series**: $500 for 4-session leadership program
- **Individual**: Disabled by event creator
- **User Options**:
  - Buy entire series only
  - No individual session purchases allowed

#### Scenario 3: Individual-Only Pricing (Workshop Series)
- **Series**: Disabled (no bulk discount)
- **Individual**: $75 per workshop
- **User Options**:
  - Buy each workshop separately
  - No series package available

#### Scenario 4: Standalone Events (Current System)
- No series association
- Current payment/RSVP system unchanged

### 4. Implementation Strategy

#### Phase 1: Schema & Core Logic
1. Add `event_series` and `series_attendees` to Triplit schema
2. Update `events` schema with optional series fields
3. Create series management utilities (`src/lib/event-series.ts`)
4. Implement dual payment validation logic

#### Phase 2: Series Creation Flow
1. Add "Create Recurring Event" option to event creation
2. Recurrence pattern UI (weekly, specific days, duration)
3. **Pricing configuration**:
   - Enable/disable series pricing
   - Enable/disable individual event pricing
   - Set prices for both levels
4. Generate individual event occurrences with proper pricing

#### Phase 3: Payment Logic
1. **Series purchases**:
   - Create `series_attendees` record
   - Auto-create `attendees` records for all events (status: GOING)
   - Prevent individual purchases for series-purchased events
2. **Individual purchases**:
   - Standard ticket purchase flow (existing system)
   - Works for both series events and standalone events
   - Check against series purchase to prevent double-payment

#### Phase 4: UI/UX Enhancement
1. **Event pages**:
   - Show series context when applicable
   - Display both series and individual pricing options
   - "Buy Series" vs "Buy This Class" buttons
2. **Series overview page**:
   - List all occurrences with dates/times
   - Show user's attendance status across series
   - Purchase options for remaining events

### 5. Business Model Examples

**Dance Studio:**
- "Salsa Wednesdays" - 12 weeks
- Series: $180 (save $60)
- Individual: $20 per class
- Students can mix: buy 6-class package, then add individual classes

**Fitness Gym:**
- "HIIT Tuesdays/Thursdays" - 8 weeks (16 classes)
- Series: $320 
- Individual: $25 per class
- Drop-ins welcome, members get series discount

**Professional Training:**
- "Data Science Bootcamp" - 6 weeks
- Series only: $1200
- No individual sessions (cohort-based learning)

### 6. Key Benefits

- **Maximum business flexibility**: Support any pricing strategy
- **User choice**: Buy series for savings or individual for flexibility
- **Preserves existing system**: Standalone events work exactly as before
- **Prevents double-payment**: Smart validation between series and individual purchases
- **Revenue optimization**: Encourages series purchases while capturing drop-in revenue

### 7. Technical Advantages

- **Reuses existing infrastructure**: All current ticket/RSVP/notification systems work unchanged
- **Clean data model**: Each event occurrence is a real event with real attendees
- **Simple queries**: Can easily find "all my Tuesday yoga classes" or "series completion rate"
- **Gradual rollout**: Can launch with series-only events first, add complexity later

This approach gives businesses complete control over their pricing strategy while maintaining the simplicity and power of the existing event system.