-- Run in Supabase SQL Editor. Link Stripe Checkout customer email to VIP rows (webhook or manual).

create table if not exists public.vip_members (
  email text primary key,
  stripe_customer_id text,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.vip_members enable row level security;

create policy "Users read own VIP row"
  on public.vip_members
  for select
  to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Example: grant VIP after Stripe payment (replace email)
-- insert into public.vip_members (email, active) values ('user@example.com', true)
-- on conflict (email) do update set active = true, updated_at = now();
