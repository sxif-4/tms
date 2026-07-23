import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, Trash2Icon } from "lucide-react";
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
import {
  DISCOUNT_TYPES,
  DISCOUNT_TYPE_LABELS,
  TARGET_TYPES,
  TARGET_TYPE_LABELS,
} from "../constants";
import { createPromotionServerFn, updatePromotionServerFn } from "../server";
import type {
  DiscountType,
  Promotion,
  PromotionTargetType,
} from "../types";

const DECIMAL = /^\d+(\.\d{1,2})?$/;
const toDateInput = (iso: string) => iso.slice(0, 10);

type TargetRow = { targetType: PromotionTargetType; targetId: string };

export function PromotionDialog({
  open,
  onOpenChange,
  promotion,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion: Promotion | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = promotion != null;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minSpend, setMinSpend] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [perUserLimit, setPerUserLimit] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [targets, setTargets] = useState<TargetRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setName(promotion?.name ?? "");
    setDescription(promotion?.description ?? "");
    setCode(promotion?.code ?? "");
    setDiscountType(promotion?.discountType ?? "percentage");
    setDiscountValue(promotion?.discountValue ?? "");
    setMinSpend(promotion?.minSpend ?? "");
    setUsageLimit(promotion?.usageLimit != null ? String(promotion.usageLimit) : "");
    setPerUserLimit(
      promotion?.perUserLimit != null ? String(promotion.perUserLimit) : "",
    );
    setValidFrom(promotion ? toDateInput(promotion.validFrom) : "");
    setValidTo(promotion ? toDateInput(promotion.validTo) : "");
    setIsActive(promotion?.isActive ?? true);
    setTargets(
      promotion?.targets.map((t) => ({
        targetType: t.targetType,
        targetId: String(t.targetId),
      })) ?? [],
    );
  }, [open, promotion]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        code: code.trim() || undefined,
        discountType,
        discountValue: discountValue.trim(),
        minSpend: minSpend.trim() || undefined,
        usageLimit: usageLimit.trim() ? Number(usageLimit) : undefined,
        perUserLimit: perUserLimit.trim() ? Number(perUserLimit) : undefined,
        validFrom: new Date(validFrom).toISOString(),
        validTo: new Date(validTo).toISOString(),
        isActive,
        targets: targets
          .filter((t) => t.targetId.trim())
          .map((t) => ({
            targetType: t.targetType,
            targetId: Number(t.targetId),
          })),
      };
      return isEdit
        ? updatePromotionServerFn({ data: { id: promotion.id, ...payload } })
        : createPromotionServerFn({ data: payload });
    },
    onSuccess: () => {
      // Prefix key — refreshes every filtered variant of the list.
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast.success(isEdit ? "Promotion updated" : "Promotion created");
      onOpenChange(false);
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Something went wrong"),
  });

  const canSubmit =
    name.trim() &&
    description.trim() &&
    DECIMAL.test(discountValue.trim()) &&
    validFrom &&
    validTo;

  const addTarget = () =>
    setTargets((rows) => [...rows, { targetType: "room_type", targetId: "" }]);
  const updateTarget = (i: number, patch: Partial<TargetRow>) =>
    setTargets((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );
  const removeTarget = (i: number) =>
    setTargets((rows) => rows.filter((_, idx) => idx !== i));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit promotion" : "New promotion"}</DialogTitle>
          <DialogDescription>
            Discounts applied to bookings, optionally scoped to specific targets.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="promo-name">Name</Label>
            <Input
              id="promo-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="promo-desc">Description</Label>
            <Input
              id="promo-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="promo-code">Code (optional)</Label>
              <Input
                id="promo-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="SUMMER10"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="promo-type">Discount type</Label>
              <Select
                value={discountType}
                onValueChange={(v) => setDiscountType(v as DiscountType)}
              >
                <SelectTrigger id="promo-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {DISCOUNT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {DISCOUNT_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="promo-value">
                Value {discountType === "percentage" ? "(%)" : "(£)"}
              </Label>
              <Input
                id="promo-value"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="10.00"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="promo-min">Min spend (optional)</Label>
              <Input
                id="promo-min"
                value={minSpend}
                onChange={(e) => setMinSpend(e.target.value)}
                placeholder="50.00"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="promo-usage">Total uses (optional)</Label>
              <Input
                id="promo-usage"
                type="number"
                min={1}
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="promo-peruser">Per-user (optional)</Label>
              <Input
                id="promo-peruser"
                type="number"
                min={1}
                value={perUserLimit}
                onChange={(e) => setPerUserLimit(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="promo-from">Valid from</Label>
              <Input
                id="promo-from"
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="promo-to">Valid to</Label>
              <Input
                id="promo-to"
                type="date"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Targets (optional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addTarget}>
                <PlusIcon data-icon="inline-start" />
                Add
              </Button>
            </div>
            {targets.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No targets — applies to everything.
              </p>
            ) : (
              targets.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Select
                    value={t.targetType}
                    onValueChange={(v) =>
                      updateTarget(i, { targetType: v as PromotionTargetType })
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {TARGET_TYPES.map((tt) => (
                          <SelectItem key={tt} value={tt}>
                            {TARGET_TYPE_LABELS[tt]}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    className="w-24"
                    placeholder="ID"
                    value={t.targetId}
                    onChange={(e) => updateTarget(i, { targetId: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeTarget(i)}
                    aria-label="Remove target"
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              ))
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
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
            {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
