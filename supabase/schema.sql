create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  type text not null check (type in ('income', 'expense')),
  payment_method text not null default 'non_cash'
    check (payment_method in ('cash', 'non_cash')),
  color text not null default '#70e1b0',
  icon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, type, payment_method)
);

alter table public.categories
  add column if not exists payment_method text not null default 'non_cash';

do $migration$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'categories_payment_method_check'
  ) then
    alter table public.categories
      add constraint categories_payment_method_check
      check (payment_method in ('cash', 'non_cash'));
  end if;
end
$migration$;

alter table public.categories
  drop constraint if exists categories_name_type_key;

do $migration$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'categories_name_type_payment_method_key'
  ) then
    alter table public.categories
      add constraint categories_name_type_payment_method_key
      unique (name, type, payment_method);
  end if;
end
$migration$;

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 80),
  type text not null,
  initial_balance numeric(18,2) not null default 0 check (initial_balance >= 0),
  color text not null default '#70e1b0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('income', 'expense')),
  amount numeric(18,2) not null check (amount > 0),
  description text not null check (char_length(description) between 1 and 180),
  transaction_date date not null default current_date,
  notes text,
  attachment_path text,
  attachment_name text,
  attachment_type text check (
    attachment_type is null or attachment_type in (
      'image/jpeg', 'image/png', 'image/webp', 'application/pdf'
    )
  ),
  attachment_size bigint check (
    attachment_size is null or attachment_size between 1 and 10485760
  ),
  category_id uuid not null references public.categories(id) on delete restrict,
  wallet_id uuid not null references public.wallets(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions
  add column if not exists attachment_path text,
  add column if not exists attachment_name text,
  add column if not exists attachment_type text,
  add column if not exists attachment_size bigint;

do $migration$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'transactions_attachment_type_check'
  ) then
    alter table public.transactions
      add constraint transactions_attachment_type_check
      check (
        attachment_type is null or attachment_type in (
          'image/jpeg', 'image/png', 'image/webp', 'application/pdf'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'transactions_attachment_size_check'
  ) then
    alter table public.transactions
      add constraint transactions_attachment_size_check
      check (
        attachment_size is null or attachment_size between 1 and 10485760
      );
  end if;
end
$migration$;

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'transaction-attachments',
  'transaction-attachments',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  month date not null check (date_trunc('month', month)::date = month),
  amount numeric(18,2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, month)
);

create table if not exists public.wallet_transfers (
  id uuid primary key default gen_random_uuid(),
  from_wallet_id uuid not null references public.wallets(id) on delete restrict,
  to_wallet_id uuid not null references public.wallets(id) on delete restrict,
  amount numeric(18,2) not null check (amount > 0),
  fee numeric(18,2) not null default 0 check (fee >= 0),
  transfer_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_wallet_id <> to_wallet_id)
);

create table if not exists public.payment_reminders (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  due_date date not null,
  amount numeric(18,2) check (amount is null or amount > 0),
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'paid')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'pending' and paid_at is null) or
    (status = 'paid' and paid_at is not null)
  )
);

create index if not exists transactions_date_idx
  on public.transactions (transaction_date desc);
create index if not exists transactions_wallet_idx
  on public.transactions (wallet_id);
create index if not exists transactions_category_idx
  on public.transactions (category_id);
create index if not exists budgets_month_idx
  on public.budgets (month);
create index if not exists wallet_transfers_date_idx
  on public.wallet_transfers (transfer_date desc);
create index if not exists payment_reminders_status_due_date_idx
  on public.payment_reminders (status, due_date);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists wallets_set_updated_at on public.wallets;
create trigger wallets_set_updated_at
before update on public.wallets
for each row execute function public.set_updated_at();

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

drop trigger if exists budgets_set_updated_at on public.budgets;
create trigger budgets_set_updated_at
before update on public.budgets
for each row execute function public.set_updated_at();

