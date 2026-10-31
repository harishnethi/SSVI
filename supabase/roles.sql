-- SSVI website: admin, worker and customer accounts, attendance, paddy -> murmura production.
-- Run this after schema.sql, in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- It is safe to re-run.

-- ---------------------------------------------------------------------------
-- Profiles: one per login. role decides what the person can see.
--   admin    - everything
--   worker   - attendance, upcoming orders, stock in/out, production
--   customer - own orders, invoices, dues; price list; place orders
--   none     - signed up but not given access yet
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'none' check (role in ('admin','worker','customer','none')),
  full_name text not null default '',
  phone text default '',
  customer_id uuid references customers(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz default now()
);

create or replace function my_role() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select role from profiles where id = auth.uid() and active), 'none')
$$;

create or replace function my_customer_id() returns uuid
language sql stable security definer set search_path = public as $$
  select customer_id from profiles where id = auth.uid() and role = 'customer' and active
$$;

-- New logins. Customers sign up themselves (signup = 'customer', or "Continue with Google") and get a
-- customer record. Every other new login starts with role 'none' until an admin gives it a role,
-- so nobody can make themselves an admin or worker from the sign-up form.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  -- Google fills in full_name / name; our sign-up form sends name.
  nm text := coalesce(nullif(meta->>'name', ''), nullif(meta->>'full_name', ''), '');
  via_google boolean := coalesce(new.raw_app_meta_data->>'provider', 'email') <> 'email';
  cid uuid;
begin
  if meta->>'signup' = 'customer' or via_google then
    insert into customers (name, phone, email, address, gstin, state, created_by)
    values (coalesce(nullif(nm, ''), new.email), coalesce(meta->>'phone', ''), new.email,
            coalesce(meta->>'address', ''), upper(coalesce(meta->>'gstin', '')), coalesce(meta->>'state', ''), new.id)
    returning id into cid;
    insert into profiles (id, role, full_name, phone, customer_id)
    values (new.id, 'customer', nm, coalesce(meta->>'phone', ''), cid);
  else
    insert into profiles (id, role, full_name, phone)
    values (new.id, 'none', nm, coalesce(meta->>'phone', ''));
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Logins that existed before this file (the owner) become admins.
insert into profiles (id, role, full_name)
select id, 'admin', coalesce(raw_user_meta_data->>'name', '') from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Products: 'finished' = murmura you sell, 'raw' = paddy and other inputs.
-- ---------------------------------------------------------------------------
alter table products add column if not exists kind text not null default 'finished'
  check (kind in ('finished','raw'));

alter table stock_movements drop constraint if exists stock_movements_reason_check;
alter table stock_movements add constraint stock_movements_reason_check
  check (reason in ('purchase','production','sale','adjustment','return','consumed'));

-- Workers record stock changes, so the stock trigger must update products on their behalf.
alter function apply_stock_movement() security definer;
alter function apply_stock_movement() set search_path = public;
alter function apply_payment() security definer;
alter function apply_payment() set search_path = public;

-- ---------------------------------------------------------------------------
-- Orders placed by customers on the website wait for the admin to confirm.
-- ---------------------------------------------------------------------------
alter table orders add column if not exists placed_by_customer boolean not null default false;

-- p = { notes, delivery_date, items: [{product_id, qty}] }. Prices come from the product list.
create or replace function place_order(p jsonb) returns orders
language plpgsql security definer set search_path = public as $$
declare
  o orders;
  it jsonb;
  pr products;
  q numeric;
  tot numeric := 0;
  cid uuid := my_customer_id();
begin
  if cid is null then raise exception 'Only customer accounts can place orders here'; end if;
  if jsonb_array_length(coalesce(p->'items', '[]'::jsonb)) = 0 then raise exception 'Add at least one item'; end if;

  insert into orders (order_no, customer_id, delivery_date, notes, placed_by_customer)
  values (next_number('order', 'SO-'), cid, nullif(p->>'delivery_date', '')::date, coalesce(p->>'notes', ''), true)
  returning * into o;

  for it in select * from jsonb_array_elements(p->'items') loop
    select * into pr from products where id = (it->>'product_id')::uuid and kind = 'finished';
    if not found then raise exception 'Product not found'; end if;
    q := (it->>'qty')::numeric;
    if q is null or q <= 0 then raise exception 'Quantity must be more than 0'; end if;
    insert into order_items (order_id, product_id, description, hsn, unit, qty, rate, gst_rate)
    values (o.id, pr.id, pr.name, pr.hsn, pr.unit, q, pr.price, pr.gst_rate);
    tot := tot + round(q * pr.price, 2);
  end loop;

  update orders set total = tot where id = o.id returning * into o;
  return o;
end $$;

-- ---------------------------------------------------------------------------
-- Production: paddy used -> murmura made. Records both stock changes.
-- ---------------------------------------------------------------------------
create table if not exists production_runs (
  id uuid primary key default gen_random_uuid(),
  run_date date not null default current_date,
  paddy_id uuid not null references products(id),
  paddy_qty numeric(12,3) not null check (paddy_qty > 0),
  product_id uuid not null references products(id),
  qty numeric(12,3) not null check (qty > 0),
  note text default '',
  created_at timestamptz default now(),
  created_by uuid default auth.uid()
);

