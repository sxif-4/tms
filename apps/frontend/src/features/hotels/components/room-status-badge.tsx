import { Badge } from "~/components/ui/badge";
import { ROOM_STATUS_LABELS, roomStatusBadgeVariant } from "../constants";
import type { RoomStatus } from "../types";

export function RoomStatusBadge({ status }: { status: RoomStatus }) {
  return (
    <Badge variant={roomStatusBadgeVariant(status)}>
      {ROOM_STATUS_LABELS[status]}
    </Badge>
  );
}
