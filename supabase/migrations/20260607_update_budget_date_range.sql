alter table public.budgets
  add column if not exists start_date date,
  add column if not exists end_date date;

update public.budgets
set
  start_date = coalesce(start_date, month, current_date),
  end_date = coalesce(
    end_date,
    (date_trunc('month', coalesce(month, current_date)) +
      interval '1 month - 1 day')::date
  );

alter table public.budgets
  alter column start_date set not null,
  alter column end_date set not null;

do $migration$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'budgets_date_range_check'
  ) then
    alter table public.budgets
      add constraint budgets_date_range_check
      check (start_date <= end_date);
  end if;
end
$migration$;

alter table public.budgets
  drop constraint if exists budgets_category_id_month_key;

do $migration$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'budgets_category_id_start_date_end_date_key'
  ) then
    alter table public.budgets
      add constraint budgets_category_id_start_date_end_date_key
      unique (category_id, start_date, end_date);
  end if;
end
$migration$;

create index if not exists budgets_date_range_idx
  on public.budgets (start_date, end_date);

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
    id, category_id, month, start_date, end_date, amount, created_at, updated_at
  )
  select id, category_id,
    coalesce(month, date_trunc('month', coalesce(start_date, current_date))::date),
    coalesce(start_date, month, current_date),
    coalesce(
      end_date,
      (date_trunc('month', coalesce(month, start_date, current_date)) +
        interval '1 month - 1 day')::date
    ),
    amount, created_at, updated_at
  from jsonb_to_recordset(payload #> '{data,budgets}')
    as x(
      id uuid, category_id uuid, month date, start_date date, end_date date,
      amount numeric, created_at timestamptz, updated_at timestamptz
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
