import { InboxIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { CUSTOMER_REQUESTS, type RequestStatus } from "../mock";

const STATUS: Record<
  RequestStatus,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  new: { label: "New", variant: "default" },
  pending: { label: "Pending", variant: "secondary" },
  urgent: { label: "Urgent", variant: "destructive" },
};

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const openCount = CUSTOMER_REQUESTS.filter((r) => r.status !== "pending").length;

export function CustomerRequestsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <InboxIcon className="size-4 text-muted-foreground" />
          Customer requests
        </CardTitle>
        <CardDescription>Latest messages needing a response</CardDescription>
        <CardAction>
          <Badge variant="secondary">{openCount} open</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col px-2">
        {CUSTOMER_REQUESTS.map((request) => {
          const status = STATUS[request.status];
          return (
            <div
              key={request.id}
              className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
            >
              <Avatar>
                <AvatarFallback>{initials(request.customer)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">
                    {request.customer}
                  </p>
                  <span className="hidden text-[10px] font-medium tracking-wide text-muted-foreground uppercase sm:inline">
                    {request.type}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {request.subject}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={status.variant}>{status.label}</Badge>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {request.time}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
