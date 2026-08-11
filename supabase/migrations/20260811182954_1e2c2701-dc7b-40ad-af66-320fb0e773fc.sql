-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','reviewer','member');
CREATE TYPE public.member_status AS ENUM ('active','inactive','pending');
CREATE TYPE public.submission_status AS ENUM ('pending','approved','rejected','revision');

-- TEAMS
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.teams TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  full_name text NOT NULL,
  avatar_url text,
  bio text,
  role_title text,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  status public.member_status NOT NULL DEFAULT 'pending',
  total_points int NOT NULL DEFAULT 0,
  total_contributions int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','reviewer'));
$$;

-- TASK TYPES (point rules)
CREATE TABLE public.task_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  unit_label text NOT NULL DEFAULT 'unit',
  points_per_unit int NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.task_types TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_types TO authenticated;
GRANT ALL ON public.task_types TO service_role;
ALTER TABLE public.task_types ENABLE ROW LEVEL SECURITY;

-- SUBMISSIONS
CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  task_type_id uuid NOT NULL REFERENCES public.task_types(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  text_content text,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 500),
  status public.submission_status NOT NULL DEFAULT 'pending',
  awarded_points int,
  review_note text,
  reviewer_id uuid,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
CREATE INDEX submissions_profile_idx ON public.submissions(profile_id, submitted_at DESC);
CREATE INDEX submissions_status_idx ON public.submissions(status, submitted_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- SUBMISSION FILES
CREATE TABLE public.submission_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submission_files TO authenticated;
GRANT ALL ON public.submission_files TO service_role;
ALTER TABLE public.submission_files ENABLE ROW LEVEL SECURITY;

-- POINTS LEDGER
CREATE TABLE public.points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_id uuid REFERENCES public.submissions(id) ON DELETE SET NULL,
  points int NOT NULL,
  reason text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX points_ledger_profile_idx ON public.points_ledger(profile_id, created_at DESC);
GRANT SELECT ON public.points_ledger TO anon;
GRANT SELECT, INSERT ON public.points_ledger TO authenticated;
GRANT ALL ON public.points_ledger TO service_role;
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;

-- ACHIEVEMENTS
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.achievements TO anon;
GRANT SELECT ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, achievement_id)
);
GRANT SELECT ON public.user_achievements TO anon;
GRANT SELECT ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "teams public read" ON public.teams FOR SELECT USING (true);
CREATE POLICY "teams admin write" ON public.teams FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "profiles public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles admin manage" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "roles self read" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "task types public read" ON public.task_types FOR SELECT USING (true);
CREATE POLICY "task types admin manage" ON public.task_types FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "submissions owner read" ON public.submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "submissions owner insert" ON public.submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending' AND awarded_points IS NULL);
CREATE POLICY "submissions owner update" ON public.submissions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status IN ('pending','revision'))
  WITH CHECK (auth.uid() = user_id AND status IN ('pending','revision'));
CREATE POLICY "submissions staff manage" ON public.submissions FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "files owner read" ON public.submission_files FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "files owner insert" ON public.submission_files FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "files owner delete" ON public.submission_files FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE POLICY "ledger public read" ON public.points_ledger FOR SELECT USING (true);
CREATE POLICY "ledger staff insert" ON public.points_ledger FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "achievements public read" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "user achievements public read" ON public.user_achievements FOR SELECT USING (true);

-- TOTALS TRIGGERS
CREATE OR REPLACE FUNCTION public.sync_profile_totals()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pid uuid;
BEGIN
  pid := COALESCE(NEW.profile_id, OLD.profile_id);
  UPDATE public.profiles p SET
    total_points = COALESCE((SELECT SUM(points) FROM public.points_ledger WHERE profile_id = pid),0),
    updated_at = now()
  WHERE p.id = pid;
  RETURN NULL;
END; $$;
CREATE TRIGGER points_ledger_totals AFTER INSERT OR UPDATE OR DELETE ON public.points_ledger
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_totals();

CREATE OR REPLACE FUNCTION public.sync_contribution_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pid uuid;
BEGIN
  pid := COALESCE(NEW.profile_id, OLD.profile_id);
  UPDATE public.profiles p SET
    total_contributions = COALESCE((SELECT COUNT(*) FROM public.submissions WHERE profile_id = pid AND status = 'approved'),0)
  WHERE p.id = pid;
  RETURN NULL;
END; $$;
CREATE TRIGGER submissions_count AFTER INSERT OR UPDATE OR DELETE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.sync_contribution_count();

