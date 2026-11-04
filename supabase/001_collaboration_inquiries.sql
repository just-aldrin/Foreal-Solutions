-- Run this once in the Supabase SQL Editor for the foreal-solutions project
-- (gdpcwvcfhvzediqmeqmw): https://supabase.com/dashboard/project/gdpcwvcfhvzediqmeqmw/sql/new
--
-- Creates the table the "collaboration inquiry" form on the landing page
-- writes to. Anonymous visitors can only INSERT (submit a form) -- nobody
-- can read, update, or delete rows with the public anon/publishable key.
-- Read the submissions from the Table Editor (logged in as the project
-- owner) or with the service_role key from a trusted server.

create table if not exists public.collaboration_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  project text not null,
  details text not null,
  created_at timestamptz not null default now()
);

alter table public.collaboration_inquiries enable row level security;

drop policy if exists "Anyone can submit an inquiry" on public.collaboration_inquiries;
create policy "Anyone can submit an inquiry"
  on public.collaboration_inquiries
  for insert
  to anon
  with check (true);
