
-- Allow authenticated users to create their own athlete record
create policy "Users can insert own athlete record"
on public.athletes
for insert
to authenticated
with check (user_id = auth.uid());
