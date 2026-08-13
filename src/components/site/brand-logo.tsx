import { useQuery } from "@tanstack/react-query";
import logoAsset from "@/assets/shatterher-logo.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const DEFAULT_LOGO = logoAsset.url;

/** Logo URL from the CMS, falling back to the bundled ShatterHer mark. */
export function useBrandLogo() {
  const { data } = useQuery({
    queryKey: ["brand-logo"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "brand.logo")
        .maybeSingle();
      if (error) return null;
      return data?.value?.trim() ? data.value : null;
    },
  });
  return data ?? DEFAULT_LOGO;
}

export function BrandLogo({ className }: { className?: string }) {
  const src = useBrandLogo();
  return <img src={src} alt="ShatterHer logo" className={cn("object-contain", className)} loading="eager" />;
}
