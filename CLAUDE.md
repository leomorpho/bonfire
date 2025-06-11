# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

```bash
# Start development server (port 5173)
npm run dev

# Start Triplit real-time sync server (required for real-time features)
npm run triplit

# Reset database and start fresh
make clean  # Removes local.db
make dev    # Runs migrations and starts dev server

# Run both unit and integration tests
npm run test

# Run only unit tests
npm run test:unit

# Run only E2E tests
npm run test:integration

# Lint and format code
npm run lint     # Check for linting errors
npm run format   # Auto-format code
```

### Database

```bash
# Generate new migration after schema changes
npm run generate

# Apply migrations to database
npm run migrate

# Seed database with test data
npm run seed
```

### Build & Production

```bash
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run start    # Start production server
```

## Architecture

### Tech Stack

- **Frontend**: Svelte 5 + SvelteKit 2 with TypeScript
- **Styling**: Tailwind CSS + DaisyUI + custom UI components in `src/lib/components/ui`
- **Database**: SQLite (dev) / Turso (prod) with Drizzle ORM
- **Real-time**: Triplit for collaborative features
- **Auth**: Lucia Auth with Google OAuth and email/OTP

### Project Structure

- **Routes**: File-based routing in `src/routes/`
  - `/(app)/` - Public pages
  - `/(bonfire)/` - Event management pages
  - `/(user)/` - User dashboard/settings
  - `/(login)/` - Authentication
- **Components**: Reusable components in `src/lib/components/`
- **Server**: Backend logic in `src/lib/server/`
- **Database**: Schema in `src/lib/server/database/schema.ts`

### Key Patterns

1. **Server-side forms**: Use `+page.server.ts` for form actions and data loading
2. **Real-time sync**: Triplit client in `src/lib/triplit.ts` for collaborative features
3. **File uploads**: TUS protocol implementation for resumable uploads
4. **Notifications**: Queue-based system supporting email, SMS, and push

### Database Schema

Core entities:

- `users` - User accounts and profiles
- `events` - Event information
- `attendees` - RSVPs and attendance
- `messages` - Real-time chat
- `bring_list_items` - Items for events
- `notifications` - Notification queue

### Testing Approach

- Unit tests with Vitest for utilities and components
- E2E tests with Playwright for user flows
- Test files co-located with source files (`.test.ts`)
