import { useSuspenseQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useCurrentUser } from "~/features/auth";
import type { Role, User } from "~/features/auth";
import { ChangeRoleDialog } from "../components/change-role-dialog";
import { CreateStaffDialog } from "../components/create-staff-dialog";
import { UserCard } from "../components/user-card";
import { ROLE_LABELS } from "../constants";
import { usersQueryOptions } from "../queries";

type StatusFilter = "all" | "active" | "inactive";

const ALL_ROLES = Object.keys(ROLE_LABELS) as Role[];

export function UsersListPage() {
  const currentUser = useCurrentUser();
  const { data: users } = useSuspenseQuery(usersQueryOptions);
  const [selected, setSelected] = useState<User | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // The signed-in admin manages everyone else — drop themselves from the grid.
  const others = users.filter((u) => u.id !== currentUser?.id);
  const filtered = others.filter(
    (u) =>
      (roleFilter === "all" || u.role === roleFilter) &&
      (statusFilter === "all" ||
        (statusFilter === "active" ? u.isActive : !u.isActive)),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage accounts, roles, and access for everyone in the system.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <PlusIcon data-icon="inline-start" />
          Add account
        </Button>
      </div>

      {others.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={roleFilter}
            onValueChange={(v) => setRoleFilter(v as Role | "all")}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All roles</SelectItem>
                {ALL_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <span className="ml-auto text-sm text-muted-foreground">
            {filtered.length} of {others.length}
          </span>
        </div>
      )}

      {others.length === 0 ? (
        <p className="text-sm text-muted-foreground">No other users yet.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No users match these filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onChangeRole={() => setSelected(user)}
            />
          ))}
        </div>
      )}

      <ChangeRoleDialog user={selected} onClose={() => setSelected(null)} />
      <CreateStaffDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
