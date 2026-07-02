import { PencilIcon, Trash2Icon } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { PLACEMENT_LABELS } from "../constants";
import type { Advertisement } from "../types";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function AdvertisementCard({
  ad,
  onEdit,
  onDelete,
}: {
  ad: Advertisement;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className={ad.isActive ? undefined : "opacity-70"}>
      <img
        src={ad.image}
        alt={ad.title}
        className="h-32 w-full bg-muted object-cover"
      />
      <CardHeader>
        <CardTitle className="truncate">{ad.title}</CardTitle>
        <CardDescription className="truncate">
          {PLACEMENT_LABELS[ad.placement]} · {fmt(ad.startsAt)} –{" "}
          {fmt(ad.endsAt)}
        </CardDescription>
        <CardAction>
          <Badge variant={ad.isActive ? "secondary" : "outline"}>
            {ad.isActive ? "Active" : "Inactive"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onEdit}
        >
          <PencilIcon data-icon="inline-start" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onDelete}
          aria-label="Delete advertisement"
        >
          <Trash2Icon />
        </Button>
      </CardFooter>
    </Card>
  );
}
