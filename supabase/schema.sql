-- Couriers table to store individual riders and their settings/rates
CREATE TABLE IF NOT EXISTS public.couriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    hourly_rate NUMERIC(10, 2) DEFAULT 177.00,
    seniority_support NUMERIC(10, 2) DEFAULT 2250.00,
    relief_fund NUMERIC(10, 2) DEFAULT 180.00,
    dues_installments NUMERIC(10, 2) DEFAULT 1200.00,
    vat_rate NUMERIC(5, 2) DEFAULT 20.00,
    withholding_rate NUMERIC(5, 2) DEFAULT 20.00,
    monthly_extra_hours NUMERIC(10, 2) DEFAULT 0.00,
    monthly_extra_premiums NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on couriers
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;

-- Couriers RLS policies (managers can only manage their own couriers)
CREATE POLICY "Allow managers full control over own couriers" ON public.couriers
    FOR ALL USING (auth.uid() = manager_id);

-- Trigger to create a default courier on user sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.couriers (manager_id, name)
  VALUES (new.id, 'Benim Profilim');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Daily logs table (referenced to couriers instead of auth.users directly)
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id UUID NOT NULL REFERENCES public.couriers(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    hours_worked NUMERIC(4, 2) DEFAULT 12.00,
    market_packages INTEGER DEFAULT 0,
    food_packages_0_4 INTEGER DEFAULT 0,
    food_packages_4_6 INTEGER DEFAULT 0,
    food_packages_6plus INTEGER DEFAULT 0,
    fuel_expense NUMERIC(10, 2) DEFAULT 0.00,       -- Daily Fuel Expense
    motor_lease_expense NUMERIC(10, 2) DEFAULT 0.00, -- Daily Motor Rent/Lease Expense
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    -- Unique constraint to prevent duplicate logs on the same date for the same courier
    CONSTRAINT unique_courier_date UNIQUE (courier_id, log_date)
);

-- Enable RLS on daily_logs
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- Daily logs RLS policies (managers can only manage logs of their own couriers)
CREATE POLICY "Allow managers select of own couriers' logs" ON public.daily_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.couriers 
            WHERE public.couriers.id = public.daily_logs.courier_id 
            AND public.couriers.manager_id = auth.uid()
        )
    );

CREATE POLICY "Allow managers insert of own couriers' logs" ON public.daily_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.couriers 
            WHERE public.couriers.id = courier_id 
            AND public.couriers.manager_id = auth.uid()
        )
    );

CREATE POLICY "Allow managers update of own couriers' logs" ON public.daily_logs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.couriers 
            WHERE public.couriers.id = public.daily_logs.courier_id 
            AND public.couriers.manager_id = auth.uid()
        )
    );

CREATE POLICY "Allow managers delete of own couriers' logs" ON public.daily_logs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.couriers 
            WHERE public.couriers.id = public.daily_logs.courier_id 
            AND public.couriers.manager_id = auth.uid()
        )
    );
