import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useCurrentUser } from "~/features/auth";
import type { User } from "~/features/auth";
import { ChangeRoleDialog } from "../components/change-role-dialog";
import { UserCard } from "../components/user-card";
import { usersQueryOptions } from "../queries";

export function UsersListPage() {
  const currentUser = useCurrentUser();
  const { data: users } = useSuspenseQuery(usersQueryOptions);
  const [selected, setSelected] = useState<User | null>(null);

  // The signed-in admin manages everyone else — drop themselves from the grid.
  const others = users.filter((u) => u.id !== currentUser?.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage roles for everyone in the system.
        </p>
      </div>

      {others.length === 0 ? (
        <p className="text-sm text-muted-foreground">No other users yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {others.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onChangeRole={() => setSelected(user)}
            />
          ))}
        </div>
      )}

      <ChangeRoleDialog user={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
