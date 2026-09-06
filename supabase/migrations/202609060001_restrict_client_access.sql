-- The app reads through its server-side database connection, not the Data API.
alter table public.bookings enable row level security;
alter table public.daily_metrics enable row level security;
alter table public.monthly_expectations enable row level security;
alter table public.weekly_forecast enable row level security;
alter table public.visibility_checks enable row level security;
alter table public.actions enable row level security;
alter table public.referral_categories enable row level security;

revoke all privileges on table
  public.bookings, public.daily_metrics, public.monthly_expectations,
  public.weekly_forecast, public.visibility_checks, public.actions,
  public.referral_categories
from anon, authenticated;

revoke all privileges on sequence public.actions_id_seq from anon, authenticated;
