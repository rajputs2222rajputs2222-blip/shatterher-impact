-- 1. Lock down public reads on sensitive tables ---------------------------
DROP POLICY IF EXISTS "profiles public read" ON public.profiles;
CREATE POLICY "profiles authenticated read" ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ledger public read" ON public.points_ledger;
CREATE POLICY "ledger owner or staff read" ON public.points_ledger
  FOR SELECT TO authenticated
  USING (
    public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = points_ledger.profile_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "user achievements public read" ON public.user_achievements;
CREATE POLICY "user achievements authenticated read" ON public.user_achievements
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "task types public read" ON public.task_types;
CREATE POLICY "task types authenticated read" ON public.task_types
  FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.points_ledger FROM anon;
REVOKE SELECT ON public.user_achievements FROM anon;
REVOKE SELECT ON public.task_types FROM anon;

GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.points_ledger TO authenticated;
GRANT SELECT ON public.user_achievements TO authenticated;
GRANT SELECT ON public.task_types TO authenticated;

-- 2. Curated public read RPCs (safe columns only) --------------------------
CREATE OR REPLACE FUNCTION public.get_public_member_profile(p_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'profile', jsonb_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'avatar_url', p.avatar_url,
      'bio', p.bio,
      'role_title', p.role_title,
      'status', p.status,
      'total_points', p.total_points,
      'total_contributions', p.total_contributions,
      'created_at', p.created_at,
      'teams', CASE WHEN t.id IS NULL THEN NULL ELSE jsonb_build_object('name', t.name, 'slug', t.slug, 'icon', t.icon) END
    ),
    'ledger', COALESCE((
      SELECT jsonb_agg(x) FROM (
        SELECT l.id, l.points, l.reason, l.created_at
        FROM public.points_ledger l
        WHERE l.profile_id = p.id
        ORDER BY l.created_at DESC LIMIT 20
      ) x), '[]'::jsonb),
    'achievements', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'earned_at', ua.earned_at,
        'achievements', jsonb_build_object('code', a.code, 'name', a.name, 'description', a.description, 'icon', a.icon)
      ))
      FROM public.user_achievements ua
      JOIN public.achievements a ON a.id = ua.achievement_id
      WHERE ua.profile_id = p.id), '[]'::jsonb)
  )
  FROM public.profiles p
  LEFT JOIN public.teams t ON t.id = p.team_id
  WHERE p.id = p_id AND p.status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.get_public_point_rules()
RETURNS TABLE(id uuid, team_id uuid, name text, description text, unit_label text, points_per_unit integer, sort_order integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT tt.id, tt.team_id, tt.name, tt.description, tt.unit_label, tt.points_per_unit, tt.sort_order
  FROM public.task_types tt
  WHERE tt.active = true
  ORDER BY tt.sort_order;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_member_profile(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_point_rules() TO anon, authenticated;

-- 3. Block self-escalation of privileged profile columns -------------------
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') OR auth.uid() IS NULL THEN
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
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS profiles_guard_privileged ON public.profiles;
CREATE TRIGGER profiles_guard_privileged
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_columns();

-- 4. Only active members may create submissions ----------------------------
DROP POLICY IF EXISTS "submissions owner insert" ON public.submissions;
CREATE POLICY "submissions owner insert" ON public.submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND awarded_points IS NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = submissions.profile_id AND p.user_id = auth.uid() AND p.status = 'active'
    )
  );