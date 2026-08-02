import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import type { User } from "~/features/auth";
import { HotelAssignmentEditor } from "./hotel-assignment-editor";

export function ManageHotelsDialog({
  user,
  onClose,
}: {
  user: User | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={user != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage hotels</DialogTitle>
          <DialogDescription>
            {user
              ? `Choose which hotels ${user.name} can manage. Their role grants the permissions; these assignments decide where those permissions apply.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        {user && <HotelAssignmentEditor userId={user.id} />}

        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
