-- Defense-in-depth: explicit restrictive INSERT policy on user_roles
-- Ensures only existing admins can insert roles; blocks any user from self-promoting.
CREATE POLICY "only admins can insert roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));