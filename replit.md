# AniRelease - Anime Release Calendar

## Overview

AniRelease is a modern web application for tracking upcoming anime releases. Users can browse anime sorted by release month, filter by various criteria (genre, studio, year), view detailed information with image galleries, and switch between Italian and English languages. The app features a dark/light theme toggle, admin authentication for content management, and a clean, minimal design with rounded elements and gradient accents.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: Zustand for global state, TanStack React Query for server state
- **Styling**: Tailwind CSS v4 with CSS variables for theming, shadcn/ui component library (New York style)
- **Animations**: Framer Motion for smooth transitions and hover effects
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Framework**: Express.js running on Node.js
- **API Pattern**: RESTful API endpoints under `/api/*`
- **Database ORM**: Drizzle ORM with PostgreSQL (Neon serverless)
- **Architecture**: Monorepo structure with shared schema between client and server

### Project Structure
```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/   # UI components (anime cards, editors, layout)
│   │   ├── pages/        # Route pages (home, admin)
│   │   ├── lib/          # Utilities, API client, Zustand store
│   │   └── hooks/        # Custom React hooks
├── server/           # Express backend
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Database access layer
│   └── db.ts         # Database connection
├── shared/           # Shared code between client/server
│   └── schema.ts     # Drizzle schema definitions
```

### Data Model
- **Users**: Admin authentication (username/password)
- **Animes**: Main anime entries with title, release date, studio, genres, description, cover image, gallery
- **AnimeEpisodes**: Individual episode tracking linked to parent anime
- **Genres**: Lookup table for genre names
- **Studios**: Lookup table for studio names

### Key Design Decisions
1. **Zustand over Redux**: Simpler state management for this app's complexity level
2. **Drizzle ORM**: Type-safe database queries with Zod validation integration
3. **shadcn/ui**: Customizable, accessible component primitives
4. **Monorepo with shared schema**: Single source of truth for types between frontend and backend

## External Dependencies

### Database
- **PostgreSQL** via Neon Serverless - Primary data store
- Connection configured via `NEON_DATABASE_URL` environment variable (fallback to `DATABASE_URL`)

### Image Storage
- **Cloudinary** - Cloud image hosting and management
- Connection configured via `CLOUDINARY_URL` environment variable
- Images are uploaded via `/api/upload` endpoint and stored permanently on Cloudinary
- Maximum image size: 10MB per file

### Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **framer-motion**: Animation library
- **date-fns**: Date formatting with locale support (Italian/English)
- **embla-carousel-react**: Image carousel component
- **react-hook-form** + **zod**: Form handling with validation

### UI Framework
- **Radix UI primitives**: Accessible component building blocks (dialog, dropdown, popover, etc.)
- **Tailwind CSS v4**: Utility-first styling
- **Lucide React**: Icon library

### Build & Development
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development
- **drizzle-kit**: Database migration tooling