import { UserCogIcon } from "lucide-react";
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
import type { User } from "~/features/auth";
import { ROLE_LABELS } from "../constants";
import { initials } from "../utils";

export function UserCard({
  user,
  onChangeRole,
}: {
  user: User;
  onChangeRole: () => void;
}) {
  return (
    <Card>
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
      <CardFooter>
        <Button
          variant="default"
          size="sm"
          className="w-full"
          onClick={onChangeRole}
        >
          <UserCogIcon data-icon="inline-start" />
          Change role
        </Button>
      </CardFooter>
    </Card>
  );
}
