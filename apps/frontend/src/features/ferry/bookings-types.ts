export type FerryBooking = {
  id: number;
  bookingReference: string;
  userId: number;
  scheduleId: number;
  hotelBookingId: number;
  passengerCount: number;
  totalAmount: string;
  validatedBy: number | null;
  validatedAt: string | Date | null;
  status: "pending" | "confirmed" | "cancelled" | "validated";
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
};
