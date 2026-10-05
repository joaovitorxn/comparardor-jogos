"use server";

import { revalidatePath } from "next/cache";

/** Descarta a versão em cache da página (gerada antes de as outras lojas chegarem) e a recarrega. */
export async function refreshGamePage(slug: string) {
  revalidatePath(`/jogo/${slug}`);
}
