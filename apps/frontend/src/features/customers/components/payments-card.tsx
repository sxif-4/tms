import { ReceiptIcon } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { gbpExact } from "../constants";
import type { CustomerPayment, PayableType } from "../types";

const PAYABLE_LABELS: Record<PayableType, string> = {
  hotel_booking: "Hotel",
  ferry_booking: "Ferry",
  event_booking: "Event",
  park_ticket: "Park",
};

const METHOD_LABELS: Record<CustomerPayment["method"], string> = {
  card: "Card",
  cash: "Cash",
  bank_transfer: "Bank transfer",
};

function paymentVariant(
  status: CustomerPayment["status"],
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "completed") return "default";
  if (status === "failed") return "destructive";
  if (status === "pending") return "outline";
  return "secondary"; // refunded
}

export function PaymentsCard({ payments }: { payments: CustomerPayment[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payments</CardTitle>
        <CardDescription>
          Every transaction on this account, newest first.
        </CardDescription>
        <CardAction>
          <ReceiptIcon className="size-5 text-muted-foreground" />
        </CardAction>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No payments recorded — complimentary bookings never take money.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>For</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(
                        payment.paidAt ?? payment.createdAt,
                      ).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{PAYABLE_LABELS[payment.payableType]}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {payment.payableReference ?? "—"}
                    </TableCell>
                    <TableCell>{METHOD_LABELS[payment.method]}</TableCell>
                    <TableCell>
                      <Badge variant={paymentVariant(payment.status)}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {gbpExact(payment.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
