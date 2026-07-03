import { useSuspenseQuery } from "@tanstack/react-query";
import { ShieldCheckIcon } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { Role } from "~/features/auth";
import { ALL_ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS } from "../constants";
import { usersQueryOptions } from "../queries";

export function RolesPage() {
  const { data: users } = useSuspenseQuery(usersQueryOptions);

  const counts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">Roles</h1>
        <p className="text-sm text-muted-foreground">
          The system uses one role per user. Assign roles from the Users page.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_ROLES.map((role: Role) => (
          <Card key={role}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheckIcon className="size-4 text-muted-foreground" />
                {ROLE_LABELS[role]}
              </CardTitle>
              <CardDescription>{ROLE_DESCRIPTIONS[role]}</CardDescription>
              <CardAction>
                <Badge variant="secondary" className="tabular-nums">
                  {counts[role] ?? 0}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {counts[role] ?? 0}{" "}
                {(counts[role] ?? 0) === 1 ? "user" : "users"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
