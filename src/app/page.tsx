import type { Metadata } from "next";
import { HomeView } from "./home-view";

export const revalidate = 900;

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return <HomeView />;
}
