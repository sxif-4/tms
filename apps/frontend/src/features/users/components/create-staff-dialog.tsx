import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, CopyIcon } from "lucide-react";
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
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { Role } from "~/features/auth";
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "../constants";
import { usersQueryOptions } from "../queries";
import { createStaffServerFn, type StaffCreated } from "../server";

export function CreateStaffDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [phone, setPhone] = useState("");
  const [created, setCreated] = useState<StaffCreated | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset everything once the dialog fully closes.
  useEffect(() => {
    if (!open) {
      setName("");
      setEmail("");
      setRole("");
      setPhone("");
      setCreated(null);
      setError(null);
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!role) throw new Error("Pick a role first");
      return createStaffServerFn({
        data: {
          name: name.trim(),
          email: email.trim(),
          role,
          phone: phone.trim() || undefined,
        },
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: usersQueryOptions.queryKey });
      setCreated(result);
      toast.success(`Created ${result.user.name}`);
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Failed to create account"),
  });

  const canSubmit =
    name.trim().length >= 2 && /.+@.+\..+/.test(email.trim()) && role !== "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {created ? "Account created" : "Add account"}
          </DialogTitle>
          <DialogDescription>
            {created
              ? "Share the temporary password with the new user — it won't be shown again."
              : "Create a staff or visitor account. A one-time password is generated automatically."}
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="flex flex-col gap-3">
            <Credential label="Email" value={created.user.email} />
            <Credential
              label="Temporary password"
              value={created.temporaryPassword}
              mono
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="staff-name">Full name</Label>
              <Input
                id="staff-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="staff-role">Role</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as Role)}
              >
                <SelectTrigger id="staff-role" className="w-full">
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
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="staff-phone">Phone (optional)</Label>
              <Input
                id="staff-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="555-0100"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter>
          {created ? (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || !canSubmit}
              >
                {mutation.isPending ? "Creating…" : "Create account"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Credential({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <code
          className={`flex-1 truncate rounded-md bg-muted px-3 py-2 text-sm ${
            mono ? "font-mono" : ""
          }`}
        >
          {value}
        </code>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={copy}
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <CheckIcon className="size-4" />
          ) : (
            <CopyIcon className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
