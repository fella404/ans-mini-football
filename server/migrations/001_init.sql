-- 001_init.sql — mengikuti ERD.md v1.0

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists fields (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists time_slots (
  id uuid primary key default gen_random_uuid(),
  start_time time not null,
  end_time time not null,
  price integer not null check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint time_slots_range check (end_time > start_time),
  constraint time_slots_unique unique (start_time, end_time)
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  booking_code text not null unique,
  customer_name text not null,
  customer_phone text not null,
  field_id uuid not null references fields (id) on delete restrict,
  play_date date not null,
  start_time time not null,
  duration_hours integer not null check (duration_hours between 1 and 4),
  total_price integer not null check (total_price >= 0),
  payment_type text not null check (payment_type in ('full', 'dp')),
  dp_percentage integer check (dp_percentage between 1 and 100),
  amount_due integer not null check (amount_due >= 0),
  remaining_amount integer not null default 0 check (remaining_amount >= 0),
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'waiting_approval', 'PAID', 'completed', 'cancelled')),
  proof_url text,
  proof_uploaded_at timestamptz,
  rejection_reason text,
  deadline_at timestamptz,
  cancelled_by text check (cancelled_by in ('customer', 'system', 'admin')),
  cancellation_reason text,
  cancelled_by_user_id uuid references users (id) on delete set null,
  is_walk_in boolean not null default false,
  remaining_settled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_dp_consistency check (
    (payment_type = 'full' and dp_percentage is null)
    or (payment_type = 'dp' and dp_percentage is not null)
  )
);

create table if not exists booking_slots (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  field_id uuid not null references fields (id) on delete restrict,
  time_slot_id uuid not null references time_slots (id) on delete restrict,
  play_date date not null,
  price integer not null check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint booking_slots_unique unique (booking_id, time_slot_id)
);

-- Anti double booking di level database (PRD 5.2)
create unique index if not exists booking_slots_no_overlap
  on booking_slots (field_id, play_date, time_slot_id)
  where is_active;

create table if not exists settings (
  id integer primary key default 1 check (id = 1),
  dp_percentage integer not null default 50 check (dp_percentage between 1 and 100),
  booking_window_days integer not null default 30 check (booking_window_days > 0),
  bank_name text,
  bank_account_number text,
  bank_account_holder text,
  qris_image_url text,
  updated_at timestamptz not null default now(),
  updated_by uuid references users (id) on delete set null
);

create index if not exists bookings_status_idx on bookings (status);
create index if not exists bookings_play_date_idx on bookings (play_date);
create index if not exists bookings_created_at_idx on bookings (created_at desc);
create index if not exists bookings_customer_phone_idx on bookings (customer_phone);
create index if not exists booking_slots_booking_id_idx on booking_slots (booking_id);

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_set_updated_at before update on users
  for each row execute function set_updated_at();
create trigger fields_set_updated_at before update on fields
  for each row execute function set_updated_at();
create trigger time_slots_set_updated_at before update on time_slots
  for each row execute function set_updated_at();
create trigger bookings_set_updated_at before update on bookings
  for each row execute function set_updated_at();
create trigger settings_set_updated_at before update on settings
  for each row execute function set_updated_at();
