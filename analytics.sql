-- Create analytics tracking tables
create table if not exists public.analytics_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  anonymous_id text,
  event_type text not null, -- 'page_view', 'signup', 'workspace_create', 'ai_generation', 'document_upload', 'team_invite', 'feature_use', 'returning_user'
  event_name text not null,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index events for faster reporting on funnel queries
create index if not exists idx_analytics_events_type_name on public.analytics_events(event_type, event_name);
create index if not exists idx_analytics_events_user_id on public.analytics_events(user_id);
create index if not exists idx_analytics_events_created_at on public.analytics_events(created_at);