drop trigger if exists wallet_transfers_set_updated_at on public.wallet_transfers;
create trigger wallet_transfers_set_updated_at
before update on public.wallet_transfers
for each row execute function public.set_updated_at();

drop trigger if exists payment_reminders_set_updated_at on public.payment_reminders;
create trigger payment_reminders_set_updated_at
before update on public.payment_reminders
for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.wallet_transfers enable row level security;
alter table public.payment_reminders enable row level security;

-- Tidak ada policy publik. Aplikasi mengakses tabel hanya melalui server
-- menggunakan service role key, yang melewati RLS.

create or replace function public.restore_finance_backup(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce((payload ->> 'version')::int, 0) <> 1 then
    raise exception 'Versi backup tidak didukung';
  end if;

  delete from payment_reminders;
  delete from wallet_transfers;
  delete from budgets;
  delete from transactions;
  delete from wallets;
  delete from categories;

  insert into categories (
    id, name, type, payment_method, color, icon, created_at, updated_at
  )
  select id, name, type, coalesce(payment_method, 'non_cash'),
    color, icon, created_at, updated_at
  from jsonb_to_recordset(payload #> '{data,categories}')
    as x(
      id uuid, name text, type text, payment_method text, color text, icon text,
      created_at timestamptz, updated_at timestamptz
    );

  insert into wallets (id, name, type, initial_balance, color, created_at, updated_at)
  select id, name, type, initial_balance, color, created_at, updated_at
  from jsonb_to_recordset(payload #> '{data,wallets}')
    as x(id uuid, name text, type text, initial_balance numeric, color text, created_at timestamptz, updated_at timestamptz);

  insert into transactions (
    id, type, amount, description, transaction_date, notes, attachment_path,
    attachment_name, attachment_type, attachment_size,
    category_id, wallet_id, created_at, updated_at
  )
  select id, type, amount, description, transaction_date, notes,
    attachment_path, attachment_name, attachment_type, attachment_size,
    category_id, wallet_id, created_at, updated_at
  from jsonb_to_recordset(payload #> '{data,transactions}')
    as x(
      id uuid, type text, amount numeric, description text, transaction_date date,
      notes text, attachment_path text, attachment_name text,
      attachment_type text, attachment_size bigint, category_id uuid,
      wallet_id uuid, created_at timestamptz, updated_at timestamptz
    );

  insert into budgets (id, category_id, month, amount, created_at, updated_at)
  select id, category_id, month, amount, created_at, updated_at
  from jsonb_to_recordset(payload #> '{data,budgets}')
    as x(id uuid, category_id uuid, month date, amount numeric, created_at timestamptz, updated_at timestamptz);

  insert into wallet_transfers (
    id, from_wallet_id, to_wallet_id, amount, fee, transfer_date,
    notes, created_at, updated_at
  )
  select id, from_wallet_id, to_wallet_id, amount, fee, transfer_date,
    notes, created_at, updated_at
  from jsonb_to_recordset(payload #> '{data,wallet_transfers}')
    as x(
      id uuid, from_wallet_id uuid, to_wallet_id uuid, amount numeric, fee numeric,
      transfer_date date, notes text, created_at timestamptz, updated_at timestamptz
    );

  insert into payment_reminders (
    id, title, due_date, amount, notes, status, paid_at, created_at, updated_at
  )
  select id, title, due_date, amount, notes, status, paid_at,
    created_at, updated_at
  from jsonb_to_recordset(
    coalesce(payload #> '{data,payment_reminders}', '[]'::jsonb)
  )
    as x(
      id uuid, title text, due_date date, amount numeric, notes text,
      status text, paid_at timestamptz, created_at timestamptz,
      updated_at timestamptz
    );
end;
$$;

revoke all on function public.restore_finance_backup(jsonb) from public;
revoke all on function public.restore_finance_backup(jsonb) from anon;
revoke all on function public.restore_finance_backup(jsonb) from authenticated;
grant execute on function public.restore_finance_backup(jsonb) to service_role;
