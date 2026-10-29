-- SSVI database schema for Supabase (Postgres).
-- Run this whole file once in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- It is safe to re-run: objects are created only if missing / replaced.

-- ---------------------------------------------------------------------------
-- Business settings (single row)
-- ---------------------------------------------------------------------------
create table if not exists settings (
  id int primary key default 1 check (id = 1),
  business_name text not null default 'SSVI',
  address text default '',
  phone text default '',
  email text default '',
  gstin text default '',
  state text default '',
  bank_details text default '',
  invoice_terms text default 'Goods once sold will not be taken back.',
  updated_at timestamptz default now()
);
insert into settings (id) values (1) on conflict (id) do nothing;

-- Running counters for document numbers (INV-0001, BILL-0001, SO-0001)
create table if not exists counters (
  name text primary key,
  value int not null default 0
);
insert into counters (name) values ('gst_invoice'), ('bill'), ('order')
  on conflict (name) do nothing;

create or replace function next_number(counter_name text, prefix text)
returns text language plpgsql as $$
declare v int;
begin
  update counters set value = value + 1 where name = counter_name returning value into v;
  return prefix || lpad(v::text, 4, '0');
end $$;

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text default '',
  email text default '',
  address text default '',
  gstin text default '',
  state text default '',
  notes text default '',
  created_at timestamptz default now(),
  created_by uuid default auth.uid()
);

-- ---------------------------------------------------------------------------
-- Products & stock
-- ---------------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text default '',
  hsn text default '',
  unit text not null default 'pcs',
  price numeric(12,2) not null default 0,
  gst_rate numeric(5,2) not null default 18,
  stock numeric(12,3) not null default 0,
  low_stock numeric(12,3) not null default 0,
  created_at timestamptz default now(),
  created_by uuid default auth.uid()
);

-- Every stock change is recorded here; products.stock is kept in sync by trigger.
-- qty is signed: positive = stock in, negative = stock out.
create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  qty numeric(12,3) not null,
  reason text not null check (reason in ('purchase','production','sale','adjustment','return')),
  ref_id uuid,
  note text default '',
  created_at timestamptz default now(),
  created_by uuid default auth.uid()
);

create or replace function apply_stock_movement() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update products set stock = stock + new.qty where id = new.product_id;
    return new;
  elsif tg_op = 'DELETE' then
    update products set stock = stock - old.qty where id = old.product_id;
    return old;
  end if;
  return null;
end $$;

drop trigger if exists trg_stock_movement on stock_movements;
create trigger trg_stock_movement after insert or delete on stock_movements
  for each row execute function apply_stock_movement();

-- ---------------------------------------------------------------------------
-- Sales orders
-- ---------------------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  customer_id uuid not null references customers(id),
  status text not null default 'pending'
    check (status in ('pending','confirmed','dispatched','delivered','cancelled')),
  order_date date not null default current_date,
  delivery_date date,
  notes text default '',
  total numeric(12,2) not null default 0,
  invoice_id uuid,
  created_at timestamptz default now(),
  created_by uuid default auth.uid()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  description text not null,
  hsn text default '',
  unit text default 'pcs',
  qty numeric(12,3) not null,
  rate numeric(12,2) not null,
  gst_rate numeric(5,2) not null default 0
);

-- ---------------------------------------------------------------------------
-- Invoices (tax_mode 'gst' = tax invoice, 'none' = plain bill without tax)
-- ---------------------------------------------------------------------------
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null unique,
  tax_mode text not null check (tax_mode in ('gst','none')),
  inter_state boolean not null default false,
  customer_id uuid not null references customers(id),
  order_id uuid references orders(id) on delete set null,
  invoice_date date not null default current_date,
  due_date date,
  subtotal numeric(12,2) not null default 0,
  cgst numeric(12,2) not null default 0,
  sgst numeric(12,2) not null default 0,
  igst numeric(12,2) not null default 0,
  round_off numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  paid numeric(12,2) not null default 0,
  notes text default '',
  cancelled boolean not null default false,
  created_at timestamptz default now(),
  created_by uuid default auth.uid()
);

create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  description text not null,
  hsn text default '',
  unit text default 'pcs',
  qty numeric(12,3) not null,
  rate numeric(12,2) not null,
  gst_rate numeric(5,2) not null default 0,
  amount numeric(12,2) not null,
  tax numeric(12,2) not null default 0
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  paid_on date not null default current_date,
  method text not null default 'cash',
  note text default '',
  created_at timestamptz default now(),
  created_by uuid default auth.uid()
);

create or replace function apply_payment() returns trigger
language plpgsql as $$
declare inv uuid := coalesce(new.invoice_id, old.invoice_id);
begin
  update invoices
     set paid = coalesce((select sum(amount) from payments where invoice_id = inv), 0)
   where id = inv;
  return null;
end $$;

drop trigger if exists trg_payment on payments;
create trigger trg_payment after insert or update or delete on payments
  for each row execute function apply_payment();

