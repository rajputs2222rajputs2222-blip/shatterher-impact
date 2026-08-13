import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

function visitorHash() {
  const key = "sh_visitor";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

/** Records an anonymous page view for the admin analytics dashboard. */
export function VisitTracker() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (path.startsWith("/admin")) return;
    const timer = window.setTimeout(() => {
      void supabase.from("page_views").insert({
        path,
        referrer: document.referrer || null,
        visitor_hash: visitorHash(),
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [path]);

  return null;
}
