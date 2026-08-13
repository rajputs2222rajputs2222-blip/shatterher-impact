-- 1. Site content
CREATE TABLE public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  group_name text NOT NULL DEFAULT 'general',
  label text NOT NULL,
  kind text NOT NULL DEFAULT 'text',
  value text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site content public read" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "site content admin write" ON public.site_content FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $fn$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $fn$;

CREATE TRIGGER site_content_updated_at BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Page views
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  referrer text,
  visitor_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.page_views TO anon;
GRANT INSERT, SELECT ON public.page_views TO authenticated;
GRANT ALL ON public.page_views TO service_role;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "page views anyone insert" ON public.page_views FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "page views admin read" ON public.page_views FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX page_views_created_idx ON public.page_views (created_at DESC);

-- 3. Achievements admin management
CREATE POLICY "achievements admin write" ON public.achievements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO authenticated;

-- 4. Admin visitor stats
CREATE OR REPLACE FUNCTION public.get_visitor_stats(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE since timestamptz := now() - (GREATEST(p_days,1) || ' days')::interval;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN jsonb_build_object(
    'total_views', (SELECT COUNT(*) FROM public.page_views WHERE created_at >= since),
    'unique_visitors', (SELECT COUNT(DISTINCT visitor_hash) FROM public.page_views WHERE created_at >= since),
    'views_today', (SELECT COUNT(*) FROM public.page_views WHERE created_at >= date_trunc('day', now())),
    'daily', COALESCE((SELECT jsonb_agg(d) FROM (
        SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
               COUNT(*) AS views, COUNT(DISTINCT visitor_hash) AS visitors
        FROM public.page_views WHERE created_at >= since
        GROUP BY 1 ORDER BY 1) d), '[]'::jsonb),
    'top_pages', COALESCE((SELECT jsonb_agg(p) FROM (
        SELECT path, COUNT(*) AS views FROM public.page_views WHERE created_at >= since
        GROUP BY path ORDER BY 2 DESC LIMIT 10) p), '[]'::jsonb),
    'referrers', COALESCE((SELECT jsonb_agg(r) FROM (
        SELECT COALESCE(NULLIF(referrer,''),'direct') AS referrer, COUNT(*) AS views
        FROM public.page_views WHERE created_at >= since
        GROUP BY 1 ORDER BY 2 DESC LIMIT 10) r), '[]'::jsonb)
  );
END; $$;

-- 5. Lock down function execution
REVOKE EXECUTE ON FUNCTION public.get_leaderboard(text, text, text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_platform_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_member_profile(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_point_rules() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_visitor_stats(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.guard_profile_privileged_columns() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_profile_totals() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_contribution_count() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_leaderboard(text, text, text, integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_member_profile(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_point_rules() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_visitor_stats(integer) TO authenticated;

-- 6. Seed editable content defaults
INSERT INTO public.site_content (key, group_name, label, kind, value, sort_order) VALUES
('home.eyebrow','home','Hero eyebrow','text','ShatterHer · Leaders',1),
('home.title_line1','home','Hero line 1','text','Every',2),
('home.title_line2','home','Hero line 2','text','contribution',3),
('home.title_line3','home','Hero line 3 (accent)','text','counts.',4),
('home.subtitle','home','Hero subtitle','textarea','Create. Contribute. Lead. Earn your place among the ShatterHer leaders.',5),
('home.cta_primary','home','Primary button','text','Share Your Contribution',6),
('home.cta_secondary','home','Secondary button','text','Explore the Leaders',7),
('home.hero_image','home','Hero image URL','image','',8),
('brand.logo','brand','Logo URL','image','',1),
('brand.name','brand','Brand name','text','ShatterHerLeaders',2),
('brand.tagline','brand','Tagline','text','Break the chains. Reclaim the freedom.',3),
('about.title','about','About title','text','We are ShatterHer',1),
('about.body','about','About body','textarea','A youth-led movement for equality, empowerment and action.',2),
('contact.email','contact','Contact email','text','hello@shatterher.org',1),
('contact.instagram','contact','Instagram URL','text','',2),
('contact.linkedin','contact','LinkedIn URL','text','',3),
('footer.text','footer','Footer text','textarea','Built by the ShatterHer community.',1);