-- LEADERBOARD RPC
CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_period text DEFAULT 'all',
  p_team text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  rank bigint, profile_id uuid, full_name text, avatar_url text,
  role_title text, team_name text, team_slug text,
  points bigint, contributions bigint
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH since AS (
    SELECT CASE
      WHEN p_period = 'week' THEN now() - interval '7 days'
      WHEN p_period = 'month' THEN now() - interval '30 days'
      ELSE '-infinity'::timestamptz END AS ts
  ), agg AS (
    SELECT p.id,
      COALESCE(SUM(l.points),0)::bigint AS pts,
      COUNT(DISTINCT l.submission_id)::bigint AS cnt
    FROM public.profiles p
    LEFT JOIN public.points_ledger l ON l.profile_id = p.id AND l.created_at >= (SELECT ts FROM since)
    WHERE p.status = 'active'
    GROUP BY p.id
  ), ranked AS (
    SELECT RANK() OVER (ORDER BY a.pts DESC, p.full_name ASC) AS rnk,
      p.id, p.full_name, p.avatar_url, p.role_title,
      t.name AS team_name, t.slug AS team_slug, a.pts, a.cnt
    FROM agg a
    JOIN public.profiles p ON p.id = a.id
    LEFT JOIN public.teams t ON t.id = p.team_id
  )
  SELECT rnk, id, full_name, avatar_url, role_title, team_name, team_slug, pts, cnt
  FROM ranked
  WHERE (p_team IS NULL OR team_slug = p_team)
    AND (p_search IS NULL OR full_name ILIKE '%' || p_search || '%')
  ORDER BY rnk, full_name
  LIMIT GREATEST(p_limit,1) OFFSET GREATEST(p_offset,0);
$$;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(text,text,text,int,int) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS TABLE (members bigint, contributions bigint, points bigint, teams bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT COUNT(*) FROM public.profiles WHERE status='active'),
    (SELECT COUNT(*) FROM public.submissions WHERE status='approved'),
    (SELECT COALESCE(SUM(points),0) FROM public.points_ledger),
    (SELECT COUNT(DISTINCT team_id) FROM public.profiles WHERE team_id IS NOT NULL AND status='active');
$$;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO anon, authenticated;

-- STORAGE POLICIES
CREATE POLICY "contrib upload own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contributions' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "contrib read own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'contributions' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff(auth.uid())));
CREATE POLICY "contrib delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'contributions' AND (storage.foldername(name))[1] = auth.uid()::text);

-- SEED TEAMS
INSERT INTO public.teams (slug, name, description, icon, sort_order) VALUES
 ('magazine','Magazine','Handmade magazine pages, layout and craft.','📖',1),
 ('video','Video','Short and long form video editing, including podcasts.','🎬',2),
 ('instagram','Instagram','Audience research, trend research and reels.','📱',3),
 ('collaboration','Collaboration','Collaboration reels made with other creators.','🤝',4),
 ('content-review','Content Review','The team that keeps every piece of work sharp.','🫶',5),
 ('poetry','Poetry','Poems that turn feeling into voice.','🕊️',6),
 ('writing','Writing','Articles, essays and scripts.','✍️',7),
 ('partnerships','Partnerships','Partnerships and collaborations that grow the movement.','🌍',8),
 ('podcast','Podcast','Recording and planning episodes.','🎙️',9),
 ('research','Research','Deep research that grounds our work.','🔎',10),
 ('audio-video','Audio & Video','Audio and video editing craft.','🎧',11);

-- SEED TASK TYPES
INSERT INTO public.task_types (team_id, name, description, unit_label, points_per_unit, sort_order)
SELECT t.id, v.name, v.descr, v.unit, v.pts, v.ord FROM (VALUES
 ('magazine','Authentic Handmade Magazine','Original handmade magazine pages.','page',50,1),
 ('video','Short Form Video Editor','Reels and short form edits.','video',80,1),
 ('video','Long Form Video Editor','Long form edits, including podcast editing.','video',90,2),
 ('instagram','Audience Research','Understanding who we speak to.','research',85,1),
 ('instagram','Trend Research','Spotting what moves right now.','research',85,2),
 ('instagram','Content Creator','Reels created for the page.','reel',95,3),
 ('collaboration','Collaboration Reel','Reels made together with others.','reel',80,1),
 ('content-review','Content Reviewer','Careful review of submitted work.','review',80,1),
 ('poetry','Poetic Writer','Original poetry.','poem',85,1),
 ('writing','Non-Poetic Writer','Articles, essays and reports.','page',80,1),
 ('writing','Script Writer','Scripts for video and podcast.','page',70,2),
 ('partnerships','Partnership','Secured partnerships.','partnership',90,1),
 ('partnerships','Collaboration','Collaborations with creators and orgs.','collaboration',70,2),
 ('podcast','Podcast Artist','Recorded podcast sessions.','recording',95,1),
 ('podcast','Episode Planner','Planned and structured episodes.','episode',85,2),
 ('research','Research','In-depth research work.','research',90,1),
 ('audio-video','Audio and Video Editing','Roughly 1-2 minutes or longer, depending on scope and quality.','video',60,1)
) AS v(team_slug,name,descr,unit,pts,ord)
JOIN public.teams t ON t.slug = v.team_slug;

