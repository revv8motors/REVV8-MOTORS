
DROP POLICY IF EXISTS "anyone create inquiry" ON public.inquiries;
CREATE POLICY "anyone create valid inquiry" ON public.inquiries
  FOR INSERT
  WITH CHECK (
    char_length(name) BETWEEN 1 AND 100
    AND char_length(email) BETWEEN 3 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND char_length(message) BETWEEN 1 AND 2000
    AND (phone IS NULL OR char_length(phone) <= 30)
  );
