import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ModeToggle } from "~/components/mode-toggle";
import { useCurrentUser } from "~/features/auth";
import { ROLE_LABELS } from "~/features/users/constants";
import { initials } from "~/features/users/utils";

export function SettingsPage() {
  const user = useCurrentUser();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Your account and workspace preferences.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your administrator account.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar size="lg">
            <AvatarFallback>{initials(user?.name ?? "?")}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="font-medium">{user?.name}</span>
            <span className="truncate text-sm text-muted-foreground">
              {user?.email}
            </span>
          </div>
          {user && (
            <Badge variant="secondary" className="ml-auto">
              {ROLE_LABELS[user.role]}
            </Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Switch between light and dark mode.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-sm">Theme</span>
          <ModeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
          <CardDescription>System information.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Application</span>
            <span className="text-foreground">FUNISLAND Booking System</span>
          </div>
          <div className="flex justify-between">
            <span>Environment</span>
            <span className="text-foreground">Development</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
