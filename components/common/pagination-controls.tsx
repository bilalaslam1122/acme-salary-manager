"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

/** Stand-in page number for building the "Go to page" URL on the server. */
export const PAGE_TOKEN = 987_654_321;

/** Rows-per-page select; each option is a canonical URL built on the server. */
export function PageSizeSelect({
  current,
  options,
}: {
  current: number;
  options: { size: number; href: string }[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <Label
        htmlFor={id}
        className="text-sm font-normal whitespace-nowrap text-muted-foreground"
      >
        Rows per page
      </Label>
      <NativeSelect
        id={id}
        size="sm"
        value={String(current)}
        onChange={(event) => {
          const option = options.find((o) => String(o.size) === event.target.value);
          if (option) startTransition(() => router.push(option.href));
        }}
      >
        {options.map((option) => (
          <NativeSelectOption key={option.size} value={String(option.size)}>
            {option.size}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}

/** "Go to page" for long lists. Input is clamped to 1…totalPages. */
export function JumpToPage({
  current,
  totalPages,
  firstPageHref,
  hrefTemplate,
}: {
  current: number;
  totalPages: number;
  firstPageHref: string;
  /** Href for page {@link PAGE_TOKEN}; the token is replaced with the chosen page. */
  hrefTemplate: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [value, setValue] = useState("");
  const id = useId();

  function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const requested = Number.parseInt(value, 10);
    if (Number.isNaN(requested)) return;
    const page = Math.min(Math.max(requested, 1), totalPages);
    setValue("");
    if (page === current) return;
    const href =
      page === 1 ? firstPageHref : hrefTemplate.replace(String(PAGE_TOKEN), String(page));
    startTransition(() => router.push(href));
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2" noValidate>
      <Label
        htmlFor={id}
        className="text-sm font-normal whitespace-nowrap text-muted-foreground"
      >
        Go to page
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={1}
        max={totalPages}
        placeholder={String(current)}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-7 w-20 tabular-nums"
      />
      <Button type="submit" variant="outline" size="sm" disabled={value === ""}>
        Go
      </Button>
    </form>
  );
}
