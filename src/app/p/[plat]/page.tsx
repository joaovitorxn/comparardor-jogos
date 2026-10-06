import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { parsePlatforms, serializePlatforms } from "@/lib/platform-selection";
import { HomeView } from "../../home-view";

// Home personalizada por plataforma: o proxy reescreve "/" para cá quando a pessoa escolheu plataformas.
// Uma página por combinação, em cache (ISR) — nada de render por visita.
export const revalidate = 900;

// Nenhuma combinação é gerada no deploy (cada uma lê o banco de ofertas inteiro): a primeira visita a gera e as seguintes
// vêm do cache. Só as 14 combinações válidas existem; qualquer outra dá 404.
export function generateStaticParams() {
  return [];
}

export const dynamicParams = true;

export const metadata: Metadata = { alternates: { canonical: "/" }, robots: { index: false } };

export default async function PersonalizedHome(props: PageProps<"/p/[plat]">) {
  const { plat } = await props.params;
  const platforms = parsePlatforms(plat);
  // só endereços na forma canônica ("pc-playstation"); qualquer variação não vira outra página em cache
  if (!platforms.length || serializePlatforms(platforms) !== plat) notFound();
  return <HomeView platforms={platforms} />;
}
