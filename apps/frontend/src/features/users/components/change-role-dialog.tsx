import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { Role, User } from "~/features/auth";
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "../constants";
import { usersQueryOptions } from "../queries";
import { updateUserRoleServerFn } from "../server";

export function ChangeRoleDialog({
  user,
  onClose,
}: {
  user: User | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<Role | undefined>(user?.role);
  const [error, setError] = useState<string | null>(null);

  // Reset the picker each time a different user's dialog is opened.
  useEffect(() => {
    setRole(user?.role);
    setError(null);
  }, [user]);

  const unchanged = !role || role === user?.role;

  const mutation = useMutation({
    mutationFn: () => {
      if (!user || !role) throw new Error("Pick a role first");
      return updateUserRoleServerFn({ data: { id: user.id, role } });
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: usersQueryOptions.queryKey });
      toast.success(`Updated ${updated.name}'s role`);
      onClose();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Failed to update role"),
  });

  return (
    <Dialog open={user != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>
            {user ? `Assign a new role to ${user.name}.` : ""}
          </DialogDescription>
        </DialogHeader>

        <Select value={role} onValueChange={(value) => setRole(value as Role)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {ASSIGNABLE_ROLES.map((option) => (
                <SelectItem key={option} value={option}>
                  {ROLE_LABELS[option]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || unchanged}
          >
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
