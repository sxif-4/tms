import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MoreVerticalIcon,
  UserCheckIcon,
  UserCogIcon,
  UserXIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { User } from "~/features/auth";
import { ROLE_LABELS } from "../constants";
import { usersQueryOptions } from "../queries";
import { setUserActiveServerFn } from "../server";
import { initials } from "../utils";

export function UserCard({
  user,
  onChangeRole,
}: {
  user: User;
  onChangeRole: () => void;
}) {
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: (isActive: boolean) =>
      setUserActiveServerFn({ data: { id: user.id, isActive } }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: usersQueryOptions.queryKey });
      toast.success(
        updated.isActive
          ? `Reactivated ${updated.name}`
          : `Deactivated ${updated.name}`,
      );
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to update status",
      ),
  });

  return (
    <Card className={user.isActive ? undefined : "opacity-70"}>
      <CardHeader className="flex flex-row items-center gap-3">
        <Avatar size="lg">
          <AvatarFallback>{initials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <CardTitle className="truncate">{user.name}</CardTitle>
          <CardDescription className="truncate">{user.email}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
        {!user.isActive && <Badge variant="outline">Inactive</Badge>}
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={onChangeRole}
        >
          <UserCogIcon data-icon="inline-start" />
          Change role
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="More actions"
              disabled={statusMutation.isPending}
            >
              <MoreVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {user.isActive ? (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => statusMutation.mutate(false)}
              >
                <UserXIcon />
                Deactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => statusMutation.mutate(true)}>
                <UserCheckIcon />
                Reactivate
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
