"use client";

import Form from "next/form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { DISCOUNTS, PRICE_CAPS, SORTS, type FilterValues } from "@/lib/search-options";
import { getStore, PLATFORM_FAMILIES } from "@/lib/stores";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="mb-2 font-display text-xs font-semibold uppercase tracking-[0.15em] text-muted">{title}</legend>
      {children}
    </fieldset>
  );
}

function Radio({ name, value, current, label }: { name: string; value: string; current: string; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-text-2 hover:text-text has-[:checked]:font-medium has-[:checked]:text-text">
      <input type="radio" name={name} value={value} defaultChecked={current === value} className="accent-[var(--accent)]" />
      {label}
    </label>
  );
}

/**
 * Filtros da busca. É um formulário GET comum (a URL guarda os filtros); cada mudança
 * envia o formulário sozinha, sem botão de "aplicar".
 */
export function SearchFilters({ values, genres, stores }: { values: FilterValues; genres: string[]; stores: string[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  // monta a URL só com os filtros preenchidos (sem "loja=&genero=" vazios) e volta à 1ª página
  const submit = () => {
    if (!formRef.current) return;
    const qs = new URLSearchParams();
    for (const [key, value] of new FormData(formRef.current)) {
      if (typeof value === "string" && value && !(key === "ordem" && value === "relevancia")) qs.set(key, value);
    }
    router.push(qs.size ? `/busca?${qs}` : "/busca", { scroll: false });
  };
  const selectClass = "h-9 w-full rounded-[4px] border border-line bg-bg px-2 text-sm text-text focus:border-accent focus:outline-none";

  return (
    // a key recria o formulário quando a URL muda, para os campos refletirem os filtros atuais
    <Form ref={formRef} action="/busca" onChange={submit} className="space-y-6" key={JSON.stringify(values)}>
      {values.q && <input type="hidden" name="q" value={values.q} />}

      <Group title="Ordenar por">
        <select name="ordem" defaultValue={values.ordem} className={selectClass} aria-label="Ordenar por">
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Group>

      <Group title="Plataforma">
        <Radio name="plataforma" value="" current={values.plataforma} label="Todas" />
        {PLATFORM_FAMILIES.map((f) => (
          <Radio key={f.id} name="plataforma" value={f.id} current={values.plataforma} label={f.label} />
        ))}
      </Group>

      <Group title="Preço">
        <Radio name="ate" value="" current={values.ate} label="Qualquer preço" />
        {PRICE_CAPS.map((p) => (
          <Radio key={p.value} name="ate" value={p.value} current={values.ate} label={p.label} />
        ))}
      </Group>

      <Group title="Desconto">
        <Radio name="desconto" value="" current={values.desconto} label="Qualquer um" />
        {DISCOUNTS.map((d) => (
          <Radio key={d.value} name="desconto" value={d.value} current={values.desconto} label={d.label} />
        ))}
      </Group>

      <Group title="Loja">
        <select name="loja" defaultValue={values.loja} className={selectClass} aria-label="Loja">
          <option value="">Todas as lojas</option>
          {stores.map((s) => (
            <option key={s} value={s}>
              {getStore(s)?.name ?? s}
            </option>
          ))}
        </select>
      </Group>

      {genres.length > 0 && (
        <Group title="Gênero">
          <select name="genero" defaultValue={values.genero} className={selectClass} aria-label="Gênero">
            <option value="">Todos os gêneros</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Group>
      )}

      <noscript>
        <button type="submit" className="w-full rounded-[4px] border border-line px-3 py-2 text-sm">
          Aplicar filtros
        </button>
      </noscript>
      <Link href={values.q ? `/busca?q=${encodeURIComponent(values.q)}` : "/busca"} className="block text-xs text-muted hover:text-accent">
        Limpar filtros
      </Link>
    </Form>
  );
}