-- ---------------------------------------------------------------------------
-- RPC: create a sales order with items in one transaction
-- p = { customer_id, order_date, delivery_date, notes, items: [{product_id, description, hsn, unit, qty, rate, gst_rate}] }
-- ---------------------------------------------------------------------------
create or replace function create_order(p jsonb) returns orders
language plpgsql as $$
declare o orders; it jsonb; tot numeric := 0;
begin
  insert into orders (order_no, customer_id, order_date, delivery_date, notes)
  values (next_number('order', 'SO-'),
          (p->>'customer_id')::uuid,
          coalesce((p->>'order_date')::date, current_date),
          nullif(p->>'delivery_date','')::date,
          coalesce(p->>'notes',''))
  returning * into o;

  for it in select * from jsonb_array_elements(p->'items') loop
    insert into order_items (order_id, product_id, description, hsn, unit, qty, rate, gst_rate)
    values (o.id, nullif(it->>'product_id','')::uuid, it->>'description', coalesce(it->>'hsn',''),
            coalesce(it->>'unit','pcs'), (it->>'qty')::numeric, (it->>'rate')::numeric,
            coalesce((it->>'gst_rate')::numeric, 0));
    tot := tot + round((it->>'qty')::numeric * (it->>'rate')::numeric, 2);
  end loop;

  update orders set total = tot where id = o.id returning * into o;
  return o;
end $$;

-- ---------------------------------------------------------------------------
-- RPC: create an invoice, compute tax, reduce stock, link to order
-- p = { tax_mode, inter_state, customer_id, order_id, invoice_date, due_date, notes,
--       items: [{product_id, description, hsn, unit, qty, rate, gst_rate}] }
-- ---------------------------------------------------------------------------
create or replace function create_invoice(p jsonb) returns invoices
language plpgsql as $$
declare
  inv invoices;
  it jsonb;
  mode text := coalesce(p->>'tax_mode', 'gst');
  inter boolean := coalesce((p->>'inter_state')::boolean, false);
  amt numeric; tx numeric; rate numeric;
  sub numeric := 0; tax_total numeric := 0; gross numeric; rounded numeric;
begin
  insert into invoices (invoice_no, tax_mode, inter_state, customer_id, order_id, invoice_date, due_date, notes)
  values (case when mode = 'gst' then next_number('gst_invoice', 'INV-') else next_number('bill', 'BILL-') end,
          mode, inter,
          (p->>'customer_id')::uuid,
          nullif(p->>'order_id','')::uuid,
          coalesce((p->>'invoice_date')::date, current_date),
          nullif(p->>'due_date','')::date,
          coalesce(p->>'notes',''))
  returning * into inv;

  for it in select * from jsonb_array_elements(p->'items') loop
    rate := case when mode = 'gst' then coalesce((it->>'gst_rate')::numeric, 0) else 0 end;
    amt := round((it->>'qty')::numeric * (it->>'rate')::numeric, 2);
    tx := round(amt * rate / 100, 2);
    sub := sub + amt;
    tax_total := tax_total + tx;

    insert into invoice_items (invoice_id, product_id, description, hsn, unit, qty, rate, gst_rate, amount, tax)
    values (inv.id, nullif(it->>'product_id','')::uuid, it->>'description', coalesce(it->>'hsn',''),
            coalesce(it->>'unit','pcs'), (it->>'qty')::numeric, (it->>'rate')::numeric, rate, amt, tx);

    if nullif(it->>'product_id','') is not null then
      insert into stock_movements (product_id, qty, reason, ref_id, note)
      values ((it->>'product_id')::uuid, -(it->>'qty')::numeric, 'sale', inv.id, inv.invoice_no);
    end if;
  end loop;

  gross := sub + tax_total;
  rounded := round(gross);

  update invoices set
    subtotal = sub,
    cgst = case when inter then 0 else round(tax_total / 2, 2) end,
    sgst = case when inter then 0 else tax_total - round(tax_total / 2, 2) end,
    igst = case when inter then tax_total else 0 end,
    round_off = rounded - gross,
    total = rounded
  where id = inv.id
  returning * into inv;

  if inv.order_id is not null then
    update orders set invoice_id = inv.id,
      status = case when status in ('pending','confirmed') then 'dispatched' else status end
    where id = inv.order_id;
  end if;

  return inv;
end $$;

-- RPC: cancel an invoice and put its stock back
create or replace function cancel_invoice(invoice uuid) returns void
language plpgsql as $$
begin
  update invoices set cancelled = true where id = invoice and not cancelled;
  if found then
    insert into stock_movements (product_id, qty, reason, ref_id, note)
    select product_id, qty, 'return', invoice, 'Cancelled ' || (select invoice_no from invoices where id = invoice)
      from invoice_items where invoice_id = invoice and product_id is not null;
    update orders set invoice_id = null where invoice_id = invoice;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Row level security: any signed-in staff member can read and write.
-- Staff accounts are created by the owner in Supabase Dashboard -> Authentication.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['settings','counters','customers','products','stock_movements',
                           'orders','order_items','invoices','invoice_items','payments'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists staff_all on %I', t);
    execute format('create policy staff_all on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

create index if not exists idx_invoices_customer on invoices(customer_id);
create index if not exists idx_invoices_date on invoices(invoice_date);
create index if not exists idx_orders_customer on orders(customer_id);
create index if not exists idx_stock_product on stock_movements(product_id);
