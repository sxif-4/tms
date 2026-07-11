import { ShieldCheck } from "lucide-react";
import { Badge } from "~/components/ui/badge";

export function PaymentTrustBadges() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <ShieldCheck className="size-4 text-primary" />
        Secure checkout
      </span>
      <Badge variant="outline" className="font-normal">
        Visa
      </Badge>
      <Badge variant="outline" className="font-normal">
        Mastercard
      </Badge>
      <Badge variant="outline" className="font-normal">
        Amex
      </Badge>
    </div>
  );
}
