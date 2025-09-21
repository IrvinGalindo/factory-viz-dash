-- Enable full CRUD operations on machines table
CREATE POLICY "Enable insert for all users" ON public.machines FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.machines FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.machines FOR DELETE USING (true);