-- p = { run_date, paddy_id, paddy_qty, product_id, qty, note }
create or replace function record_production(p jsonb) returns production_runs
language plpgsql security definer set search_path = public as $$
declare r production_runs;
begin
  if my_role() not in ('admin','worker') then raise exception 'Not allowed'; end if;
  insert into production_runs (run_date, paddy_id, paddy_qty, product_id, qty, note)
  values (coalesce(nullif(p->>'run_date', '')::date, current_date), (p->>'paddy_id')::uuid, (p->>'paddy_qty')::numeric,
          (p->>'product_id')::uuid, (p->>'qty')::numeric, coalesce(p->>'note', ''))
  returning * into r;
  insert into stock_movements (product_id, qty, reason, ref_id, note) values
    (r.paddy_id, -r.paddy_qty, 'consumed', r.id, 'Used for production'),
    (r.product_id, r.qty, 'production', r.id, 'Made from paddy');
  return r;
end $$;

-- ---------------------------------------------------------------------------
-- Attendance: workers check in / out for today; admins can edit any day.
-- ---------------------------------------------------------------------------
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references profiles(id) on delete cascade,
  work_date date not null default current_date,
  status text not null default 'present' check (status in ('present','half_day','absent','leave')),
  check_in timestamptz,
  check_out timestamptz,
  note text default '',
  unique (worker_id, work_date)
);

-- action = 'in' or 'out'
create or replace function mark_attendance(action text) returns attendance
language plpgsql security definer set search_path = public as $$
declare a attendance;
begin
  if my_role() <> 'worker' then raise exception 'Only workers mark attendance'; end if;
  if action = 'in' then
    insert into attendance (worker_id, work_date, status, check_in)
    values (auth.uid(), current_date, 'present', now())
    on conflict (worker_id, work_date) do update set check_in = coalesce(attendance.check_in, now()), status = 'present'
    returning * into a;
  elsif action = 'out' then
    update attendance set check_out = now()
     where worker_id = auth.uid() and work_date = current_date
    returning * into a;
    if not found then raise exception 'Check in first'; end if;
  else
    raise exception 'Unknown action';
  end if;
  return a;
end $$;

-- ---------------------------------------------------------------------------
-- Public website: product names and business contact, without prices.
-- ---------------------------------------------------------------------------
create or replace function public_catalog()
returns table (name text, unit text, hsn text)
language sql stable security definer set search_path = public as $$
  select name, unit, hsn from products where kind = 'finished' order by name
$$;

create or replace function public_business()
returns table (business_name text, address text, phone text, email text)
language sql stable security definer set search_path = public as $$
  select business_name, address, phone, email from settings where id = 1
$$;

grant execute on function public_catalog() to anon, authenticated;
grant execute on function public_business() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row level security by role. Replaces the earlier "any signed-in user" rule.
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table production_runs enable row level security;
alter table attendance enable row level security;

do $$
declare t text;
begin
  foreach t in array array['settings','counters','customers','products','stock_movements','orders','order_items',
                           'invoices','invoice_items','payments','profiles','production_runs','attendance'] loop
    execute format('drop policy if exists staff_all on %I', t);
    execute format('drop policy if exists admin_all on %I', t);
    execute format('create policy admin_all on %I for all to authenticated using (my_role() = ''admin'') with check (my_role() = ''admin'')', t);
  end loop;
end $$;

drop policy if exists read_settings on settings;
create policy read_settings on settings for select to authenticated using (true);

drop policy if exists worker_read on customers;
create policy worker_read on customers for select to authenticated using (my_role() = 'worker');
drop policy if exists customer_own on customers;
create policy customer_own on customers for select to authenticated using (id = my_customer_id());
drop policy if exists customer_update_own on customers;
create policy customer_update_own on customers for update to authenticated
  using (id = my_customer_id()) with check (id = my_customer_id());

drop policy if exists worker_read on products;
create policy worker_read on products for select to authenticated using (my_role() = 'worker');
drop policy if exists customer_read on products;
create policy customer_read on products for select to authenticated using (my_role() = 'customer' and kind = 'finished');

drop policy if exists worker_read on stock_movements;
create policy worker_read on stock_movements for select to authenticated using (my_role() = 'worker');
drop policy if exists worker_insert on stock_movements;
create policy worker_insert on stock_movements for insert to authenticated
  with check (my_role() = 'worker' and reason in ('purchase','production','adjustment'));

drop policy if exists worker_read on orders;
create policy worker_read on orders for select to authenticated using (my_role() = 'worker');
drop policy if exists customer_own on orders;
create policy customer_own on orders for select to authenticated using (customer_id = my_customer_id());

drop policy if exists worker_read on order_items;
create policy worker_read on order_items for select to authenticated using (my_role() = 'worker');
drop policy if exists customer_own on order_items;
create policy customer_own on order_items for select to authenticated
  using (exists (select 1 from orders o where o.id = order_id and o.customer_id = my_customer_id()));

drop policy if exists customer_own on invoices;
create policy customer_own on invoices for select to authenticated using (customer_id = my_customer_id());
drop policy if exists customer_own on invoice_items;
create policy customer_own on invoice_items for select to authenticated
  using (exists (select 1 from invoices i where i.id = invoice_id and i.customer_id = my_customer_id()));
drop policy if exists customer_own on payments;
create policy customer_own on payments for select to authenticated
  using (exists (select 1 from invoices i where i.id = invoice_id and i.customer_id = my_customer_id()));

drop policy if exists worker_read on production_runs;
create policy worker_read on production_runs for select to authenticated using (my_role() = 'worker');

drop policy if exists own_read on attendance;
create policy own_read on attendance for select to authenticated using (worker_id = auth.uid());

drop policy if exists own_read on profiles;
create policy own_read on profiles for select to authenticated using (id = auth.uid());

create index if not exists idx_attendance_date on attendance(work_date);
create index if not exists idx_production_date on production_runs(run_date);
