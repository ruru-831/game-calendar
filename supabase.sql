create table if not exists public.friend_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_date date not null,
  start_time time not null,
  end_time time,
  friend_name text not null,
  memo text default '',
  reminder_minutes integer not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.friend_events enable row level security;

create policy "Users can read their own events"
on public.friend_events
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own events"
on public.friend_events
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own events"
on public.friend_events
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own events"
on public.friend_events
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_friend_events_updated_at on public.friend_events;

create trigger set_friend_events_updated_at
before update on public.friend_events
for each row
execute function public.set_updated_at();