-- SEED ACHIEVEMENTS
INSERT INTO public.achievements (code, name, description, icon, sort_order) VALUES
 ('first_contribution','First Contribution','You shared your first contribution.','🏆',1),
 ('points_500','500 Point Club','You crossed 500 points.','🔥',2),
 ('points_1000','1,000 Point Club','You crossed 1,000 points.','💫',3),
 ('contributions_10','10 Contributions','Ten approved contributions.','🚀',4),
 ('top_3','Top 3 Leader','You reached the top three.','👑',5),
 ('consistency','Consistency Award','Contributing month after month.','💜',6),
 ('community_builder','Community Builder','Partnerships and collaborations that grow ShatterHer.','🌟',7);

-- SEED DEMO MEMBERS + CONTRIBUTIONS
WITH new_profiles AS (
  INSERT INTO public.profiles (full_name, role_title, team_id, status)
  SELECT v.name, v.role_title, t.id, 'active'::public.member_status
  FROM (VALUES
   ('Aarav Sharma','Content Reviewer','content-review'),
   ('Mira Kapoor','Instagram Lead','instagram'),
   ('Zara Ahmed','Video Editor','video'),
   ('Ishita Rao','Poetic Writer','poetry'),
   ('Noor Fatima','Partnership Team','partnerships'),
   ('Ananya Verma','Podcast Artist','podcast'),
   ('Sana Malik','Research','research'),
   ('Diya Nair','Magazine','magazine'),
   ('Riya Chatterjee','Script Writer','writing'),
   ('Kiara Joshi','Audio & Video','audio-video')
  ) AS v(name, role_title, team_slug)
  JOIN public.teams t ON t.slug = v.team_slug
  RETURNING id, full_name
), seeded AS (
  INSERT INTO public.submissions (profile_id, user_id, task_type_id, title, description, quantity, status, awarded_points, submitted_at, reviewed_at)
  SELECT np.id, '00000000-0000-0000-0000-000000000000'::uuid, tt.id,
    v.title, v.descr, v.qty, 'approved'::public.submission_status, v.qty * tt.points_per_unit,
    now() - (v.days_ago || ' days')::interval, now() - ((v.days_ago - 1) || ' days')::interval
  FROM (VALUES
   ('Aarav Sharma','Content Reviewer','Reviewed the September magazine drafts','Full pass across tone, clarity and accuracy.',6,3),
   ('Aarav Sharma','Content Reviewer','Reviewed reel scripts','Checked six reel scripts before publishing.',5,12),
   ('Aarav Sharma','Research','Research on girls access to STEM','Compiled findings from five regions.',2,20),
   ('Mira Kapoor','Content Creator','Reels for Women''s Education week','Four reels across the campaign.',4,2),
   ('Mira Kapoor','Audience Research','Instagram audience research','Who we reach and who we still miss.',3,9),
   ('Mira Kapoor','Trend Research','Trend research for the month','Formats worth trying next.',2,18),
   ('Zara Ahmed','Long Form Video Editor','Podcast episode edits','Three full episodes edited.',3,4),
   ('Zara Ahmed','Short Form Video Editor','Short form edits for launch week','Five shorts cut and colour graded.',5,14),
   ('Ishita Rao','Poetic Writer','Poems for the Voices series','Six poems on courage and belonging.',6,5),
   ('Ishita Rao','Non-Poetic Writer','Essay on youth leadership','Long form essay for the magazine.',4,16),
   ('Noor Fatima','Partnership','Partnerships with three youth orgs','Ongoing programme partnerships.',3,6),
   ('Noor Fatima','Collaboration','Creator collaborations','Four creators joined a campaign.',4,15),
   ('Ananya Verma','Podcast Artist','Recorded four episodes','Interviews with young leaders.',4,7),
   ('Ananya Verma','Episode Planner','Planned the next season','Five episodes structured end to end.',5,17),
   ('Sana Malik','Research','Research on the gender gap in sport','Data and interviews.',5,8),
   ('Diya Nair','Authentic Handmade Magazine','Handmade spread for issue 04','Eight illustrated pages.',8,10),
   ('Riya Chatterjee','Script Writer','Scripts for the awareness series','Seven scripted pages.',7,11),
   ('Kiara Joshi','Audio and Video Editing','Audio cleanup and video sync','Six pieces polished.',6,13),
   ('Kiara Joshi','Short Form Video Editor','Shorts for the anniversary','Two shorts.',2,21)
  ) AS v(member, task, title, descr, qty, days_ago)
  JOIN new_profiles np ON np.full_name = v.member
  JOIN public.task_types tt ON tt.name = v.task
  RETURNING id, profile_id, awarded_points, title, reviewed_at
)
INSERT INTO public.points_ledger (profile_id, submission_id, points, reason, created_at)
SELECT profile_id, id, awarded_points, title, reviewed_at FROM seeded;