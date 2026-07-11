-- Profiles table to store user settings
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    hourly_rate NUMERIC(10, 2) DEFAULT 177.00,
    seniority_support NUMERIC(10, 2) DEFAULT 2250.00,
    relief_fund NUMERIC(10, 2) DEFAULT 180.00,
    dues_installments NUMERIC(10, 2) DEFAULT 1200.00,
    vat_rate NUMERIC(5, 2) DEFAULT 20.00,
    withholding_rate NUMERIC(5, 2) DEFAULT 20.00,
    packet_premium_rate NUMERIC(5, 4) DEFAULT 0.5000,
    monthly_extra_hours NUMERIC(10, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Allow individual read to own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow individual update to own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow individual insert of own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger to create a default profile on user sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Daily logs table
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    hours_worked NUMERIC(4, 2) DEFAULT 12.00,
    market_packages INTEGER DEFAULT 0,
    food_packages_0_4 INTEGER DEFAULT 0,
    food_packages_4_6 INTEGER DEFAULT 0,
    food_packages_6plus INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    -- Unique constraint to prevent duplicate logs on the same date for the same user
    CONSTRAINT unique_user_date UNIQUE (user_id, log_date)
);

-- Enable RLS on daily_logs
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- Daily logs RLS policies
CREATE POLICY "Allow individual select of own logs" ON public.daily_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow individual insert of own logs" ON public.daily_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow individual update of own logs" ON public.daily_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow individual delete of own logs" ON public.daily_logs
    FOR DELETE USING (auth.uid() = user_id);
