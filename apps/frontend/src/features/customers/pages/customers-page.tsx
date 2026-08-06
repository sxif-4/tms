import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { SearchIcon, UserRoundIcon } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { PageHeading } from "~/components/page-heading";
import { customerSearchQueryOptions } from "../queries";

export function CustomersPage() {
  const [query, setQuery] = useState("");
  // Keeps typing responsive while the previous result set is still on screen.
  const deferred = useDeferredValue(query);
  const { data: customers, isPending } = useQuery(
    customerSearchQueryOptions(deferred.trim() || undefined),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeading />

      <div className="relative max-w-md">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, or booking reference…"
          className="pl-9"
          autoFocus
        />
      </div>

      {isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : customers && customers.length > 0 ? (
        <div className="flex flex-col gap-2">
          {customers.map((customer) => (
            <Link
              key={customer.id}
              to="/dashboard/admin/customers/$customerId"
              params={{ customerId: String(customer.id) }}
              className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/60"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <UserRoundIcon className="size-5 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">
                    {customer.name}
                  </p>
                  {!customer.isActive && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {customer.email}
                  {customer.phone ? ` · ${customer.phone}` : ""}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold tabular-nums">
                  {customer.bookingCount}
                </span>
                <span className="text-xs text-muted-foreground">
                  {customer.bookingCount === 1 ? "booking" : "bookings"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {deferred.trim()
            ? `No customer matches "${deferred.trim()}".`
            : "No customers yet."}
        </p>
      )}
    </div>
  );
}
