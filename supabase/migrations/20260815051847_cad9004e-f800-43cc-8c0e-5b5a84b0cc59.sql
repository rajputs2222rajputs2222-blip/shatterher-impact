-- 1) Column-level protection for self-service profile updates
DROP POLICY IF EXISTS "profiles self update" ON public.profiles;

CREATE POLICY "profiles self update safe columns"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND NOT public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (
  auth.uid() = user_id
  AND status = (SELECT p.status FROM public.profiles p WHERE p.id = profiles.id)
  AND total_points = (SELECT p.total_points FROM public.profiles p WHERE p.id = profiles.id)
  AND total_contributions = (SELECT p.total_contributions FROM public.profiles p WHERE p.id = profiles.id)
);

-- 2) Harden the guard trigger: no anonymous bypass, strict OLD/NEW pinning
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.total_points := 0;
    NEW.total_contributions := 0;
    RETURN NEW;
  END IF;

  NEW.status := OLD.status;
  NEW.total_points := OLD.total_points;
  NEW.total_contributions := OLD.total_contributions;
  NEW.user_id := OLD.user_id;
  NEW.id := OLD.id;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END; $function$;

-- 3) Trigger-owned functions must never be callable through the API
REVOKE ALL ON FUNCTION public.guard_profile_privileged_columns() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_profile_totals() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_contribution_count() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 4) Role helpers: keep executable only where RLS policies need them
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

-- 5) Admin-only analytics stays admin-only
REVOKE ALL ON FUNCTION public.get_visitor_stats(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_visitor_stats(integer) TO authenticated, service_role;

-- 6) Curated public read APIs: only these four stay reachable by visitors
REVOKE ALL ON FUNCTION public.get_leaderboard(text, text, text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_platform_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_member_profile(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_point_rules() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(text, text, text, integer, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_member_profile(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_point_rules() TO anon, authenticated, service_role;