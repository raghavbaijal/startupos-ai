-- StartupOS AI - Database Schema
-- Compatible with Supabase PostgreSQL (pgvector enabled)

-- 1. Enable Required Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector" with schema public;

-- 2. User Profiles Table (extends Supabase Auth)
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text not null,
    full_name text,
    avatar_url text,
    tier text default 'free' check (tier in ('free', 'pro', 'enterprise')),
    credits_remaining integer default 20,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Startup Workspaces Table
create table public.workspaces (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    name text not null,
    industry text not null,
    description text not null,
    budget numeric(12, 2) not null,
    skills text[] default '{}'::text[] not null,
    target_market text not null,
    stage text default 'ideation' check (stage in ('ideation', 'validation', 'branding', 'mvp', 'growth')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. AI Startup Validation & Reports Table
create table public.startup_reports (
    id uuid default gen_random_uuid() primary key,
    workspace_id uuid references public.workspaces(id) on delete cascade not null,
    feasibility_score integer check (feasibility_score >= 0 and feasibility_score <= 100),
    profitability_score integer check (profitability_score >= 0 and profitability_score <= 100),
    difficulty_score integer check (difficulty_score >= 0 and difficulty_score <= 100),
    market_demand text not null,
    competition_summary text not null,
    risk_analysis jsonb default '{}'::jsonb not null,
    swot_analysis jsonb default '{"strengths": [], "weaknesses": [], "opportunities": [], "threats": []}'::jsonb not null,
    market_gaps text[] default '{}'::text[] not null,
    differentiation_strategy text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Competitor Analysis Table
create table public.competitors (
    id uuid default gen_random_uuid() primary key,
    workspace_id uuid references public.workspaces(id) on delete cascade not null,
    name text not null,
    website text,
    market_share text,
    strengths text[] default '{}'::text[] not null,
    weaknesses text[] default '{}'::text[] not null,
    estimated_pricing text,
    differentiation text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Branding Studio Assets Table
create table public.branding_assets (
    id uuid default gen_random_uuid() primary key,
    workspace_id uuid references public.workspaces(id) on delete cascade not null,
    brand_names jsonb default '[]'::jsonb not null, -- Array of objects: { name: string, justification: string, availability: string }
    slogans text[] default '{}'::text[] not null,
    positioning_statement text not null,
    color_palette jsonb default '{}'::jsonb not null, -- { primary: string, secondary: string, accent: string, background: string, scheme_type: string }
    logo_prompts text[] default '{}'::text[] not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Roadmap & Tasks Table
create table public.roadmaps (
    id uuid default gen_random_uuid() primary key,
    workspace_id uuid references public.workspaces(id) on delete cascade not null,
    plan_30_day jsonb default '[]'::jsonb not null, -- Array of weekly objectives & tasks
    plan_90_day jsonb default '[]'::jsonb not null, -- Array of monthly milestones & objectives
    launch_roadmap jsonb default '[]'::jsonb not null, -- Step-by-step launch checklist
    growth_roadmap jsonb default '[]'::jsonb not null, -- Growth channels & targets
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Marketing Engine Table
create table public.marketing_plans (
    id uuid default gen_random_uuid() primary key,
    workspace_id uuid references public.workspaces(id) on delete cascade not null,
    instagram_campaigns jsonb default '[]'::jsonb not null, -- Content copy, hashtags, design prompts
    linkedin_campaigns jsonb default '[]'::jsonb not null,
    email_sequences jsonb default '[]'::jsonb not null, -- Subject, body, trigger schedule
    ad_copy jsonb default '{}'::jsonb not null, -- { google: [], meta: [], linkedin: [] }
    content_calendar jsonb default '[]'::jsonb not null, -- Unified content publishing calendar
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Financial Projections Table
create table public.financial_projections (
    id uuid default gen_random_uuid() primary key,
    workspace_id uuid references public.workspaces(id) on delete cascade not null,
    startup_costs jsonb default '[]'::jsonb not null, -- List of assets/expenses to launch
    revenue_projections jsonb default '[]'::jsonb not null, -- 12-month projections
    break_even_analysis jsonb default '{}'::jsonb not null, -- Monthly overhead vs profit margin calculations
    expense_forecasts jsonb default '[]'::jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Pitch Deck Content Table
create table public.pitch_decks (
    id uuid default gen_random_uuid() primary key,
    workspace_id uuid references public.workspaces(id) on delete cascade not null,
    problem_statement text not null,
    solution text not null,
    market_size jsonb default '{}'::jsonb not null, -- { tam: string, sam: string, som: string }
    business_model text not null,
    go_to_market text not null,
    slides jsonb default '[]'::jsonb not null, -- Structured slides: [{ title: string, content: string, visual_layout_suggestion: string }]
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. AI memory & RAG Store Table (pgvector)
create table public.vector_memories (
    id uuid default gen_random_uuid() primary key,
    workspace_id uuid references public.workspaces(id) on delete cascade not null,
    content text not null,
    embedding vector(768) not null, -- Match size of Google text-embedding-004 model
    metadata jsonb default '{}'::jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. AI Generation logs (Audit & Usage Tracking)
create table public.ai_generation_logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    workspace_id uuid references public.workspaces(id) on delete cascade,
    agent_type text not null,
    prompt_tokens integer default 0,
    completion_tokens integer default 0,
    cost numeric(8, 6) default 0.000000,
    latency_ms integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- =========================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =========================================================================

-- Foreign keys indexes
create index idx_workspaces_user_id on public.workspaces(user_id);
create index idx_reports_workspace_id on public.startup_reports(workspace_id);
create index idx_competitors_workspace_id on public.competitors(workspace_id);
create index idx_branding_workspace_id on public.branding_assets(workspace_id);
create index idx_roadmaps_workspace_id on public.roadmaps(workspace_id);
create index idx_marketing_workspace_id on public.marketing_plans(workspace_id);
create index idx_finance_workspace_id on public.financial_projections(workspace_id);
create index idx_pitch_deck_workspace_id on public.pitch_decks(workspace_id);
create index idx_vector_memories_workspace_id on public.vector_memories(workspace_id);
create index idx_logs_user_id on public.ai_generation_logs(user_id);

-- pgvector Index (HNSW Index for Fast Cosine Similarity Searches)
-- Note: Replace 1536 with 768 if switching to Gemini's native text-embedding-004 model
create index idx_vector_memories_embedding on public.vector_memories 
using hnsw (embedding vector_cosine_ops);


-- =========================================================================
-- SECURITY & ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.startup_reports enable row level security;
alter table public.competitors enable row level security;
alter table public.branding_assets enable row level security;
alter table public.roadmaps enable row level security;
alter table public.marketing_plans enable row level security;
alter table public.financial_projections enable row level security;
alter table public.pitch_decks enable row level security;
alter table public.vector_memories enable row level security;
alter table public.ai_generation_logs enable row level security;

-- 1. Profiles Policies
create policy "Users can read own profile" 
on public.profiles for select 
using (auth.uid() = id);

create policy "Users can update own profile" 
on public.profiles for update 
using (auth.uid() = id);

-- 2. Workspaces Policies
create policy "Users can view their own workspaces" 
on public.workspaces for select 
using (auth.uid() = user_id);

create policy "Users can insert workspaces" 
on public.workspaces for insert 
with check (auth.uid() = user_id);

create policy "Users can update their workspaces" 
on public.workspaces for update 
using (auth.uid() = user_id);

create policy "Users can delete their workspaces" 
on public.workspaces for delete 
using (auth.uid() = user_id);

-- Helper Function to check workspace ownership
create or replace function public.is_workspace_owner(workspace_id uuid)
returns boolean security definer as $$
begin
  return exists (
    select 1 from public.workspaces 
    where id = workspace_id and user_id = auth.uid()
  );
end;
$$ language plpgsql;

-- 3. Startup Reports Policies
create policy "Workspace owners can view reports"
on public.startup_reports for select
using (public.is_workspace_owner(workspace_id));

create policy "Workspace owners can insert reports"
on public.startup_reports for insert
with check (public.is_workspace_owner(workspace_id));

create policy "Workspace owners can update reports"
on public.startup_reports for update
using (public.is_workspace_owner(workspace_id));

-- 4. Competitors Policies
create policy "Workspace owners can view competitors"
on public.competitors for select
using (public.is_workspace_owner(workspace_id));

create policy "Workspace owners can manage competitors"
on public.competitors for all
using (public.is_workspace_owner(workspace_id));

-- 5. Branding Assets Policies
create policy "Workspace owners can view branding assets"
on public.branding_assets for select
using (public.is_workspace_owner(workspace_id));

create policy "Workspace owners can manage branding assets"
on public.branding_assets for all
using (public.is_workspace_owner(workspace_id));

-- 6. Roadmaps Policies
create policy "Workspace owners can view roadmaps"
on public.roadmaps for select
using (public.is_workspace_owner(workspace_id));

create policy "Workspace owners can manage roadmaps"
on public.roadmaps for all
using (public.is_workspace_owner(workspace_id));

-- 7. Marketing Plans Policies
create policy "Workspace owners can view marketing plans"
on public.marketing_plans for select
using (public.is_workspace_owner(workspace_id));

create policy "Workspace owners can manage marketing plans"
on public.marketing_plans for all
using (public.is_workspace_owner(workspace_id));

-- 8. Financial Projections Policies
create policy "Workspace owners can view financial projections"
on public.financial_projections for select
using (public.is_workspace_owner(workspace_id));

create policy "Workspace owners can manage financial projections"
on public.financial_projections for all
using (public.is_workspace_owner(workspace_id));

-- 9. Pitch Decks Policies
create policy "Workspace owners can view pitch decks"
on public.pitch_decks for select
using (public.is_workspace_owner(workspace_id));

create policy "Workspace owners can manage pitch decks"
on public.pitch_decks for all
using (public.is_workspace_owner(workspace_id));

-- 10. Vector Memories Policies
create policy "Workspace owners can view vector memories"
on public.vector_memories for select
using (public.is_workspace_owner(workspace_id));

create policy "Workspace owners can manage vector memories"
on public.vector_memories for all
using (public.is_workspace_owner(workspace_id));

-- 11. AI Logs Policies
create policy "Users can view their own AI logs"
on public.ai_generation_logs for select
using (auth.uid() = user_id);


-- =========================================================================
-- DATABASE FUNCTIONS & TRIGGERS FOR PROFILES
-- =========================================================================

-- Trigger to automatically create a profile after signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, tier, credits_remaining)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    'free',
    20
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- =========================================================================
-- VECTOR SEARCH RAG FUNCTION
-- =========================================================================

-- Function to search vector memories using cosine similarity
create or replace function public.match_workspace_memories (
  query_embedding vector,
  match_threshold float,
  match_count int,
  target_workspace_id uuid
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
security definer
as $$
begin
  return query
  select
    vector_memories.id,
    vector_memories.content,
    vector_memories.metadata,
    1 - (vector_memories.embedding <=> query_embedding) as similarity
  from public.vector_memories
  where vector_memories.workspace_id = target_workspace_id
    and 1 - (vector_memories.embedding <=> query_embedding) > match_threshold
  order by vector_memories.embedding <=> query_embedding
  limit match_count;
end;
$$ language plpgsql;

-- =========================================================================
-- 13. Landing Pages Table
-- =========================================================================
create table public.landing_pages (
    id uuid default gen_random_uuid() primary key,
    workspace_id uuid references public.workspaces(id) on delete cascade not null,
    hero jsonb default '{}'::jsonb not null, -- { title: string, subtitle: string, cta_text: string, cta_url: string }
    features jsonb default '[]'::jsonb not null, -- Array of { title: string, description: string, icon: string }
    pricing jsonb default '[]'::jsonb not null, -- Array of { name: string, price: string, period: string, features: string[], is_popular: boolean, button_text: string }
    testimonials jsonb default '[]'::jsonb not null, -- Array of { name: string, role: string, company: string, content: string }
    faqs jsonb default '[]'::jsonb not null, -- Array of { question: string, answer: string }
    code text not null, -- Raw React/Tailwind component code
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.landing_pages enable row level security;

-- Security Policies
create policy "Workspace owners can view landing pages"
on public.landing_pages for select
using (public.is_workspace_owner(workspace_id));

create policy "Workspace owners can manage landing pages"
on public.landing_pages for all
using (public.is_workspace_owner(workspace_id));

-- Performance Indexes
create index idx_landing_pages_workspace_id on public.landing_pages(workspace_id);


-- =========================================================================
-- 14. MULTI-AGENT TRANSACTIONAL ORCHESTRATOR SAVE FUNCTION
-- =========================================================================

create or replace function public.save_orchestrator_results_v1 (
  target_workspace_id uuid,
  research_json jsonb,
  competitors_json jsonb,
  branding_json jsonb,
  finance_json jsonb,
  strategy_json jsonb,
  marketing_json jsonb,
  vector_memories_json jsonb
)
returns boolean
language plpgsql
security definer
as $$
declare
  item_rec jsonb;
begin
  -- 1. Upsert startup_reports
  update public.startup_reports
  set
    feasibility_score = (research_json->>'feasibility_score')::integer,
    profitability_score = (research_json->>'profitability_score')::integer,
    difficulty_score = (research_json->>'difficulty_score')::integer,
    market_demand = research_json->>'market_demand',
    competition_summary = research_json->>'competition_summary',
    risk_analysis = coalesce(research_json->'risk_analysis', '{}'::jsonb),
    swot_analysis = coalesce(research_json->'swot_analysis', '{"strengths": [], "weaknesses": [], "opportunities": [], "threats": []}'::jsonb),
    market_gaps = coalesce(array(select jsonb_array_elements_text(research_json->'market_gaps')), '{}'::text[]),
    differentiation_strategy = research_json->>'differentiation_strategy',
    updated_at = now()
  where workspace_id = target_workspace_id;

  if not found then
    insert into public.startup_reports (
      workspace_id,
      feasibility_score,
      profitability_score,
      difficulty_score,
      market_demand,
      competition_summary,
      risk_analysis,
      swot_analysis,
      market_gaps,
      differentiation_strategy,
      updated_at
    )
    values (
      target_workspace_id,
      (research_json->>'feasibility_score')::integer,
      (research_json->>'profitability_score')::integer,
      (research_json->>'difficulty_score')::integer,
      research_json->>'market_demand',
      research_json->>'competition_summary',
      coalesce(research_json->'risk_analysis', '{}'::jsonb),
      coalesce(research_json->'swot_analysis', '{"strengths": [], "weaknesses": [], "opportunities": [], "threats": []}'::jsonb),
      coalesce(array(select jsonb_array_elements_text(research_json->'market_gaps')), '{}'::text[]),
      research_json->>'differentiation_strategy',
      now()
    );
  end if;

  -- 2. Competitors: delete existing ones and insert new ones
  delete from public.competitors where workspace_id = target_workspace_id;
  
  if competitors_json is not null and jsonb_typeof(competitors_json) = 'array' then
    for item_rec in select * from jsonb_array_elements(competitors_json) loop
      insert into public.competitors (
        workspace_id,
        name,
        website,
        market_share,
        strengths,
        weaknesses,
        estimated_pricing,
        differentiation,
        created_at
      )
      values (
        target_workspace_id,
        coalesce(item_rec->>'name', 'Unknown Competitor'),
        coalesce(item_rec->>'website', ''),
        coalesce(item_rec->>'market_share', ''),
        coalesce(array(select jsonb_array_elements_text(item_rec->'strengths')), '{}'::text[]),
        coalesce(array(select jsonb_array_elements_text(item_rec->'weaknesses')), '{}'::text[]),
        coalesce(item_rec->>'estimated_pricing', ''),
        coalesce(item_rec->>'differentiation', ''),
        now()
      );
    end loop;
  end if;

  -- 3. Upsert branding_assets
  update public.branding_assets
  set
    brand_names = coalesce(branding_json->'brand_names', '[]'::jsonb),
    slogans = coalesce(array(select jsonb_array_elements_text(branding_json->'slogans')), '{}'::text[]),
    positioning_statement = coalesce(branding_json->>'positioning_statement', ''),
    color_palette = coalesce(branding_json->'color_palette', '{}'::jsonb),
    logo_prompts = coalesce(array(select jsonb_array_elements_text(branding_json->'logo_prompts')), '{}'::text[]),
    updated_at = now()
  where workspace_id = target_workspace_id;

  if not found then
    insert into public.branding_assets (
      workspace_id,
      brand_names,
      slogans,
      positioning_statement,
      color_palette,
      logo_prompts,
      updated_at
    )
    values (
      target_workspace_id,
      coalesce(branding_json->'brand_names', '[]'::jsonb),
      coalesce(array(select jsonb_array_elements_text(branding_json->'slogans')), '{}'::text[]),
      coalesce(branding_json->>'positioning_statement', ''),
      coalesce(branding_json->'color_palette', '{}'::jsonb),
      coalesce(array(select jsonb_array_elements_text(branding_json->'logo_prompts')), '{}'::text[]),
      now()
    );
  end if;

  -- 4. Upsert financial_projections
  update public.financial_projections
  set
    startup_costs = coalesce(finance_json->'startup_costs', '[]'::jsonb),
    revenue_projections = coalesce(finance_json->'revenue_projections', '[]'::jsonb),
    break_even_analysis = coalesce(finance_json->'break_even_analysis', '{}'::jsonb),
    expense_forecasts = coalesce(finance_json->'expense_forecasts', '[]'::jsonb),
    updated_at = now()
  where workspace_id = target_workspace_id;

  if not found then
    insert into public.financial_projections (
      workspace_id,
      startup_costs,
      revenue_projections,
      break_even_analysis,
      expense_forecasts,
      updated_at
    )
    values (
      target_workspace_id,
      coalesce(finance_json->'startup_costs', '[]'::jsonb),
      coalesce(finance_json->'revenue_projections', '[]'::jsonb),
      coalesce(finance_json->'break_even_analysis', '{}'::jsonb),
      coalesce(finance_json->'expense_forecasts', '[]'::jsonb),
      now()
    );
  end if;

  -- 5. Upsert roadmaps
  update public.roadmaps
  set
    plan_30_day = coalesce(strategy_json->'plan_30_day', '[]'::jsonb),
    plan_90_day = coalesce(strategy_json->'plan_90_day', '[]'::jsonb),
    launch_roadmap = coalesce(strategy_json->'launch_roadmap', '[]'::jsonb),
    growth_roadmap = coalesce(strategy_json->'growth_roadmap', '[]'::jsonb),
    updated_at = now()
  where workspace_id = target_workspace_id;

  if not found then
    insert into public.roadmaps (
      workspace_id,
      plan_30_day,
      plan_90_day,
      launch_roadmap,
      growth_roadmap,
      updated_at
    )
    values (
      target_workspace_id,
      coalesce(strategy_json->'plan_30_day', '[]'::jsonb),
      coalesce(strategy_json->'plan_90_day', '[]'::jsonb),
      coalesce(strategy_json->'launch_roadmap', '[]'::jsonb),
      coalesce(strategy_json->'growth_roadmap', '[]'::jsonb),
      now()
    );
  end if;

  -- 6. Upsert marketing_plans
  update public.marketing_plans
  set
    instagram_campaigns = coalesce(marketing_json->'instagram_campaigns', '[]'::jsonb),
    linkedin_campaigns = coalesce(marketing_json->'linkedin_campaigns', '[]'::jsonb),
    email_sequences = coalesce(marketing_json->'email_sequences', '[]'::jsonb),
    ad_copy = coalesce(marketing_json->'ad_copy', '{}'::jsonb),
    content_calendar = coalesce(marketing_json->'content_calendar', '[]'::jsonb),
    updated_at = now()
  where workspace_id = target_workspace_id;

  if not found then
    insert into public.marketing_plans (
      workspace_id,
      instagram_campaigns,
      linkedin_campaigns,
      email_sequences,
      ad_copy,
      content_calendar,
      updated_at
    )
    values (
      target_workspace_id,
      coalesce(marketing_json->'instagram_campaigns', '[]'::jsonb),
      coalesce(marketing_json->'linkedin_campaigns', '[]'::jsonb),
      coalesce(marketing_json->'email_sequences', '[]'::jsonb),
      coalesce(marketing_json->'ad_copy', '{}'::jsonb),
      coalesce(marketing_json->'content_calendar', '[]'::jsonb),
      now()
    );
  end if;

  -- 7. Update workspace stage to 'branding'
  update public.workspaces
  set stage = 'branding',
      updated_at = now()
  where id = target_workspace_id;

  -- 8. Delete previous vector memories generated by agents to prevent duplicates on retry
  delete from public.vector_memories 
  where workspace_id = target_workspace_id 
    and (metadata->>'source') = 'agent_generation';

  -- 9. Vector Memories insertion
  if vector_memories_json is not null and jsonb_typeof(vector_memories_json) = 'array' then
    for item_rec in select * from jsonb_array_elements(vector_memories_json) loop
      insert into public.vector_memories (
        workspace_id,
        content,
        embedding,
        metadata,
        created_at
      )
      values (
        target_workspace_id,
        item_rec->>'content',
        (item_rec->>'embedding')::public.vector,
        coalesce(item_rec->'metadata', '{}'::jsonb),
        now()
      );
    end loop;
  end if;

  return true;
end;
$$;


-- =========================================================================
-- 15. Jobs Table for Asynchronous Orchestration Tracking
-- =========================================================================

create table public.jobs (
    id uuid default gen_random_uuid() primary key,
    workspace_id uuid references public.workspaces(id) on delete cascade not null,
    status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
    progress integer default 0 check (progress >= 0 and progress <= 100),
    current_step text,
    step_status jsonb default '{"research": "pending", "branding": "pending", "finance": "pending", "strategy": "pending", "marketing": "pending"}'::jsonb not null,
    error_message text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.jobs enable row level security;

-- Security Policies
create policy "Workspace owners can view job status"
on public.jobs for select
using (public.is_workspace_owner(workspace_id));

-- Performance Indexes
create index idx_jobs_workspace_id on public.jobs(workspace_id);

-- Concurrency Guard: Enforce single active generation per workspace
create unique index idx_active_workspace_job 
on public.jobs(workspace_id) 
where status in ('pending', 'processing');


-- =========================================================================
-- 16. Uploaded Documents Tracking Table
-- =========================================================================

create table public.documents (
    id uuid default gen_random_uuid() primary key,
    workspace_id uuid references public.workspaces(id) on delete cascade not null,
    name text not null,
    file_path text not null, -- Supabase Storage bucket path
    file_size integer not null, -- in bytes
    mime_type text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.documents enable row level security;

-- Security Policies
create policy "Workspace owners can view documents"
on public.documents for select
using (public.is_workspace_owner(workspace_id));

create policy "Workspace owners can manage documents"
on public.documents for all
using (public.is_workspace_owner(workspace_id));

-- Index for tenancy lookups
create index idx_documents_workspace_id on public.documents(workspace_id);


-- =========================================================================
-- 17. Timeline Events Logging Table (For Workspace History)
-- =========================================================================

create table public.workspace_events (
    id uuid default gen_random_uuid() primary key,
    workspace_id uuid references public.workspaces(id) on delete cascade not null,
    event_type text not null check (event_type in ('creation', 'report', 'branding', 'finance', 'roadmap', 'marketing', 'document', 'chat', 'pitchdeck', 'landingpage')),
    title text not null,
    description text not null,
    metadata jsonb default '{}'::jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.workspace_events enable row level security;

-- Security Policies
create policy "Workspace owners can view events"
on public.workspace_events for select
using (public.is_workspace_owner(workspace_id));

create policy "Workspace owners can insert events"
on public.workspace_events for insert
with check (public.is_workspace_owner(workspace_id));

-- Index for sorting timeline events
create index idx_workspace_events_workspace_id_date on public.workspace_events(workspace_id, created_at desc);


-- =========================================================================
-- 18. Workspace Memberships Table
-- =========================================================================
create table if not exists public.workspace_members (
    id uuid default gen_random_uuid() primary key,
    workspace_id uuid references public.workspaces(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (workspace_id, user_id)
);

alter table public.workspace_members enable row level security;

-- Performance index
create index if not exists idx_workspace_members_user_workspace on public.workspace_members(user_id, workspace_id);

-- =========================================================================
-- 19. Workspace Invitations Table
-- =========================================================================
create table if not exists public.workspace_invitations (
    id uuid default gen_random_uuid() primary key,
    workspace_id uuid references public.workspaces(id) on delete cascade not null,
    email text not null,
    role text not null check (role in ('admin', 'editor', 'viewer')),
    invited_by uuid references public.profiles(id) on delete cascade not null,
    status text default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    expires_at timestamp with time zone default timezone('utc'::text, now() + interval '7 days') not null
);

alter table public.workspace_invitations enable row level security;

-- Performance index
create index if not exists idx_workspace_invitations_email_workspace on public.workspace_invitations(email, workspace_id);

-- =========================================================================
-- 20. Resource Comment Threads Table
-- =========================================================================
create table if not exists public.comments (
    id uuid default gen_random_uuid() primary key,
    workspace_id uuid references public.workspaces(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    resource_type text not null check (resource_type in ('report', 'branding', 'finance', 'roadmap', 'marketing', 'pitchdeck', 'landingpage')),
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.comments enable row level security;

-- Performance index
create index if not exists idx_comments_workspace_resource on public.comments(workspace_id, resource_type);

-- =========================================================================
-- 21. Workspace Module Snapshot Versions Table (For Rollbacks)
-- =========================================================================
create table if not exists public.workspace_versions (
    id uuid default gen_random_uuid() primary key,
    workspace_id uuid references public.workspaces(id) on delete cascade not null,
    created_by uuid references public.profiles(id) on delete cascade not null,
    version_type text not null check (version_type in ('branding', 'marketing', 'finance')),
    data jsonb not null,
    version_number integer not null,
    label text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.workspace_versions enable row level security;

-- Performance index
create index if not exists idx_workspace_versions_workspace_type on public.workspace_versions(workspace_id, version_type);

-- =========================================================================
-- SECURITY CHECKS & RLS POLICIES FOR COLLABORATORS
-- =========================================================================

-- Redefine role check function
create or replace function public.has_workspace_role(workspace_id uuid, min_role text)
returns boolean security definer as $$
declare
  actual_role text;
begin
  -- 1. Owner creator check
  if exists (select 1 from public.workspaces where id = workspace_id and user_id = auth.uid()) then
    actual_role := 'owner';
  else
    -- 2. Membership query
    select role into actual_role from public.workspace_members
    where workspace_members.workspace_id = has_workspace_role.workspace_id and workspace_members.user_id = auth.uid();
  end if;

  if actual_role is null then
    return false;
  end if;

  -- 3. Check role hierarchy
  if min_role = 'viewer' then
    return actual_role in ('owner', 'admin', 'editor', 'viewer');
  elsif min_role = 'editor' then
    return actual_role in ('owner', 'admin', 'editor');
  elsif min_role = 'admin' then
    return actual_role in ('owner', 'admin');
  elsif min_role = 'owner' then
    return actual_role = 'owner';
  end if;
  return false;
end;
$$ language plpgsql;

-- Alter workspace_events table to include logging user_id
alter table public.workspace_events add column if not exists user_id uuid references public.profiles(id) on delete set null;

-- Rebuild Workspaces table RLS policies
drop policy if exists "Users can view their own workspaces" on public.workspaces;
drop policy if exists "Users can update their workspaces" on public.workspaces;
drop policy if exists "Users can delete their workspaces" on public.workspaces;

create policy "Workspace members can view workspaces" on public.workspaces for select 
using (auth.uid() = user_id or exists (select 1 from public.workspace_members where workspace_members.workspace_id = workspaces.id and workspace_members.user_id = auth.uid()));

create policy "Workspace admins can update workspaces" on public.workspaces for update 
using (auth.uid() = user_id or exists (select 1 from public.workspace_members where workspace_members.workspace_id = workspaces.id and workspace_members.user_id = auth.uid() and role in ('owner', 'admin')));

create policy "Workspace owners can delete workspaces" on public.workspaces for delete 
using (auth.uid() = user_id);

-- Drop and Rebuild RLS Policies for Core Tables
drop policy if exists "Workspace owners can view reports" on public.startup_reports;
drop policy if exists "Workspace owners can insert reports" on public.startup_reports;
drop policy if exists "Workspace owners can update reports" on public.startup_reports;
create policy "Members can view reports" on public.startup_reports for select using (public.has_workspace_role(workspace_id, 'viewer'));
create policy "Editors can manage reports" on public.startup_reports for all using (public.has_workspace_role(workspace_id, 'editor'));

drop policy if exists "Workspace owners can view competitors" on public.competitors;
drop policy if exists "Workspace owners can manage competitors" on public.competitors;
create policy "Members can view competitors" on public.competitors for select using (public.has_workspace_role(workspace_id, 'viewer'));
create policy "Editors can manage competitors" on public.competitors for all using (public.has_workspace_role(workspace_id, 'editor'));

drop policy if exists "Workspace owners can view branding assets" on public.branding_assets;
drop policy if exists "Workspace owners can manage branding assets" on public.branding_assets;
create policy "Members can view branding assets" on public.branding_assets for select using (public.has_workspace_role(workspace_id, 'viewer'));
create policy "Editors can manage branding assets" on public.branding_assets for all using (public.has_workspace_role(workspace_id, 'editor'));

drop policy if exists "Workspace owners can view roadmaps" on public.roadmaps;
drop policy if exists "Workspace owners can manage roadmaps" on public.roadmaps;
create policy "Members can view roadmaps" on public.roadmaps for select using (public.has_workspace_role(workspace_id, 'viewer'));
create policy "Editors can manage roadmaps" on public.roadmaps for all using (public.has_workspace_role(workspace_id, 'editor'));

drop policy if exists "Workspace owners can view marketing plans" on public.marketing_plans;
drop policy if exists "Workspace owners can manage marketing plans" on public.marketing_plans;
create policy "Members can view marketing plans" on public.marketing_plans for select using (public.has_workspace_role(workspace_id, 'viewer'));
create policy "Editors can manage marketing plans" on public.marketing_plans for all using (public.has_workspace_role(workspace_id, 'editor'));

drop policy if exists "Workspace owners can view financial projections" on public.financial_projections;
drop policy if exists "Workspace owners can manage financial projections" on public.financial_projections;
create policy "Members can view financial projections" on public.financial_projections for select using (public.has_workspace_role(workspace_id, 'viewer'));
create policy "Editors can manage financial projections" on public.financial_projections for all using (public.has_workspace_role(workspace_id, 'editor'));

drop policy if exists "Workspace owners can view pitch decks" on public.pitch_decks;
drop policy if exists "Workspace owners can manage pitch decks" on public.pitch_decks;
create policy "Members can view pitch decks" on public.pitch_decks for select using (public.has_workspace_role(workspace_id, 'viewer'));
create policy "Editors can manage pitch decks" on public.pitch_decks for all using (public.has_workspace_role(workspace_id, 'editor'));

drop policy if exists "Workspace owners can view vector memories" on public.vector_memories;
drop policy if exists "Workspace owners can manage vector memories" on public.vector_memories;
create policy "Members can view vector memories" on public.vector_memories for select using (public.has_workspace_role(workspace_id, 'viewer'));
create policy "Editors can manage vector memories" on public.vector_memories for all using (public.has_workspace_role(workspace_id, 'editor'));

drop policy if exists "Workspace owners can view landing pages" on public.landing_pages;
drop policy if exists "Workspace owners can manage landing pages" on public.landing_pages;
create policy "Members can view landing pages" on public.landing_pages for select using (public.has_workspace_role(workspace_id, 'viewer'));
create policy "Editors can manage landing pages" on public.landing_pages for all using (public.has_workspace_role(workspace_id, 'editor'));

drop policy if exists "Workspace owners can view job status" on public.jobs;
create policy "Members can view job status" on public.jobs for select using (public.has_workspace_role(workspace_id, 'viewer'));

drop policy if exists "Workspace owners can view documents" on public.documents;
drop policy if exists "Workspace owners can manage documents" on public.documents;
create policy "Members can view documents" on public.documents for select using (public.has_workspace_role(workspace_id, 'viewer'));
create policy "Editors can manage documents" on public.documents for all using (public.has_workspace_role(workspace_id, 'editor'));

drop policy if exists "Workspace owners can view events" on public.workspace_events;
drop policy if exists "Workspace owners can insert events" on public.workspace_events;
create policy "Members can view events" on public.workspace_events for select using (public.has_workspace_role(workspace_id, 'viewer'));
create policy "Members can insert events" on public.workspace_events for insert with check (public.has_workspace_role(workspace_id, 'viewer'));

-- RLS for workspace_members
create policy "Members can view workspace memberships" on public.workspace_members for select using (public.has_workspace_role(workspace_id, 'viewer'));
create policy "Admins can manage workspace memberships" on public.workspace_members for all using (public.has_workspace_role(workspace_id, 'admin'));

-- RLS for workspace_invitations
create policy "Members can view workspace invitations" on public.workspace_invitations for select using (public.has_workspace_role(workspace_id, 'viewer'));
create policy "Admins can manage workspace invitations" on public.workspace_invitations for all using (public.has_workspace_role(workspace_id, 'admin'));

-- RLS for comments
create policy "Members can view comments" on public.comments for select using (public.has_workspace_role(workspace_id, 'viewer'));
create policy "Members can create comments" on public.comments for insert with check (public.has_workspace_role(workspace_id, 'viewer') and auth.uid() = user_id);
create policy "Admins or authors can delete comments" on public.comments for delete using (public.has_workspace_role(workspace_id, 'admin') or auth.uid() = user_id);

-- RLS for workspace_versions
create policy "Members can view versions" on public.workspace_versions for select using (public.has_workspace_role(workspace_id, 'viewer'));
create policy "Editors can create versions" on public.workspace_versions for insert with check (public.has_workspace_role(workspace_id, 'editor') and auth.uid() = created_by);

-- =========================================================================
-- 22. Subscriptions Table (Stripe-ready & Razorpay-native)
-- =========================================================================
create table if not exists public.subscriptions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    plan_type text not null check (plan_type in ('free', 'pro', 'team')),
    status text not null check (status in ('active', 'inactive', 'canceled', 'trialing')),
    razorpay_subscription_id text unique,
    stripe_subscription_id text unique,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id)
);

alter table public.subscriptions enable row level security;

create policy "Users can view their own subscription"
    on public.subscriptions for select using (auth.uid() = user_id);

-- Add file_size to public.documents for storage limits checks
alter table public.documents add column if not exists file_size integer default 0;

-- 23. Extra Policies
create policy "Admins can insert jobs" on public.jobs for insert with check (public.has_workspace_role(workspace_id, 'admin'));



