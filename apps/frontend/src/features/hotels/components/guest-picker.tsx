import { useQuery } from "@tanstack/react-query";
import {
  CheckIcon,
  Loader2Icon,
  MailIcon,
  PhoneIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Field, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";
import { searchGuestsServerFn } from "../server";
import type { GuestSearchResult } from "../types";

export type GuestMode = "new" | "existing";

export interface NewGuestFields {
  name: string;
  email: string;
  phone: string;
}

/**
 * Who the stay is for. A returning guest is found by name, email or phone and
 * reuses their account; a new one is created from the fields. Either way the
 * booking lands on the guest, never on the staff member taking it.
 */
export function GuestPicker({
  hotelId,
  mode,
  onModeChange,
  selected,
  onSelect,
  fields,
  onFieldsChange,
}: {
  hotelId: number;
  mode: GuestMode;
  onModeChange: (mode: GuestMode) => void;
  selected: GuestSearchResult | null;
  onSelect: (guest: GuestSearchResult | null) => void;
  fields: NewGuestFields;
  onFieldsChange: (fields: NewGuestFields) => void;
}) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(handle);
  }, [search]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["hotel-guest-search", hotelId, debounced] as const,
    queryFn: () =>
      searchGuestsServerFn({
        data: { hotelId, q: debounced || undefined },
      }),
    staleTime: 10 * 1000,
    enabled: mode === "existing",
  });

  const set = (patch: Partial<NewGuestFields>) =>
    onFieldsChange({ ...fields, ...patch });

  return (
    <div className="bg-card rounded-xl border">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <Tabs onValueChange={(v) => onModeChange(v as GuestMode)} value={mode}>
          <TabsList>
            <TabsTrigger value="new">New guest</TabsTrigger>
            <TabsTrigger value="existing">Returning guest</TabsTrigger>
          </TabsList>
        </Tabs>
        {mode === "new" && (
          <p className="text-muted-foreground text-xs">
            A known email reuses that account.
          </p>
        )}
      </div>

      {mode === "existing" ? (
        <div className="flex flex-col gap-3 p-4">
          {selected ? (
            <div className="border-brand bg-brand/5 flex items-start gap-3 rounded-lg border p-3">
              <span className="bg-brand text-brand-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium">
                {selected.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{selected.name}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {selected.email}
                  {selected.phone ? ` · ${selected.phone}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StayBadge stays={selected.stays} />
                <Button
                  aria-label="Clear selected guest"
                  onClick={() => onSelect(null)}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <XIcon />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Field>
                <FieldLabel htmlFor="nb-guest-search">
                  Search by name, email or phone
                </FieldLabel>
                <div className="relative">
                  <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    autoComplete="off"
                    className="pl-9"
                    id="nb-guest-search"
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Start typing…"
                    value={search}
                  />
                  {isFetching && (
                    <Loader2Icon className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin" />
                  )}
                </div>
              </Field>

              {results.length === 0 ? (
                <p className="text-muted-foreground py-2 text-sm">
                  {debounced
                    ? "No guest matches that. Add them as a new guest instead."
                    : "Type to find a guest, or start with the ones who stay most often."}
                </p>
              ) : (
                <ul className="max-h-64 divide-y overflow-y-auto rounded-lg border">
                  {results.map((guest) => (
                    <li key={guest.id}>
                      <button
                        className={cn(
                          "hover:bg-accent/50 flex w-full items-center gap-3 px-3 py-2 text-left",
                          "focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
                        )}
                        onClick={() => onSelect(guest)}
                        type="button"
                      >
                        <span className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium">
                          {guest.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {guest.name}
                          </span>
                          <span className="text-muted-foreground flex flex-wrap items-center gap-x-3 text-xs">
                            <span className="inline-flex min-w-0 items-center gap-1">
                              <MailIcon className="size-3 shrink-0" />
                              <span className="truncate">{guest.email}</span>
                            </span>
                            {guest.phone && (
                              <span className="inline-flex items-center gap-1">
                                <PhoneIcon className="size-3 shrink-0" />
                                {guest.phone}
                              </span>
                            )}
                          </span>
                        </span>
                        <StayBadge stays={guest.stays} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="nb-name">Full name</FieldLabel>
            <Input
              id="nb-name"
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Jane Okafor"
              value={fields.name}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="nb-email">Email</FieldLabel>
            <Input
              id="nb-email"
              onChange={(e) => set({ email: e.target.value })}
              placeholder="jane@example.com"
              type="email"
              value={fields.email}
            />
          </Field>
          <Field className="sm:col-span-2 sm:max-w-xs">
            <FieldLabel htmlFor="nb-phone">Phone (optional)</FieldLabel>
            <Input
              id="nb-phone"
              onChange={(e) => set({ phone: e.target.value })}
              placeholder="+44 7700 900123"
              type="tel"
              value={fields.phone}
            />
          </Field>
        </div>
      )}
    </div>
  );
}

/** Stay count is how the desk spots a regular mid-conversation. */
function StayBadge({ stays }: { stays: number }) {
  if (stays === 0) {
    return (
      <Badge className="shrink-0" variant="outline">
        First stay
      </Badge>
    );
  }
  return (
    <Badge className="shrink-0 gap-1" variant="secondary">
      <CheckIcon className="size-3" />
      {stays} {stays === 1 ? "stay" : "stays"}
    </Badge>
  );
}
