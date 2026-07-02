import { PencilIcon, ReceiptIcon, Trash2Icon } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { Promotion } from "../types";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function PromotionCard({
  promo,
  onEdit,
  onViewUsages,
  onDelete,
}: {
  promo: Promotion;
  onEdit: () => void;
  onViewUsages: () => void;
  onDelete: () => void;
}) {
  const discount =
    promo.discountType === "percentage"
      ? `${Number(promo.discountValue)}% off`
      : `£${promo.discountValue} off`;

  return (
    <Card className={promo.isActive ? undefined : "opacity-70"}>
      <CardHeader>
        <CardTitle className="truncate">{promo.name}</CardTitle>
        <CardDescription className="truncate">
          {promo.code ? `Code ${promo.code}` : "Auto-applied"} · {discount}
        </CardDescription>
        <CardAction>
          <Badge variant={promo.isActive ? "secondary" : "outline"}>
            {promo.isActive ? "Active" : "Inactive"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>
          {fmt(promo.validFrom)} – {fmt(promo.validTo)}
        </span>
        <Badge variant="outline">
          {promo.targets.length > 0
            ? `${promo.targets.length} target${promo.targets.length > 1 ? "s" : ""}`
            : "All targets"}
        </Badge>
        {promo.minSpend && (
          <span className="text-xs">Min £{promo.minSpend}</span>
        )}
      </CardContent>
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
          onClick={onViewUsages}
          aria-label="View usages"
        >
          <ReceiptIcon />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onDelete}
          aria-label="Delete promotion"
        >
          <Trash2Icon />
        </Button>
      </CardFooter>
    </Card>
  );
}
