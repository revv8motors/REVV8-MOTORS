-- Rewrite cars SELECT policy so anonymous users don't trigger has_role()
DROP POLICY IF EXISTS "anyone view published cars" ON public.cars;

CREATE POLICY "anyone view published cars"
ON public.cars
FOR SELECT
USING (
  published = true
  OR (auth.role() = 'authenticated' AND public.has_role(auth.uid(), 'admin'::public.app_role))
);

-- Revoke EXECUTE on has_role from anon and authenticated; RLS policies still
-- run as the policy owner and can call the function internally.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;