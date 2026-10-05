import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allPlatformCombinations, parsePlatforms, serializePlatforms } from "@/lib/platform-selection";
import { HomeView } from "../../home-view";

// Home personalizada por plataforma: o proxy reescreve "/" para cá quando a pessoa escolheu plataformas.
// Uma página por combinação, em cache (ISR) — nada de render por visita.
export const revalidate = 300;

export function generateStaticParams() {
  return allPlatformCombinations().map((p) => ({ plat: serializePlatforms(p) }));
}

export const metadata: Metadata = { alternates: { canonical: "/" }, robots: { index: false } };

export default async function PersonalizedHome(props: PageProps<"/p/[plat]">) {
  const { plat } = await props.params;
  const platforms = parsePlatforms(plat);
  if (!platforms.length) notFound();
  return <HomeView platforms={platforms} />;
}
