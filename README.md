# StartupOS AI - AI Co-Founder SaaS Platform

https://startupos-ai.vercel.app/signup

StartupOS AI is a flagship AI-powered SaaS platform designed to act as an automated, intelligent co-founder. By evaluating startup ideas, the platform generates complete execution blueprints, market validation, branding kits, financial forecasts, marketing plans, slide decks, and launch roadmaps.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Next.js Server Actions & API Route Handlers
- **Database**: Supabase PostgreSQL, Authentication, and Storage
- **AI Memory**: pgvector for Retrieval-Augmented Generation (RAG)
- **Large Language Models**: Google Gemini 1.5 Pro & 1.5 Flash (via `@google/generative-ai` SDK)
- **Rate Limiting**: Upstash Redis Rate Limiting middleware

---

## Getting Started

### 1. Prerequisites
Ensure you have the following installed on your machine:
- Node.js (v18.18+ or v20+)
- npm / yarn / pnpm
- Supabase CLI (Optional, for local migrations)

### 2. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 3. Environment Setup
Copy the environment variables template and fill in your keys:
```bash
cp .env.local.example .env.local
```
Update `.env.local` with your:
- Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- Gemini API key (`GEMINI_API_KEY`)
- Upstash Redis keys for API rate-limiting

### 4. Database Setup (Supabase)
Run the SQL schema located in `./schema.sql` inside your Supabase SQL Editor. This script will:
- Enable the `uuid-ossp` and `vector` extensions.
- Create all core SaaS database tables (`workspaces`, `startup_reports`, `branding_assets`, etc.).
- Set up automatic triggers to sync authentication profiles.
- Enable **Row Level Security (RLS)** policies on all tables to prevent cross-tenant data leaks.
- Create HNSW indexes on vector embeddings for fast RAG lookups.
- Create Pl/pgSQL procedures for vector similarity match searches.

### 5. Running the App locally
Start the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Core Architecture Highlights

### Multi-Agent Orchestrator (`/lib/agents/orchestrator.ts`)
The AI engine implements a two-stage sequential and parallel execution pattern:
1. **Phase 1 (Parallel)**: Concurrently spins up the **Market Research**, **Branding**, and **Finance** agents to parse feasibility scores, competitive SWOT matrixes, naming options, and expense forecasting.
2. **Phase 2 (Sequential)**: Uses results from Phase 1 to feed context into the **Strategy** and **Marketing** agents to align roadmap tasks and copywriting assets with specific budgets and competitive advantages.
3. **Structured Schemas**: Leverages Gemini SDK structured JSON output capability (`responseMimeType: "application/json"`) matching standard TS schemas.

### Database Row Level Security (RLS)
The database enforces strict tenant isolation:
- Users can only read/write workspaces they own: `auth.uid() = user_id`.
- Child assets check workspace ownership via the `public.is_workspace_owner(workspace_id)` function.
- All service operations bypass RLS strictly when necessary via the `SUPABASE_SERVICE_ROLE_KEY`.

### AI Memory & pgvector RAG
The platform recalls previous ideas and feedback using vector similarity:
- Embedded chunks are indexed using a Cosine Similarity index (`vector_cosine_ops` with HNSW).
- High-speed semantic lookup using the custom DB RPC call `match_workspace_memories`.
