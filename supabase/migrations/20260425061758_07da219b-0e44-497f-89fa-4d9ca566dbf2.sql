
ALTER FUNCTION public.set_updated_at() SET search_path = public;

DROP POLICY IF EXISTS "public read cars bucket" ON storage.objects;
CREATE POLICY "public read individual car images" ON storage.objects
  FOR SELECT USING (bucket_id = 'cars' AND name IS NOT NULL);
