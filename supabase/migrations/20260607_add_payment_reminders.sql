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

drop trigger if exists payment_reminders_set_updated_at
  on public.payment_reminders;
create trigger payment_reminders_set_updated_at
before update on public.payment_reminders
for each row execute function public.set_updated_at();

alter table public.payment_reminders enable row level security;

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

  insert into wallets (
    id, name, type, initial_balance, color, created_at, updated_at
  )
  select id, name, type, initial_balance, color, created_at, updated_at
  from jsonb_to_recordset(payload #> '{data,wallets}')
    as x(
      id uuid, name text, type text, initial_balance numeric, color text,
      created_at timestamptz, updated_at timestamptz
    );

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
      id uuid, type text, amount numeric, description text,
      transaction_date date, notes text, attachment_path text,
      attachment_name text, attachment_type text, attachment_size bigint,
      category_id uuid, wallet_id uuid, created_at timestamptz,
      updated_at timestamptz
    );

  insert into budgets (
    id, category_id, month, amount, created_at, updated_at
  )
  select id, category_id, month, amount, created_at, updated_at
  from jsonb_to_recordset(payload #> '{data,budgets}')
    as x(
      id uuid, category_id uuid, month date, amount numeric,
      created_at timestamptz, updated_at timestamptz
    );

  insert into wallet_transfers (
    id, from_wallet_id, to_wallet_id, amount, fee, transfer_date,
    notes, created_at, updated_at
  )
  select id, from_wallet_id, to_wallet_id, amount, fee, transfer_date,
    notes, created_at, updated_at
  from jsonb_to_recordset(payload #> '{data,wallet_transfers}')
    as x(
      id uuid, from_wallet_id uuid, to_wallet_id uuid, amount numeric,
      fee numeric, transfer_date date, notes text,
      created_at timestamptz, updated_at timestamptz
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

notify pgrst, 'reload schema';
