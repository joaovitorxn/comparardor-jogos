import type { Metadata } from "next";
import { MyList } from "@/components/my-list";
import { SectionHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Minha lista", robots: { index: false } };

export default function MyListPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-6">
      <SectionHeader title="Minha lista" aside="Salva neste aparelho · alertas verificados de hora em hora" />
      <MyList />
    </div>
  );
}
